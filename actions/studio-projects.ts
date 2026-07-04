"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/require-auth";
import { slugSchema } from "@/lib/validators";

const storyBlockSchema = z.object({
  type: z.enum(["CONCEPT", "PROCESS", "FINAL"]),
  text: z.string().max(5000).optional().or(z.literal("")),
  image: z.string().max(500).optional().or(z.literal("")),
});

const galleryItemSchema = z.object({
  url: z.string().min(1).max(500),
  alt: z.string().max(300).optional().or(z.literal("")),
  blurData: z.string().max(20_000).optional().or(z.literal("")),
});

const projectSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2, "Give the project a name.").max(160),
  slug: slugSchema.optional().or(z.literal("")),
  category: z.string().trim().min(2, "Pick or type a category.").max(60),
  year: z.coerce.number().int().min(1990).max(2100).optional().nullable(),
  location: z.string().max(160).optional().or(z.literal("")),
  typology: z.string().max(160).optional().or(z.literal("")),
  area: z.string().max(80).optional().or(z.literal("")),
  team: z.string().max(400).optional().or(z.literal("")),
  heroImage: z.string().max(500).optional().or(z.literal("")),
  heroBlur: z.string().max(20_000).optional().or(z.literal("")),
  metaTitle: z.string().max(200).optional().or(z.literal("")),
  metaDesc: z.string().max(400).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  story: z.array(storyBlockSchema).max(3),
  gallery: z.array(galleryItemSchema).max(60),
});

export type SaveProjectResult =
  | { ok: true; id: string }
  | { ok: false; errors: Record<string, string[]> };

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function revalidateSite(slug?: string) {
  revalidatePath("/");
  revalidatePath("/projects");
  if (slug) revalidatePath(`/projects/${slug}`);
}

export async function saveProject(input: unknown): Promise<SaveProjectResult> {
  await requireUser();

  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]> };
  }
  const d = parsed.data;

  const slug = d.slug || slugify(d.title);
  const clash = await prisma.project.findFirst({
    where: { slug, ...(d.id ? { NOT: { id: d.id } } : {}) },
    select: { id: true },
  });
  if (clash) {
    return { ok: false, errors: { slug: [`“${slug}” is already used by another project.`] } };
  }

  const scalars = {
    title: d.title,
    slug,
    category: d.category,
    year: d.year ?? null,
    location: d.location || null,
    typology: d.typology || null,
    area: d.area || null,
    team: d.team || null,
    heroImage: d.heroImage || null,
    heroBlur: d.heroBlur || null,
    metaTitle: d.metaTitle || null,
    metaDesc: d.metaDesc || null,
    status: d.status,
  };

  const story = d.story
    .filter((b) => b.text || b.image)
    .map((b, i) => ({ type: b.type, text: b.text || null, image: b.image || null, order: i }));
  const gallery = d.gallery.map((g, i) => ({
    url: g.url,
    alt: g.alt || null,
    blurData: g.blurData || null,
    order: i,
  }));

  const id = await prisma.$transaction(async (tx) => {
    let projectId = d.id;
    if (projectId) {
      await tx.project.update({ where: { id: projectId }, data: scalars });
      await tx.storyBlock.deleteMany({ where: { projectId } });
      await tx.galleryImage.deleteMany({ where: { projectId } });
    } else {
      const last = await tx.project.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
      const created = await tx.project.create({
        data: { ...scalars, order: (last?.order ?? -1) + 1 },
      });
      projectId = created.id;
    }
    if (story.length) {
      await tx.storyBlock.createMany({ data: story.map((s) => ({ ...s, projectId: projectId! })) });
    }
    if (gallery.length) {
      await tx.galleryImage.createMany({ data: gallery.map((g) => ({ ...g, projectId: projectId! })) });
    }
    return projectId!;
  });

  await revalidateSite(slug);
  revalidatePath("/studio/projects");
  return { ok: true, id };
}

export async function togglePublish(id: string) {
  await requireUser();
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return;
  await prisma.project.update({
    where: { id },
    data: { status: project.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" },
  });
  await revalidateSite(project.slug);
  revalidatePath("/studio/projects");
}

export async function deleteProject(id: string) {
  await requireUser();
  const project = await prisma.project.delete({ where: { id } });
  await revalidateSite(project.slug);
  revalidatePath("/studio/projects");
}

/** Swap display order with the neighbour above/below. */
export async function moveProject(id: string, direction: "up" | "down") {
  await requireUser();
  const all = await prisma.project.findMany({ orderBy: { order: "asc" }, select: { id: true } });
  const idx = all.findIndex((p) => p.id === id);
  const swap = direction === "up" ? idx - 1 : idx + 1;
  if (idx === -1 || swap < 0 || swap >= all.length) return;

  await prisma.$transaction([
    prisma.project.update({ where: { id: all[idx].id }, data: { order: swap } }),
    prisma.project.update({ where: { id: all[swap].id }, data: { order: idx } }),
  ]);
  await revalidateSite();
  revalidatePath("/studio/projects");
}
