/**
 * Build-time studio facts.
 *
 * These are the *defaults* — the live values are editable from the
 * dashboard (Studio → Studio details) and are read with `getIdentity()`
 * from `lib/settings`. Use this module only where an async read isn't
 * possible (static `metadata` exports, sitemap, robots); anything
 * rendered in a page or component should read the live identity so the
 * studio's edits actually show up.
 *
 * Imports the *pure* defaults module — this file is reachable from
 * client components, so it must never pull in the database.
 */
import { DEFAULTS } from "@/lib/content-defaults";

export const site = DEFAULTS.identity;

// Discovery form: essential pages are Home / Projects / About / Services,
// and the client opted out of a public blog — no Journal here.
export const navLinks = [
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/testimonials", label: "Testimonials" },
  { href: "/contact", label: "Contact" },
] as const;

/**
 * Pages that belong in the footer index and the sitemap but not in the
 * top nav. Press is real content and worth crawling, but a sixth item in
 * the floating nav pill crowds it — the About page carries a "Featured
 * in" strip that links through instead.
 */
export const secondaryLinks = [{ href: "/press", label: "Press" }] as const;

export const whatsappHref = (text?: string) =>
  `https://wa.me/${site.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
