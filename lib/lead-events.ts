/**
 * The enquiry activity trail.
 *
 * `Lead.status` is a single column overwritten in place: it can tell you
 * a lead is in "Discussion" and nothing whatsoever about when it got
 * there, whether anyone was emailed, or whether that email arrived. This
 * module writes the record that answers those questions.
 *
 * Recording an event must never be the reason an action fails. Moving a
 * lead to "Won" is the real work; the timeline entry is bookkeeping, so
 * `record()` swallows its own errors rather than rolling back a change
 * the studio has already been told succeeded.
 */
import { prisma } from "@/lib/db";
import type { LeadEventType } from "@/lib/generated/prisma/client";

export type LeadEventInput = {
  leadId: string;
  type: LeadEventType;
  summary: string;
  meta?: Record<string, unknown>;
};

export async function record({ leadId, type, summary, meta }: LeadEventInput) {
  try {
    await prisma.leadEvent.create({
      data: { leadId, type, summary, meta: meta ? (meta as object) : undefined },
    });
  } catch (err) {
    console.error("[lead-event:failed]", type, leadId, err);
  }
}
