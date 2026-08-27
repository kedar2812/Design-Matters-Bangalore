"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/require-auth";
import { prisma } from "@/lib/db";
import { getIdentity, getSection, type NotificationsContent } from "@/lib/settings";
import { SECTION_SCHEMAS } from "@/lib/content-validation";
import { mailStatus, sendMail } from "@/lib/mail";
import { notificationEmail, type LeadForEmail } from "@/lib/emails/enquiry";
import { resolveRecipients } from "@/lib/notify-lead";

/* ------------------------------------------------------------- saving */

export type SaveAlertsResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Store where enquiry alerts go.
 *
 * Addresses are normalised here rather than in the schema, because the
 * studio typing the same address twice in different case is a thing to
 * fix quietly, not an error to hand back.
 */
export async function saveAlertSettings(input: {
  recipients: string[];
  notifyStudio: boolean;
  acknowledgeEnquirer: boolean;
}): Promise<SaveAlertsResult> {
  await requireUser();

  const seen = new Set<string>();
  const recipients: string[] = [];
  for (const raw of input.recipients) {
    const address = raw.trim().toLowerCase();
    if (!address || seen.has(address)) continue;
    seen.add(address);
    recipients.push(address);
  }

  const parsed = SECTION_SCHEMAS.notifications.safeParse({
    recipients,
    notifyStudio: input.notifyStudio,
    acknowledgeEnquirer: input.acknowledgeEnquirer,
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    // Name the address that is wrong. "Invalid email" against a list of
    // five is a puzzle, not a message.
    const index = typeof first?.path?.[1] === "number" ? (first.path[1] as number) : null;
    const which = index === null ? "" : ` (${recipients[index] || "the blank one"})`;
    return { ok: false, error: `${first?.message ?? "That did not save."}${which}` };
  }

  await prisma.siteSetting.upsert({
    where: { key: "notifications" },
    create: { key: "notifications", value: parsed.data as object },
    update: { value: parsed.data as object },
  });

  revalidatePath("/studio/alerts");
  revalidatePath("/studio/leads");
  return { ok: true };
}

/* --------------------------------------------------------- test send */

export type TestAlertResult =
  | { ok: true; to: string[] }
  | { ok: false; error: string };

/**
 * Send one real alert to the configured addresses.
 *
 * It goes through the same template and the same provider as a genuine
 * enquiry, because a test that takes a different path only proves the
 * test works. The sample lead is obviously a sample — the studio should
 * never have to wonder whether someone called Sample Enquiry is waiting
 * for a call back.
 *
 * The stage buttons in a real notification are signed links naming a
 * lead id. This one has no lead, so `sampleId` produces links that
 * resolve to nothing rather than to somebody else's enquiry.
 */
export async function sendTestAlert(): Promise<TestAlertResult> {
  await requireUser();

  const status = mailStatus();
  if (!status.ready) {
    return { ok: false, error: status.reason ?? "Email is not configured yet." };
  }

  const { to } = await resolveRecipients();
  if (to.length === 0) {
    return {
      ok: false,
      error: "There is nowhere to send it. Add an address above, or set the studio email under Studio details.",
    };
  }

  const identity = await getIdentity();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000").replace(
    /\/+$/,
    "",
  );

  const sample: LeadForEmail = {
    id: "test-alert",
    name: "Sample Enquiry",
    email: identity.email || "someone@example.com",
    phone: identity.phone || null,
    message:
      "This is a test of the studio's enquiry alerts. If it reached you, a real enquiry will too. Nothing has been added to the dashboard.",
    source: "/studio/alerts",
    topic: "Test",
    budget: null,
    location: null,
    createdAt: new Date(),
  };

  const mail = notificationEmail(sample, identity, siteUrl);
  const sent = await sendMail({
    to,
    subject: `Test: ${mail.subject}`,
    html: mail.html,
    text: mail.text,
  });

  return sent.ok ? { ok: true, to } : { ok: false, error: sent.error };
}

/* ------------------------------------------------------------ reading */

export async function getAlertSettings(): Promise<NotificationsContent> {
  await requireUser();
  return getSection("notifications");
}
