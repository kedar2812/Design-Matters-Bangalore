import Image from "next/image";
import { Entry } from "@/components/motion/Entry";
import { MaskedHeading } from "@/components/motion/MaskedHeading";
import { IMG_Q } from "@/lib/images";

/**
 * The opening of a secondary page: eyebrow, headline, intro, and a band
 * of photographs beneath them.
 *
 * The photographs are the point. Every one of these pages used to open
 * on a screen of type on bare canvas, which on a site whose whole subject
 * is buildings reads as an apology. The band puts work on the first
 * screen and, because it runs past the fold, gives the page an obvious
 * reason to be scrolled.
 *
 * Three frames on a descending stagger rather than an even row — the same
 * offset language as the studio collage and the culture grid, so this
 * reads as part of the site rather than a new device. The third is
 * dropped on phones, where a third of a 12-column grid is too narrow to
 * show a building in.
 *
 * Images are supplied by the page and must come from its own subject
 * matter: the practice-area covers on Services, the published projects on
 * Press, the reviewers' own homes on Testimonials. Never a decorative
 * pick — a photograph on a page is a claim that it belongs there.
 */

export type HeroImage = { src: string; alt: string; blur?: string | null };

const CELLS = [
  { grid: "col-span-7 md:col-span-5", aspect: "aspect-[4/5]", sizes: "(min-width: 768px) 40vw, 58vw" },
  { grid: "col-span-5 md:col-span-4 md:mt-20", aspect: "aspect-[3/4]", sizes: "(min-width: 768px) 31vw, 42vw" },
  { grid: "hidden md:block md:col-span-3 md:mt-10", aspect: "aspect-[3/4]", sizes: "23vw" },
];

export function PageHero({
  eyebrow,
  heading,
  intro,
  images = [],
  children,
}: {
  eyebrow: string;
  heading: string;
  intro?: string;
  images?: HeroImage[];
  /** Anything that belongs beside the intro — a rating, a count, a link. */
  children?: React.ReactNode;
}) {
  const band = images.slice(0, CELLS.length);

  return (
    <header className="px-gutter pt-36">
      <Entry>
        <p className="mono-label mb-4 text-brass">{eyebrow}</p>
      </Entry>

      <MaskedHeading className="font-display text-h1 max-w-4xl">
        {heading}
      </MaskedHeading>

      {(intro || children) && (
        <div className="mt-8 grid gap-8 md:grid-cols-12 md:items-end">
          {intro && (
            <Entry delay={0.1} className="md:col-span-7">
              <p className="max-w-2xl text-lg leading-relaxed text-ink-soft">
                {intro}
              </p>
            </Entry>
          )}
          {children && (
            <div className="md:col-span-4 md:col-start-9">{children}</div>
          )}
        </div>
      )}

      {band.length > 0 && (
        <div className="mt-16 grid grid-cols-12 gap-gutter">
          {band.map((img, i) => (
            <Entry key={img.src} delay={0.14 + i * 0.08} className={CELLS[i].grid}>
              <div
                className={`rounded-frame relative overflow-hidden bg-hairline/40 ${CELLS[i].aspect}`}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes={CELLS[i].sizes}
                  quality={IMG_Q.feature}
                  placeholder={img.blur ? "blur" : "empty"}
                  blurDataURL={img.blur ?? undefined}
                  className="rounded-[inherit] object-cover"
                />
              </div>
            </Entry>
          ))}
        </div>
      )}
    </header>
  );
}
