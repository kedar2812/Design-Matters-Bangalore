/**
 * Portfolio read helpers shared by the index and the three practice-area
 * pages. Everything here works off `getPublishedProjects()`, so it is
 * identical in database mode and snapshot mode.
 */
import { getPublishedProjects, type SiteProject } from "@/lib/content";
import { CATEGORIES, resolveCategory, type CategorySlug } from "@/lib/categories";
import type { ProjectTile } from "@/components/site/ProjectsGrid";
import type { PortalData } from "@/components/site/CategoryPortals";

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
