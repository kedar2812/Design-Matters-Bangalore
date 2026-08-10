"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/require-auth";
import { SECTION_KEYS, type SectionKey } from "@/lib/settings";
import { CATEGORIES, CATEGORY_SLUGS } from "@/lib/categories";

/* Per-section shapes. Kept deliberately permissive on length so the
   studio can write as much as a page needs — the guard that matters is
   that the shape matches what the page renders. */

const str = z.string().max(4000);
const line = z.string().max(300);

const schemas: Record<SectionKey, z.ZodType> = {
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
      .regex(/^\d{8,15}$/, "Digits only, with country code — e.g. 919886016711."),
    instagram: z.url().or(z.literal("")),
    linkedin: z.url().or(z.literal("")),
    houzz: z.url().or(z.literal("")),
    mapQuery: line,
  }),

  home: z.object({
    heroEyebrow: line,
    heroLine: line,
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
    teamHeading: line,
    team: z.array(line).max(40),
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
      .regex(/^[0-5](\.\d)?$/, "A rating like 4.9 — between 0 and 5."),
    reviewCount: z.string().regex(/^\d{1,6}$/, "Digits only — e.g. 87."),
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
};

export type SaveSettingsResult =
  | { ok: true }
  | { ok: false; errors: Record<string, string[]> };

/** Pages that render each section — saved edits go live immediately. */
const AFFECTED: Record<SectionKey, string[]> = {
  identity: ["/", "/projects", "/about", "/services", "/contact"],
  home: ["/"],
  about: ["/about"],
  services: ["/", "/services"],
  contact: ["/contact"],
  testimonials: ["/", "/testimonials"],
  projects: ["/projects", ...CATEGORY_SLUGS.map((s) => `/projects/${s}`)],
};

export async function saveSection(
  key: SectionKey,
  value: unknown,
): Promise<SaveSettingsResult> {
  await requireUser();

  if (!SECTION_KEYS.includes(key)) {
    return { ok: false, errors: { _: ["Unknown content section."] } };
  }

  const parsed = schemas[key].safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      errors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    };
  }

  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value: parsed.data as object },
    update: { value: parsed.data as object },
  });

  for (const path of AFFECTED[key]) revalidatePath(path);
  revalidatePath("/studio/content");
  return { ok: true };
}

/** Drop the override so the section falls back to its built-in copy. */
export async function resetSection(key: SectionKey) {
  await requireUser();
  if (!SECTION_KEYS.includes(key)) return;
  await prisma.siteSetting.deleteMany({ where: { key } });
  for (const path of AFFECTED[key]) revalidatePath(path);
  revalidatePath("/studio/content");
}

/** Which sections have been edited — surfaced in the dashboard. */
export async function editedSections(): Promise<SectionKey[]> {
  const rows = await prisma.siteSetting.findMany({ select: { key: true } });
  return rows.map((r) => r.key as SectionKey).filter((k) => SECTION_KEYS.includes(k));
}
