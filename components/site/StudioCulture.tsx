import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";
import { IMG_Q } from "@/lib/images";
import blurs from "@/lib/studio-blurs.json";

/**
 * Life in the studio (§2.5) — the photographs that sit under the roster.
 *
 * Everything here is a group of a dozen-plus people strung out sideways,
 * so every frame is wide; a square crop would cut somebody out of their
 * own team photo. The cells are staggered with uneven top margins rather
 * than set on a tidy baseline, which keeps a page of group shots from
 * reading as a contact sheet.
 *
 * One studio interior sits in the middle of the outings on purpose. Six
 * consecutive holiday photographs make a practice look like it never
 * works; the desks put the trips in context.
 *
 * The video is the studio's own clip from the Kabini trip. It is wired
 * `preload="none"` behind a poster, so it costs one image until somebody
 * presses play — 4.4 MB is not something to hand every visitor. The
 * poster is a still from the same trip rather than a frame grab; it is a
 * cover image, and the caption names the trip, not the frame.
 */

export const TEAM_VIDEO: { src: string; poster: string; caption: string } | null = {
  src: "/uploads/studio/culture/outing-kabini.mp4",
  poster: "/uploads/studio/culture/outing-kabini.jpg",
  caption: "The studio on its Kabini trip",
};

const PHOTOS = [
  {
    src: "/uploads/studio/culture/outing-nandi-hills.jpg",
    alt: "The Design Matters team on the rock at the summit of Nandi Hills, the plain behind them under heavy cloud",
    grid: "md:col-span-7",
    aspect: "aspect-[3/2]",
  },
  {
    src: "/uploads/studio/culture/outing-poolside.jpg",
    alt: "The studio gathered along the edge of a pool in Wayanad, surrounded by coconut and banana palms",
    grid: "md:col-span-5 md:mt-16",
    aspect: "aspect-[3/2]",
  },
  {
    src: "/uploads/studio/culture/studio-desks.jpg",
    alt: "The Design Matters studio at work — a long shared desk running beneath a deep blue wall",
    grid: "md:col-span-5",
    aspect: "aspect-[3/2]",
  },
  {
    src: "/uploads/studio/culture/outing-lunch.jpg",
    alt: "The whole studio seated along one long timber table for lunch, a green wall of creeper behind them",
    grid: "md:col-span-7 md:mt-12",
    aspect: "aspect-[3/2]",
  },
  {
    src: "/uploads/studio/culture/outing-wayanad.jpg",
    alt: "The team on the lawn in front of a tiled-roof estate house in Wayanad",
    grid: "md:col-span-6",
    aspect: "aspect-[3/2]",
  },
  {
    src: "/uploads/studio/culture/office-events.jpg",
    alt: "A studio celebration on the office terrace under a green canopy, the team holding yellow balloons",
    grid: "md:col-span-6 md:mt-12",
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
        <Reveal className="mb-gutter">
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
                // Widest cell is 7/12 of the content column.
                sizes="(min-width: 768px) 58vw, 100vw"
                quality={IMG_Q.candid}
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
