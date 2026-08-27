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
  /**
   * Blur placeholder for `image`. Only needed when the slide points at a
   * photograph that is not the project's own hero or one of its gallery
   * frames, since those two are looked up automatically. Produced by
   * `scripts/hero-slide.ts`.
   */
  blur?: string;
  /**
   * `object-position` for the crop, e.g. "50% 38%".
   *
   * The hero is roughly 2.3:1 on a laptop and the photographs are 3:2, so
   * every slide loses a third of its height. Centring is right more often
   * than not, but not always: leave this unset unless the frame actually
   * needs it, and say why in a comment when you set it.
   */
  focus?: string;
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

/**
 * Where enquiry email lands, and whether it is sent at all.
 *
 * This is the one piece of "content" that is not copy: it is a delivery
 * setting, and it lives here rather than in an environment variable
 * because the studio has to be able to change it themselves. An address
 * that can only be changed by a deploy is an address that stays wrong —
 * the colleague who joins, the accountant who should be copied, the
 * holiday cover, none of those are worth a release.
 *
 * `recipients` empty is a normal state, not a broken one: it means "use
 * the studio email from Studio details", which is the address a client
 * would write to anyway. `lib/notify-lead` resolves the chain.
 */
export type NotificationsContent = {
  /** Extra inboxes for new-enquiry alerts. Empty falls back — see above. */
  recipients: string[];
  /** Email the studio when an enquiry arrives. */
  notifyStudio: boolean;
  /** Email the enquirer a confirmation that the studio has their message. */
  acknowledgeEnquirer: boolean;
};

/* ----------------------------------------------------------- defaults */

export const DEFAULTS = {
  identity: {
    name: "Design Matters Architects",
    shortName: "Design Matters",
    tagline: "Architecture + Interior Design, Bangalore",
    founded: 2011,
    principal: "Ar. Kiran Hanumaiah",
    principalTitle: "Principal Architect",
    addressLine1: "3302, 2nd Floor, 12th A Main Rd",
    addressLine2: "HAL 2nd Stage, Indiranagar",
    city: "Bangalore",
    state: "Karnataka",
    pin: "560008",
    phone: "+91 98860 16711",
    phoneAlt: "+91 78921 04742",
    email: "kiran@designmattersblr.com",
    whatsapp: "919886016711",
    instagram: "https://www.instagram.com/designmattersarchitects/",
    linkedin: "https://in.linkedin.com/in/kiran-hanumaiah-825539a1",
    houzz: "",
    mapQuery:
      "Design Matters Architects, 12th A Main Rd, HAL 2nd Stage, Indiranagar, Bangalore",
  } satisfies Identity,

  home: {
    heroEyebrow: "Architecture + Interior Design · Bangalore, since 2011",
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
        // NSP-10, encoded at the hero tier by `scripts/hero-slide.ts`
        // rather than reusing the 2200px gallery frame, which is built for
        // a half-width slot and goes soft across a full-bleed hero.
        image: "/uploads/projects/dr-ashwini-residence/slide-1.jpg",
        word: "listen.",
        projectSlug: "dr-ashwini-residence",
        alt: "The roof terrace at Dr. Ashwini Residence, a steel pergola over lawn and planters with the city beyond",
        blur: "data:image/jpeg;base64,/9j/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAIAAwDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAT/xAAhEAABAwQBBQAAAAAAAAAAAAABAAIDBBESEwUUITGB8P/EABUBAQEAAAAAAAAAAAAAAAAAAAEC/8QAFhEBAQEAAAAAAAAAAAAAAAAAAAEC/9oADAMBAAIRAxEAPwBwdXNNT6Yxsa0d7kD4K11Pi44RRsBNyOod59IijJj/2Q==",
        // Pulled above centre. The frame is 3:2 in a hero nearer 2.3:1, and
        // a centred crop cuts the pergola off at the top while keeping a
        // wide band of empty terrace tile at the bottom. This keeps the
        // pergola and the skyline, which are what the photograph is about,
        // and holds the dark foliage in the bottom-left where the headline
        // needs something to sit against.
        focus: "50% 38%",
      },
    ],
    heroWords: ["belong.", "breathe.", "listen.", "endure."],
    studioEyebrow: "The studio",
    studioStatement:
      "Since 2011 we have built houses, workplaces and interiors around Bangalore. Each one is drawn for its own site: which way the sun crosses it, what the street is like, and how the people who will live there actually spend a day.",
    studioLinkLabel: "The story of the studio",
    workHeading: "Selected work",
    servicesHeading: "What we do",
    services: [
      {
        title: "Architecture",
        body: "New builds and major renovations: residences, apartments, commercial and hospitality, carried from feasibility to handover.",
      },
      {
        title: "Interior design",
        body: "Complete interiors for homes and workplaces: space planning, custom furniture, materials and light, detailed down to the drawer runners.",
      },
      {
        title: "Consultation",
        body: "An architect's judgement when you need it most: plot evaluation before you buy, design review, feasibility.",
      },
    ],
  } satisfies HomeContent,

  /**
   * The studio's own About copy, used verbatim.
   *
   * Round 2 asked for the About page to be replaced with this text, and
   * round 3 asked for it again after we had taken a light editing pass
   * over it: the triads were unstacked, "Bangalore" became "Bangalore",
   * and the client did not want either change. It is their studio and
   * their words, so this is now their draft as sent, punctuation and
   * American spellings included, down to "Recognized".
   *
   * The one intentional difference is the dash in "(2020-2022)", which
   * arrived as an en dash. Long dashes are banned across the site by the
   * same note, so it is a hyphen here.
   *
   * If this needs to change again, change it here rather than editing it
   * in the dashboard, so the file and the live site do not disagree.
   */
  about: {
    eyebrow: "About // the studio",
    heading: "Who We Are",
    story: [
      "At Design Matters, we believe exceptional design is a blend of structural rigor, intuitive functionality, and artistic detail. Founded in 2011 by Principal Architect Kiran Hanumaiah, our Bangalore-based practice specializes in architecture, interior design, and bespoke product design. We transform space into thoughtful, highly tailored environments that reflect the unique vision and lifestyle of every client.",
    ],
    philosophyEyebrow: "The philosophy",
    philosophyQuote:
      "A house is judged by the parts nobody photographs. Where the light lands at four in the afternoon, whether the kitchen works when three people are in it, how the place feels in the second year.",
    principalEyebrow: "Led by Deep Expertise",
    principalBio: [
      "Kiran brings over 23 years of industry leadership to the firm. An alumnus of B.M.S. College of Engineering (B.Arch) and the School of Planning and Architecture, New Delhi (M.Arch), Kiran spent 12 years as a Senior Associate Architect at Team-2 Architects and Engineers.",
      "Managing diverse, high-scale projects across multiple sectors laid the foundation for Design Matters: a firm built on technical precision, collaborative management, and uncompromising design standards.",
    ],
    recognitionHeading: "Recognized for Excellence",
    recognitionIntro:
      "Over the past decade, Design Matters has established itself as one of Bangalore's premier design practices, distinguished by an impressive portfolio and outstanding client trust.",
    recognition: [
      {
        title: "Award-Winning Service",
        body: "Consecutive winner of the Best of Houzz Service award (2020-2022).",
      },
      {
        title: "Featured In Print & Media",
        body: "Recognized across top architectural publications including Buildofy, The Architect's Diary, and national press outlets.",
      },
      {
        title: "Client-Centric Philosophy",
        body: "Driven by transparency, meticulous execution, and lasting craftsmanship.",
      },
    ],
    teamHeading: "The Team",
    approachHeading: "How we work",
    approach: [
      {
        title: "Listen before drawing",
        body: "A brief that is only a room count tells us very little. We would rather hear how the mornings go, who cooks, where everyone ends up on a Sunday. The plan comes out of that.",
      },
      {
        title: "Design for this climate",
        body: "Bangalore is kind to buildings that are oriented properly and shaded properly. Get those right, along with cross-ventilation and materials that suit the weather, and the air conditioning has much less to do.",
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
        body: "New builds and major renovations: private residences, apartment buildings, commercial and hospitality projects. From feasibility and massing to municipal approvals and construction drawings. The full arc, with one studio accountable for all of it.",
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
    whatsappMessage: "Hello Design Matters, I'd like to discuss a project.",
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
    emptyNote: "New work is being photographed. This section returns shortly.",

    residentialTagline: "Houses, villas and homes",
    residentialEyebrow: "Practice area 01",
    residentialHeading: "Homes built around how a family actually lives.",
    residentialIntro:
      "Private residences, villas and apartments across Bangalore, planned around light, cross-ventilation and the way a household moves through its day. Every house starts on the site itself, not on a drawing board.",
    residentialHighlights: [
      {
        title: "Site-first planning",
        body: "Orientation, prevailing wind and the neighbour's setback decide the plan long before the elevation does.",
      },
      {
        title: "Materials that age",
        body: "Exposed concrete, kota, terracotta and local stone. Surfaces that look better in year ten than in year one.",
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
      "Apartment interiors, villa fit-outs and workspace refits, detailed to the millimetre, joinery drawn in-house, and executed with the makers we have worked with for a decade.",
    interiorsHighlights: [
      {
        title: "Drawn, not styled",
        body: "Every wardrobe, counter and reveal is a shop drawing before it is a mood board.",
      },
      {
        title: "Light as a material",
        body: "Layered lighting design: ambient, task and accent, set out at the plan stage.",
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
      "Schools, campuses, civic and community buildings. Projects where circulation, daylight and durability matter more than any single façade gesture, and where the brief belongs to hundreds of people at once.",
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

  notifications: {
    recipients: [],
    notifyStudio: true,
    acknowledgeEnquirer: true,
  } satisfies NotificationsContent,
} as const;

export type Sections = {
  identity: Identity;
  home: HomeContent;
  about: AboutContent;
  services: ServicesContent;
  contact: ContactContent;
  testimonials: TestimonialsContent;
  projects: ProjectsContent;
  notifications: NotificationsContent;
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
