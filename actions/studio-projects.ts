"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/require-auth";
import { slugSchema } from "@/lib/validators";
import { CATEGORY_SLUGS, RESERVED_PROJECT_SLUGS } from "@/lib/categories";

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
  area: z.string().max(160).optional().or(z.literal("")),
  siteArea: z.string().max(160).optional().or(z.literal("")),
  team: z.string().max(400).optional().or(z.literal("")),
  client: z.string().max(200).optional().or(z.literal("")),
  photographer: z.string().max(200).optional().or(z.literal("")),
  collaborator: z.string().max(300).optional().or(z.literal("")),
  units: z.string().max(120).optional().or(z.literal("")),
  statusNote: z.string().max(160).optional().or(z.literal("")),
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
  // A project's category can change on any save, and the portals show
  // counts and cover art — cheaper to refresh all three than to work
  // out which one moved.
  for (const c of CATEGORY_SLUGS) revalidatePath(`/projects/${c}`);
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

  // The practice-area pages live at /projects/<slug> too, and a static
  // segment always wins in Next's router — so a project taking one of
  // those slugs would silently become unreachable.
  if (RESERVED_PROJECT_SLUGS.includes(slug)) {
    return {
      ok: false,
      errors: {
        slug: [
          `“${slug}” is reserved for the ${slug} practice-area page — choose a different URL slug.`,
        ],
      },
    };
  }

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
    siteArea: d.siteArea || null,
    team: d.team || null,
    client: d.client || null,
    photographer: d.photographer || null,
    collaborator: d.collaborator || null,
    units: d.units || null,
    statusNote: d.statusNote || null,
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

/**
 * Persist a whole display order at once.
 *
 * This replaces a swap-two-neighbours action that wrote array *indices*
 * into `order`. That is only correct while the stored values happen to be
 * 0..n-1, and they stop being that the first time a project is deleted:
 * `saveProject` numbers new rows from the current maximum and nothing
 * renumbers on delete, so gaps accumulate. Once they do, writing an index
 * can collide with a row nobody touched — two projects end up sharing an
 * `order`, and their relative position becomes whatever Postgres feels
 * like returning. The live database had already reached that state.
 *
 * Writing the entire sequence removes the failure mode rather than
 * patching it: order is always exactly 0..n-1 afterwards, whatever it was
 * before. It also lets the list be dragged rather than nudged a row at a
 * time, which is what the brief asked for.
 *
 * Ids not present in `ids` keep their relative order and are appended —
 * so a project created in another tab mid-drag is pushed to the end
 * rather than silently deleted from the ordering.
 */
export async function reorderProjects(ids: string[]) {
  await requireUser();

  const all = await prisma.project.findMany({
    orderBy: { order: "asc" },
    select: { id: true },
  });
  const known = new Set(all.map((p) => p.id));

  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const id of ids) {
    if (known.has(id) && !seen.has(id)) {
      seen.add(id);
      ordered.push(id);
    }
  }
  for (const p of all) {
    if (!seen.has(p.id)) ordered.push(p.id);
  }

  await prisma.$transaction(
    ordered.map((id, order) => prisma.project.update({ where: { id }, data: { order } })),
  );

  await revalidateSite();
  revalidatePath("/studio/projects");
}
