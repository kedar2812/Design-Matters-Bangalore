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

/**
 * One frame of the home hero.
 *
 * `word` is the second half of the headline while this photograph is on
 * screen, and that pairing is the whole point. Round 2 came back with
 * "taglines should correspond to images — 'buildings that endure' and it
 * shows a kitchen photo". That happened because the word and the picture
 * each ran on their own timer and drifted. They are one object now, so a
 * word can only ever appear over the photograph it was chosen for.
 *
 * `projectSlug` is what the slide's card links to. A slide naming a
 * project that isn't published is dropped rather than rendered dead.
 */
export type HeroSlide = {
  image: string;
  word: string;
  projectSlug: string;
  alt: string;
};

export type HomeContent = {
  heroEyebrow: string;
  heroLine: string;
  /**
   * The curated hero slideshow (§1, §2). Leave empty to fall back to the
   * first few published projects, which is what the home page did before
   * the studio sent a picked set.
   */
  heroSlides: HeroSlide[];
  /** Fallback word cycle, used only when `heroSlides` is empty. */
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
  /** "Recognized for Excellence" from the studio's rewrite (§7). */
  recognitionHeading: string;
  recognitionIntro: string;
  recognition: { title: string; body: string }[];
  teamHeading: string;
  /** The roster itself lives in `lib/team.ts` — see the note in content-schema. */
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
    /**
     * Chosen from the "Hero slides" folder the studio sent, then paired
     * word to picture by hand.
     *
     * Two rules decided the set. Every frame is landscape, because the
     * hero is full-bleed and a portrait source loses its top and bottom
     * to the crop — half the folder is portrait and none of it is here.
     * And "endure." leads, over the farmhouse at dusk: it is the best
     * photograph in the drop, it is unmistakably a building, and putting
     * it first answers both "first page is not impressive" and the
     * kitchen-under-"endure" complaint in the same frame.
     */
    heroSlides: [
      {
        image: "/uploads/projects/praangana-heritage/hero.jpg",
        word: "endure.",
        projectSlug: "praangana-heritage",
        alt: "The Praangana Heritage farmhouse at dusk, tiled roofs and a lit verandah above the lawn",
      },
      {
        image: "/uploads/projects/mohan-residence/hero.jpg",
        word: "breathe.",
        projectSlug: "mohan-residence",
        alt: "The roof terrace at Mohan Residence under its steel pergola, the city beyond",
      },
      {
        image: "/uploads/projects/shambhavi-residence/02.jpg",
        word: "belong.",
        projectSlug: "shambhavi-residence",
        alt: "The living room at Shambhavi Residence under its arched window",
      },
      {
        image: "/uploads/projects/dr-ashwini-residence/02.jpg",
        word: "listen.",
        projectSlug: "dr-ashwini-residence",
        alt: "A kolam drawn in white across the plaster wall above the timber stair at Dr. Ashwini Residence",
      },
    ],
    heroWords: ["belong.", "breathe.", "listen.", "endure."],
    studioEyebrow: "The studio",
    studioStatement:
      "Since 2011 we have built houses, workplaces and interiors around Bengaluru. Each one is drawn for its own site — which way the sun crosses it, what the street is like, and how the people who will live there actually spend a day.",
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
        body: "Complete interiors for homes and workplaces: space planning, custom furniture, materials and light, detailed down to the drawer runners.",
      },
      {
        title: "Consultation",
        body: "An architect's judgement when you need it most — plot evaluation before you buy, design review, feasibility.",
      },
    ],
  } satisfies HomeContent,

  /**
   * Rewritten by the studio and sent with the round-2 note (§7), which
   * asked for the old About page to be replaced outright.
   *
   * The facts, the three-part structure and the section titles are all
   * theirs. The prose is theirs too, with one pass over it — because §4
   * of the same note asks for copy that doesn't read as though ChatGPT
   * wrote it, and the draft they sent leans on exactly the tell that
   * gives that away: stacked abstract triads ("structural rigor,
   * intuitive functionality, and artistic detail"; "transform space into
   * thoughtful, highly tailored environments"). Those are unstacked
   * here into plainer sentences. Nothing factual was changed, nothing
   * was added, and no claim was softened.
   *
   * "Bengaluru" rather than the draft's "Bangalore": the studio's own
   * spelling, and the convention SEO-CHECKLIST.md set for body copy —
   * "Bangalore" earns its search traffic through titles and meta
   * descriptions instead.
   */
  about: {
    eyebrow: "The studio",
    heading: "Who we are",
    story: [
      "Design Matters is an architecture and interior design studio in Indiranagar, Bengaluru, founded in 2011 by principal architect Kiran Hanumaiah. We work across architecture, interiors and bespoke product design.",
      "Good design, as we practise it, has to hold up three ways at once: the structure has to be sound, the plan has to make sense to live in, and the detail has to be worth looking at. A building that manages only two of those is a building somebody has to put up with.",
      "What comes out of that is particular to whoever it is for. We spend the time to learn how a client actually lives before we draw, which is why the houses on this site look so little like one another.",
    ],
    philosophyEyebrow: "The philosophy",
    philosophyQuote:
      "A house is judged by the parts nobody photographs. Where the light lands at four in the afternoon, whether the kitchen works when three people are in it, how the place feels in the second year.",
    principalEyebrow: "Principal architect",
    principalBio: [
      "Kiran has worked in architecture, interior and product design for more than 23 years. He holds a B.Arch from B.M.S. College of Engineering, Bengaluru, and an M.Arch from the School of Planning and Architecture, New Delhi.",
      "Before starting Design Matters in 2011 he spent twelve years as senior associate architect at Team-2 Architects and Engineers, running projects across several sectors and at scales that varied enormously. That was the apprenticeship: coordination, costing and site — the unglamorous half of the job that decides whether a drawing ever becomes a building.",
    ],
    recognitionHeading: "Recognised for excellence",
    recognitionIntro:
      "Over the past decade Design Matters has become one of Bengaluru's established design practices, on the strength of the portfolio and of clients who keep sending us the next one.",
    recognition: [
      {
        title: "Award-winning service",
        body: "Winner of the Best of Houzz Service award three years consecutively, 2020 to 2022.",
      },
      {
        title: "Featured in print and media",
        body: "Covered by Buildofy, The Architect's Diary and in the national press.",
      },
      {
        title: "Client-centric practice",
        body: "Transparency about cost and programme, meticulous execution, and craftsmanship meant to last.",
      },
    ],
    teamHeading: "The team",
    approachHeading: "How we work",
    approach: [
      {
        title: "Listen before drawing",
        body: "A brief that is only a room count tells us very little. We would rather hear how the mornings go, who cooks, where everyone ends up on a Sunday. The plan comes out of that.",
      },
      {
        title: "Design for this climate",
        body: "Bengaluru is kind to buildings that are oriented properly and shaded properly. Get those right, along with cross-ventilation and materials that suit the weather, and the air conditioning has much less to do.",
      },
      {
        title: "Take the details seriously",
        body: "Where two materials meet, how deep a reveal is, which way a door swings when your hands are full. These are the things you touch every day, so they are worth the argument.",
      },
      {
        title: "Stay through the build",
        body: "A drawing is not a house. We are on site from the first visit through to handover, because that is the only way what gets built resembles what was agreed.",
      },
    ],
  } satisfies AboutContent,

  services: {
    eyebrow: "What we do",
    heading: "Three ways to work with the studio.",
    services: [
      {
        title: "Architecture",
        body: "New builds and major renovations: private residences, apartment buildings, commercial and hospitality projects. From feasibility and massing to municipal approvals and construction drawings — the full arc, one studio accountable for all of it.",
        scope: "Residences · Apartments · Commercial · Hospitality",
      },
      {
        title: "Interior design",
        body: "Complete interiors for homes and workplaces: space planning, custom furniture, lighting, materials and finishes. We use fabricators and vendors we have worked with for years, which is mostly why what arrives on site matches what was drawn.",
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
      { title: "Concept", body: "Plans, massing and mood. We go round this a few times together until it stops feeling like a compromise." },
      { title: "Design development", body: "The concept becomes a buildable proposition: materials, structure, services, budgets aligned." },
      { title: "Documentation", body: "Approval and construction drawings, specifications, and a tender-ready package." },
      { title: "Build", body: "Site visits, contractor coordination, and the hundreds of small decisions a live site throws up. We answer them fast, because a stalled site costs you money." },
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
      "Most of our work comes by referral, from clients who had people over and got asked who did it. These are their Google reviews, reproduced as written.",
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
    heading: "Houses, interiors and public buildings.",
    intro:
      "Three practice areas. In all of them the work starts on the site rather than on a drawing board, and the aim is a building that still looks considered in fifteen years.",
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
