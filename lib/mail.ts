/**
 * Outbound email.
 *
 * One provider (Resend), reached over its REST API with `fetch` rather
 * than its SDK — sending an email is a single POST, and the SDK would be
 * a dependency, a lockfile entry and a version to keep current in
 * exchange for nothing.
 *
 * Two rules hold everywhere this is used:
 *
 *  1. Sending never throws at the caller. A visitor's enquiry is already
 *     safe in the database by the time we get here; a mail provider
 *     having a bad afternoon must not turn a successful submission into
 *     an error page. Failures come back as a value.
 *
 *  2. Missing configuration is a normal state, not a crash. Local dev and
 *     the snapshot build have no API key and shouldn't need one — they
 *     log the mail and report it as skipped, which the studio then shows
 *     honestly as "not sent" rather than pretending it went.
 */

const ENDPOINT = "https://api.resend.com/emails";

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

/** `Design Matters Architects <studio@mail.designmattersblr.com>` */
const from = () => process.env.MAIL_FROM?.trim();

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

export const mailConfigured = () => Boolean(process.env.RESEND_API_KEY && from());

/**
 * Why mail can or cannot send, in the words the dashboard shows.
 *
 * The studio needs to be able to tell "we have not set this up yet" from
 * "we set it up and it is failing", and those are different sentences,
 * not different severities of the same one.
 */
export function mailStatus(): { ready: boolean; reason?: string; from?: string } {
  if (!process.env.RESEND_API_KEY) {
    return { ready: false, reason: "No mail provider key is configured on the server yet." };
  }
  const sender = from();
  if (!sender) {
    return { ready: false, reason: "No sending address is configured on the server yet." };
  }
  return { ready: true, from: sender };
}

export async function sendMail(mail: Mail): Promise<MailResult> {
  const key = process.env.RESEND_API_KEY;
  const sender = from();

  if (!key || !sender) {
    const error = !key ? "RESEND_API_KEY is not set" : "MAIL_FROM is not set";
    console.warn(`[mail:skipped] ${error}, "${mail.subject}" to ${String(mail.to)}`);
    return { ok: false, skipped: true, error };
  }

  const to = Array.isArray(mail.to) ? mail.to : [mail.to];
  if (to.length === 0) {
    return { ok: false, skipped: true, error: "no recipient configured" };
  }

  try {
    // Resend's own timeout is generous; ours is short on purpose. This
    // runs inside a form submission, and a visitor watching a spinner
    // cares more about a fast confirmation than about us waiting out a
    // provider that has already stopped answering. The lead is stored
    // either way, and a timeout is recorded as a failure the studio can
    // retry from the dashboard.
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
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
