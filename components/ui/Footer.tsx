import Link from "next/link";
import { navLinks, site, whatsappHref } from "@/lib/site";

/**
 * Dusk footer — every page's closing act shifts into the dark warm
 * register and makes the studio's #1 ask (enquire) unmissable:
 * a written enquiry, WhatsApp, or a phone call.
 */
export function Footer() {
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
            href={whatsappHref("Hello Design Matters — I'd like to discuss a project.")}
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
          <p className="text-sm leading-relaxed text-cream/70">
            {site.name}
            <br />
            {site.address.line1}
            <br />
            {site.address.line2}
            <br />
            {site.address.city} {site.address.pin}
          </p>
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
                href={whatsappHref("Hello Design Matters — I'd like to discuss a project.")}
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
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mono-label mb-4 text-brass-bright">Elsewhere</p>
          <ul className="space-y-2 text-sm text-cream/70">
            <li>
              <a
                href={site.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-brass-bright"
              >
                Instagram — @designmattersarchitects
              </a>
            </li>
            <li>
              <a
                href={site.socials.linkedin}
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
        <p className="mono-label text-cream/50">Indiranagar, Bengaluru</p>
      </div>
    </footer>
  );
}
