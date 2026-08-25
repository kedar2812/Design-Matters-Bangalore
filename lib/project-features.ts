/**
 * Sub-projects: a distinct, named piece of work that sits *inside* a
 * larger project and deserves its own billing on that project's page
 * without becoming a separate entry in the portfolio index.
 *
 * Club Nadora is the first of these — the clubhouse at the centre of the
 * Woodsvale villa development. It used to be a standalone project, which
 * misrepresented both: Woodsvale wasn't listed at all, and Club Nadora
 * read as a civic building rather than the amenity block it is.
 *
 * Kept here rather than in the database because it is a structural fact
 * about a handful of projects, not something the studio edits weekly. If
 * that changes, this is the shape a `SubProject` table would take.
 */

export type ProjectFeature = {
  /** Small label above the title, e.g. "Within the development". */
  eyebrow: string;
  title: string;
  /** Metadata pairs shown as a compact title block. Empty values drop. */
  facts: [string, string | null][];
  body: string[];
  images: { url: string; alt: string }[];
};

export const PROJECT_FEATURES: Record<string, ProjectFeature> = {
  woodsvale: {
    eyebrow: "Within the development",
    title: "Club Nadora",
    facts: [
      ["Typology", "Clubhouse"],
      ["Built-up area", "20,000 sq ft"],
      ["Status", "Completed"],
    ],
    // Deliberately factual. There is no studio-written description of
    // Club Nadora on file, and inventing one for a building that exists
    // is not a risk worth taking — this states only what the record and
    // the photographs support. Replace with Kiran's copy when it arrives.
    body: [
      "Club Nadora is the clubhouse at the centre of Woodsvale, a 20,000 sq ft amenity block in exposed brick, set on the development's central lawn with its social rooms opening onto the grass.",
    ],
    images: [
      {
        url: "/uploads/projects/club-nadora-woodsvale/01.jpg",
        alt: "Club Nadora, the clubhouse in exposed brick, its cantilevered porch opening onto the lawn and paved terrace",
      },
      {
        url: "/uploads/projects/club-nadora-woodsvale/02.jpg",
        alt: "Club Nadora at dusk, the lit clubhouse rising behind the planted Woodsvale signage wall",
      },
    ],
  },
};

export const featureFor = (slug: string): ProjectFeature | undefined =>
  PROJECT_FEATURES[slug];
