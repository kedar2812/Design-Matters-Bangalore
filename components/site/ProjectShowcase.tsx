import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";
import type { ProjectTile } from "@/components/site/ProjectsGrid";
import { IMG_Q } from "@/lib/images";

/**
 * The portfolio, told as an editorial sequence rather than a card grid.
 *
 * Each project takes a full row: an oversized photograph on one side,
 * a quiet metadata column on the other, sides alternating down the
 * page. The photograph is the subject — the type stays small and out of
 * its way, and everything that moves is transform/opacity only.
 */

type Props = {
  projects: ProjectTile[];
  /** Continues the numbering when a page renders several groups. */
  startIndex?: number;
  className?: string;
};

/** Small key/value row — the printed-caption register. */
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-4 border-t border-hairline py-2.5">
      <dt className="mono-label w-24 shrink-0">{label}</dt>
      <dd className="text-sm text-ink-soft">{value}</dd>
    </div>
  );
}

export function ProjectShowcase({ projects, startIndex = 0, className }: Props) {
  return (
    <div className={cn("space-y-section", className)}>
      {projects.map((p, i) => {
        const n = startIndex + i + 1;
        const flipped = i % 2 === 1;
        const facts = [
          p.location && { label: "Location", value: p.location },
          p.year && { label: "Completed", value: String(p.year) },
          { label: "Practice", value: p.category },
        ].filter(Boolean) as { label: string; value: string }[];

        return (
          <Reveal key={p.id} y={40}>
            <article className="group">
              <Link
                href={`/projects/${p.slug}`}
                className="grid items-center gap-x-gutter gap-y-8 lg:grid-cols-12"
              >
                {/* Photograph */}
                <div
                  className={cn(
                    "rounded-frame relative overflow-hidden bg-stone/15 lg:col-span-8",
                    // Alternating sides: the flipped row pushes the image
                    // to the right half by starting it at column 5.
                    flipped ? "lg:order-2 lg:col-start-5" : "lg:col-start-1",
                  )}
                >
                  <div className="relative aspect-[4/3] sm:aspect-[3/2]">
                    {p.heroImage && (
                      <Image
                        src={p.heroImage}
                        alt={p.title}
                        fill
                        sizes="(min-width: 1024px) 66vw, 100vw"
                        quality={IMG_Q.feature}
                        placeholder={p.heroBlur ? "blur" : "empty"}
                        blurDataURL={p.heroBlur ?? undefined}
                        className="rounded-[inherit] object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.045]"
                      />
                    )}
                    {/* Warms the lower edge so the caption below reads as
                        part of the same frame, not a separate block. */}
                    <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-t from-noir/25 via-transparent to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
                  </div>
                </div>

                {/* Caption column */}
                <div
                  className={cn(
                    "lg:col-span-4",
                    flipped ? "lg:order-1 lg:col-start-1 lg:pr-4" : "lg:col-start-9 lg:pl-4",
                  )}
                >
                  <p className="mono-label mb-4 text-brass">
                    {String(n).padStart(2, "0")}
                  </p>

                  <h3 className="font-display text-h2 leading-[1.05] transition-colors duration-500 group-hover:text-brass">
                    {p.title}
                  </h3>

                  <dl className="mt-7">
                    {facts.map((f) => (
                      <Fact key={f.label} {...f} />
                    ))}
                  </dl>

                  {/* Arrow slides out of the underline on hover */}
                  <span className="mono-label mt-7 inline-flex items-center gap-2 text-ink">
                    View project
                    <span
                      aria-hidden
                      className="inline-block transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1.5"
                    >
                      &rarr;
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="mt-2 block h-px w-full max-w-[10rem] origin-left scale-x-0 bg-brass transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
                  />
                </div>
              </Link>
            </article>
          </Reveal>
        );
      })}
    </div>
  );
}
