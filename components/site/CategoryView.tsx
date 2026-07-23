import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Entry } from "@/components/motion/Entry";
import { Reveal } from "@/components/motion/Reveal";
import { ProjectShowcase } from "@/components/site/ProjectShowcase";
import { getCategoryTiles } from "@/lib/portfolio";
import { getSection, categoryCopy } from "@/lib/settings";
import { CATEGORIES, categoryHref, type Category } from "@/lib/categories";

/**
 * Page metadata for a practice area, driven by the same editable copy
 * the page renders — so retitling the section in the dashboard also
 * retitles it for Google.
 */
export async function categoryMetadata(category: Category): Promise<Metadata> {
  const content = await getSection("projects");
  const copy = categoryCopy(content, category.slug);
  return {
    title: `${category.label} projects — ${copy.tagline}`,
    description: copy.intro.slice(0, 300),
    alternates: { canonical: categoryHref(category.slug) },
  };
}

/**
 * One practice-area page — Residential, Interiors or Institutional.
 * All three routes render this; the only difference is which category
 * they pass in. Every word comes from the dashboard-editable `projects`
 * section, and the imagery comes from the projects themselves.
 */
export async function CategoryView({ category }: { category: Category }) {
  const [content, projects] = await Promise.all([
    getSection("projects"),
    getCategoryTiles(category.slug),
  ]);
  const copy = categoryCopy(content, category.slug);
  const lead = projects.find((p) => p.heroImage);
  const siblings = CATEGORIES.filter((c) => c.slug !== category.slug);

  return (
    <main>
      {/* ------------------------------------------------------- masthead */}
      <header className="px-gutter pt-36">
        <Entry>
          <p className="mono-label mb-4 text-brass">{copy.eyebrow}</p>
          <h1 className="font-display text-h1 max-w-4xl leading-[1.02]">
            {copy.heading}
          </h1>
        </Entry>

        <Entry delay={0.1}>
          <div className="mt-10 grid gap-x-gutter gap-y-6 border-t border-hairline pt-8 lg:grid-cols-12">
            <p className="mono-label lg:col-span-3">
              {category.label} — {String(projects.length).padStart(2, "0")}{" "}
              {projects.length === 1 ? "project" : "projects"}
            </p>
            <p className="max-w-2xl text-lg leading-relaxed text-ink-soft lg:col-span-8 lg:col-start-5">
              {copy.intro}
            </p>
          </div>
        </Entry>
      </header>

      {/* --------------------------------------------------- lead picture */}
      {lead?.heroImage && (
        <Entry delay={0.16} className="px-gutter pt-14">
          <Link
            href={`/projects/${lead.slug}`}
            className="rounded-frame group relative block aspect-[16/10] overflow-hidden bg-stone/15 sm:aspect-[21/9]"
          >
            <Image
              src={lead.heroImage}
              alt={lead.title}
              fill
              priority
              sizes="100vw"
              placeholder={lead.heroBlur ? "blur" : "empty"}
              blurDataURL={lead.heroBlur ?? undefined}
              className="rounded-[inherit] object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
            />
            <div
              aria-hidden
              className="absolute inset-0 rounded-[inherit] bg-gradient-to-t from-noir/75 via-noir/10 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
              <p className="mono-label mb-2 text-brass-bright">Latest</p>
              <p className="font-display text-h2 leading-none text-cream">{lead.title}</p>
              {lead.location && (
                <p className="mono-label mt-2 text-cream/75">
                  {lead.location}
                  {lead.year && ` — ${lead.year}`}
                </p>
              )}
            </div>
          </Link>
        </Entry>
      )}

      {/* ------------------------------------------------------ highlights */}
      {copy.highlights.length > 0 && (
        <section className="px-gutter pt-section">
          <ul className="grid gap-x-gutter gap-y-10 border-t border-hairline pt-10 sm:grid-cols-2 lg:grid-cols-3">
            {copy.highlights.map((h, i) => (
              <Reveal key={h.title} delay={i * 0.08}>
                <li className="list-none">
                  <p className="mono-label mb-3 text-brass">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h2 className="font-display text-h3">{h.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">{h.body}</p>
                </li>
              </Reveal>
            ))}
          </ul>
        </section>
      )}

      {/* --------------------------------------------------------- the work */}
      <section className="px-gutter pt-section">
        {projects.length > 0 ? (
          <>
            <Reveal>
              <div className="mb-16 flex flex-wrap items-baseline justify-between gap-4 border-t border-hairline pt-8">
                <h2 className="font-display text-h2">Selected {category.label.toLowerCase()} work.</h2>
                <p className="mono-label">
                  {String(projects.length).padStart(2, "0")}{" "}
                  {projects.length === 1 ? "project" : "projects"}
                </p>
              </div>
            </Reveal>
            {/* The masthead picture already carries `lead`, so the
                sequence below picks up from the next project and keeps
                its numbering continuous with it. */}
            <ProjectShowcase
              projects={projects.filter((p) => p.id !== lead?.id)}
              startIndex={lead ? 1 : 0}
            />
          </>
        ) : (
          <Reveal>
            <p className="max-w-xl border-t border-hairline pt-8 text-lg text-stone">
              {content.emptyNote}
            </p>
          </Reveal>
        )}
      </section>

      {/* -------------------------------------------------- cross-links */}
      <section className="px-gutter pb-section pt-section">
        <Reveal>
          <p className="mono-label border-t border-hairline pb-8 pt-8">
            The other practice areas
          </p>
          <ul className="grid gap-gutter sm:grid-cols-2">
            {siblings.map((c) => (
              <li key={c.slug}>
                <Link
                  href={categoryHref(c.slug)}
                  className="group flex items-baseline justify-between gap-6 border-t border-hairline py-8 transition-colors hover:border-brass"
                >
                  <span className="font-display text-h2 transition-colors group-hover:text-brass">
                    {c.label}
                  </span>
                  <span
                    aria-hidden
                    className="mono-label transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1.5"
                  >
                    &rarr;
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>
    </main>
  );
}
