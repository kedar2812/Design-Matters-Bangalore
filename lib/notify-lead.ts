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
import { getIdentity } from "@/lib/settings";
import { mailConfigured, notifyRecipients, sendMail } from "@/lib/mail";
import { acknowledgementEmail, notificationEmail, type LeadForEmail } from "@/lib/emails/enquiry";

/** Absolute, no trailing slash — email links cannot be relative. */
function siteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

/**
 * Where the notification goes. LEAD_NOTIFY_TO wins so the studio can add
 * a second reader without a deploy; otherwise it falls back to whatever
 * address the studio has published as its own, which is the address a
 * client would write to anyway.
 */
async function recipients(identityEmail: string) {
  const configured = notifyRecipients();
  return configured.length > 0 ? configured : identityEmail ? [identityEmail] : [];
}

export type NotifyOutcome = { notified: boolean; error?: string };

export async function notifyNewLead(lead: LeadForEmail): Promise<NotifyOutcome> {
  const identity = await getIdentity();
  const url = siteUrl();

  /* ---------------------------------------------- to the studio */

  const to = await recipients(identity.email);
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

  // Only when mail is genuinely configured. An unconfigured install
  // should log one skipped notification, not two.
  if (mailConfigured()) {
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
