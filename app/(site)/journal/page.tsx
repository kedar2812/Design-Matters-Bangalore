import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Reveal } from "@/components/motion/Reveal";
import { Entry } from "@/components/motion/Entry";
import { formatDate } from "@/lib/utils";

export const revalidate = 3600;

// The client opted out of a public blog (website-discovery form), so
// the journal is unlinked and unindexed — kept alive for the studio
// dashboard until a final keep/remove call is made.
export const metadata: Metadata = {
  title: "Journal — Notes from the Studio",
  description:
    "Occasional writing from Design Matters Architects: project notes, material studies, and thinking on building well in Bengaluru.",
  alternates: { canonical: "/journal" },
  robots: { index: false, follow: false },
};

export default async function JournalPage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      cover: true,
      coverBlur: true,
      tags: true,
      publishedAt: true,
    },
  });

  return (
    <main className="px-gutter pb-section pt-36">
      <Entry>
        <p className="mono-label mb-4">Journal</p>
        <h1 className="font-display text-h1 mb-14 max-w-3xl">
          Notes from the studio.
        </h1>
      </Entry>

      {posts.length === 0 ? (
        <Entry>
          <div className="rule pt-6">
            <p className="max-w-md leading-relaxed text-ink-soft">
              First entries are being drafted. In the meantime, the work says
              plenty —{" "}
              <Link href="/projects" className="underline underline-offset-4 hover:text-brass">
                see the projects
              </Link>
              .
            </p>
          </div>
        </Entry>
      ) : (
        <ul className="grid gap-gutter sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <Reveal key={post.id} delay={(i % 3) * 0.1}>
              <li>
                <Link href={`/journal/${post.slug}`} className="group block">
                  {post.cover && (
                    <div className="relative mb-5 aspect-[4/3] overflow-hidden bg-stone/20">
                      <Image
                        src={post.cover}
                        alt={post.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        placeholder={post.coverBlur ? "blur" : "empty"}
                        blurDataURL={post.coverBlur ?? undefined}
                        className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                      />
                    </div>
                  )}
                  <h2 className="font-display text-h3 transition-colors group-hover:text-brass">
                    {post.title}
                  </h2>
                  <p className="mono-label mt-2">
                    {post.publishedAt && formatDate(post.publishedAt)}
                    {post.tags.length > 0 && ` — ${post.tags.join(" / ")}`}
                  </p>
                </Link>
              </li>
            </Reveal>
          ))}
        </ul>
      )}
    </main>
  );
}
