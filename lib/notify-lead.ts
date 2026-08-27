/**
 * What happens after an enquiry is stored: tell the studio, thank the
 * enquirer, and write down how both went.
 *
 * The order matters. The studio notification is the one that must not be
 * lost, so it is sent first and its outcome is what `notifiedAt` /
 * `notifyError` on the lead reflect. The acknowledgement to the enquirer
 * is courtesy — if it fails the studio still has the enquiry, so it is
 * recorded in the timeline and otherwise left alone.
 *
 * Nothing in here throws. Every path ends in a row written to the
 * database, because the failure mode that actually hurts is the one
 * nobody can see.
 */
import { prisma } from "@/lib/db";
import { record } from "@/lib/lead-events";
import { getIdentity, getSection } from "@/lib/settings";
import { envRecipients, mailConfigured, sendMail } from "@/lib/mail";
import { acknowledgementEmail, notificationEmail, type LeadForEmail } from "@/lib/emails/enquiry";

/** Absolute, no trailing slash — email links cannot be relative. */
function siteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

/**
 * Where a new-enquiry alert goes, and why.
 *
 * Three sources, most specific first. The dashboard wins because it is
 * the one the studio can change themselves at four in the afternoon; the
 * environment variable is the deploy-time fallback; and the studio's own
 * published email address is the last resort, on the grounds that an
 * enquiry reaching the address printed on the contact page is never the
 * wrong outcome.
 *
 * `source` comes back with the addresses so the dashboard can say which
 * rung it landed on rather than leaving the studio to guess.
 */
export type RecipientResolution = {
  to: string[];
  source: "dashboard" | "server" | "studio-email" | "none";
};

export async function resolveRecipients(): Promise<RecipientResolution> {
  const [settings, identity] = await Promise.all([
    getSection("notifications"),
    getIdentity(),
  ]);

  if (settings.recipients.length > 0) {
    return { to: [...settings.recipients], source: "dashboard" };
  }
  const fromEnv = envRecipients();
  if (fromEnv.length > 0) return { to: fromEnv, source: "server" };
  if (identity.email) return { to: [identity.email], source: "studio-email" };
  return { to: [], source: "none" };
}

export type NotifyOutcome = { notified: boolean; error?: string; skipped?: boolean };

export type NotifyOptions = {
  /**
   * Send even though alerts are switched off. Set only by the "send this
   * one anyway" button, where the studio is asking for this one email by
   * name — a preference is not a lock.
   */
  force?: boolean;
  /**
   * Whether the enquirer gets the acknowledgement. False on a manual
   * resend: the studio wanting its own copy again is no reason to tell
   * the enquirer a second time that their message arrived.
   */
  acknowledge?: boolean;
};

export async function notifyNewLead(
  lead: LeadForEmail,
  { force = false, acknowledge = true }: NotifyOptions = {},
): Promise<NotifyOutcome> {
  const [identity, settings] = await Promise.all([
    getIdentity(),
    getSection("notifications"),
  ]);
  const url = siteUrl();

  /* ---------------------------------------------- to the studio */

  // Switched off deliberately is not a failure, and must not be dressed
  // as one: a red "never emailed out" block on every enquiry would train
  // the studio to ignore the one that is genuinely broken.
  if (!settings.notifyStudio && !force) {
    await record({
      leadId: lead.id,
      type: "NOTIFY_SKIPPED",
      summary: "Not emailed, email alerts are switched off",
      meta: { reason: "alerts-off" },
    });
    return { notified: false, skipped: true };
  }

  const { to } = await resolveRecipients();
  const notice = notificationEmail(lead, identity, url);

  const sent =
    to.length === 0
      ? ({ ok: false as const, skipped: true as const, error: "no notification recipient configured" })
      : await sendMail({
          to,
          subject: notice.subject,
          html: notice.html,
          text: notice.text,
          // The single most useful line in this whole feature: hitting
          // reply in Gmail writes to the person who enquired.
          replyTo: lead.email,
        });

  if (sent.ok) {
    await prisma.lead
      .update({
        where: { id: lead.id },
        data: { notifiedAt: new Date(), notifyError: null },
      })
      .catch(() => {});
    await record({
      leadId: lead.id,
      type: "NOTIFIED",
      summary: `Notification emailed to ${to.join(", ")}`,
      meta: { messageId: sent.id, to },
    });
  } else {
    await prisma.lead
      .update({ where: { id: lead.id }, data: { notifyError: sent.error } })
      .catch(() => {});
    await record({
      leadId: lead.id,
      type: "NOTIFY_FAILED",
      summary: sent.skipped
        ? `Notification not sent, ${sent.error}`
        : `Notification failed, ${sent.error}`,
      meta: { error: sent.error, skipped: Boolean(sent.skipped) },
    });
  }

  /* ------------------------------------------- to the enquirer */

  // Only when mail is genuinely configured, and only if the studio wants
  // it. An unconfigured install should log one skipped notification, not
  // two; a studio that prefers to answer in its own words first should
  // log none at all.
  if (acknowledge && mailConfigured() && settings.acknowledgeEnquirer) {
    const ack = acknowledgementEmail(lead, identity, url);
    const ackSent = await sendMail({
      to: lead.email,
      subject: ack.subject,
      html: ack.html,
      text: ack.text,
      replyTo: identity.email || undefined,
    });
    if (ackSent.ok) {
      await record({
        leadId: lead.id,
        type: "ACKNOWLEDGED",
        summary: `Acknowledgement sent to ${lead.email}`,
        meta: { messageId: ackSent.id },
      });
    } else {
      await record({
        leadId: lead.id,
        type: "NOTIFY_FAILED",
        summary: `Acknowledgement to ${lead.email} failed, ${ackSent.error}`,
        meta: { error: ackSent.error, kind: "acknowledgement" },
      });
    }
  }

  return sent.ok ? { notified: true } : { notified: false, error: sent.error };
}
