import { getIdentity } from "@/lib/settings";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Site-wide structured data: the studio as an Organization and a
 * bookable LocalBusiness (ProfessionalService) in Indiranagar.
 * Reads the live identity so dashboard edits reach search engines.
 */
export async function organizationJsonLd() {
  const site = await getIdentity();
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
      jobTitle: site.principalTitle,
      sameAs: site.linkedin,
    },
    telephone: site.phone.replace(/\s/g, ""),
    email: site.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: `${site.addressLine1}, ${site.addressLine2}`,
      addressLocality: site.city,
      addressRegion: site.state,
      postalCode: site.pin,
      addressCountry: "IN",
    },
    areaServed: site.city,
    knowsAbout: [
      "Architecture",
      "Interior Design",
      "Residential Design",
      "Commercial Design",
      "Hospitality Design",
    ],
    sameAs: [site.instagram, site.linkedin, site.houzz].filter(Boolean),
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

/**
 * The press page as an ItemList of Article citations (§2.6). Each entry
 * points at the publisher's page, with the studio as the subject rather
 * than the author — these are pieces *about* the practice.
 *
 * Items without a verified date carry no `datePublished` rather than a
 * fabricated one; the same rule the data file follows.
 */
export function pressJsonLd(
  items: {
    publication: string;
    headline: string;
    url?: string;
    date?: string;
  }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Design Matters in the press",
    url: `${SITE_URL}/press`,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Article",
        headline: item.headline,
        ...(item.url && { url: item.url }),
        ...(item.date && { datePublished: item.date }),
        publisher: { "@type": "Organization", name: item.publication },
        about: { "@id": `${SITE_URL}/#organization` },
      },
    })),
  };
}

/** Render helper — one <script> per schema object. */
export function jsonLdScript(data: object) {
  return {
    __html: JSON.stringify(data).replace(/</g, "\\u003c"),
  };
}
