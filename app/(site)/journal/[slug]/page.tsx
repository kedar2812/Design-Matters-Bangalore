import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const revalidate = 3600;

/** Rich content block shape produced by the studio journal editor. */
type Block =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "quote"; text: string; cite?: string }
  | { type: "image"; url: string; alt?: string; caption?: string };

export async function generateStaticParams() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    select: { slug: true },
  });
  return posts.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post) return {};
  return {
    title: post.metaTitle ?? post.title,
    description: post.metaDesc ?? `${post.title} — from the Design Matters journal.`,
    alternates: { canonical: `/journal/${post.slug}` },
    openGraph: post.cover ? { images: [post.cover] } : undefined,
  };
}

export default async function JournalArticle({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post || !post.published) notFound();

  const blocks = (Array.isArray(post.body) ? post.body : []) as Block[];

  return (
    <main className="px-gutter pb-section pt-36">
      <article>
        {/* Header */}
        <header className="mx-auto max-w-2xl">
          <p className="mono-label mb-4">
            {post.publishedAt && formatDate(post.publishedAt)}
            {post.tags.length > 0 && ` — ${post.tags.join(" / ")}`}
          </p>
          <h1 className="font-display text-h1">{post.title}</h1>
        </header>

        {post.cover && (
          <div className="relative mx-auto mt-12 aspect-[21/10] max-w-5xl overflow-hidden bg-stone/20">
            <Image
              src={post.cover}
              alt={post.title}
              fill
              priority
              sizes="(min-width: 1280px) 1024px, 100vw"
              placeholder={post.coverBlur ? "blur" : "empty"}
              blurDataURL={post.coverBlur ?? undefined}
              className="object-cover"
            />
          </div>
        )}

        {/* Body — optimal reading measure */}
        <div className="mx-auto mt-14 max-w-2xl space-y-7">
          {blocks.map((block, i) => {
            switch (block.type) {
              case "heading":
                return (
                  <h2 key={i} className="font-display text-h3 pt-6">
                    {block.text}
                  </h2>
                );
              case "quote":
                return (
                  <blockquote key={i} className="border-l-2 border-brass py-1 pl-6">
                    <p className="font-display text-h3 leading-snug">{block.text}</p>
                    {block.cite && <cite className="mono-label mt-3 block not-italic">{block.cite}</cite>}
                  </blockquote>
                );
              case "image":
                return (
                  <figure key={i} className="!my-12 -mx-4 sm:-mx-12">
                    <div className="relative aspect-[3/2] overflow-hidden bg-stone/20">
                      <Image
                        src={block.url}
                        alt={block.alt ?? ""}
                        fill
                        sizes="(min-width: 768px) 768px, 100vw"
                        className="object-cover"
                      />
                    </div>
                    {block.caption && (
                      <figcaption className="mono-label mt-3">{block.caption}</figcaption>
                    )}
                  </figure>
                );
              default:
                return (
                  <p key={i} className="leading-[1.75] text-ink-soft">
                    {"text" in block ? block.text : null}
                  </p>
                );
            }
          })}
        </div>

        <footer className="rule mx-auto mt-20 max-w-2xl pt-5">
          <Link href="/journal" className="mono-label transition-colors hover:text-brass">
            &larr; All journal entries
          </Link>
        </footer>
      </article>
    </main>
  );
}
