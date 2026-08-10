import type { MetadataRoute } from "next";
import { getPublishedProjects } from "@/lib/content";
import { SITE_URL } from "@/lib/seo";
import { CATEGORY_SLUGS } from "@/lib/categories";

export const revalidate = 3600;

// Journal routes are intentionally absent: the client opted out of a
// public blog in the website-discovery form.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getPublishedProjects();

  // The static pages have no per-page timestamp in the database, but they
  // are not static in practice — every one of them renders dashboard-
  // editable copy. The newest project edit is the closest honest proxy
  // for "when did this site last change", and a sitemap entry with no
  // lastModified at all is the one thing a crawler cannot schedule
  // against. Falls back to build time on an empty portfolio.
  const lastModified = projects.reduce<Date>(
    (latest, p) => (p.updatedAt > latest ? p.updatedAt : latest),
    new Date(0),
  );
  const siteModified = lastModified.getTime() ? lastModified : new Date();

  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, priority: 1, changeFrequency: "weekly" },
    { url: `${SITE_URL}/projects`, priority: 0.9, changeFrequency: "weekly" },
    // The practice-area pages are the studio's main search surface —
    // "residential architects bengaluru" and the like land here.
    ...CATEGORY_SLUGS.map((slug) => ({
      url: `${SITE_URL}/projects/${slug}`,
      priority: 0.9,
      changeFrequency: "weekly" as const,
    })),
    { url: `${SITE_URL}/about`, priority: 0.7, changeFrequency: "monthly" },
    { url: `${SITE_URL}/testimonials`, priority: 0.7, changeFrequency: "monthly" },
    { url: `${SITE_URL}/press`, priority: 0.7, changeFrequency: "monthly" },
    { url: `${SITE_URL}/services`, priority: 0.7, changeFrequency: "monthly" },
    { url: `${SITE_URL}/contact`, priority: 0.8, changeFrequency: "yearly" },
  ];

  const fixed: MetadataRoute.Sitemap = pages.map((entry) => ({
    lastModified: siteModified,
    ...entry,
  }));

  return [
    ...fixed,
    ...projects.map((p) => ({
      url: `${SITE_URL}/projects/${p.slug}`,
      lastModified: p.updatedAt,
      priority: 0.8,
      changeFrequency: "monthly" as const,
      // Google Images is a real front door for architecture, and it only
      // finds a photograph it can attribute to a page. Listing the hero
      // and the gallery here is the cheapest way to offer every frame in
      // the portfolio for indexing — roughly 150 photographs that were
      // otherwise discoverable only by rendering the page.
      images: [p.heroImage, ...p.gallery.map((g) => g.url)]
        .filter((u): u is string => Boolean(u))
        .map((u) => `${SITE_URL}${u}`),
    })),
  ];
}
