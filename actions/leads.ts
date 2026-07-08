"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { enquirySchema } from "@/lib/validators";

export type EnquiryState = {
  ok: boolean;
  errors?: Record<string, string[]>;
  message?: string;
} | null;

/** Contact form → Lead row → appears in /studio/leads. */
export async function submitEnquiry(
  _prev: EnquiryState,
  formData: FormData,
): Promise<EnquiryState> {
  // Honeypot filled → almost certainly a bot. Pretend success before
  // validation so the response never hints at the trap.
  if (formData.get("company")) return { ok: true };

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

  await prisma.lead.create({
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

  return {
    ok: true,
    message: "Thank you — we've received your enquiry and will be in touch within a working day.",
  };
}
