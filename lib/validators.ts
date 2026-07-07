import { z } from "zod";

/** Contact-page enquiry → Lead row. */
export const enquirySchema = z.object({
  name: z.string().trim().min(2, "Please tell us your name.").max(120),
  email: z.email("Please enter a valid email."),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s-]{6,17}$/, "Please enter a valid phone number.")
    .optional()
    .or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(10, "Tell us a little about your project — a sentence or two is fine.")
    .max(5000),
  source: z.string().max(200).optional(),
  // Optional context the studio asked to capture (discovery form):
  // project type, budget range, site location.
  topic: z.string().trim().max(60).optional(),
  budget: z.string().trim().max(60).optional(),
  location: z.string().trim().max(120).optional(),
  // Honeypot — real visitors never fill this.
  company: z.literal("").optional(),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only.");
