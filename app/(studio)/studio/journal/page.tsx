import Link from "next/link";
import { prisma } from "@/lib/db";
import { togglePostPublish } from "@/actions/studio-posts";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Studio — Journal" };

export default async function StudioJournal() {
  const posts = await prisma.post.findMany({ orderBy: { updatedAt: "desc" } });

  return (
    <div className="max-w-5xl">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="s-label mb-2">Journal</p>
          <h1 className="text-[1.375rem] font-semibold tracking-[-0.02em]">Notes from the studio.</h1>
        </div>
        <Link
          href="/studio/journal/new"
          className="border border-s-solid bg-s-solid px-6 py-2.5 text-sm text-s-on-solid transition-colors hover:bg-transparent hover:text-s-text"
        >
          Write an entry
        </Link>
      </header>

      {posts.length === 0 ? (
        <p className="rule pt-6 text-sm text-s-text-3">
          Nothing written yet. Project walk-throughs, material studies, site
          notes — entries published here appear on the public journal.
        </p>
      ) : (
        <ul className="rule divide-y divide-s-border">
          {posts.map((post) => (
            <li key={post.id} className="flex items-center gap-5 py-4">
              <Link href={`/studio/journal/${post.id}`} className="group min-w-0 flex-1">
                <p className="truncate text-sm font-medium transition-colors group-hover:text-s-accent">
                  {post.title}
                </p>
                <p className="s-label mt-0.5">
                  {post.published && post.publishedAt
                    ? `Published ${formatDate(post.publishedAt)}`
                    : `Edited ${formatDate(post.updatedAt)}`}
                  {post.tags.length > 0 && ` — ${post.tags.join(" / ")}`}
                </p>
              </Link>
              <form action={togglePostPublish.bind(null, post.id)}>
                <button
                  type="submit"
                  className={`s-label border px-3 py-1.5 transition-colors ${
                    post.published
                      ? "border-brass text-s-accent hover:border-stone hover:text-s-text-3"
                      : "border-s-border text-s-text-3 hover:border-brass hover:text-s-accent"
                  }`}
                >
                  {post.published ? "On site" : "Draft"}
                </button>
              </form>
              <Link href={`/studio/journal/${post.id}`} className="s-label hover:text-s-accent">
                Edit
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
