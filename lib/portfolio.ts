/**
 * Portfolio read helpers shared by the index and the three practice-area
 * pages. Everything here works off `getPublishedProjects()`, so it is
 * identical in database mode and snapshot mode.
 */
import { getPublishedProjects, type SiteProject } from "@/lib/content";
import { CATEGORIES, resolveCategory, type CategorySlug } from "@/lib/categories";
import type { ProjectTile } from "@/components/site/ProjectsGrid";
import type { PortalData } from "@/components/site/CategoryPortals";
import type { HeroImage } from "@/components/site/PageHero";

/** Trim a project to the fields a tile renders — keeps payloads lean. */
export const toTile = (p: SiteProject): ProjectTile => ({
  id: p.id,
  slug: p.slug,
  title: p.title,
  category: p.category,
  year: p.year,
  location: p.location,
  heroImage: p.heroImage,
  heroBlur: p.heroBlur,
});

/** Every published project, as tiles, in display order. */
export async function getProjectTiles(): Promise<ProjectTile[]> {
  return (await getPublishedProjects()).map(toTile);
}

/** Published projects in one practice area, in display order. */
export async function getCategoryTiles(slug: CategorySlug): Promise<ProjectTile[]> {
  const all = await getPublishedProjects();
  return all.filter((p) => resolveCategory(p.category)?.slug === slug).map(toTile);
}

/**
 * Counts and cover art for the three portals. The cover is the leading
 * published project in that category, so portals stay current without
 * anyone uploading separate artwork.
 */
export async function getCategoryPortals(
  taglines: Record<CategorySlug, string>,
): Promise<PortalData[]> {
  const all = await getPublishedProjects();

  return CATEGORIES.map(({ slug }) => {
    const inCategory = all.filter((p) => resolveCategory(p.category)?.slug === slug);
    const cover = inCategory.find((p) => p.heroImage);
    return {
      slug,
      tagline: taglines[slug],
      count: inCategory.length,
      image: cover?.heroImage ?? null,
      blur: cover?.heroBlur ?? null,
    };
  });
}

/**
 * Hero-band photography for a secondary page.
 *
 * `slugs` names the projects that page is actually about — the ones it
 * cites, reviews or sells. Anything without a hero photograph, or naming
 * a project that has no page here, drops out silently rather than
 * leaving a hole in the grid.
 *
 * With no slugs it falls back to the leading published projects, which
 * keeps a page like Contact current without anyone curating it.
 */
export async function getHeroImages(
  slugs: string[] = [],
  limit = 3,
): Promise<HeroImage[]> {
  const all = await getPublishedProjects();
  const withHero = all.filter((p) => p.heroImage);

  const picked = slugs.length
    ? slugs
        .map((s) => withHero.find((p) => p.slug === s))
        .filter((p): p is SiteProject => Boolean(p))
    : withHero;

  // De-duplicate: several press pieces can cite the same house.
  const seen = new Set<string>();
  return picked
    .filter((p) => !seen.has(p.slug) && seen.add(p.slug))
    .slice(0, limit)
    .map((p) => ({
      src: p.heroImage!,
      alt: `${p.title}${p.location ? `, ${p.location}` : ""} · Design Matters`,
      blur: p.heroBlur,
    }));
}
