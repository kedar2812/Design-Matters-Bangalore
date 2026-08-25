import Link from "next/link";
import { prisma } from "@/lib/db";
import { CATEGORIES, categoryHref, resolveCategory } from "@/lib/categories";
import { ProjectList, type ProjectRow } from "@/components/studio/ProjectList";
import { Card, CardHead, PageHead, buttonClass } from "@/components/studio/ui";
import { Reveal } from "@/components/studio/Reveal";
import { ExternalIcon, PlusIcon } from "@/components/studio/icons";

export const metadata = { title: "Studio | Projects" };

export default async function StudioProjects() {
  const projects = await prisma.project.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { gallery: true } } },
  });

  // How the portfolio splits across the three practice-area pages — the
  // quickest way to spot a page with nothing published on it.
  const counts = CATEGORIES.map((c) => ({
    ...c,
    total: projects.filter((p) => resolveCategory(p.category)?.slug === c.slug).length,
    live: projects.filter(
      (p) => p.status === "PUBLISHED" && resolveCategory(p.category)?.slug === c.slug,
    ).length,
  }));
  const uncategorised = projects.filter((p) => !resolveCategory(p.category)).length;

  const rows: ProjectRow[] = projects.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    category: p.category,
    location: p.location,
    status: p.status,
    heroImage: p.heroImage,
    heroBlur: p.heroBlur,
    images: p._count.gallery,
    area: resolveCategory(p.category)?.label ?? null,
  }));

  return (
    <div>
      <PageHead
        title="Projects"
        subtitle="The portfolio, in the order it appears on the site."
        action={
          <Link href="/studio/projects/new" className={buttonClass("primary", "md")}>
            <PlusIcon className="size-4" />
            Add a project
          </Link>
        }
      />

      {/* Practice areas */}
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        {counts.map(({ slug, label, total, live }, i) => (
          <Reveal key={slug} delay={i * 0.05}>
            <Link
              href={categoryHref(slug)}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-full items-center justify-between gap-3 rounded-s border border-s-border bg-s-surface p-4 shadow-s transition-colors hover:border-s-border-strong"
            >
              <div className="min-w-0">
                <p className="truncate text-[0.8125rem] font-medium text-s-text-2">{label}</p>
                <p className="s-display mt-1 text-[1.5rem] leading-none text-s-text">
                  {live}
                  <span className="text-s-text-3"> / {total}</span>
                </p>
                <p className="mt-1 text-[0.75rem] text-s-text-3">
                  {live === 0 && total > 0 ? "none published yet" : "live on the site"}
                </p>
              </div>
              <ExternalIcon className="size-4 shrink-0 text-s-text-3 transition-colors group-hover:text-s-accent" />
            </Link>
          </Reveal>
        ))}
      </div>

      {uncategorised > 0 && (
        <p className="mb-4 rounded-s-sm border border-s-border bg-s-surface-2 px-3.5 py-2.5 text-[0.8125rem] text-s-text-2">
          {uncategorised} {uncategorised === 1 ? "project sits" : "projects sit"} outside the three
          practice areas, so {uncategorised === 1 ? "it appears" : "they appear"} on the main
          projects index only.
        </p>
      )}

      <Reveal delay={0.1}>
        <Card className="overflow-hidden">
          <CardHead
            title="All projects"
            hint={`${projects.length} total · ${projects.filter((p) => p.status === "PUBLISHED").length} live`}
            divided
          />
          <div className="p-3">
            <ProjectList projects={rows} />
          </div>
        </Card>
      </Reveal>
    </div>
  );
}
