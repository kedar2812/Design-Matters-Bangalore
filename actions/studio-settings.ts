"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/require-auth";
import { SECTION_KEYS, type SectionKey } from "@/lib/settings";
import { CATEGORY_SLUGS } from "@/lib/categories";
import { SECTION_SCHEMAS } from "@/lib/content-validation";

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
  // Delivery settings, not copy: nothing on the public site reads them.
  notifications: [],
};

export async function saveSection(
  key: SectionKey,
  value: unknown,
): Promise<SaveSettingsResult> {
  await requireUser();

  if (!SECTION_KEYS.includes(key)) {
    return { ok: false, errors: { _: ["Unknown content section."] } };
  }

  const parsed = SECTION_SCHEMAS[key].safeParse(value);
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
