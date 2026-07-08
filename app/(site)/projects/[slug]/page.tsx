import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedProject, getPublishedProjects } from "@/lib/content";
import { MaskedHeading } from "@/components/motion/MaskedHeading";
import { Reveal } from "@/components/motion/Reveal";
import { Entry } from "@/components/motion/Entry";
import { Parallax } from "@/components/motion/Parallax";
import { jsonLdScript, projectJsonLd } from "@/lib/seo";
import { EnquirySection } from "@/components/site/EnquirySection";
import {
  LightboxProvider,
  LightboxTrigger,
  type LightboxImage,
} from "@/components/site/Lightbox";

export const revalidate = 3600;

export async function generateStaticParams() {
  const projects = await getPublishedProjects();
  return projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProject(slug);
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
  const project = await getPublishedProject(slug);
  if (!project) notFound();

  // Next/prev in display order (wrapping)
  const siblings = await getPublishedProjects();
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

  // Every photo on the page opens in the lightbox: story images first
  // (in block order), then the gallery. Index maps must match the
  // render order below.
  const storyImages = project.storyBlocks.filter((b) => b.image);
  const storyIndex = new Map(storyImages.map((b, i) => [b.id, i]));
  const media: LightboxImage[] = [
    ...storyImages.map((b) => ({
      url: b.image!,
      alt: `${project.title} — ${STORY_LABELS[b.type]}`,
    })),
    ...project.gallery.map((img, i) => ({
      url: img.url,
      alt: img.alt ?? `${project.title} — view ${i + 1}`,
      blur: img.blurData,
    })),
  ];

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(projectJsonLd(project))}
      />
      {/* Hero — inset rounded frame, consistent with the home carousel */}
      <section className="p-2.5">
        <div className="relative flex min-h-[calc(85dvh-1.25rem)] flex-col justify-end overflow-hidden rounded-[1.5rem]">
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
                className="rounded-[inherit] object-cover"
              />
              {/* Top + bottom scrims: nav and title stay legible over
                  light photography as well as dark. */}
              <div className="absolute inset-0 bg-gradient-to-b from-noir/45 via-noir/5 to-noir/70" />
            </>
          )}
          <div className="relative px-gutter pb-14 pt-40">
            <p className="mono-label mb-4 text-cream/90">
              {project.category}
              {project.location && ` — ${project.location}`}
            </p>
            <MaskedHeading className="font-display text-hero max-w-5xl text-cream">
              {project.title}
            </MaskedHeading>
          </div>
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

      <LightboxProvider images={media}>
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
                    <LightboxTrigger
                      index={storyIndex.get(block.id)!}
                      className={
                        i % 2 === 0
                          ? "md:col-span-7"
                          : "md:col-span-7 md:col-start-6 md:order-2"
                      }
                    >
                      <Parallax className="rounded-frame">
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
                    </LightboxTrigger>
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

        {/* Gallery — every frame opens full screen */}
        {project.gallery.length > 0 && (
          <section className="px-gutter pb-section" aria-label="Project gallery">
            <div className="grid gap-gutter md:grid-cols-2">
              {project.gallery.map((img, i) => (
                <Reveal
                  key={img.id}
                  delay={(i % 2) * 0.1}
                  className={i % 3 === 2 ? "md:col-span-2" : ""}
                >
                  <LightboxTrigger index={storyImages.length + i}>
                    <Parallax className="rounded-frame">
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
                  </LightboxTrigger>
                </Reveal>
              ))}
            </div>
          </section>
        )}
      </LightboxProvider>

      {/* Story's end → the ask. The full form, right here — the lead
          arrives in the dashboard tagged with this project. */}
      <EnquirySection
        source={`project:${project.slug}`}
        eyebrow="Planning something similar?"
        title="Tell us about your site — we'll tell you what it could become."
        whatsappText={`Hello Design Matters — I saw ${project.title} on your website and I'd like to discuss a similar project.`}
      />

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
