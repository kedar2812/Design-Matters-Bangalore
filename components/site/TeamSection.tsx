import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";
import { IMG_Q } from "@/lib/images";
import {
  TEAM,
  rosterByRank,
  rankHeading,
  initialsOf,
  type TeamMember,
} from "@/lib/team";
import blurs from "@/lib/studio-blurs.json";

/**
 * The studio roster.
 *
 * Round 1 ran this as one even grid of ten faces with no sub-headings —
 * the portraits were shot in a single session against one wall, and they
 * tile into a continuous band that sub-headings would interrupt.
 *
 * Round 2 overrules that, and points at digitalbluefoam.com/company/team
 * as the model. That page separates its founders from its core team
 * outright, and gives each person a role, a place and a sentence in their
 * own voice. The client is right about the substance of it: a flat grid
 * of eleven faces tells a prospective client nothing about who would
 * actually run their project.
 *
 * So the roster is now banded by rank — seniors in a wider three-up grid
 * that gives them physical weight on the page, everyone else four-up
 * beneath. The principal is still absent from both; he has his own block
 * above, which is where the hierarchy actually reads.
 *
 * The reference also carries a personal statement under every name. We
 * have none, and inventing them would be putting words in the mouths of
 * eleven real people. `TeamMember.bio` exists and renders when present;
 * until the studio sends them the cards close up cleanly without the
 * paragraph, so the page is never visibly waiting for something.
 *
 * Portraits are stored as greyscale JPEGs rather than desaturated in CSS:
 * the source shoot is monochrome already, and dropping the two empty
 * chroma planes takes about a quarter off every file. `grayscale` stays on
 * the element so that a future colour portrait can't break the set.
 */

const blurOf = (src?: string) =>
  src ? (blurs as Record<string, string>)[src] : undefined;

function Portrait({ member, sizes }: { member: TeamMember; sizes: string }) {
  return (
    <div className="rounded-frame relative aspect-[3/4] overflow-hidden bg-hairline/40">
      {member.image ? (
        <Image
          src={member.image}
          alt={`${member.name}, ${member.designation} at Design Matters`}
          fill
          sizes={sizes}
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

/**
 * One person. The designation sits *above* the name, as on the reference
 * page — it turns the card into "this is the senior architect, and she is
 * called Pallavi" rather than a caption under a photograph.
 */
function Card({
  member,
  sizes,
  delay,
}: {
  member: TeamMember;
  sizes: string;
  delay: number;
}) {
  return (
    <li className="list-none">
      <Reveal delay={delay} className="group">
        <Portrait member={member} sizes={sizes} />
        <div className="pt-4">
          <p className="mono-label text-brass">{member.designation}</p>
          <h3 className="font-display text-h3 mt-2 leading-tight">{member.name}</h3>
          {member.bio && (
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">
              {member.bio}
            </p>
          )}
        </div>
      </Reveal>
    </li>
  );
}

export function TeamSection({ heading }: { heading: string }) {
  const groups = rosterByRank();

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

      {groups.map((group, gi) => {
        // Seniors get a three-up grid, so each portrait is physically
        // larger than the ones below it and the band reads as a tier
        // rather than as the top row of one long list.
        const senior = group.rank === "Senior Architect";
        const cols = senior ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-2 lg:grid-cols-4";
        const sizes = senior
          ? "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
          : "(min-width: 1024px) 22vw, 45vw";
        const perRow = senior ? 3 : 4;

        return (
          <div key={group.rank} className={gi > 0 ? "mt-20" : ""}>
            <Reveal>
              <p className="mono-label mb-8 text-stone">{rankHeading(group.rank)}</p>
            </Reveal>
            <ul className={`grid gap-x-gutter gap-y-12 ${cols}`}>
              {group.members.map((m, i) => (
                <Card
                  key={m.name}
                  member={m}
                  sizes={sizes}
                  // Stagger runs across a row and resets, so the grid
                  // ripples in left-to-right rather than all at once.
                  delay={(i % perRow) * 0.07}
                />
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
