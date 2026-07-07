import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { site } from "@/lib/site";
import { Reveal } from "@/components/motion/Reveal";
import { RotatingWord } from "@/components/motion/RotatingWord";
import { TextScrub } from "@/components/motion/TextScrub";
import { HeroCarousel, type HeroSlide } from "@/components/site/HeroCarousel";
import { ProjectCard } from "@/components/site/ProjectCard";
import { EnquirySection } from "@/components/site/EnquirySection";

// Static-first: prerendered, refreshed hourly (dashboard mutations
// will also revalidate on publish).
export const revalidate = 3600;

export const metadata: Metadata = { alternates: { canonical: "/" } };

const services = [
  {
    title: "Architecture",
    body: "New builds and major renovations — residences, apartments, commercial and hospitality — carried from feasibility to handover.",
  },
  {
    title: "Interior design",
    body: "Complete interiors for homes and workplaces: space planning, custom furniture, materials and light, executed to the last drawer detail.",
  },
  {
    title: "Consultation",
    body: "An architect's judgement when you need it most — plot evaluation before you buy, design review, feasibility.",
  },
];

export default async function HomePage() {
  const featured = await prisma.project.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { order: "asc" },
    take: 8,
    include: {
      // First story block supplies each slide's narrative hook.
      storyBlocks: { orderBy: { order: "asc" }, take: 1 },
    },
  });

  const slides: HeroSlide[] = featured
    .filter((p) => p.heroImage)
    .slice(0, 5)
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      category: p.category,
      location: p.location,
      heroImage: p.heroImage!,
      heroBlur: p.heroBlur,
      hook: p.storyBlocks[0]?.text ?? null,
    }));

  const grid = featured.slice(1);

  return (
    <main>
      {/* ------------------------------------------- hero — carousel */}
      <HeroCarousel slides={slides}>
        <p className="mono-label mb-5 text-cream/90">
          Architecture + Interior Design — Bengaluru, since {site.founded}
        </p>
        {/* Two masked lines rise on load (pure CSS, LCP-safe); the
            second line then keeps quietly cycling the studio's verbs. */}
        <h1 className="font-display text-hero max-w-5xl text-cream">
          <span className="mask-safe block overflow-hidden">
            <span className="mask-rise block">Buildings that</span>
          </span>
          <span className="mask-safe block overflow-hidden">
            <span className="mask-rise block" style={{ animationDelay: "0.12s" }}>
              <RotatingWord
                words={["belong.", "breathe.", "listen.", "endure."]}
                className="text-brass-bright"
              />
            </span>
          </span>
        </h1>
      </HeroCarousel>

      {/* ---------------------------------------------------- the studio */}
      <section className="px-gutter py-section">
        <Reveal>
          <p className="mono-label mb-6">The studio</p>
        </Reveal>
        {/* Words brighten with scroll — scrubbed, so the reveal glides
            with Lenis instead of firing once. */}
        <TextScrub className="font-display text-h1 max-w-4xl">
          Fifteen years of residences, workplaces and interiors across
          Bengaluru — each one designed for its climate, its street, and
          the people who live with it.
        </TextScrub>
        <Reveal>
          <Link
            href="/about"
            className="mono-label mt-10 inline-block underline underline-offset-4 transition-colors hover:text-brass"
          >
            The story of the studio &rarr;
          </Link>
        </Reveal>
      </section>

      {/* ------------------------------------------------ selected work */}
      <section className="px-gutter pb-section" aria-labelledby="work-heading">
        <Reveal>
          <div className="rule mb-12 flex items-baseline justify-between pt-4">
            <h2 id="work-heading" className="font-display text-h2">
              Selected work
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
              What we do
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
          {services.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.1}>
              <h3 className="font-display text-h3 mb-4">{s.title}</h3>
              <p className="max-w-sm text-sm leading-relaxed text-ink-soft">
                {s.body}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ enquire */}
      <EnquirySection source="home" />
    </main>
  );
}
