/**
 * The studio's three practice areas.
 *
 * This is the single source of truth for the category taxonomy: the
 * dashboard's category picker, the nav's quick links, the `/projects`
 * portals and the three dedicated category pages all read from here,
 * so adding or renaming a practice area is a one-file change.
 *
 * Deliberately free of any database import — the nav and the project
 * form are client components and reach this module through the browser
 * bundle. Editable *copy* for each category lives in the `projects`
 * section of `lib/content-defaults`; this file holds only the
 * structural facts (slug, canonical label, routing).
 */

export type CategorySlug = "residential" | "interiors" | "institutional";

export type Category = {
  slug: CategorySlug;
  /** Canonical label, exactly as stored in `Project.category`. */
  label: string;
  /** Roman-ish index shown as the section numeral on the site. */
  numeral: string;
  /** Alternative spellings that should resolve to this category. */
  aliases: string[];
};

export const CATEGORIES: Category[] = [
  {
    slug: "residential",
    label: "Residential",
    numeral: "01",
    aliases: ["residence", "residences", "homes", "housing", "villa", "villas"],
  },
  {
    slug: "interiors",
    label: "Interiors",
    numeral: "02",
    aliases: ["interior", "interior design", "fit-out", "fitout"],
  },
  {
    slug: "institutional",
    label: "Institutional",
    numeral: "03",
    aliases: ["institution", "institutions", "civic", "education", "educational"],
  },
];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);

/** Canonical labels, in display order — what the dashboard offers first. */
export const CATEGORY_LABELS = CATEGORIES.map((c) => c.label);

/**
 * Slugs that a project must never claim, or its detail page would be
 * shadowed by the category route sitting at the same path depth.
 * Enforced in `actions/studio-projects`.
 */
export const RESERVED_PROJECT_SLUGS: readonly string[] = CATEGORY_SLUGS;

export const categoryBySlug = (slug: string): Category | undefined =>
  CATEGORIES.find((c) => c.slug === slug);

/**
 * Resolve a free-typed `Project.category` to one of the three practice
 * areas. Matching is case- and spacing-insensitive and accepts the
 * aliases above, so legacy rows ("residences", "Interior") still land
 * on the right page. Anything unrecognised (e.g. the older
 * "Commercial" / "Hospitality" values) returns `undefined` — those
 * projects still appear on the main index under their own filter, they
 * just don't belong to a dedicated page.
 */
export function resolveCategory(value: string | null | undefined): Category | undefined {
  if (!value) return undefined;
  const needle = value.trim().toLowerCase().replace(/\s+/g, " ");
  return CATEGORIES.find(
    (c) => c.slug === needle || c.label.toLowerCase() === needle || c.aliases.includes(needle),
  );
}

/** True when a project's stored category belongs to the given practice area. */
export const isInCategory = (projectCategory: string, slug: CategorySlug) =>
  resolveCategory(projectCategory)?.slug === slug;

export const categoryHref = (slug: CategorySlug) => `/projects/${slug}`;
