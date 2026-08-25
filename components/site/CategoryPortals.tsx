import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { CATEGORIES, categoryHref, type CategorySlug } from "@/lib/categories";
import { IMG_Q } from "@/lib/images";

/**
 * The three practice areas as tall photographic portals — the first
 * thing the portfolio index offers, before the full index below it.
 * Each card borrows its image from that category's leading project, so
 * the studio never has to upload artwork for this section: publish a
 * project and the portal updates itself.
 */

export type PortalData = {
  slug: CategorySlug;
  tagline: string;
  count: number;
  image: string | null;
  blur: string | null;
};

export function CategoryPortals({ portals }: { portals: PortalData[] }) {
  const bySlug = new Map(portals.map((p) => [p.slug, p]));

  return (
    <ul className="grid gap-gutter sm:grid-cols-2 lg:grid-cols-3">
      {CATEGORIES.map((cat, i) => {
        const data = bySlug.get(cat.slug);
        const count = data?.count ?? 0;

        return (
          <Reveal key={cat.slug} delay={i * 0.08} y={32}>
            <li className="h-full list-none">
              <Link
                href={categoryHref(cat.slug)}
                className="rounded-frame group relative flex h-full min-h-[26rem] flex-col justify-end overflow-hidden bg-noir p-6 sm:min-h-[30rem]"
              >
                {data?.image && (
                  <Image
                    src={data.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    quality={IMG_Q.card}
                    placeholder={data.blur ? "blur" : "empty"}
                    blurDataURL={data.blur ?? undefined}
                    className="rounded-[inherit] object-cover opacity-90 transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
                  />
                )}

                {/* Ink wash, deep enough at the foot for cream type to
                    clear contrast over any photograph. */}
                <div
                  aria-hidden
                  className="absolute inset-0 rounded-[inherit] bg-gradient-to-t from-noir via-noir/45 to-noir/10 transition-opacity duration-700 group-hover:from-noir group-hover:via-noir/35"
                />

                {/* Count chip */}
                <span className="glass-dark mono-label absolute right-5 top-5 rounded-full px-3.5 py-1.5 text-cream/90">
                  {count} {count === 1 ? "project" : "projects"}
                </span>

                <div className="relative">
                  <p className="mono-label mb-3 text-brass-bright">{cat.numeral}</p>
                  <h3 className="font-display text-h2 leading-none text-cream">
                    {cat.label}
                  </h3>
                  {data?.tagline && (
                    <p className="mt-3 max-w-[22ch] text-sm leading-relaxed text-cream/75">
                      {data.tagline}
                    </p>
                  )}

                  <span className="mono-label mt-6 inline-flex items-center gap-2 text-cream">
                    Explore
                    <span
                      aria-hidden
                      className="inline-block transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1.5"
                    >
                      &rarr;
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="mt-2 block h-px w-full max-w-[7rem] origin-left scale-x-0 bg-brass-bright transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
                  />
                </div>
              </Link>
            </li>
          </Reveal>
        );
      })}
    </ul>
  );
}
