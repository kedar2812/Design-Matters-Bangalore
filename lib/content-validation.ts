/**
 * What the dashboard is allowed to save into each content section.
 *
 * This lives in `lib` rather than beside the server action that uses it
 * for one reason: a `"use server"` module may only export async
 * functions, so a schema declared there cannot be imported by anything
 * else — including a check that it still matches the shape it validates.
 *
 * That check exists (`scripts/check-content-schemas.ts`) and it is not
 * ceremony. Zod strips unknown keys, and `getSection` merges stored
 * values over the built-in defaults, so a field present in the shape and
 * missing from the schema does not error: it is quietly dropped on save
 * and then quietly replaced by its default on read. The edit appears to
 * work, the page does not change, and nothing anywhere says why. Two
 * fields had already drifted this way — the home hero slideshow and the
 * About page's "Recognized for Excellence" block — and a required field
 * left behind after its shape lost it (`about.team`) made the About form
 * fail to save at all, on an error naming a control that is not on the
 * screen.
 *
 * So: every key in `Sections` must appear here, and nothing here may
 * name a key that `Sections` does not have.
 *
 * Lengths are deliberately permissive. The guard that matters is that
 * the shape matches what the page renders, not that a studio's
 * paragraph is under some number a developer picked.
 */
import { z } from "zod";
import type { SectionKey } from "@/lib/content-defaults";
import { CATEGORIES } from "@/lib/categories";

const str = z.string().max(4000);
const line = z.string().max(300);

/** One frame of the home hero: photograph, the word it carries, its project. */
const heroSlide = z.object({
  image: line,
  word: line,
  projectSlug: line,
  alt: str,
  // Both are set by hand in the defaults for frames that need them, and
  // both must survive a save from the dashboard — losing `focus` silently
  // re-crops a photograph the studio had already framed.
  blur: z.string().max(20000).optional(),
  focus: line.optional(),
});

export const SECTION_SCHEMAS: Record<SectionKey, z.ZodType> = {
  identity: z.object({
    name: line,
    shortName: line,
    tagline: line,
    founded: z.coerce.number().int().min(1900).max(2100),
    principal: line,
    principalTitle: line,
    addressLine1: line,
    addressLine2: line,
    city: line,
    state: line,
    pin: line,
    phone: line,
    phoneAlt: line.or(z.literal("")),
    email: z.email("Enter a valid email address."),
    whatsapp: z
      .string()
      .regex(/^\d{8,15}$/, "Digits only, with country code, e.g. 919886016711."),
    instagram: z.url().or(z.literal("")),
    linkedin: z.url().or(z.literal("")),
    houzz: z.url().or(z.literal("")),
    mapQuery: line,
  }),

  home: z.object({
    heroEyebrow: line,
    heroLine: line,
    heroSlides: z.array(heroSlide).max(12),
    heroWords: z.array(line).min(1, "Give the hero at least one word.").max(8),
    studioEyebrow: line,
    studioStatement: str,
    studioLinkLabel: line,
    workHeading: line,
    servicesHeading: line,
    services: z.array(z.object({ title: line, body: str })).max(6),
  }),

  about: z.object({
    eyebrow: line,
    heading: str,
    story: z.array(str).max(8),
    philosophyEyebrow: line,
    philosophyQuote: str,
    principalEyebrow: line,
    principalBio: z.array(str).max(8),
    recognitionHeading: line,
    recognitionIntro: str,
    recognition: z.array(z.object({ title: line, body: str })).max(8),
    // The roster itself moved to lib/team.ts when it gained portraits and
    // an explicit order; only the heading is editable here.
    teamHeading: line,
    approachHeading: line,
    approach: z.array(z.object({ title: line, body: str })).max(8),
  }),

  services: z.object({
    eyebrow: line,
    heading: str,
    services: z.array(z.object({ title: line, body: str, scope: line })).max(8),
    processEyebrow: line,
    processHeading: line,
    process: z.array(z.object({ title: line, body: str })).max(10),
  }),

  contact: z.object({
    eyebrow: line,
    heading: str,
    whatsappLabel: line,
    whatsappMessage: str,
  }),

  testimonials: z.object({
    eyebrow: line,
    heading: str,
    intro: str,
    ratingValue: z
      .string()
      .regex(/^[0-5](\.\d)?$/, "A rating like 4.9, between 0 and 5."),
    reviewCount: z.string().regex(/^\d{1,6}$/, "Digits only, e.g. 87."),
    googleUrl: z.url("A full URL, starting with https://"),
    pullQuote: str,
    pullQuoteAuthor: line,
    homeEyebrow: line,
    homeHeading: line,
    homeLinkLabel: line,
  }),

  // Flat per-category keys, built from the taxonomy so a new practice
  // area only ever needs editing in `lib/categories`.
  projects: z.object({
    eyebrow: line,
    heading: str,
    intro: str,
    portalEyebrow: line,
    indexEyebrow: line,
    indexHeading: line,
    emptyNote: str,
    ...Object.fromEntries(
      CATEGORIES.flatMap(({ slug }) => [
        [`${slug}Tagline`, line],
        [`${slug}Eyebrow`, line],
        [`${slug}Heading`, str],
        [`${slug}Intro`, str],
        [`${slug}Highlights`, z.array(z.object({ title: line, body: str })).max(8)],
      ]),
    ),
  }),

  notifications: z.object({
    // Deduped and lowercased before it gets here, so the only thing left
    // to say is that each one is a real address.
    recipients: z
      .array(z.email("That does not look like an email address."))
      .max(10, "Ten addresses is plenty — use a group address beyond that."),
    notifyStudio: z.boolean(),
    acknowledgeEnquirer: z.boolean(),
  }),
};
