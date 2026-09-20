"use client";

import { usePathname } from "next/navigation";

/**
 * The studio's location, in the footer of every page but one.
 *
 * `/contact` carries its own, larger map in the page body, where a map is
 * the point rather than a courtesy. Rendering this one too would put two
 * Google maps on a single page, a few hundred pixels apart, which reads as
 * an oversight rather than a decision — so the footer stands down there.
 *
 * The iframe takes `pointer-events-none` on purpose: a live map in a
 * footer swallows the wheel and traps the visitor's scroll halfway down
 * the page. Inert, the whole frame is one link that opens Maps properly,
 * which is the only thing anyone wants from a map down here.
 *
 * `loading="lazy"` matters more than usual — the embed pulls roughly a
 * megabyte of Google's JavaScript and this footer is on every page. Lazy
 * keeps it out of the initial load entirely, since it is always below the
 * fold.
 */
export function FooterMap({
  href,
  embed,
  title,
}: {
  href: string;
  embed: string;
  title: string;
}) {
  const pathname = usePathname();
  if (pathname === "/contact") return null;

  /* Rendered inside the address/contact half of the footer rather than as
     a grid row of its own. As a separate row it would be pushed down by
     the grid's row gap *and* by the height of the tallest column in the
     row above (the site index), leaving it floating well clear of the
     address it belongs to. Nested, it closes straight up under them. */
  return (
    <div className="mt-4">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block overflow-hidden rounded-frame border border-dusk-edge"
      >
        {/* Muted so it sits in the dusk palette instead of glaring out of
            it, and brought up to full colour on hover. */}
        <iframe
          src={embed}
          title={title}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none block h-[170px] w-full border-0 grayscale brightness-[0.62] contrast-[1.08] transition-all duration-700 group-hover:grayscale-0 group-hover:brightness-100 group-hover:contrast-100"
        />
        <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-noir/70 px-3 py-1.5 text-[11px] tracking-wide text-cream backdrop-blur-sm transition-colors group-hover:text-brass-bright">
          Open in Google Maps
        </span>
      </a>
    </div>
  );
}
