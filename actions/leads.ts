"use server";

import { after } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isSnapshotMode } from "@/lib/content";
import { record } from "@/lib/lead-events";
import { notifyNewLead } from "@/lib/notify-lead";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { enquirySchema } from "@/lib/validators";

export type EnquiryState = {
  ok: boolean;
  errors?: Record<string, string[]>;
  message?: string;
} | null;

/** Five enquiries an hour from one address is already generous for a studio this size. */
const SUBMIT_LIMIT = 5;
const SUBMIT_WINDOW_MS = 60 * 60 * 1000;

/** Contact form → Lead row → email to the studio → appears in /studio/leads. */
export async function submitEnquiry(
  _prev: EnquiryState,
  formData: FormData,
): Promise<EnquiryState> {
  // Honeypot filled → almost certainly a bot. Pretend success before
  // validation so the response never hints at the trap.
  if (formData.get("company")) return { ok: true };

  // The honeypot stops scripts that fill every field; it does nothing
  // about the same form submitted over and over. Now that a submission
  // sends mail, that difference is Kiran's inbox.
  const ip = clientIp(await headers());
  const verdict = rateLimit(`enquiry:${ip}`, SUBMIT_LIMIT, SUBMIT_WINDOW_MS);
  if (!verdict.allowed) {
    return {
      ok: false,
      message:
        "That's a few enquiries from here already, and we have them. Please call or WhatsApp us if it's urgent.",
    };
  }

  // FormData.get() returns null for absent fields — normalize so
  // optional schema fields behave the same with or without the input.
  const field = (key: string) => {
    const v = formData.get(key);
    return typeof v === "string" ? v : undefined;
  };

  const parsed = enquirySchema.safeParse({
    name: field("name"),
    email: field("email"),
    phone: field("phone"),
    message: field("message"),
    source: field("source"),
    topic: field("topic"),
    budget: field("budget"),
    location: field("location"),
    company: field("company") ?? "",
  });

  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    return { ok: false, errors: flat.fieldErrors };
  }

  if (isSnapshotMode) {
    // Database-free preview: nowhere to store the lead. Log it server-side
    // so a test submission isn't silently invisible, and let WhatsApp/phone
    // carry real contact until the site runs with its database.
    console.log("[enquiry:snapshot-mode]", JSON.stringify(parsed.data));
  } else {
    const lead = await prisma.lead.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        message: parsed.data.message,
        source: parsed.data.source || "contact-page",
        topic: parsed.data.topic || null,
        budget: parsed.data.budget || null,
        location: parsed.data.location || null,
      },
    });

    await record({
      leadId: lead.id,
      type: "RECEIVED",
      summary: `Enquiry submitted from ${lead.source ?? "the site"}`,
      meta: { source: lead.source },
    });

    // Mail goes out *after* the response reaches the visitor. The
    // enquiry is already committed; making somebody watch a spinner
    // while two SMTP round-trips complete would trade the thing they
    // care about for the thing we care about. `after` also means a mail
    // provider outage can never surface as a failed submission — the
    // failure lands in the lead's timeline instead, where the studio can
    // see it and resend.
    after(async () => {
      try {
        await notifyNewLead(lead);
      } catch (err) {
        console.error("[enquiry:notify-crashed]", lead.id, err);
        await record({
          leadId: lead.id,
          type: "NOTIFY_FAILED",
          summary: "Notification crashed before it could be sent",
          meta: { error: err instanceof Error ? err.message : String(err) },
        });
      }
    });
  }

  return {
    ok: true,
    message: "Thank you. We've received your enquiry and will be in touch within a working day.",
  };
}
