import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";
import { IMG_Q } from "@/lib/images";
import blurs from "@/lib/studio-blurs.json";

/**
 * Life in the studio (§2.5) — the photographs that sit under the roster.
 *
 * The team outing video belongs here too. It hasn't been supplied yet
 * (there is no video anywhere on the old site, only the write-up of the
 * Nandi Hills trip), so the block ships as photographs and the video slot
 * is wired but dormant: set TEAM_VIDEO below and it appears, muted,
 * lazy-loaded, poster-backed, with controls and no autoplay — never a
 * third-party embed player on first load.
 */

/**
 * Fill in when the file arrives. `src` should be an MP4 under
 * /public/uploads/studio/, `poster` a still from it.
 */
export const TEAM_VIDEO: { src: string; poster: string; caption: string } | null =
  null;

const PHOTOS = [
  {
    src: "/uploads/studio/culture/team-group.jpg",
    alt: "The Design Matters team seated together on stone steps under trees during a studio outing",
    grid: "md:col-span-7",
    aspect: "aspect-[4/3]",
  },
  {
    src: "/uploads/studio/culture/outing-walkway.jpg",
    alt: "Members of the studio on a covered timber walkway at Nandi Hills",
    grid: "md:col-span-5 md:mt-16",
    aspect: "aspect-[4/3]",
  },
  {
    src: "/uploads/studio/culture/studio-desks.jpg",
    alt: "The Design Matters studio at work — a long shared desk running beneath a deep blue wall",
    grid: "md:col-span-5",
    aspect: "aspect-[3/2]",
  },
  {
    src: "/uploads/studio/culture/studio-signage.jpg",
    alt: "The team standing together in the studio in front of the Design Matters signage wall",
    grid: "md:col-span-7 md:mt-10",
    aspect: "aspect-[3/2]",
  },
];

const blurOf = (src: string) => (blurs as Record<string, string>)[src];

export function StudioCulture({
  heading = "Life at the studio",
  blurb,
}: {
  heading?: string;
  blurb?: string;
}) {
  return (
    <section className="mt-section px-gutter" aria-labelledby="culture-heading">
      <Reveal>
        <div className="rule mb-12 pt-4">
          <h2 id="culture-heading" className="font-display text-h2">
            {heading}
          </h2>
          {blurb && (
            <p className="mt-5 max-w-2xl leading-relaxed text-ink-soft">{blurb}</p>
          )}
        </div>
      </Reveal>

      {TEAM_VIDEO && (
        <Reveal className="mb-12">
          <figure>
            <div className="rounded-frame relative aspect-video overflow-hidden bg-stone/10">
              <video
                className="h-full w-full rounded-[inherit] object-cover"
                src={TEAM_VIDEO.src}
                poster={TEAM_VIDEO.poster}
                controls
                muted
                playsInline
                preload="none"
              />
            </div>
            <figcaption className="mono-label mt-3 text-stone">
              {TEAM_VIDEO.caption}
            </figcaption>
          </figure>
        </Reveal>
      )}

      <div className="grid gap-gutter md:grid-cols-12">
        {PHOTOS.map((p, i) => (
          <Reveal key={p.src} delay={(i % 2) * 0.1} className={p.grid}>
            <div
              className={`rounded-frame relative overflow-hidden bg-stone/10 ${p.aspect}`}
            >
              <Image
                src={p.src}
                alt={p.alt}
                fill
                sizes="(min-width: 768px) 55vw, 100vw"
                quality={IMG_Q.feature}
                placeholder={blurOf(p.src) ? "blur" : "empty"}
                blurDataURL={blurOf(p.src)}
                className="rounded-[inherit] object-cover"
              />
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
