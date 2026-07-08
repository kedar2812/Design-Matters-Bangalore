import type { Metadata } from "next";
import { getPublishedProjects } from "@/lib/content";
import { ProjectsGrid } from "@/components/site/ProjectsGrid";
import { Entry } from "@/components/motion/Entry";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Projects — Residences, Apartments, Commercial & Interiors",
  description:
    "The built work of Design Matters Architects: private residences, apartment interiors, commercial and hospitality spaces across Bengaluru.",
  alternates: { canonical: "/projects" },
};

export default async function ProjectsPage() {
  // Trim to the tile fields so the client payload stays lean.
  const projects = (await getPublishedProjects()).map(
    ({ id, slug, title, category, year, location, heroImage, heroBlur }) => ({
      id, slug, title, category, year, location, heroImage, heroBlur,
    }),
  );

  const categories = [...new Set(projects.map((p) => p.category))];

  return (
    <main className="px-gutter pb-section pt-36">
      <Entry>
        <p className="mono-label mb-4">Index of works — {String(projects.length).padStart(2, "0")}</p>
        <h1 className="font-display text-h1 mb-14 max-w-3xl">
          The work speaks in plan, section and light.
        </h1>
      </Entry>
      <ProjectsGrid projects={projects} categories={categories} />
    </main>
  );
}
