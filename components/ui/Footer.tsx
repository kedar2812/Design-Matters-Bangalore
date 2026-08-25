import Link from "next/link";
import { navLinks } from "@/lib/site";
import { CATEGORIES, categoryHref } from "@/lib/categories";
import { whatsappHref, type Identity } from "@/lib/settings";

/**
 * Dusk footer — every page's closing act shifts into the dark warm
 * register and makes the studio's #1 ask (enquire) unmissable:
 * a written enquiry, WhatsApp, or a phone call.
 */
export function Footer({ identity: site }: { identity: Identity }) {
  const wa = whatsappHref(
    site.whatsapp,
    `Hello ${site.shortName}, I’d like to discuss a project.`,
  );

  return (
    <footer className="bg-dusk text-cream">
      {/* Conversation CTA */}
      <div className="px-gutter pb-20 pt-24">
        <p className="mono-label mb-5 text-brass-bright">Have a site in mind?</p>
        <p className="font-display text-h1 max-w-4xl text-cream">
          Start the conversation.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/contact"
            className="rounded-full bg-cream px-8 py-3.5 text-sm tracking-wide text-noir transition-colors hover:bg-brass-bright"
          >
            Enquire about a project
          </Link>
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-cream/30 px-8 py-3.5 text-sm tracking-wide text-cream transition-colors hover:border-brass-bright hover:text-brass-bright"
          >
            WhatsApp the studio
          </a>
          <a
            href={`tel:${site.phone.replace(/\s/g, "")}`}
            className="mono-label ml-1 text-cream/60 transition-colors hover:text-brass-bright"
          >
            or call {site.phone}
          </a>
        </div>
      </div>

      {/* Columns */}
      <div className="mx-gutter grid gap-10 border-t border-dusk-edge py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="mono-label mb-4 text-brass-bright">Studio</p>
          {/* A real <address>, not a <p>. The studio's postal address on
              every page is the site's strongest local-search signal, and
              the element is the semantic one, it also keeps the block
              consistent with the PostalAddress in the JSON-LD, which is
              what "NAP consistency" actually means. `not-italic` because
              the UA sheet italicises <address> by default. */}
          <address className="text-sm not-italic leading-relaxed text-cream/70">
            {site.name}
            <br />
            {site.addressLine1}
            <br />
            {site.addressLine2}
            <br />
            {site.city} {site.pin}
          </address>
        </div>

        <div>
          <p className="mono-label mb-4 text-brass-bright">Contact</p>
          <ul className="space-y-2 text-sm text-cream/70">
            <li>
              <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="transition-colors hover:text-brass-bright">
                {site.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="transition-colors hover:text-brass-bright">
                {site.email}
              </a>
            </li>
            <li>
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-brass-bright"
              >
                WhatsApp the studio
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="mono-label mb-4 text-brass-bright">Index</p>
          <ul className="space-y-2 text-sm text-cream/70">
            {navLinks.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="transition-colors hover:text-brass-bright">
                  {label}
                </Link>

                {/* The practice areas are the studio's main search
                    surface, worth a crawlable link on every page. */}
                {href === "/projects" && (
                  <ul className="mt-2 space-y-2 border-l border-dusk-edge pl-3">
                    {CATEGORIES.map((c) => (
                      <li key={c.slug}>
                        <Link
                          href={categoryHref(c.slug)}
                          className="text-cream/55 transition-colors hover:text-brass-bright"
                        >
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mono-label mb-4 text-brass-bright">Elsewhere</p>
          <ul className="space-y-2 text-sm text-cream/70">
            <li>
              <a
                href={site.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-brass-bright"
              >
                Instagram
              </a>
            </li>
            <li>
              <a
                href={site.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-brass-bright"
              >
                LinkedIn
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Baseline */}
      <div className="mx-gutter flex flex-wrap items-baseline justify-between gap-4 border-t border-dusk-edge py-5">
        <p className="mono-label text-cream/50">
          &copy; {new Date().getFullYear()} {site.name}
        </p>
        <p className="mono-label text-cream/50">
          {site.addressLine2.split(",").pop()?.trim() || site.city}, {site.city}
        </p>
      </div>
    </footer>
  );
}
