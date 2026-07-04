import type { Metadata } from "next";
import { prisma } from "@/lib/db";
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
  const projects = await prisma.project.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { order: "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      year: true,
      location: true,
      heroImage: true,
      heroBlur: true,
    },
  });

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
