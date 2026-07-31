import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { LightboxProvider, LightboxTrigger } from "@/components/site/Lightbox";
import { IMG_Q } from "@/lib/images";
import {
  FEATURED_ONLINE,
  FEATURED_PRINT,
  pressDate,
  type PressItem,
} from "@/lib/press";
import blurs from "@/lib/studio-blurs.json";

/**
 * Press and publications (§2.6) — credibility real estate, so it is set
 * as an editorial index rather than a wall of logos or a list of links.
 *
 * Two registers. Online pieces are a ruled index: publication and date on
 * the left, headline carrying the weight, project cross-link on the
 * right. Buildofy's two entries lead the list at a larger size because
 * Kiran rates the platform highest, and giving them scale is a cleaner
 * way to say so than a "featured" badge would be.
 *
 * Print cuttings are shown as what they are — scans — as upright
 * thumbnails that open full size in the site's existing lightbox.
 */

const outbound = { target: "_blank", rel: "noopener noreferrer" } as const;

function OnlineRow({ item, lead }: { item: PressItem; lead?: boolean }) {
  const when = pressDate(item);

  return (
    <li className="rule group list-none pt-5">
      <div className="grid gap-x-gutter gap-y-2 md:grid-cols-12">
        <p className="mono-label md:col-span-3">
          {item.publication}
          {when && <span className="text-stone"> — {when}</span>}
        </p>

        <div className="md:col-span-6">
          <h3
            className={
              lead
                ? "font-display text-h3 leading-tight"
                : "font-display text-xl leading-snug"
            }
          >
            <a
              href={item.url}
              {...outbound}
              className="transition-colors hover:text-brass"
            >
              {item.headline}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </h3>
          {item.projectName && (
            <p className="mono-label mt-2 text-stone">{item.projectName}</p>
          )}
        </div>

        <div className="md:col-span-3 md:text-right">
          {item.projectSlug ? (
            <Link
              href={`/projects/${item.projectSlug}`}
              className="mono-label underline underline-offset-4 transition-colors hover:text-brass"
            >
              See the project &rarr;
            </Link>
          ) : (
            <a
              href={item.url}
              {...outbound}
              className="mono-label text-stone underline underline-offset-4 transition-colors hover:text-brass"
            >
              Read the article &rarr;
            </a>
          )}
        </div>
      </div>
    </li>
  );
}

export function PressList() {
  const leads = FEATURED_ONLINE.filter((i) => i.weight === "lead");
  const rest = FEATURED_ONLINE.filter((i) => i.weight !== "lead");

  const scans = FEATURED_PRINT.filter((i) => i.scan);
  const media = scans.map((i) => ({
    url: i.scan!,
    alt: `${i.publication} — “${i.headline}”, by ${i.byline}`,
  }));

  return (
    <>
      {/* ------------------------------------------ featured on websites */}
      <section className="px-gutter pb-section" aria-labelledby="online-heading">
        <Reveal>
          <div className="rule mb-10 pt-4">
            <h2 id="online-heading" className="font-display text-h2">
              Featured on websites
            </h2>
          </div>
        </Reveal>

        <ul className="space-y-6">
          {leads.map((item, i) => (
            <Reveal key={item.url} delay={i * 0.08}>
              <OnlineRow item={item} lead />
            </Reveal>
          ))}
          {rest.map((item, i) => (
            <Reveal key={item.url} delay={i * 0.05}>
              <OnlineRow item={item} />
            </Reveal>
          ))}
        </ul>
      </section>

      {/* --------------------------------------------- featured in media */}
      <section className="px-gutter pb-section" aria-labelledby="print-heading">
        <Reveal>
          <div className="rule mb-10 pt-4">
            <h2 id="print-heading" className="font-display text-h2">
              Featured in media
            </h2>
            {/* Kiran is a quoted source in these pieces, not their author —
                the bylines belong to the paper's own writer. */}
            <p className="mt-5 max-w-2xl leading-relaxed text-ink-soft">
              Kiran Hanumaiah is quoted in the Deccan Herald’s design pages on
              daylight, kitchens and garden rooms — how homes in this climate
              are actually built and lived in.
            </p>
          </div>
        </Reveal>

        <LightboxProvider images={media}>
          <ul className="grid gap-gutter sm:grid-cols-2 lg:grid-cols-3">
            {scans.map((item, i) => (
              <Reveal key={item.scan} delay={i * 0.08}>
                <li className="list-none">
                  <LightboxTrigger index={i}>
                    <div className="rounded-frame relative aspect-[3/4] overflow-hidden bg-paper">
                      <Image
                        src={item.scan!}
                        alt={`Newspaper cutting — “${item.headline}”, ${item.publication}`}
                        fill
                        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                        quality={IMG_Q.feature}
                        placeholder={
                          (blurs as Record<string, string>)[item.scan!]
                            ? "blur"
                            : "empty"
                        }
                        blurDataURL={(blurs as Record<string, string>)[item.scan!]}
                        className="rounded-[inherit] object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02]"
                      />
                    </div>
                  </LightboxTrigger>
                  <div className="pt-4">
                    <h3 className="font-display text-xl leading-snug">
                      {item.headline}
                    </h3>
                    <p className="mono-label mt-1.5 text-stone">
                      {item.publication}
                      {item.byline && ` — ${item.byline}`}
                    </p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ul>
        </LightboxProvider>
      </section>
    </>
  );
}
