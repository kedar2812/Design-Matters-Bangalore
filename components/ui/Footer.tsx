import Link from "next/link";
import { navLinks, site, whatsappHref } from "@/lib/site";

export function Footer() {
  return (
    <footer className="rule bg-bone px-gutter pb-10 pt-16">
      {/* CTA */}
      <div className="mb-16">
        <p className="mono-label mb-4">Have a site in mind?</p>
        <Link
          href="/contact"
          className="font-display text-h1 inline-block max-w-3xl transition-colors hover:text-brass"
        >
          Start a conversation&thinsp;&rarr;
        </Link>
      </div>

      {/* Columns */}
      <div className="rule grid gap-10 pt-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="mono-label mb-4">Studio</p>
          <p className="text-sm leading-relaxed text-ink-soft">
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
          <p className="mono-label mb-4">Contact</p>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li>
              <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="hover:text-brass">
                {site.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="hover:text-brass">
                {site.email}
              </a>
            </li>
            <li>
              <a
                href={whatsappHref("Hello Design Matters — I'd like to discuss a project.")}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brass"
              >
                WhatsApp the studio
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="mono-label mb-4">Index</p>
          <ul className="space-y-2 text-sm text-ink-soft">
            {navLinks.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="hover:text-brass">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mono-label mb-4">Elsewhere</p>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li>
              <a
                href={site.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brass"
              >
                Instagram
              </a>
            </li>
            <li>
              <a
                href={site.socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brass"
              >
                LinkedIn
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Baseline */}
      <div className="rule mt-14 flex flex-wrap items-baseline justify-between gap-4 pt-4">
        <p className="mono-label">
          &copy; {new Date().getFullYear()} {site.name}
        </p>
        <p className="mono-label">{site.coordinates}</p>
      </div>
    </footer>
  );
}
