import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { moveProject, togglePublish } from "@/actions/studio-projects";

export const metadata = { title: "Studio — Projects" };

export default async function StudioProjects() {
  const projects = await prisma.project.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { gallery: true } } },
  });

  return (
    <div className="max-w-5xl">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mono-label mb-2">Projects</p>
          <h1 className="font-display text-h2">The portfolio.</h1>
        </div>
        <Link
          href="/studio/projects/new"
          className="border border-ink bg-ink px-6 py-2.5 text-sm text-bone transition-colors hover:bg-transparent hover:text-ink"
        >
          Add a project
        </Link>
      </header>

      <p className="mono-label rule pt-4">
        Order here is display order on the site — first project is the homepage hero.
      </p>

      <ul className="mt-2 divide-y divide-hairline">
        {projects.map((p, i) => (
          <li key={p.id} className="flex items-center gap-5 py-4">
            {/* Order controls */}
            <div className="flex flex-col">
              <form action={moveProject.bind(null, p.id, "up")}>
                <button
                  type="submit"
                  disabled={i === 0}
                  aria-label={`Move ${p.title} up`}
                  className="px-1 text-stone transition-colors hover:text-ink disabled:opacity-25"
                >
                  ↑
                </button>
              </form>
              <form action={moveProject.bind(null, p.id, "down")}>
                <button
                  type="submit"
                  disabled={i === projects.length - 1}
                  aria-label={`Move ${p.title} down`}
                  className="px-1 text-stone transition-colors hover:text-ink disabled:opacity-25"
                >
                  ↓
                </button>
              </form>
            </div>

            {/* Thumb */}
            <div className="relative hidden h-14 w-20 shrink-0 overflow-hidden bg-stone/20 sm:block">
              {p.heroImage && (
                <Image
                  src={p.heroImage}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              )}
            </div>

            {/* Facts */}
            <Link href={`/studio/projects/${p.id}`} className="group min-w-0 flex-1">
              <p className="truncate text-sm font-medium transition-colors group-hover:text-brass">
                {p.title}
              </p>
              <p className="mono-label mt-0.5">
                {p.category}
                {p.location && ` — ${p.location}`}
                {" — "}
                {p._count.gallery} {p._count.gallery === 1 ? "image" : "images"}
              </p>
            </Link>

            {/* Publish toggle */}
            <form action={togglePublish.bind(null, p.id)}>
              <button
                type="submit"
                className={`mono-label border px-3 py-1.5 transition-colors ${
                  p.status === "PUBLISHED"
                    ? "border-brass text-brass hover:border-stone hover:text-stone"
                    : "border-hairline text-stone hover:border-brass hover:text-brass"
                }`}
              >
                {p.status === "PUBLISHED" ? "On site" : "Draft"}
              </button>
            </form>

            <Link href={`/studio/projects/${p.id}`} className="mono-label hover:text-brass">
              Edit
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
