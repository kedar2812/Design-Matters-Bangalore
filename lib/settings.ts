/**
 * Editable site content — the DB-backed reader.
 *
 * Shapes and built-in copy live in `lib/content-defaults` (no database
 * import, so client components can reach them). This module merges the
 * stored JSON over those defaults, so a section that has never been
 * edited still renders, and adding a new default field needs no
 * migration and no backfill.
 */
import { cache } from "react";
import { prisma } from "@/lib/db";
import { DEFAULTS, type SectionKey, type Sections } from "@/lib/content-defaults";

export * from "@/lib/content-defaults";

/* ------------------------------------------------------------ reading */

/** All stored overrides, deduped per request. */
const loadOverrides = cache(async (): Promise<Partial<Record<SectionKey, unknown>>> => {
  try {
    const rows = await prisma.siteSetting.findMany();
    return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Partial<
      Record<SectionKey, unknown>
    >;
  } catch {
    // A missing table (fresh clone, pre-migrate) must not take the site
    // down — fall back to defaults.
    return {};
  }
});

/**
 * Stored values win field-by-field; anything absent falls back to the
 * default, so new default fields appear without re-saving in the dashboard.
 */
export async function getSection<K extends SectionKey>(key: K): Promise<Sections[K]> {
  const overrides = await loadOverrides();
  const stored = overrides[key];
  const base = DEFAULTS[key] as Sections[K];
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return base;
  return { ...base, ...(stored as object) } as Sections[K];
}

export const getIdentity = () => getSection("identity");
