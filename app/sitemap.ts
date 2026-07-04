import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts] = await Promise.all([
    prisma.project.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    }),
    prisma.post.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const fixed: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, priority: 1, changeFrequency: "weekly" },
    { url: `${SITE_URL}/projects`, priority: 0.9, changeFrequency: "weekly" },
    { url: `${SITE_URL}/about`, priority: 0.7, changeFrequency: "monthly" },
    { url: `${SITE_URL}/services`, priority: 0.7, changeFrequency: "monthly" },
    { url: `${SITE_URL}/journal`, priority: 0.6, changeFrequency: "weekly" },
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
    ...posts.map((p) => ({
      url: `${SITE_URL}/journal/${p.slug}`,
      lastModified: p.updatedAt,
      priority: 0.5,
      changeFrequency: "yearly" as const,
    })),
  ];
}
