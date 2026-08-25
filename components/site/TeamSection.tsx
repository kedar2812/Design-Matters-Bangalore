import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHead } from "@/components/site/SectionHead";
import { IMG_Q } from "@/lib/images";
import { TEAM, principal, rosterByRank, rankHeading, initialsOf, type TeamMember } from "@/lib/team";
import blurs from "@/lib/studio-blurs.json";
import { cn } from "@/lib/utils";

/**
 * The studio roster, built to the page the client asked us to follow:
 * digitalbluefoam.com/company/team.
 *
 * What that page actually does, and what is reproduced here:
 *
 *  - People sit in a continuous hairline grid. The cells butt together
 *    and are separated by drawn rules, rather than floating as separate
 *    cards on the page background. That single decision is most of the
 *    look.
 *  - The portrait is inset inside its cell with the surface showing
 *    around it, not bled to the edges.
 *  - The role sits ABOVE the name, in a bordered chip, monospaced and
 *    uppercase. It reads as "this is the senior architect, and she is
 *    called Pallavi" rather than as a caption.
 *  - Then the name, then the location in monospace, then a rule, then a
 *    short statement in the person's own voice.
 *  - Leadership is a separate, wider band above the rest of the team.
 *
 * Two deliberate departures. The palette is the studio's own bone, brass
 * and hairline rather than the reference's greys and blues, because
 * copying the layout is the brief and copying the colours would just make
 * this somebody else's website. And the principal keeps the dark
 * full-width block he already had, which does the job the reference's
 * two-up founder row does.
 *
 * The bios are the one piece still missing. That page gives everyone a
 * sentence in their own voice and we have none of them, so `bio` renders
 * when present and the card closes up cleanly when it is absent. They are
 * on the asset request; drop them into `lib/team.ts` and they appear.
 */

const blurOf = (src?: string) =>
  src ? (blurs as Record<string, string>)[src] : undefined;

/** Everyone works out of the Indiranagar studio. */
const LOCATION = "Bangalore, IN";

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="mono-label inline-block border border-hairline px-3 py-1.5 text-stone">
      {children}
    </span>
  );
}

function PersonCard({
  member,
  sizes,
  delay,
}: {
  member: TeamMember;
  sizes: string;
  delay: number;
}) {
  return (
    <li className="list-none border-b border-r border-hairline">
      <Reveal delay={delay} className="group block h-full">
        <div className="flex h-full flex-col p-5 sm:p-6">
          {/* Portrait, inset. The reference never bleeds these to the
              cell edge, and the margin is what keeps a grid of faces from
              reading as a contact sheet. */}
          {/* Always 3:4. The reference crops its founders wider, but that
              shoot was framed for it; ours is eleven people standing
              against one wall in portrait, and a 4:3 box on those cuts
              every head off at the neck. The senior tier reads as a tier
              from its cell width instead. */}
          <div className="rounded-frame relative aspect-[3/4] overflow-hidden bg-hairline/30">
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
              <div className="flex h-full w-full items-center justify-center bg-paper" aria-hidden>
                <span className="font-display text-h2 leading-none text-stone/70">
                  {initialsOf(member.name)}
                </span>
              </div>
            )}
          </div>

          <div className="mt-6">
            <Chip>{member.designation}</Chip>
          </div>
          <h3 className="font-display text-h3 mt-4 leading-tight">{member.name}</h3>
          <p className="mono-label mt-1.5 text-stone">{LOCATION}</p>

          {member.bio && (
            <>
              <span aria-hidden className="mt-5 block h-px w-full bg-hairline" />
              <p className="mt-5 text-sm leading-relaxed text-ink-soft">{member.bio}</p>
            </>
          )}
        </div>
      </Reveal>
    </li>
  );
}

export function TeamSection({ heading }: { heading: string }) {
  const groups = rosterByRank();
  const lead = principal();

  return (
    <section className="mt-section px-gutter" aria-labelledby="team-heading">
      <SectionHead
        eyebrow="The people"
        heading={heading}
        intro={`${TEAM.length} architects work out of the Indiranagar studio. ${
          lead ? `${lead.name} leads the practice; ` : ""
        }the projects on this site are theirs.`}
      />

      <div className="mt-16 space-y-16">
        {groups.map((group) => {
          const senior = group.rank === "Senior Architect";
          // Seniors get a wider three-up band, so the tier is legible as a
          // tier rather than as the first row of one long list.
          const cols = senior
            ? "sm:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-2 lg:grid-cols-4";
          const sizes = senior
            ? "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
            : "(min-width: 1024px) 22vw, 45vw";
          const perRow = senior ? 3 : 4;

          return (
            <div key={group.rank}>
              <Reveal>
                <p className="mono-label mb-6 flex items-center gap-4">
                  <span aria-hidden className="block h-px w-10 shrink-0 bg-brass" />
                  <span className="text-stone">{rankHeading(group.rank)}</span>
                </p>
              </Reveal>
              {/* Top and left rules live on the wrapper, right and bottom
                  on each cell, so the grid closes on all four sides
                  however many people are in it. */}
              <ul className={cn("grid border-l border-t border-hairline", cols)}>
                {group.members.map((m, i) => (
                  <PersonCard
                    key={m.name}
                    member={m}
                    sizes={sizes}
                    delay={(i % perRow) * 0.07}
                  />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
