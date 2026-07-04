import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { MaskedHeading } from "@/components/motion/MaskedHeading";
import { Reveal } from "@/components/motion/Reveal";
import { Entry } from "@/components/motion/Entry";
import { Parallax } from "@/components/motion/Parallax";
import { jsonLdScript, projectJsonLd } from "@/lib/seo";

export const revalidate = 3600;

export async function generateStaticParams() {
  const projects = await prisma.project.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
  });
  return projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project) return {};
  return {
    title: project.metaTitle ?? `${project.title} — ${project.category}, ${project.location}`,
    description:
      project.metaDesc ??
      `${project.title} by Design Matters Architects — ${project.category}, ${project.location}.`,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: project.heroImage ? { images: [project.heroImage] } : undefined,
  };
}

const STORY_LABELS = { CONCEPT: "Concept", PROCESS: "Process", FINAL: "The result" } as const;

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await prisma.project.findUnique({
    where: { slug },
    include: {
      gallery: { orderBy: { order: "asc" } },
      storyBlocks: { orderBy: { order: "asc" } },
    },
  });
  if (!project || project.status !== "PUBLISHED") notFound();

  // Next/prev in display order (wrapping)
  const siblings = await prisma.project.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { order: "asc" },
    select: { slug: true, title: true },
  });
  const idx = siblings.findIndex((s) => s.slug === slug);
  const prev = siblings[(idx - 1 + siblings.length) % siblings.length];
  const next = siblings[(idx + 1) % siblings.length];

  const meta: [string, string | number | null][] = [
    ["Location", project.location],
    ["Year", project.year],
    ["Typology", project.typology],
    ["Area", project.area],
    ["Team", project.team],
  ];

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(projectJsonLd(project))}
      />
      {/* Hero */}
      <section className="relative flex min-h-[85dvh] flex-col justify-end">
        {project.heroImage && (
          <>
            <Image
              src={project.heroImage}
              alt={`${project.title} — ${project.category}`}
              fill
              priority
              sizes="100vw"
              placeholder={project.heroBlur ? "blur" : "empty"}
              blurDataURL={project.heroBlur ?? undefined}
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
          </>
        )}
        <div className="relative px-gutter pb-14 pt-40">
          <p className="mono-label mb-4 text-bone/90">
            {project.category}
            {project.location && ` — ${project.location}`}
          </p>
          <MaskedHeading className="font-display text-hero max-w-5xl text-paper">
            {project.title}
          </MaskedHeading>
        </div>
      </section>

      {/* Drawing-title-block metadata */}
      <section className="px-gutter py-14">
        <Entry>
          <dl className="rule grid grid-cols-2 gap-x-8 gap-y-6 pt-6 sm:grid-cols-3 lg:grid-cols-5">
            {meta.map(([label, value]) => (
              <div key={label}>
                <dt className="mono-label mb-1">{label}</dt>
                <dd className="text-sm text-ink-soft">{value ?? "—"}</dd>
              </div>
            ))}
          </dl>
        </Entry>
      </section>

      {/* Narrative: concept → process → final */}
      {project.storyBlocks.length > 0 && (
        <section className="px-gutter pb-section">
          <div className="space-y-24">
            {project.storyBlocks.map((block, i) => (
              <div
                key={block.id}
                className="grid items-start gap-10 md:grid-cols-12"
              >
                {block.image && (
                  <Parallax
                    className={
                      i % 2 === 0
                        ? "md:col-span-7"
                        : "md:col-span-7 md:col-start-6 md:order-2"
                    }
                  >
                    <div className="relative aspect-[4/3] scale-110">
                      <Image
                        src={block.image}
                        alt={`${project.title} — ${STORY_LABELS[block.type].toLowerCase()}`}
                        fill
                        sizes="(min-width: 768px) 60vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                  </Parallax>
                )}
                <Reveal
                  className={
                    block.image
                      ? i % 2 === 0
                        ? "md:col-span-4 md:col-start-9"
                        : "md:col-span-4 md:col-start-1 md:order-1"
                      : "md:col-span-6 md:col-start-4"
                  }
                >
                  <p className="mono-label mb-4">
                    {String(i + 1).padStart(2, "0")} — {STORY_LABELS[block.type]}
                  </p>
                  {block.text && (
                    <p className="leading-relaxed text-ink-soft">{block.text}</p>
                  )}
                </Reveal>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Gallery */}
      {project.gallery.length > 0 && (
        <section className="px-gutter pb-section" aria-label="Project gallery">
          <div className="grid gap-gutter md:grid-cols-2">
            {project.gallery.map((img, i) => (
              <Reveal
                key={img.id}
                delay={(i % 2) * 0.1}
                className={i % 3 === 2 ? "md:col-span-2" : ""}
              >
                <Parallax>
                  <div
                    className={`relative scale-110 ${
                      i % 3 === 2 ? "aspect-[21/9]" : "aspect-[4/5]"
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={img.alt ?? `${project.title} — view ${i + 1}`}
                      fill
                      sizes={i % 3 === 2 ? "100vw" : "(min-width: 768px) 50vw, 100vw"}
                      placeholder={img.blurData ? "blur" : "empty"}
                      blurDataURL={img.blurData ?? undefined}
                      className="object-cover"
                    />
                  </div>
                </Parallax>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Next / prev */}
      <nav className="rule mx-gutter flex justify-between gap-6 py-10" aria-label="More projects">
        <Link href={`/projects/${prev.slug}`} className="group max-w-[45%]">
          <p className="mono-label mb-2">&larr; Previous</p>
          <p className="font-display text-h3 transition-colors group-hover:text-brass">
            {prev.title}
          </p>
        </Link>
        <Link href={`/projects/${next.slug}`} className="group max-w-[45%] text-right">
          <p className="mono-label mb-2">Next &rarr;</p>
          <p className="font-display text-h3 transition-colors group-hover:text-brass">
            {next.title}
          </p>
        </Link>
      </nav>
    </main>
  );
}
