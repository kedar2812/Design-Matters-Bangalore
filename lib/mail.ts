/**
 * Outbound email.
 *
 * Two ways out, chosen by what the server's environment provides:
 *
 *  - **SMTP**, for a Google account (or any mailbox with SMTP access).
 *    The studio's mail is Google Workspace, so this needs no DNS work at
 *    all: Google signs and sends it, and it arrives authenticated. Set
 *    `SMTP_USER` and `SMTP_PASS` (a Google *app password*, not the
 *    account password). Host and port default to Gmail's.
 *  - **Resend**, over its REST API with `fetch`, for sending from the
 *    studio's own domain once its DNS records are in place. Set
 *    `RESEND_API_KEY` and `MAIL_FROM`.
 *
 * SMTP wins when both are configured, because it is the one that works
 * without anyone touching the domain.
 *
 * Two rules hold everywhere this is used:
 *
 *  1. Sending never throws at the caller. A visitor's enquiry is already
 *     safe in the database by the time we get here; a mail provider
 *     having a bad afternoon must not turn a successful submission into
 *     an error page. Failures come back as a value.
 *
 *  2. Missing configuration is a normal state, not a crash. Local dev and
 *     the snapshot build have no credentials and shouldn't need them —
 *     they log the mail and report it as skipped, which the studio then
 *     shows honestly as "not sent" rather than pretending it went.
 *
 * SETUP-EMAIL.md is the setup guide for both.
 */
import nodemailer, { type Transporter } from "nodemailer";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export type MailResult =
  | { ok: true; id: string }
  | { ok: false; skipped: true; error: string }
  | { ok: false; skipped?: false; error: string };

export type Mail = {
  to: string | string[];
  subject: string;
  html: string;
  /** Always send one. Some clients prefer it, and spam filters read its absence as a signal. */
  text: string;
  /** Set to the enquirer so a reply in Gmail goes to them, not to us. */
  replyTo?: string;
};

type Provider = "smtp" | "resend";

const env = (key: string) => process.env[key]?.trim() || undefined;

function provider(): Provider | null {
  if (env("SMTP_USER") && env("SMTP_PASS")) return "smtp";
  if (env("RESEND_API_KEY")) return "resend";
  return null;
}

/**
 * Who the mail is from.
 *
 * Over SMTP it defaults to the signed-in account under the studio's name,
 * because Gmail rewrites any other From address to that account anyway,
 * and a header that says one thing while the mail says another is what
 * spam filters look for.
 */
function from(): string | undefined {
  const explicit = env("MAIL_FROM");
  if (explicit) return explicit;
  const user = env("SMTP_USER");
  if (provider() === "smtp" && user) return `Design Matters Architects <${user}>`;
  return undefined;
}

/**
 * Fallback recipients from the environment.
 *
 * The dashboard setting wins over this — see `lib/notify-lead`. It stays
 * because a server can be handed a working address before anyone has
 * logged into the studio, and because it is the only way to reach the
 * inbox if the database is the thing that is broken.
 */
export function envRecipients(): string[] {
  const raw = process.env.LEAD_NOTIFY_TO ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const mailConfigured = () => provider() !== null && Boolean(from());

/**
 * Why mail can or cannot send, in the words the dashboard shows.
 *
 * The studio needs to be able to tell "we have not set this up yet" from
 * "we set it up and it is failing", and those are different sentences,
 * not different severities of the same one.
 */
export function mailStatus(): { ready: boolean; reason?: string; from?: string } {
  const p = provider();
  if (!p) {
    return { ready: false, reason: "No sending account is connected on the server yet." };
  }
  const sender = from();
  if (!sender) {
    return { ready: false, reason: "No sending address is configured on the server yet." };
  }
  return { ready: true, from: sender };
}

/* --------------------------------------------------------------- SMTP */

let transport: Transporter | undefined;
let transportKey = "";

function smtp(): Transporter {
  const host = env("SMTP_HOST") ?? "smtp.gmail.com";
  const port = Number(env("SMTP_PORT") ?? 465);
  const user = env("SMTP_USER")!;
  const pass = env("SMTP_PASS")!.replace(/\s+/g, ""); // Google shows app passwords in groups of four
  // 465 is TLS from the first byte; 587 upgrades with STARTTLS.
  const secure = env("SMTP_SECURE") ? env("SMTP_SECURE") === "true" : port === 465;

  // Rebuilt only if the settings change, so a pooled connection is reused
  // across the notification and the acknowledgement for the same enquiry.
  const key = [host, port, user, pass, secure].join("|");
  if (!transport || key !== transportKey) {
    transport = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      // Short on purpose, for the same reason as the Resend timeout below.
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 12000,
    });
    transportKey = key;
  }
  return transport;
}

/** Turn nodemailer's errors into a sentence the studio can act on. */
function smtpError(err: unknown): string {
  const e = err as { code?: string; responseCode?: number; message?: string };
  if (e?.code === "EAUTH" || e?.responseCode === 535 || e?.responseCode === 534) {
    return "the mail account refused the sign-in (check the app password is current)";
  }
  if (e?.code === "ETIMEDOUT" || e?.code === "ECONNECTION" || e?.code === "ESOCKET" || e?.code === "EDNS") {
    return "the mail server could not be reached";
  }
  if (e?.responseCode === 550 || e?.responseCode === 553) {
    return `the mail server rejected a recipient (${e.message ?? "550"})`;
  }
  return e?.message ?? "unknown mail error";
}

async function sendSmtp(mail: Mail, to: string[], sender: string): Promise<MailResult> {
  try {
    const info = await smtp().sendMail({
      from: sender,
      to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      ...(mail.replyTo ? { replyTo: mail.replyTo } : {}),
    });
    return { ok: true, id: info.messageId ?? "" };
  } catch (err) {
    const error = smtpError(err);
    console.error(`[mail:failed] ${error}`);
    return { ok: false, error };
  }
}

/* ------------------------------------------------------------- Resend */

async function sendResend(mail: Mail, to: string[], sender: string): Promise<MailResult> {
  try {
    // Resend's own timeout is generous; ours is short on purpose. The lead
    // is stored either way, and a timeout is recorded as a failure the
    // studio can retry from the dashboard.
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: sender,
        to,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });

    const body = (await res.json().catch(() => null)) as
      | { id?: string; message?: string; name?: string }
      | null;

    if (!res.ok) {
      // Resend puts the useful part in `message` ("The domain is not
      // verified", "You can only send to your own address"). Keep it —
      // it is the difference between a fixable DNS problem and a mystery.
      const error = body?.message ?? `Resend responded ${res.status}`;
      console.error(`[mail:failed] ${error}`);
      return { ok: false, error };
    }

    return { ok: true, id: body?.id ?? "" };
  } catch (err) {
    const error =
      err instanceof Error
        ? err.name === "TimeoutError"
          ? "the mail provider did not respond in time"
          : err.message
        : "unknown mail error";
    console.error(`[mail:failed] ${error}`);
    return { ok: false, error };
  }
}

/* --------------------------------------------------------------- send */

export async function sendMail(mail: Mail): Promise<MailResult> {
  const p = provider();
  const sender = from();

  if (!p || !sender) {
    const error = !p ? "no sending account is configured" : "MAIL_FROM is not set";
    console.warn(`[mail:skipped] ${error}, "${mail.subject}" to ${String(mail.to)}`);
    return { ok: false, skipped: true, error };
  }

  const to = Array.isArray(mail.to) ? mail.to : [mail.to];
  if (to.length === 0) {
    return { ok: false, skipped: true, error: "no recipient configured" };
  }

  return p === "smtp" ? sendSmtp(mail, to, sender) : sendResend(mail, to, sender);
}
