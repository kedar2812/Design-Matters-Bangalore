/**
 * Press and publications (§2.6).
 *
 * Every headline, date and URL here was read off the live article or off
 * the studio's own portfolio pages — nothing is approximated. Where a
 * detail could not be verified it is simply absent, which is why some
 * entries carry no date and some carry no project link:
 *
 *  - The three Deccan Herald cuttings have no `date`. The publication
 *    dates are printed in the page headers of the supplied scan and are
 *    not legible at that resolution. A guessed date on a press page is
 *    worse than no date.
 *  - "The Nest" and "The Ellappan Residence" have no `projectSlug`. Both
 *    articles name a project that has no page on this site, so there is
 *    nothing to link to.
 *
 * `weight: "lead"` marks the pieces Kiran singled out — Buildofy, which
 * he rates highly — and the section gives them the larger treatment.
 */

export type PressItem = {
  publication: string;
  headline: string;
  /** Absolute URL for online pieces; absent for print. */
  url?: string;
  /** ISO date, only when the full date was verified on the article. */
  date?: string;
  /** Use when only the year is known — never widen a year into a date. */
  year?: number;
  /** The studio's name for the project, as printed in the article. */
  projectName?: string;
  /** Slug of the matching page on this site, when one exists. */
  projectSlug?: string;
  byline?: string;
  /** Scan, for print items. */
  scan?: string;
  weight?: "lead";
};

export const FEATURED_ONLINE: PressItem[] = [
  {
    publication: "Buildofy",
    headline: "Shambhavi Residence by Design Matters Architect",
    url: "https://www.buildofy.com/projects/shambhavi-bengaluru-karnataka",
    // The portfolio page records 2025; the article itself carries no
    // publication date, so the year is all we can honestly state.
    year: 2025,
    projectName: "Shambhavi",
    projectSlug: "shambhavi-residence",
    weight: "lead",
  },
  {
    publication: "Buildofy",
    headline: "Split Level Residence",
    url: "https://www.buildofy.com/projects/split-level-residence-bengaluru-karnataka",
    projectName: "Split Level Residence",
    projectSlug: "house-of-levels",
    weight: "lead",
  },
  {
    publication: "The Architects Diary",
    headline: "This Compact House Design is Rooted in Tradition",
    url: "https://thearchitectsdiary.com/this-compact-house-design-is-rooted-in-tradition-design-matters/",
    date: "2025-07-12",
    projectName: "The Ellappan Residence",
  },
  {
    publication: "The Architects Diary",
    headline: "This 30’x40’ Plot Nestled in the Heart of South Bengaluru",
    url: "https://thearchitectsdiary.com/this-30-x-40-plot-nestled-in-the-heart-of-south-bengaluru-design-matters/",
    date: "2024-04-30",
    projectName: "Soumya and Chetan’s Residence",
    projectSlug: "soumya-and-chetan-residence",
  },
  {
    publication: "The Architects Diary",
    headline: "A House Where Design Can Bring in Lots of Sunshine",
    url: "https://thearchitectsdiary.com/a-house-where-design-can-bring-in-lots-of-sunshine-design-matters/",
    date: "2023-12-29",
    projectName: "Vivek’s Residence",
    projectSlug: "vivek-residence",
  },
  {
    publication: "The Architects Diary",
    headline:
      "A Bright, Airy 4BHK Contemporary Home Enriched with Plenty of Ventilation",
    url: "https://thearchitectsdiary.com/a-bright-airy-4bhk-contemporary-home-enriched-with-plenty-of-ventilation-design-matters/",
    date: "2023-07-14",
    projectName: "The Nest",
  },
  {
    publication: "The Architects Diary",
    headline: "Minimalist House Design With Traditional Indian Elements",
    url: "https://thearchitectsdiary.com/minimalist-house-design-with-traditional-indian-elements-design-matters/",
    date: "2023-02-21",
    projectName: "The Minimal Indian House",
    projectSlug: "the-minimal-indian-house",
  },
];

export const FEATURED_PRINT: PressItem[] = [
  {
    publication: "Deccan Herald",
    headline: "Let There Be Natural Light",
    byline: "Sowmya Putran",
    scan: "/uploads/studio/press/dh-natural-light.jpg",
  },
  {
    publication: "Deccan Herald",
    headline: "Creating a culinary haven",
    byline: "Sowmya Putran",
    scan: "/uploads/studio/press/dh-culinary-haven.jpg",
  },
  {
    publication: "Deccan Herald",
    headline: "Gazebos, pergolas now garden musts",
    byline: "Sowmya Putran",
    scan: "/uploads/studio/press/dh-gazebos-pergolas.jpg",
  },
];

/**
 * "2024-04-30" → "April 2024"; a bare year stays a bare year. Returns
 * undefined when neither is known, so the caller renders nothing rather
 * than a placeholder.
 */
export function pressDate(item: Pick<PressItem, "date" | "year">) {
  if (item.date) {
    return new Date(item.date).toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  }
  return item.year ? String(item.year) : undefined;
}

/** The publications the studio has appeared in, most-featured first. */
export function publications() {
  const counts = new Map<string, number>();
  for (const item of [...FEATURED_ONLINE, ...FEATURED_PRINT]) {
    counts.set(item.publication, (counts.get(item.publication) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);
}
