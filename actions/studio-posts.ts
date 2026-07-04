"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/require-auth";
import { slugSchema } from "@/lib/validators";

const blockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("paragraph"), text: z.string().max(10_000) }),
  z.object({ type: z.literal("heading"), text: z.string().max(300) }),
  z.object({
    type: z.literal("quote"),
    text: z.string().max(2000),
    cite: z.string().max(200).optional().or(z.literal("")),
  }),
  z.object({
    type: z.literal("image"),
    url: z.string().min(1).max(500),
    alt: z.string().max(300).optional().or(z.literal("")),
    caption: z.string().max(500).optional().or(z.literal("")),
  }),
]);

const postSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2, "Give the entry a title.").max(200),
  slug: slugSchema.optional().or(z.literal("")),
  cover: z.string().max(500).optional().or(z.literal("")),
  coverBlur: z.string().max(20_000).optional().or(z.literal("")),
  tags: z.array(z.string().trim().min(1).max(40)).max(10),
  metaTitle: z.string().max(200).optional().or(z.literal("")),
  metaDesc: z.string().max(400).optional().or(z.literal("")),
  published: z.boolean(),
  body: z.array(blockSchema).max(100),
});

export type SavePostResult =
  | { ok: true; id: string }
  | { ok: false; errors: Record<string, string[]> };

function revalidateJournal(slug?: string) {
  revalidatePath("/");
  revalidatePath("/journal");
  if (slug) revalidatePath(`/journal/${slug}`);
  revalidatePath("/studio/journal");
}

export async function savePost(input: unknown): Promise<SavePostResult> {
  await requireUser();

  const parsed = postSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]> };
  }
  const d = parsed.data;

  const slug =
    d.slug || d.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const clash = await prisma.post.findFirst({
    where: { slug, ...(d.id ? { NOT: { id: d.id } } : {}) },
    select: { id: true },
  });
  if (clash) {
    return { ok: false, errors: { slug: [`“${slug}” is already used by another entry.`] } };
  }

  // Drop empty blocks; keep author's order.
  const body = d.body.filter((b) =>
    b.type === "image" ? b.url : b.text.trim().length > 0,
  );

  const data = {
    title: d.title,
    slug,
    cover: d.cover || null,
    coverBlur: d.coverBlur || null,
    tags: d.tags,
    metaTitle: d.metaTitle || null,
    metaDesc: d.metaDesc || null,
    published: d.published,
    body,
  };

  let id: string;
  if (d.id) {
    const existing = await prisma.post.findUnique({ where: { id: d.id }, select: { publishedAt: true } });
    const post = await prisma.post.update({
      where: { id: d.id },
      data: {
        ...data,
        // Stamp publishedAt the first time it goes live.
        publishedAt: d.published ? existing?.publishedAt ?? new Date() : existing?.publishedAt,
      },
    });
    id = post.id;
  } else {
    const post = await prisma.post.create({
      data: { ...data, publishedAt: d.published ? new Date() : null },
    });
    id = post.id;
  }

  revalidateJournal(slug);
  return { ok: true, id };
}

export async function deletePost(id: string) {
  await requireUser();
  const post = await prisma.post.delete({ where: { id } });
  revalidateJournal(post.slug);
}

export async function togglePostPublish(id: string) {
  await requireUser();
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return;
  await prisma.post.update({
    where: { id },
    data: {
      published: !post.published,
      publishedAt: !post.published ? post.publishedAt ?? new Date() : post.publishedAt,
    },
  });
  revalidateJournal(post.slug);
}
