import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";
import { IMG_Q } from "@/lib/images";
import { TEAM, roster, initialsOf, type TeamMember } from "@/lib/team";
import blurs from "@/lib/studio-blurs.json";

/**
 * The studio roster (§2.5) — "team to be highlighted and mentioned".
 *
 * One even grid, no sub-headings per rank. That is a decision the
 * photography earns: the studio shot all ten portraits in a single
 * session against the same wall, the same plant, the same standing pose,
 * so the frames already tile into a continuous band. Breaking that band
 * under "Senior Architects" / "Architects" rules would fight it for no
 * gain, since the designation is printed under every name anyway.
 *
 * The principal is deliberately not in here — he gets PrincipalSection
 * above, which is where the hierarchy lives.
 *
 * Two columns on phones and five from `lg`, both of which divide the
 * roster evenly. The band in between keeps two, because five portraits
 * across a tablet renders faces too small to be worth showing.
 *
 * Portraits are stored as greyscale JPEGs rather than desaturated in CSS:
 * the source shoot is monochrome already, and dropping the two empty
 * chroma planes takes about a quarter off every file. `grayscale` stays on
 * the element so that a future colour portrait can't break the set.
 */

const blurOf = (src?: string) =>
  src ? (blurs as Record<string, string>)[src] : undefined;

/** Matches the grid below: 2 columns up to `lg`, 5 beyond. */
const TILE_SIZES = "(min-width: 1024px) 17vw, 45vw";

function Portrait({ member }: { member: TeamMember }) {
  return (
    <div className="rounded-frame relative aspect-[3/4] overflow-hidden bg-hairline/40">
      {member.image ? (
        <Image
          src={member.image}
          alt={`${member.name}, ${member.designation} at Design Matters`}
          fill
          sizes={TILE_SIZES}
          quality={IMG_Q.card}
          placeholder={blurOf(member.image) ? "blur" : "empty"}
          blurDataURL={blurOf(member.image)}
          className="rounded-[inherit] object-cover grayscale transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
        />
      ) : (
        // No photograph on file. A quiet initials tile in the studio's own
        // paper tone — never a stock avatar, never a broken frame.
        <div
          className="flex h-full w-full items-center justify-center bg-paper"
          aria-hidden
        >
          <span className="font-display text-h2 leading-none text-stone/70">
            {initialsOf(member.name)}
          </span>
        </div>
      )}
    </div>
  );
}

export function TeamSection({ heading }: { heading: string }) {
  const members = roster();

  return (
    <section className="mt-section px-gutter" aria-labelledby="team-heading">
      <Reveal>
        <div className="rule mb-14 flex items-baseline justify-between gap-6 pt-4">
          <h2 id="team-heading" className="font-display text-h2">
            {heading}
          </h2>
          <p className="mono-label shrink-0 text-stone">{TEAM.length} architects</p>
        </div>
      </Reveal>

      <ul className="grid grid-cols-2 gap-x-gutter gap-y-12 lg:grid-cols-5">
        {members.map((m, i) => (
          <li key={m.name} className="list-none">
            {/* Stagger runs across a row and resets, so the grid ripples in
                left-to-right rather than all ten landing at once. */}
            <Reveal delay={(i % 5) * 0.07} className="group">
              <Portrait member={m} />
              <div className="pt-4">
                {/* Two lines are reserved whether or not the name needs
                    them, so "Harshitha Chandrashekhar" doesn't shunt its
                    own designation a line below everyone else's. */}
                <h3 className="font-display text-h3 min-h-[2.5em] leading-tight">
                  {m.name}
                </h3>
                <p className="mono-label text-stone">{m.designation}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
