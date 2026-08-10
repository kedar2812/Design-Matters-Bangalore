import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PostForm, type PostFormData } from "@/components/studio/PostForm";

export const metadata = { title: "Studio — Edit journal entry" };

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) notFound();

  const initial: PostFormData = {
    id: post.id,
    title: post.title,
    slug: post.slug,
    cover: post.cover ?? "",
    coverBlur: post.coverBlur ?? "",
    tags: post.tags.join(", "),
    metaTitle: post.metaTitle ?? "",
    metaDesc: post.metaDesc ?? "",
    published: post.published,
    body: (Array.isArray(post.body) ? post.body : []) as PostFormData["body"],
  };

  return (
    <div>
      <header className="mb-10">
        <p className="s-label mb-2">
          Journal — {post.published ? "on site" : "draft"}
        </p>
        <h1 className="text-[1.375rem] font-semibold tracking-[-0.02em]">{post.title}</h1>
      </header>
      <PostForm initial={initial} />
    </div>
  );
}
