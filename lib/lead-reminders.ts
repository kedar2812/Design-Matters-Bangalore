/**
 * The daily reminder about enquiries nobody has answered.
 *
 * Run once a day by the server's cron, through
 * `/api/cron/lead-reminders`. Which enquiries make the list:
 *
 *  - still at "New", so the studio has not moved it anywhere;
 *  - older than the studio's chosen wait (a day, by default);
 *  - not already reminded in the last 20 hours, so a second run on the
 *    same day, or a cron that fires twice, sends nothing new;
 *  - reminded fewer than three times in all. An enquiry nobody has acted
 *    on after three reminders has been decided on, even if the decision
 *    was never recorded, and a fourth email would only teach the studio
 *    to ignore the fifth.
 *
 * Nothing older than 30 days is included either, so switching reminders
 * on for the first time does not dig up last season's enquiries.
 */
import { prisma } from "@/lib/db";
import { record } from "@/lib/lead-events";
import { sendMail } from "@/lib/mail";
import { resolveRecipients } from "@/lib/notify-lead";
import { getIdentity, getSection } from "@/lib/settings";
import { reminderEmail } from "@/lib/emails/reminder";

const MAX_REMINDERS = 3;
const QUIET_HOURS = 20;
const LOOKBACK_DAYS = 30;
const HOUR = 3_600_000;

export type ReminderOutcome =
  | { sent: true; count: number; to: string[] }
  | { sent: false; reason: string; count: number };

function siteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

export async function sendLeadReminders(now = new Date()): Promise<ReminderOutcome> {
  const settings = await getSection("notifications");
  if (!settings.remindUncontacted) {
    return { sent: false, reason: "reminders are switched off", count: 0 };
  }

  const candidates = await prisma.lead.findMany({
    where: {
      status: "NEW",
      createdAt: {
        lte: new Date(now.getTime() - settings.remindAfterHours * HOUR),
        gte: new Date(now.getTime() - LOOKBACK_DAYS * 24 * HOUR),
      },
    },
    orderBy: { createdAt: "asc" },
    include: {
      events: {
        where: { type: "REMINDED" },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      },
    },
  });

  const due = candidates.filter(
    (lead) =>
      lead.events.length < MAX_REMINDERS &&
      (lead.events[0]?.createdAt.getTime() ?? 0) < now.getTime() - QUIET_HOURS * HOUR,
  );
  if (due.length === 0) return { sent: false, reason: "nothing is waiting", count: 0 };

  const { to } = await resolveRecipients();
  if (to.length === 0) return { sent: false, reason: "no recipient configured", count: due.length };

  const mail = reminderEmail(due, await getIdentity(), siteUrl(), now);
  const result = await sendMail({ to, subject: mail.subject, html: mail.html, text: mail.text });
  if (!result.ok) return { sent: false, reason: result.error, count: due.length };

  await Promise.all(
    due.map((lead) =>
      record({
        leadId: lead.id,
        type: "REMINDED",
        summary: `Included in the daily reminder to ${to.join(", ")}`,
        meta: { to, reminder: lead.events.length + 1 },
      }),
    ),
  );

  return { sent: true, count: due.length, to };
}
