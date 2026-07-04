import { site } from "@/lib/site";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Site-wide structured data: the studio as an Organization and a
 * bookable LocalBusiness (ProfessionalService) in Indiranagar.
 */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "ProfessionalService"],
    "@id": `${SITE_URL}/#organization`,
    name: site.name,
    url: SITE_URL,
    description:
      "Architecture and interior design studio in Bengaluru — residences, apartments, commercial and hospitality spaces.",
    foundingDate: String(site.founded),
    founder: {
      "@type": "Person",
      name: site.principal,
      jobTitle: "Principal Architect",
      sameAs: site.socials.linkedin,
    },
    telephone: site.phone.replace(/\s/g, ""),
    email: site.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: `${site.address.line1}, ${site.address.line2}`,
      addressLocality: site.address.city,
      addressRegion: site.address.state,
      postalCode: site.address.pin,
      addressCountry: "IN",
    },
    areaServed: "Bengaluru",
    knowsAbout: [
      "Architecture",
      "Interior Design",
      "Residential Design",
      "Commercial Design",
      "Hospitality Design",
    ],
    sameAs: [site.socials.instagram, site.socials.linkedin].filter(Boolean),
  };
}

/** Per-project CreativeWork schema. */
export function projectJsonLd(p: {
  slug: string;
  title: string;
  category: string;
  year: number | null;
  location: string | null;
  heroImage: string | null;
  metaDesc: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: p.title,
    url: `${SITE_URL}/projects/${p.slug}`,
    creator: { "@id": `${SITE_URL}/#organization` },
    genre: p.category,
    ...(p.year && { dateCreated: String(p.year) }),
    ...(p.location && { locationCreated: { "@type": "Place", name: p.location } }),
    ...(p.heroImage && { image: `${SITE_URL}${p.heroImage}` }),
    ...(p.metaDesc && { description: p.metaDesc }),
  };
}

/** Render helper — one <script> per schema object. */
export function jsonLdScript(data: object) {
  return {
    __html: JSON.stringify(data).replace(/</g, "\\u003c"),
  };
}
