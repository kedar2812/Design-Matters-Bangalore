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
          <p className="mono-label mb-2">Journal</p>
          <h1 className="font-display text-h2">Notes from the studio.</h1>
        </div>
        <Link
          href="/studio/journal/new"
          className="border border-ink bg-ink px-6 py-2.5 text-sm text-bone transition-colors hover:bg-transparent hover:text-ink"
        >
          Write an entry
        </Link>
      </header>

      {posts.length === 0 ? (
        <p className="rule pt-6 text-sm text-stone">
          Nothing written yet. Project walk-throughs, material studies, site
          notes — entries published here appear on the public journal.
        </p>
      ) : (
        <ul className="rule divide-y divide-hairline">
          {posts.map((post) => (
            <li key={post.id} className="flex items-center gap-5 py-4">
              <Link href={`/studio/journal/${post.id}`} className="group min-w-0 flex-1">
                <p className="truncate text-sm font-medium transition-colors group-hover:text-brass">
                  {post.title}
                </p>
                <p className="mono-label mt-0.5">
                  {post.published && post.publishedAt
                    ? `Published ${formatDate(post.publishedAt)}`
                    : `Edited ${formatDate(post.updatedAt)}`}
                  {post.tags.length > 0 && ` — ${post.tags.join(" / ")}`}
                </p>
              </Link>
              <form action={togglePostPublish.bind(null, post.id)}>
                <button
                  type="submit"
                  className={`mono-label border px-3 py-1.5 transition-colors ${
                    post.published
                      ? "border-brass text-brass hover:border-stone hover:text-stone"
                      : "border-hairline text-stone hover:border-brass hover:text-brass"
                  }`}
                >
                  {post.published ? "On site" : "Draft"}
                </button>
              </form>
              <Link href={`/studio/journal/${post.id}`} className="mono-label hover:text-brass">
                Edit
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
