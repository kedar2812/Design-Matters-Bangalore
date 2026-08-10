import type { Metadata } from "next";
import { Entry } from "@/components/motion/Entry";
import { Reveal } from "@/components/motion/Reveal";
import { CategoryPortals } from "@/components/site/CategoryPortals";
import { ProjectsGrid } from "@/components/site/ProjectsGrid";
import { getCategoryPortals, getProjectTiles } from "@/lib/portfolio";
import { getSection } from "@/lib/settings";
import { CATEGORIES, type CategorySlug } from "@/lib/categories";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Architecture Projects in Bangalore",
  description:
    "The built work of Design Matters Architects — private residences, villas, apartment interiors and institutional buildings across Bengaluru and Karnataka.",
  alternates: { canonical: "/projects" },
};

export default async function ProjectsPage() {
  const content = await getSection("projects");

  const taglines = Object.fromEntries(
    CATEGORIES.map((c) => [c.slug, content[`${c.slug}Tagline`]]),
  ) as Record<CategorySlug, string>;

  const [projects, portals] = await Promise.all([
    getProjectTiles(),
    getCategoryPortals(taglines),
  ]);

  const categories = [...new Set(projects.map((p) => p.category))];

  return (
    <main className="pb-section">
      {/* --------------------------------------------------------- opening */}
      <header className="px-gutter pt-36">
        <Entry>
          <p className="mono-label mb-4 text-brass">{content.eyebrow}</p>
          <h1 className="font-display text-h1 max-w-4xl leading-[1.02]">
            {content.heading}
          </h1>
        </Entry>
        <Entry delay={0.1}>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink-soft">
            {content.intro}
          </p>
        </Entry>
      </header>

      {/* --------------------------------------------- the three practices */}
      <section className="px-gutter pt-16">
        <Entry delay={0.16}>
          <p className="mono-label mb-8 border-t border-hairline pt-8">
            {content.portalEyebrow}
          </p>
        </Entry>
        <CategoryPortals portals={portals} />
      </section>

      {/* ------------------------------------------------------ full index */}
      <section className="px-gutter pt-section">
        <Reveal>
          <div className="mb-10 flex flex-wrap items-baseline justify-between gap-4 border-t border-hairline pt-8">
            <div>
              <p className="mono-label mb-3">{content.indexEyebrow}</p>
              <h2 className="font-display text-h2">{content.indexHeading}</h2>
            </div>
            <p className="mono-label">
              {String(projects.length).padStart(2, "0")}{" "}
              {projects.length === 1 ? "project" : "projects"}
            </p>
          </div>
        </Reveal>

        {projects.length > 0 ? (
          <ProjectsGrid projects={projects} categories={categories} />
        ) : (
          <p className="max-w-xl text-lg text-stone">{content.emptyNote}</p>
        )}
      </section>
    </main>
  );
}
