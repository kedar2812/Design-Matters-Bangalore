import { prisma } from "@/lib/db";
import type {
  PostModel,
  ProjectModel,
  GalleryImageModel,
  StoryBlockModel,
  TestimonialModel,
} from "@/lib/generated/prisma/models";
import snapshotJson from "@/content/site-snapshot.json";

/**
 * The public site's only data source. Two backings, one shape:
 *
 *  - live Postgres whenever DATABASE_URL is configured (local dev, the
 *    client's server) — content managed from the studio dashboard
 *  - `content/site-snapshot.json` when it isn't (e.g. the Vercel client
 *    preview) — a committed export so the site needs no database at all
 *
 * Snapshot mode is automatic: no DATABASE_URL → snapshot. DATA_SNAPSHOT=1
 * forces it even when a database is configured. Only published content
 * is ever exported, so drafts can't leak. Refresh after content changes:
 * `npm run snapshot`.
 */

export type Post = PostModel;
export type Testimonial = TestimonialModel;
export type SiteProject = ProjectModel & {
  gallery: GalleryImageModel[];
  storyBlocks: StoryBlockModel[];
};

/** True when serving the committed snapshot (no database). */
export const isSnapshotMode =
  process.env.DATA_SNAPSHOT === "1" || !process.env.DATABASE_URL;

type RawSnapshot = {
  exportedAt: string;
  projects: (Omit<SiteProject, "createdAt" | "updatedAt"> & {
    createdAt: string;
    updatedAt: string;
  })[];
  posts: (Omit<Post, "createdAt" | "updatedAt" | "publishedAt"> & {
    createdAt: string;
    updatedAt: string;
    publishedAt: string | null;
  })[];
  /** Absent in snapshots taken before testimonials existed. */
  testimonials?: (Omit<Testimonial, "createdAt" | "updatedAt"> & {
    createdAt: string;
    updatedAt: string;
  })[];
};

let cache: {
  projects: SiteProject[];
  posts: Post[];
  testimonials: Testimonial[];
} | null = null;

function snapshot() {
  if (!cache) {
    const raw = snapshotJson as unknown as RawSnapshot;
    cache = {
      projects: raw.projects.map((p) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      })) as SiteProject[],
      posts: raw.posts.map((p) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
        publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
      })) as Post[],
      testimonials: (raw.testimonials ?? []).map((t) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      })) as Testimonial[],
    };
  }
  return cache;
}

/** Published projects in display order, gallery + story blocks included. */
export async function getPublishedProjects(): Promise<SiteProject[]> {
  if (isSnapshotMode) return snapshot().projects;
  return prisma.project.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { order: "asc" },
    include: {
      gallery: { orderBy: { order: "asc" } },
      storyBlocks: { orderBy: { order: "asc" } },
    },
  });
}

/** A single published project by slug (drafts read as absent). */
export async function getPublishedProject(slug: string): Promise<SiteProject | null> {
  if (isSnapshotMode) return snapshot().projects.find((p) => p.slug === slug) ?? null;
  const project = await prisma.project.findUnique({
    where: { slug },
    include: {
      gallery: { orderBy: { order: "asc" } },
      storyBlocks: { orderBy: { order: "asc" } },
    },
  });
  return project?.status === "PUBLISHED" ? project : null;
}

/** Published testimonials in display order. */
export async function getPublishedTestimonials(): Promise<Testimonial[]> {
  if (isSnapshotMode) return snapshot().testimonials;
  return prisma.testimonial.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
  });
}

/** Published journal posts, newest first. */
export async function getPublishedPosts(): Promise<Post[]> {
  if (isSnapshotMode) return snapshot().posts;
  return prisma.post.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
  });
}

/** A single published post by slug (unpublished reads as absent). */
export async function getPublishedPost(slug: string): Promise<Post | null> {
  if (isSnapshotMode) return snapshot().posts.find((p) => p.slug === slug) ?? null;
  const post = await prisma.post.findUnique({ where: { slug } });
  return post?.published ? post : null;
}
