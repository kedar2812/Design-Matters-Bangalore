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
 * The video is the studio's own clip from the Kabini trip, and it is the
 * one asset here that is NOT wide: it was shot on a phone, held upright,
 * and it is 720x1280. It gets a 9:16 frame for that reason. A 16:9 frame
 * would have to `object-cover` a portrait source, which throws away two
 * thirds of every frame and then enlarges the surviving band to fill the
 * width — the single biggest thing that made this clip look poor. In a
 * four-column cell the 720px source lands at roughly 2x density, so it
 * renders sharp on a retina screen without being asked to invent pixels.
 *
 * The Kabini group photograph sits beside it, centred against the taller
 * video, because a portrait cell alone in a twelve-column grid reads as a
 * layout accident. Same trip, so one caption covers the pair and the
 * whole row is a single `figure`.
 *
 * `preload="none"` behind a poster keeps the cost at one image until
 * somebody presses play — 5.5 MB is not something to hand every visitor.
 * The poster IS a frame of the clip now (and 9:16 like it), so pressing
 * play no longer cuts to a different picture.
 */

export const TEAM_VIDEO: {
  src: string;
  poster: string;
  still: string;
  stillAlt: string;
  caption: string;
} | null = {
  src: "/uploads/studio/culture/outing-kabini.mp4",
  poster: "/uploads/studio/culture/outing-kabini-poster.jpg",
  still: "/uploads/studio/culture/outing-kabini.jpg",
  stillAlt:
    "The whole Design Matters studio lined up on the bank of the Kabini backwaters under a bright, cloud-stacked sky",
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
            <div className="grid gap-gutter md:grid-cols-12 md:items-center">
              <div className="md:col-span-4">
                <div className="rounded-frame relative aspect-[9/16] overflow-hidden bg-stone/10">
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
              </div>
              <div className="md:col-span-8">
                <div className="rounded-frame relative aspect-video overflow-hidden bg-stone/10">
                  <Image
                    src={TEAM_VIDEO.still}
                    alt={TEAM_VIDEO.stillAlt}
                    fill
                    sizes="(min-width: 768px) 66vw, 100vw"
                    quality={IMG_Q.candid}
                    placeholder={blurOf(TEAM_VIDEO.still) ? "blur" : "empty"}
                    blurDataURL={blurOf(TEAM_VIDEO.still)}
                    className="rounded-[inherit] object-cover"
                  />
                </div>
              </div>
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
