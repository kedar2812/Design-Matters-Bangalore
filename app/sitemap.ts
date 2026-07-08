import type { MetadataRoute } from "next";
import { getPublishedProjects } from "@/lib/content";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 3600;

// Journal routes are intentionally absent: the client opted out of a
// public blog in the website-discovery form.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getPublishedProjects();

  const fixed: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, priority: 1, changeFrequency: "weekly" },
    { url: `${SITE_URL}/projects`, priority: 0.9, changeFrequency: "weekly" },
    { url: `${SITE_URL}/about`, priority: 0.7, changeFrequency: "monthly" },
    { url: `${SITE_URL}/services`, priority: 0.7, changeFrequency: "monthly" },
    { url: `${SITE_URL}/contact`, priority: 0.8, changeFrequency: "yearly" },
  ];

  return [
    ...fixed,
    ...projects.map((p) => ({
      url: `${SITE_URL}/projects/${p.slug}`,
      lastModified: p.updatedAt,
      priority: 0.8,
      changeFrequency: "monthly" as const,
    })),
  ];
}
