import Image from "next/image";
import { MaskedHeading } from "@/components/motion/MaskedHeading";
import { Reveal } from "@/components/motion/Reveal";
import { IMG_Q } from "@/lib/images";
import { principal } from "@/lib/team";
import blurs from "@/lib/studio-blurs.json";

/**
 * Ar. Kiran Hanumaiah — the principal, given a section rather than a tile.
 *
 * He is the one person on this page who has to read as the head of the
 * practice, and the way to do that is architectural, not decorative: his
 * own surface, his own full width for the name, and a portrait several
 * times the size of a roster tile. No badge, no ribbon, no "founder"
 * flourish — the layout already says it.
 *
 * The surface is dusk, the site's dark register. Everywhere else that
 * register is reserved for the footer, so this is the only dark moment in
 * the body of any page and it lands on the principal — which is the point.
 * It also suits the photograph: a monochrome portrait gains a good deal
 * against warm near-black that it does not against bone.
 *
 * He also didn't send a photograph in the studio's drop, so his is still
 * the one from the old site: a 7008x4672 original re-cropped to 4:5, wide
 * enough to keep the painted mural he is standing in front of. It is
 * desaturated to sit with the roster shoot, which arrived black and white.
 */

const blurOf = (src?: string) =>
  src ? (blurs as Record<string, string>)[src] : undefined;

export function PrincipalSection({
  eyebrow,
  bio,
  founded,
}: {
  eyebrow: string;
  bio: string[];
  founded: string | number;
}) {
  const kiran = principal();
  if (!kiran) return null;

  return (
    <section
      className="mt-section bg-dusk py-section text-cream"
      aria-label={eyebrow}
    >
      <div className="px-gutter">
        <Reveal>
          <p className="mono-label mb-4 text-brass-bright">{eyebrow}</p>
        </Reveal>

        <MaskedHeading as="h2" className="font-display text-h1 max-w-4xl">
          {kiran.name}
        </MaskedHeading>

        {/* Centred, not top-aligned: a 4:5 portrait runs a good deal taller
            than two paragraphs of bio, and hanging the text off the top
            leaves the column looking like it lost its second half. */}
        <div className="mt-10 grid gap-x-gutter gap-y-10 border-t border-dusk-edge pt-10 md:grid-cols-12 md:items-center">
          <Reveal className="md:col-span-5">
            <div className="rounded-frame relative aspect-[4/5] overflow-hidden bg-dusk-edge">
              {kiran.image && (
                <Image
                  src={kiran.image}
                  alt={`${kiran.name}, ${kiran.designation} and founder of Design Matters`}
                  fill
                  // Roughly 40vw of the layout at desktop, full width below.
                  sizes="(min-width: 768px) 42vw, 100vw"
                  quality={IMG_Q.feature}
                  placeholder={blurOf(kiran.image) ? "blur" : "empty"}
                  blurDataURL={blurOf(kiran.image)}
                  className="rounded-[inherit] object-cover grayscale"
                />
              )}
            </div>
          </Reveal>

          <Reveal delay={0.1} className="md:col-span-6 md:col-start-7">
            <p className="mono-label text-cream/60">
              {kiran.designation} — founded the studio in {founded}
            </p>
            <div className="mt-7 space-y-6 leading-relaxed text-cream/80">
              {bio.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
