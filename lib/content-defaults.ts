/**
 * Editable site content — shapes and built-in copy.
 *
 * Deliberately free of any database import: client components pull
 * `navLinks`/defaults through `lib/site`, and dragging Prisma into that
 * graph would break the browser bundle. The DB-backed reader lives in
 * `lib/settings`.
 */

/* ------------------------------------------------------------- shapes */

export type Identity = {
  name: string;
  shortName: string;
  tagline: string;
  founded: number;
  principal: string;
  principalTitle: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pin: string;
  phone: string;
  phoneAlt: string;
  email: string;
  whatsapp: string;
  instagram: string;
  linkedin: string;
  houzz: string;
  mapQuery: string;
};

export type HomeContent = {
  heroEyebrow: string;
  heroLine: string;
  /** Cycled by the hero's rotating word. */
  heroWords: string[];
  studioEyebrow: string;
  studioStatement: string;
  studioLinkLabel: string;
  workHeading: string;
  servicesHeading: string;
  services: { title: string; body: string }[];
};

export type AboutContent = {
  eyebrow: string;
  heading: string;
  story: string[];
  philosophyEyebrow: string;
  philosophyQuote: string;
  principalEyebrow: string;
  principalBio: string[];
  teamHeading: string;
  team: string[];
  approachHeading: string;
  approach: { title: string; body: string }[];
};

export type ServicesContent = {
  eyebrow: string;
  heading: string;
  services: { title: string; body: string; scope: string }[];
  processEyebrow: string;
  processHeading: string;
  process: { title: string; body: string }[];
};

export type ContactContent = {
  eyebrow: string;
  heading: string;
  whatsappLabel: string;
  whatsappMessage: string;
};

export type TestimonialsContent = {
  eyebrow: string;
  heading: string;
  intro: string;
  /** Live Google rating — refreshed automatically by the dashboard sync. */
  ratingValue: string;
  reviewCount: string;
  /** The studio's Google listing (the CID URL is stable). */
  googleUrl: string;
  /** The oversized quote between the header and the grid. */
  pullQuote: string;
  pullQuoteAuthor: string;
  /** The strip on the home page. */
  homeEyebrow: string;
  homeHeading: string;
  homeLinkLabel: string;
};

/**
 * Copy for the portfolio index and the three practice-area pages.
 *
 * Per-category fields are deliberately *flat* (`residentialHeading`
 * rather than `residential.heading`): `getSection` merges stored values
 * over the defaults one key deep, so a nested object would be replaced
 * wholesale the first time it's saved and would stop picking up new
 * default fields. `categoryCopy()` below re-assembles them for render.
 */
export type ProjectsContent = {
  eyebrow: string;
  heading: string;
  intro: string;
  portalEyebrow: string;
  indexEyebrow: string;
  indexHeading: string;
  emptyNote: string;

  residentialTagline: string;
  residentialEyebrow: string;
  residentialHeading: string;
  residentialIntro: string;
  residentialHighlights: { title: string; body: string }[];

  interiorsTagline: string;
  interiorsEyebrow: string;
  interiorsHeading: string;
  interiorsIntro: string;
  interiorsHighlights: { title: string; body: string }[];

  institutionalTagline: string;
  institutionalEyebrow: string;
  institutionalHeading: string;
  institutionalIntro: string;
  institutionalHighlights: { title: string; body: string }[];
};

/** The per-category slice of `ProjectsContent`, assembled for render. */
export type CategoryCopy = {
  tagline: string;
  eyebrow: string;
  heading: string;
  intro: string;
  highlights: { title: string; body: string }[];
};

/* ----------------------------------------------------------- defaults */

export const DEFAULTS = {
  identity: {
    name: "Design Matters Architects",
    shortName: "Design Matters",
    tagline: "Architecture + Interior Design, Bengaluru",
    founded: 2011,
    principal: "Ar. Kiran Hanumaiah",
    principalTitle: "Principal Architect",
    addressLine1: "3302, 2nd Floor, 12th A Main Rd",
    addressLine2: "HAL 2nd Stage, Indiranagar",
    city: "Bengaluru",
    state: "Karnataka",
    pin: "560008",
    phone: "+91 98860 16711",
    phoneAlt: "+91 78921 04742",
    email: "kiran@designmattersblr.com",
    whatsapp: "919886016711",
    instagram: "https://www.instagram.com/designmattersarchitects_/",
    linkedin: "https://in.linkedin.com/in/kiran-hanumaiah-825539a1",
    houzz: "",
    mapQuery:
      "Design Matters Architects, 12th A Main Rd, HAL 2nd Stage, Indiranagar, Bengaluru",
  } satisfies Identity,

  home: {
    heroEyebrow: "Architecture + Interior Design — Bengaluru, since 2011",
    heroLine: "Buildings that",
    heroWords: ["belong.", "breathe.", "listen.", "endure."],
    studioEyebrow: "The studio",
    studioStatement:
      "Fifteen years of residences, workplaces and interiors across Bengaluru — each one designed for its climate, its street, and the people who live with it.",
    studioLinkLabel: "The story of the studio",
    workHeading: "Selected work",
    servicesHeading: "What we do",
    services: [
      {
        title: "Architecture",
        body: "New builds and major renovations — residences, apartments, commercial and hospitality — carried from feasibility to handover.",
      },
      {
        title: "Interior design",
        body: "Complete interiors for homes and workplaces: space planning, custom furniture, materials and light, executed to the last drawer detail.",
      },
      {
        title: "Consultation",
        body: "An architect's judgement when you need it most — plot evaluation before you buy, design review, feasibility.",
      },
    ],
  } satisfies HomeContent,

  about: {
    eyebrow: "The studio",
    heading: "Good design isn't added on. It's the point.",
    story: [
      "Design Matters is an architecture and interior design studio in Indiranagar, Bengaluru. Since 2011 we have designed private residences, apartment interiors, workplaces and hospitality spaces across the city — work that ranges in scale but not in attention.",
      "The name is the position. In a city building faster than it can think, we hold that the difference between a building and a place worth inhabiting is design — considered early, argued over properly, and carried through to the last drawer detail.",
      "That conviction has quietly built one of the strongest client records among Bengaluru firms — most of our work still arrives by referral, and the studio has been recognised with Best of Houzz service awards three years running.",
    ],
    philosophyEyebrow: "The philosophy",
    philosophyQuote:
      "Design isn't what we add to a building. It's everything we refuse to leave out — light, air, proportion, and the way a home holds the people in it.",
    principalEyebrow: "Principal architect",
    principalBio: [
      "Kiran holds a Bachelor's in Architecture from B.M.S. College of Engineering, Bengaluru, and a Master's from the School of Planning and Architecture, New Delhi. Across more than two decades in architecture, interior and product design, he has built a practice defined by range — and by the patience to get the small things right.",
      "Before founding Design Matters in 2011, he spent twelve years as senior associate architect at Team-2 Architects and Engineers, running projects of widely varying scale and complexity — an apprenticeship in the unglamorous disciplines that make buildings actually happen: coordination, costing, and site.",
    ],
    teamHeading: "The team",
    team: [
      "Ar. Harshitha",
      "Ar. Keerthana",
      "Ar. Pallavi VK",
      "Ar. Maitri Shah",
      "Ar. Jerin Sabu",
      "Ar. Reshma",
      "Ar. Mrudula",
      "Ar. Shefreen",
    ],
    approachHeading: "How we work",
    approach: [
      {
        title: "Listen before drawing",
        body: "A brief is more than a room count. We start with how you live and work — the routines, the rituals, the things you didn't know to ask for — and let the plan grow from there.",
      },
      {
        title: "Design for this climate",
        body: "Bengaluru rewards buildings that breathe. Orientation, shading, cross-ventilation and honest materials do the heavy lifting long before any machine has to.",
      },
      {
        title: "Detail is the design",
        body: "The junction of two materials, the depth of a reveal, where the light lands at four in the afternoon — the small decisions are the ones you live with daily, so we sweat them.",
      },
      {
        title: "Stay through the build",
        body: "Drawings don't build houses; follow-through does. We stay involved from the first site visit to handover, so what gets built is what was designed.",
      },
    ],
  } satisfies AboutContent,

  services: {
    eyebrow: "What we do",
    heading: "Three ways of working, one standard of care.",
    services: [
      {
        title: "Architecture",
        body: "New builds and major renovations: private residences, apartment buildings, commercial and hospitality projects. From feasibility and massing to municipal approvals and construction drawings — the full arc, one studio accountable for all of it.",
        scope: "Residences · Apartments · Commercial · Hospitality",
      },
      {
        title: "Interior design",
        body: "Complete interiors for homes and workplaces — space planning, custom furniture, lighting, materials and finishes, executed with vendors we've worked with for years. Design intent survives all the way to the final coat.",
        scope: "Homes · Apartments · Offices · Clinics",
      },
      {
        title: "Consultation",
        body: "Focused engagements when you need an architect's judgement more than a full commission: plot evaluation before you buy, design review of ongoing work, or a masterplan-level look at what a property could become.",
        scope: "Site evaluation · Design review · Feasibility",
      },
    ],
    processEyebrow: "Brief to handover",
    processHeading: "The process",
    process: [
      { title: "Brief", body: "We meet, walk the site, and listen. You leave with questions worth asking; we leave with the real brief." },
      { title: "Concept", body: "Plans, massing, mood — the big moves. We iterate together until the direction feels inevitable." },
      { title: "Design development", body: "The concept becomes a buildable proposition: materials, structure, services, budgets aligned." },
      { title: "Documentation", body: "Approval and construction drawings, specifications, and a tender-ready package." },
      { title: "Build", body: "Site visits, contractor coordination, and the thousand mid-course decisions — made quickly, made once." },
      { title: "Handover", body: "Snag lists closed, systems commissioned, and a building that matches its drawings." },
    ],
  } satisfies ServicesContent,

  contact: {
    eyebrow: "Get in touch",
    heading: "Every project starts with a conversation.",
    whatsappLabel: "WhatsApp the studio",
    whatsappMessage: "Hello Design Matters — I'd like to discuss a project.",
  } satisfies ContactContent,

  testimonials: {
    eyebrow: "Client voices",
    heading: "The work, in their words.",
    intro:
      "Most of the studio's work arrives by referral — houses recommend architects better than architects can. These are our clients' Google reviews, reproduced as written.",
    ratingValue: "4.9",
    reviewCount: "87",
    googleUrl: "https://maps.google.com/?cid=7913232271800381208",
    pullQuote: "It is more beautiful in real life than we had imagined.",
    pullQuoteAuthor: "Anitha K Somasundar",
    homeEyebrow: "Client voices",
    homeHeading: "What clients say",
    homeLinkLabel: "All testimonials",
  } satisfies TestimonialsContent,

  projects: {
    eyebrow: "Selected works",
    heading: "The work speaks in plan, section and light.",
    intro:
      "Three practice areas, one way of working: read the site, respect the brief, and build something that ages well.",
    portalEyebrow: "What we practise",
    indexEyebrow: "Every project",
    indexHeading: "The complete index.",
    emptyNote: "New work is being photographed — this section returns shortly.",

    residentialTagline: "Houses, villas and homes",
    residentialEyebrow: "Practice area 01",
    residentialHeading: "Homes built around how a family actually lives.",
    residentialIntro:
      "Private residences, villas and apartments across Bengaluru — planned around light, cross-ventilation and the way a household moves through its day. Every house starts on the site itself, not on a drawing board.",
    residentialHighlights: [
      {
        title: "Site-first planning",
        body: "Orientation, prevailing wind and the neighbour's setback decide the plan long before the elevation does.",
      },
      {
        title: "Materials that age",
        body: "Exposed concrete, kota, terracotta and local stone — surfaces that look better in year ten than in year one.",
      },
      {
        title: "Built to a real budget",
        body: "Costed from the first sketch, so what gets drawn is what gets built.",
      },
    ],

    interiorsTagline: "Interiors and fit-outs",
    interiorsEyebrow: "Practice area 02",
    interiorsHeading: "Interiors that finish the architecture, not decorate it.",
    interiorsIntro:
      "Apartment interiors, villa fit-outs and workspace refits — detailed to the millimetre, joinery drawn in-house, and executed with the makers we have worked with for a decade.",
    interiorsHighlights: [
      {
        title: "Drawn, not styled",
        body: "Every wardrobe, counter and reveal is a shop drawing before it is a mood board.",
      },
      {
        title: "Light as a material",
        body: "Layered lighting design — ambient, task and accent — set out at the plan stage.",
      },
      {
        title: "One accountable team",
        body: "Design and execution stay under one roof, so nothing is lost between the drawing and the site.",
      },
    ],

    institutionalTagline: "Civic, education and institutional",
    institutionalEyebrow: "Practice area 03",
    institutionalHeading: "Buildings that hold a community together.",
    institutionalIntro:
      "Schools, campuses, civic and community buildings — projects where circulation, daylight and durability matter more than any single façade gesture, and where the brief belongs to hundreds of people at once.",
    institutionalHighlights: [
      {
        title: "Circulation first",
        body: "Corridors, courtyards and thresholds planned for peak movement, not average movement.",
      },
      {
        title: "Daylight everywhere",
        body: "Classrooms and halls designed to run on daylight for most of the working day.",
      },
      {
        title: "Low-maintenance by design",
        body: "Detailed for institutions that maintain buildings for decades on a fixed budget.",
      },
    ],
  } satisfies ProjectsContent,
} as const;

export type Sections = {
  identity: Identity;
  home: HomeContent;
  about: AboutContent;
  services: ServicesContent;
  contact: ContactContent;
  testimonials: TestimonialsContent;
  projects: ProjectsContent;
};
export type SectionKey = keyof Sections;

export const SECTION_KEYS = Object.keys(DEFAULTS) as SectionKey[];

/* ------------------------------------------------------------ helpers */

/**
 * Pull one practice area's slice out of the flat `projects` section.
 * Keeps the render side reading `copy.heading` while the stored shape
 * stays one key deep (see the note on `ProjectsContent`).
 */
export function categoryCopy(
  content: ProjectsContent,
  slug: "residential" | "interiors" | "institutional",
): CategoryCopy {
  return {
    tagline: content[`${slug}Tagline`],
    eyebrow: content[`${slug}Eyebrow`],
    heading: content[`${slug}Heading`],
    intro: content[`${slug}Intro`],
    highlights: content[`${slug}Highlights`],
  };
}

export const whatsappHref = (whatsapp: string, text?: string) =>
  `https://wa.me/${whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export const telHref = (phone: string) => `tel:${phone.replace(/\s/g, "")}`;
