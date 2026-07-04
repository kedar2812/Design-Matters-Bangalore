import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProjectForm, type ProjectFormData } from "@/components/studio/ProjectForm";

export const metadata = { title: "Studio — Edit project" };

const STORY_ORDER = ["CONCEPT", "PROCESS", "FINAL"] as const;

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      gallery: { orderBy: { order: "asc" } },
      storyBlocks: { orderBy: { order: "asc" } },
    },
  });
  if (!project) notFound();

  const initial: ProjectFormData = {
    id: project.id,
    title: project.title,
    slug: project.slug,
    category: project.category,
    year: project.year?.toString() ?? "",
    location: project.location ?? "",
    typology: project.typology ?? "",
    area: project.area ?? "",
    team: project.team ?? "",
    heroImage: project.heroImage ?? "",
    heroBlur: project.heroBlur ?? "",
    metaTitle: project.metaTitle ?? "",
    metaDesc: project.metaDesc ?? "",
    status: project.status,
    story: STORY_ORDER.map((type) => {
      const block = project.storyBlocks.find((b) => b.type === type);
      return { type, text: block?.text ?? "", image: block?.image ?? "" };
    }),
    gallery: project.gallery.map((g) => ({
      url: g.url,
      alt: g.alt ?? "",
      blurData: g.blurData ?? "",
    })),
  };

  return (
    <div>
      <header className="mb-10">
        <p className="mono-label mb-2">
          Projects — {project.status === "PUBLISHED" ? "on site" : "draft"}
        </p>
        <h1 className="font-display text-h2">{project.title}</h1>
      </header>
      <ProjectForm initial={initial} />
    </div>
  );
}
