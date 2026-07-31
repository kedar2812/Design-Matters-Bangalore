import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";
import { IMG_Q } from "@/lib/images";
import { teamByRank, initialsOf, type TeamMember } from "@/lib/team";
import blurs from "@/lib/studio-blurs.json";

/**
 * The studio roster (§2.5) — "team to be highlighted and mentioned".
 *
 * Hierarchy is carried by scale and position rather than by decoration:
 * the principal takes a wide two-column block of his own, senior
 * architects run three-up beneath, and the architects four-up under a
 * rule. Everyone shares the same 3:4 frame, so the grid stays aligned
 * whatever the source photograph was.
 *
 * Every portrait is desaturated. That is a deliberate universal choice,
 * not a style flourish: the source photographs were taken years apart in
 * different rooms under different light, one of them is already black and
 * white, and grayscale is the only treatment that makes nine of them read
 * as one set. It also means a portrait arriving later can't clash.
 *
 * People without a photograph get an initials tile in the same frame, so
 * a half-supplied roster still forms an even grid.
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
          // Grayscale everywhere, warming very slightly on hover so the
          // grid feels alive without breaking the uniform treatment.
          className="rounded-[inherit] object-cover grayscale transition-[filter,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:grayscale-[0.55] group-hover:scale-[1.03]"
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

function Caption({ member }: { member: TeamMember }) {
  return (
    <div className="pt-4">
      <h3 className="font-display text-h3 leading-tight">{member.name}</h3>
      <p className="mono-label mt-1.5 text-stone">{member.designation}</p>
    </div>
  );
}

export function TeamSection({ heading }: { heading: string }) {
  const groups = teamByRank();
  const principal = groups.find((g) => g.rank === "Principal Architect")?.members[0];
  const rest = groups.filter((g) => g.rank !== "Principal Architect");
  const total = groups.reduce((n, g) => n + g.members.length, 0);

  return (
    <section className="mt-section px-gutter" aria-labelledby="team-heading">
      <Reveal>
        <div className="rule mb-14 flex items-baseline justify-between pt-4">
          <h2 id="team-heading" className="font-display text-h2">
            {heading}
          </h2>
          <p className="mono-label">
            {total} {total === 1 ? "architect" : "architects"}
          </p>
        </div>
      </Reveal>

      {/* Principal — its own row, at twice the width of the tiles below,
          with the bio column left empty for the studio's own words. */}
      {principal && (
        <Reveal className="group mb-20 grid gap-x-gutter gap-y-6 md:grid-cols-12">
          <div className="md:col-span-5 lg:col-span-4">
            <Portrait member={principal} sizes="(min-width: 768px) 34vw, 100vw" />
          </div>
          <div className="flex flex-col justify-end md:col-span-6 md:col-start-7">
            <p className="mono-label mb-3 text-brass">{principal.designation}</p>
            <h3 className="font-display text-h1 leading-none">{principal.name}</h3>
          </div>
        </Reveal>
      )}

      {rest.map((group) => (
        <div key={group.rank} className="mb-16 last:mb-0">
          <Reveal>
            <p className="mono-label rule mb-8 pt-4">
              {group.rank === "Senior Architect" ? "Senior Architects" : "Architects"}
            </p>
          </Reveal>
          <ul
            className={
              group.rank === "Senior Architect"
                ? "grid grid-cols-2 gap-x-gutter gap-y-10 md:grid-cols-3"
                : "grid grid-cols-2 gap-x-gutter gap-y-10 sm:grid-cols-3 lg:grid-cols-5"
            }
          >
            {group.members.map((m, i) => (
              <Reveal key={m.name} delay={(i % 4) * 0.08} className="group">
                <li className="list-none">
                  <Portrait
                    member={m}
                    sizes={
                      group.rank === "Senior Architect"
                        ? "(min-width: 768px) 30vw, 50vw"
                        : "(min-width: 1024px) 18vw, (min-width: 640px) 30vw, 50vw"
                    }
                  />
                  <Caption member={m} />
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
