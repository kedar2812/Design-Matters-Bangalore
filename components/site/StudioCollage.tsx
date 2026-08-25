import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";
import { IMG_Q } from "@/lib/images";
import blurs from "@/lib/studio-blurs.json";

/**
 * The studio collage Kiran asked us to keep (§2.4).
 *
 * Rebuilt to the composition of the old About page rather than copied
 * from it: a tall portrait holding the left, a wide landscape across the
 * top right, and an uneven pair beneath — a narrow upright next to a
 * broader landscape, dropped a little lower than the frame above so the
 * block never resolves into a tidy 2×2.
 *
 * The asymmetry is the point, so the column spans are deliberately not
 * factors of each other (5 / 6, then 2 / 4), and the whole thing sits in
 * a wide band of bone with nothing else competing for the eye.
 *
 * On mobile it becomes a single column, but keeps the alternating scale —
 * two frames run to the gutter, two are inset from opposite sides — so it
 * reads as a rhythm rather than a stack of equal pictures.
 */

type Frame = {
  src: string;
  alt: string;
  /** Desktop grid placement. */
  grid: string;
  /** Aspect + inset on mobile, where the grid collapses. */
  mobile: string;
};

const FRAMES: Frame[] = [
  {
    src: "/uploads/studio/collage/signage.jpg",
    alt: "The Design Matters studio entrance, the wordmark set on a board-marked concrete wall behind a plumeria in flower",
    grid: "md:col-span-5 md:row-span-2 md:aspect-auto md:h-full",
    mobile: "aspect-[4/5]",
  },
  {
    src: "/uploads/studio/collage/materials.jpg",
    alt: "A materials flat-lay on a timber table, oak and walnut veneer samples, a copper section, tile swatches and an open book",
    grid: "md:col-span-6 md:col-start-7 md:mr-0",
    mobile: "aspect-[3/2] mr-10",
  },
  {
    src: "/uploads/studio/collage/jaali.jpg",
    alt: "A terracotta jaali screen filtering light onto a planted courtyard with a pale green chair on patterned tile",
    grid: "md:col-span-2 md:col-start-7 md:mt-8 md:ml-0",
    mobile: "aspect-[2/3] ml-16",
  },
  {
    src: "/uploads/studio/collage/meeting-room.jpg",
    alt: "The studio meeting room, a hand-painted palm mural facing a deep green wall above a long timber table",
    grid: "md:col-span-4 md:col-start-9 md:mt-16",
    mobile: "aspect-[3/2]",
  },
];

const blurOf = (src: string) => (blurs as Record<string, string>)[src];

export function StudioCollage({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="grid gap-6 md:grid-cols-12 md:gap-x-6 md:gap-y-0">
        {FRAMES.map((f, i) => (
          <Reveal key={f.src} delay={i * 0.09} className={`${f.grid} ${f.mobile}`}>
            <div className="rounded-frame relative h-full w-full overflow-hidden bg-stone/10">
              <Image
                src={f.src}
                alt={f.alt}
                fill
                sizes="(min-width: 768px) 45vw, 100vw"
                quality={IMG_Q.feature}
                placeholder={blurOf(f.src) ? "blur" : "empty"}
                blurDataURL={blurOf(f.src)}
                className="rounded-[inherit] object-cover"
              />
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
