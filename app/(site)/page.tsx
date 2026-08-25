import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedProjects } from "@/lib/content";
import { getSection } from "@/lib/settings";
import { Reveal } from "@/components/motion/Reveal";
import { TextScrub } from "@/components/motion/TextScrub";
import { HeroCarousel, type HeroSlide } from "@/components/site/HeroCarousel";
import { ProjectCard } from "@/components/site/ProjectCard";
import { EnquirySection } from "@/components/site/EnquirySection";
import { TestimonialsSection } from "@/components/site/TestimonialsSection";

// Static-first: prerendered, refreshed hourly. Dashboard edits to
// projects or copy revalidate "/" on save, so publishing is immediate.
export const revalidate = 3600;

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function HomePage() {
  // First story block supplies each slide's narrative hook.
  const [projects, home] = await Promise.all([
    getPublishedProjects(),
    getSection("home"),
  ]);
  const featured = projects.slice(0, 8);
  const bySlug = new Map(projects.map((p) => [p.slug, p]));

  /* The hero is the studio's own curated pick (§1, §2): a chosen
     photograph per slide, each carrying the headline word it was chosen
     for. Slides naming an unpublished or missing project are dropped
     rather than rendered as dead links — the whole list falling away
     leaves the old behaviour, the first few published projects, so the
     home page can never end up with no hero at all. */
  const curated: HeroSlide[] = home.heroSlides.flatMap((s) => {
    const p = bySlug.get(s.projectSlug);
    if (!p) return [];
    return [
      {
        slug: p.slug,
        title: p.title,
        category: p.category,
        location: p.location,
        heroImage: s.image,
        // A slide may point at a gallery frame rather than the project's
        // own hero, so the blur is looked up by URL across both.
        // A slide may carry its own placeholder (for a photograph that is
        // neither the project hero nor a gallery frame); otherwise it is
        // looked up by URL across both.
        heroBlur:
          s.blur ??
          (s.image === p.heroImage
            ? p.heroBlur
            : p.gallery.find((g) => g.url === s.image)?.blurData) ??
          null,
        hook: p.storyBlocks[0]?.text ?? null,
        word: s.word,
        alt: s.alt,
        focus: s.focus,
      },
    ];
  });

  const fallback: HeroSlide[] = featured
    .filter((p) => p.heroImage)
    .slice(0, 5)
    .map((p, i) => ({
      slug: p.slug,
      title: p.title,
      category: p.category,
      location: p.location,
      heroImage: p.heroImage!,
      heroBlur: p.heroBlur,
      hook: p.storyBlocks[0]?.text ?? null,
      word: home.heroWords[i % home.heroWords.length] ?? "",
      alt: `${p.title}, ${p.category}${p.location ? `, ${p.location}` : ""}`,
    }));

  const slides = curated.length ? curated : fallback;

  /* The grid below the hero shows work the hero hasn't already shown,
     so the first screen and the second aren't the same four houses. */
  const heroSlugs = new Set(slides.map((s) => s.slug));
  const grid = featured.filter((p) => !heroSlugs.has(p.slug));

  return (
    <main>
      {/* ------------------------------------------- hero, carousel */}
      <HeroCarousel slides={slides} eyebrow={home.heroEyebrow} line={home.heroLine} />

      {/* ---------------------------------------------------- the studio */}
      <section className="px-gutter py-section">
        <Reveal>
          <p className="mono-label mb-6">{home.studioEyebrow}</p>
        </Reveal>
        {/* Words brighten with scroll, scrubbed, so the reveal glides
            with Lenis instead of firing once. */}
        <TextScrub className="font-display text-h1 max-w-4xl">
          {home.studioStatement}
        </TextScrub>
        <Reveal>
          <Link
            href="/about"
            className="mono-label mt-10 inline-block underline underline-offset-4 transition-colors hover:text-brass"
          >
            {home.studioLinkLabel} &rarr;
          </Link>
        </Reveal>
      </section>

      {/* ------------------------------------------------ selected work */}
      <section className="px-gutter pb-section" aria-labelledby="work-heading">
        <Reveal>
          <div className="rule mb-12 flex items-baseline justify-between pt-4">
            <h2 id="work-heading" className="font-display text-h2">
              {home.workHeading}
            </h2>
            <Link
              href="/projects"
              className="mono-label transition-colors hover:text-brass"
            >
              All projects &rarr;
            </Link>
          </div>
        </Reveal>

        <div className="grid gap-gutter md:grid-cols-2">
          {grid.map((p, i) => (
            <Reveal key={p.id} delay={(i % 2) * 0.12} className={i % 2 === 1 ? "md:mt-16" : ""}>
              <ProjectCard
                slug={p.slug}
                title={p.title}
                category={p.category}
                year={p.year}
                location={p.location}
                heroImage={p.heroImage}
                heroBlur={p.heroBlur}
                aspect={i % 2 === 0 ? "aspect-[4/3]" : "aspect-[3/4]"}
                sizes="(min-width: 768px) 50vw, 100vw"
              />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------- what we do */}
      <section className="px-gutter pb-section" aria-labelledby="services-heading">
        <Reveal>
          <div className="rule mb-12 flex items-baseline justify-between pt-4">
            <h2 id="services-heading" className="font-display text-h2">
              {home.servicesHeading}
            </h2>
            <Link
              href="/services"
              className="mono-label transition-colors hover:text-brass"
            >
              Services &rarr;
            </Link>
          </div>
        </Reveal>
        <div className="grid gap-x-gutter gap-y-12 md:grid-cols-3">
          {home.services.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.1}>
              <h3 className="font-display text-h3 mb-4">{s.title}</h3>
              <p className="max-w-sm text-sm leading-relaxed text-ink-soft">
                {s.body}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ client voices */}
      <TestimonialsSection />

      {/* ------------------------------------------------ enquire */}
      <EnquirySection source="home" />
    </main>
  );
}
