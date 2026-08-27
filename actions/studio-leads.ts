"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { record } from "@/lib/lead-events";
import { notifyNewLead } from "@/lib/notify-lead";
import { STAGES } from "@/lib/lead-stages";
import { requireUser } from "@/lib/require-auth";

const statusSchema = z.enum(["NEW", "CONTACTED", "DISCUSSION", "WON", "LOST"]);

const stageLabel = (v: string) => STAGES.find(([s]) => s === v)?.[1] ?? v;

export async function updateLeadStatus(id: string, status: string) {
  await requireUser();
  const parsed = statusSchema.parse(status);

  // Read the old stage first — the timeline entry is "from X to Y", and
  // after the update the old value is gone for good.
  const before = await prisma.lead.findUnique({ where: { id }, select: { status: true } });
  await prisma.lead.update({ where: { id }, data: { status: parsed } });

  if (before && before.status !== parsed) {
    await record({
      leadId: id,
      type: "STATUS_CHANGED",
      summary: `Moved from ${stageLabel(before.status)} to ${stageLabel(parsed)}`,
      meta: { from: before.status, to: parsed, via: "studio" },
    });
  }

  revalidatePath("/studio/leads");
  revalidatePath("/studio/dashboard");
}

export async function saveLeadNotes(id: string, notes: string) {
  await requireUser();
  const trimmed = notes.slice(0, 10_000);
  const before = await prisma.lead.findUnique({ where: { id }, select: { notes: true } });
  await prisma.lead.update({ where: { id }, data: { notes: trimmed } });

  // Notes autosave a second after typing stops, so writing an event per
  // save would bury the timeline under one entry per pause for breath.
  // Only the first note on an enquiry is worth marking; edits after that
  // are the same act continuing.
  if (!before?.notes && trimmed.trim()) {
    await record({ leadId: id, type: "NOTED", summary: "Private note added" });
  }

  revalidatePath("/studio/leads");
}

export async function deleteLead(id: string) {
  await requireUser();
  await prisma.lead.delete({ where: { id } });
  revalidatePath("/studio/leads");
  revalidatePath("/studio/dashboard");
}

/**
 * Send the studio notification again.
 *
 * This exists for the case the whole feature is built around: the email
 * did not arrive. Without it, a failed notification is a red label the
 * studio can read and do nothing about, and the only recovery is a
 * deploy. It is also the honest way to test a fresh Resend key against a
 * real enquiry.
 */
export async function resendLeadNotification(id: string) {
  await requireUser();
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) throw new Error("That enquiry no longer exists.");

  // `force` because this button exists precisely for the case the
  // automatic send did not happen — including when the studio has alerts
  // switched off and wants this one enquiry anyway. `acknowledge: false`
  // because the enquirer has already been thanked once.
  const outcome = await notifyNewLead(lead, { force: true, acknowledge: false });
  revalidatePath("/studio/leads");
  if (!outcome.notified) throw new Error(outcome.error ?? "The email could not be sent.");
}
