import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { FEATURED_ONLINE, FEATURED_PRINT, publications } from "@/lib/press";

/**
 * The compact "featured in" strip for the About page (§2.6).
 *
 * The full index lives at /press; this is the credibility line that earns
 * the click. Set as wordmarks in the studio's own type rather than as
 * borrowed publication logos — a row of mismatched brand marks would be
 * the first loud thing on a very quiet page, and we don't have permission
 * to reproduce any of them anyway.
 */
export function PressBand() {
  const names = publications();
  const count = FEATURED_ONLINE.length + FEATURED_PRINT.length;

  return (
    <section className="mt-section px-gutter" aria-labelledby="press-band-heading">
      <Reveal>
        <div className="rule flex flex-wrap items-baseline justify-between gap-4 pt-4">
          <h2 id="press-band-heading" className="font-display text-h2">
            Featured in
          </h2>
          <Link
            href="/press"
            className="mono-label transition-colors hover:text-brass"
          >
            All {count} features &rarr;
          </Link>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <ul className="mt-10 flex flex-wrap items-baseline gap-x-12 gap-y-6">
          {names.map((name) => (
            <li key={name} className="font-display text-h3 text-stone">
              {name}
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
