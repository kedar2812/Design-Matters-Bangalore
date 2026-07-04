import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { site } from "@/lib/site";
import { MaskedHeading } from "@/components/motion/MaskedHeading";
import { Reveal } from "@/components/motion/Reveal";
import { ProjectCard } from "@/components/site/ProjectCard";

// Static-first: prerendered, refreshed hourly (dashboard mutations
// will also revalidate on publish).
export const revalidate = 3600;

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function HomePage() {
  const [featured, posts] = await Promise.all([
    prisma.project.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { order: "asc" },
      take: 5,
    }),
    prisma.post.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: 2,
    }),
  ]);

  const hero = featured[0];

  return (
    <main>
      {/* ---------------------------------------------------------- hero */}
      <section className="relative flex min-h-dvh flex-col justify-end">
        {hero?.heroImage && (
          <>
            <Image
              src={hero.heroImage}
              alt={`${hero.title} — ${hero.category}, ${hero.location}`}
              fill
              priority
              sizes="100vw"
              placeholder={hero.heroBlur ? "blur" : "empty"}
              blurDataURL={hero.heroBlur ?? undefined}
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent" />
          </>
        )}

        <div className="relative px-gutter pb-16 pt-40">
          <p className="mono-label mb-5 text-bone/90">
            Architecture + Interior Design — Bengaluru, est. {site.founded}
          </p>
          <MaskedHeading className="font-display text-hero max-w-5xl text-paper">
            Buildings that belong.
          </MaskedHeading>
          {hero && (
            <Link
              href={`/projects/${hero.slug}`}
              className="mono-label mt-10 inline-block border-t border-bone/40 pt-3 text-bone/90 transition-colors hover:text-paper"
            >
              Featured — {hero.title}, {hero.location} &rarr;
            </Link>
          )}
        </div>
      </section>

      {/* ------------------------------------------------ selected work */}
      <section className="px-gutter py-section" aria-labelledby="work-heading">
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

        {/* Editorial rhythm: full-width lead, then staggered pairs */}
        <div className="grid gap-gutter md:grid-cols-2">
          {featured.slice(1).map((p, i) => (
            <Reveal key={p.id} delay={(i % 2) * 0.12} className={i % 3 === 0 ? "md:mt-16" : ""}>
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

      {/* ------------------------------------------------------ statement */}
      <section className="blueprint-grid px-gutter py-section">
        <Reveal>
          <p className="mono-label mb-6">The studio</p>
          <p className="font-display text-h1 max-w-4xl">
            Fifteen years of residences, workplaces and interiors across
            Bengaluru — designed for climate, context and the people who
            use them.
          </p>
          <Link
            href="/about"
            className="mono-label mt-10 inline-block underline underline-offset-4 transition-colors hover:text-brass"
          >
            About Design Matters
          </Link>
        </Reveal>
      </section>

      {/* -------------------------------------------------- journal teaser */}
      {posts.length > 0 && (
        <section className="px-gutter pb-section" aria-labelledby="journal-heading">
          <Reveal>
            <div className="rule mb-10 flex items-baseline justify-between pt-4">
              <h2 id="journal-heading" className="font-display text-h2">
                From the journal
              </h2>
              <Link href="/journal" className="mono-label transition-colors hover:text-brass">
                All entries &rarr;
              </Link>
            </div>
            <ul className="grid gap-gutter md:grid-cols-2">
              {posts.map((post) => (
                <li key={post.id}>
                  <Link href={`/journal/${post.slug}`} className="group block">
                    <p className="font-display text-h3 transition-colors group-hover:text-brass">
                      {post.title}
                    </p>
                    <p className="mono-label mt-2">
                      {post.publishedAt?.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>
      )}
    </main>
  );
}
