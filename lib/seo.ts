import { getIdentity } from "@/lib/settings";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Whether the site is answering on its real public domain.
 *
 * False on localhost and on the bare Hostinger hostname it runs from
 * before the DNS cutover. `app/robots.ts` uses it to keep the staging
 * host out of the index without anyone having to remember to switch it
 * back on at launch.
 */
export const IS_PUBLIC_DOMAIN =
  !/localhost|127\.0\.0\.1|\.hstgr\.cloud|\.vercel\.app/i.test(SITE_URL);

/** The default share card. A file under /public, deliberately — see
 *  the note in `scripts/make-icons.ts` about the one that 404'd. */
export const OG_IMAGE = {
  url: "/og-default.jpg",
  width: 1200,
  height: 630,
  alt: "Looking up through a Design Matters house in Bangalore, a terracotta jaali ceiling over a double-height court hung with woven pendants",
} as const;

/**
 * The studio's search vocabulary.
 *
 * Two things drive this list. First, the city has two names and the
 * search traffic does not split evenly: "architects in Bangalore" is
 * queried several times more often than the same phrase with Bengaluru,
 * because the official rename never reached the way people type.
 *
 * Body copy used to write Bengaluru and let Bangalore in only through
 * the places a reader does not read. That flipped in round 3: the client
 * sent his own About text saying "our Bangalore-based practice" and
 * asked for it verbatim, so the visible copy and the project locations
 * are Bangalore now and the two halves of the site agree again.
 *
 * What stays Bengaluru is the machine-readable layer, deliberately.
 * `City` in the structured data is the official name and Google matches
 * it against its own place record; the keyword list keeps both spellings
 * because people type both. Press headlines keep whatever the publication
 * printed, because those are somebody else's words.
 *
 * Second, every phrase here has to be one the site can actually answer.
 * "Architects in Indiranagar" earns its place because the studio is in
 * Indiranagar; "luxury villa architects" would not, because ranking for a
 * query the pages do not serve buys a visit that bounces, and bounced
 * visits are what Google measures next.
 *
 * `<meta name="keywords">` itself has been ignored by Google since 2009
 * and is emitted here only because Bing and Yandex still read it weakly
 * and it costs forty bytes. The list matters because it is the checklist
 * the page copy, headings and alt text are written against — not because
 * the tag does anything.
 */
export const KEYWORDS = [
  "architects in Bangalore",
  "architecture firm in Bangalore",
  "residential architects Bangalore",
  "interior designers in Bangalore",
  "architects in Indiranagar",
  "best architects in Bengaluru",
  "house design Bangalore",
  "villa architects Bangalore",
  "commercial architects Bangalore",
  "interior design firm Bengaluru",
  "architectural design consultancy Bangalore",
  "Design Matters Architects",
] as const;

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
    // How people actually search for the studio, and the city under the
    // name half of India still uses. Google reads alternateName when
    // resolving a query to an entity.
    alternateName: [
      site.shortName,
      "DMA Architects",
      `${site.name} Bangalore`,
    ],
    url: SITE_URL,
    description:
      "Architecture and interior design studio in Indiranagar, Bengaluru (Bangalore), residences, villas, apartment interiors, commercial and hospitality projects.",
    foundingDate: String(site.founded),
    founder: {
      "@type": "Person",
      name: site.principal,
      jobTitle: site.principalTitle,
      sameAs: site.linkedin,
    },
    telephone: site.phone.replace(/\s/g, ""),
    email: site.email,
    // Google's LocalBusiness guidance treats image as required and logo
    // as recommended; without them the knowledge panel has nothing to
    // draw. Absolute URLs — a relative path is not resolvable to a
    // crawler reading the JSON out of context.
    image: `${SITE_URL}${OG_IMAGE.url}`,
    logo: `${SITE_URL}/icon.png`,
    address: {
      "@type": "PostalAddress",
      streetAddress: `${site.addressLine1}, ${site.addressLine2}`,
      addressLocality: site.city,
      addressRegion: site.state,
      postalCode: site.pin,
      addressCountry: "IN",
    },
    hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.mapQuery)}`,
    // Both spellings, plus the two cities outside Bengaluru the studio has
    // actually built in — Goa (Icon Bricksquare) and north Karnataka
    // (the Badami and Kerur schools). Nothing aspirational.
    areaServed: [
      { "@type": "City", name: "Bengaluru" },
      { "@type": "City", name: "Bangalore" },
      { "@type": "State", name: "Karnataka" },
      { "@type": "Country", name: "India" },
    ],
    knowsAbout: [
      "Architecture",
      "Interior Design",
      "Residential Architecture",
      "Villa Design",
      "Apartment Interior Design",
      "Commercial Design",
      "Hospitality Design",
      "Institutional Architecture",
      "Climate-responsive design",
      "Daylighting and natural ventilation",
    ],
    sameAs: [site.instagram, site.linkedin, site.houzz].filter(Boolean),
  };
}

/**
 * The site itself. Google reads this node to decide what to print as the
 * site name above a result — without it, it guesses from the <title>,
 * which here would strand the tagline in the SERP.
 *
 * No `SearchAction`: that markup only earns a sitelinks searchbox if the
 * site has a working search endpoint, and this one does not. Declaring a
 * search URL that 404s is a broken promise to a crawler.
 */
export function websiteJsonLd(name: string, shortName: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name,
    alternateName: shortName,
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "en-IN",
  };
}

/**
 * Breadcrumbs for the pages that sit more than one level down.
 *
 * This is the one structured-data type on the site with a visible payoff:
 * Google replaces the raw URL in the result with the trail, so a project
 * listing reads "Design Matters › Residential › Woodsvale" instead of a
 * slug. Pass the trail without the home crumb — it is added here so every
 * caller cannot get the root wrong.
 */
export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...trail].map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.path === "/" ? "" : c.path}`,
    })),
  };
}

/**
 * The services page as an offer catalogue.
 *
 * Architecture is a service, not a product, and the copy on /services is
 * already the studio's own description of each one — so this just restates
 * it in a form a crawler can read, with the studio as provider so the
 * services attach to the same entity as the reviews and the address.
 */
export function servicesJsonLd(services: { title: string; body: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Services offered by Design Matters Architects",
    url: `${SITE_URL}/services`,
    itemListElement: services.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Service",
        name: s.title,
        description: s.body,
        serviceType: s.title,
        provider: { "@id": `${SITE_URL}/#organization` },
        areaServed: { "@type": "City", name: "Bengaluru" },
      },
    })),
  };
}

/**
 * Per-project CreativeWork schema.
 *
 * `image` carries the whole gallery rather than the hero alone. Google
 * Images is a real entry point for architecture — people search for a
 * courtyard or a jaali long before they search for an architect — and an
 * image only competes there if a crawler can tie it to a page, a subject
 * and a creator. The hero leads the array because the first entry is the
 * one lifted into a rich result.
 */
export function projectJsonLd(p: {
  slug: string;
  title: string;
  category: string;
  year: number | null;
  location: string | null;
  heroImage: string | null;
  metaDesc: string | null;
  gallery?: { url: string }[];
}) {
  const images = [p.heroImage, ...(p.gallery ?? []).map((g) => g.url)]
    .filter((u): u is string => Boolean(u))
    .map((u) => `${SITE_URL}${u}`);

  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: p.title,
    url: `${SITE_URL}/projects/${p.slug}`,
    creator: { "@id": `${SITE_URL}/#organization` },
    genre: p.category,
    inLanguage: "en-IN",
    ...(p.year && { dateCreated: String(p.year) }),
    ...(p.location && { locationCreated: { "@type": "Place", name: p.location } }),
    ...(images.length && { image: images }),
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
