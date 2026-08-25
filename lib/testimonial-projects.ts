import { getPublishedProjects, type Testimonial } from "@/lib/content";

/**
 * Pairing reviews with the homes they are about (§2.7).
 *
 * The 24 reviews came across from Google, which carries no project
 * reference — so a quote can only sit beside the right photograph if
 * something tells us which house the reviewer lived in. That mapping is
 * here rather than in the database because it is a piece of studio
 * knowledge, not something the review itself contains, and because adding
 * a column would mean a migration this round is meant to avoid.
 *
 * Only pairings with actual evidence are listed. Everything else renders
 * as a text-only quote, which is a perfectly good outcome — a review
 * beside the wrong house would be much worse than one beside none. The
 * remaining twenty are on the request list for Kiran.
 *
 * Evidence for what is here:
 *  - Shaila Vivek → Vivek Residence. The Architects Diary's piece on the
 *    project names it "Vivek's Residence".
 *  - Chetan Basavaraj and Soumya Basavaraj → Soumya and Chetan Residence.
 *    The studio's own portfolio page names the project
 *    "Soumya and Chetan's Residence".
 *
 * `frame` picks which photograph of that project the review sits beside:
 * 0 is the project hero, 1 and up index the gallery. It exists because a
 * couple can leave two reviews of one house, and round 2 caught the
 * result — "soumya's project photo has been repeated twice". Both rows
 * pointed at the same slug and both therefore rendered the same hero, so
 * the page showed one house twice under two names. They now take
 * different frames of it.
 */
export type TestimonialProject = { slug: string; frame?: number };

export const TESTIMONIAL_PROJECTS: Record<string, TestimonialProject> = {
  "Shaila Vivek": { slug: "vivek-residence" },
  "Chetan Basavaraj": { slug: "soumya-and-chetan-residence" },
  "Soumya Basavaraj": { slug: "soumya-and-chetan-residence", frame: 1 },
};

export type PairedTestimonial = Testimonial & {
  project?: {
    slug: string;
    title: string;
    image: string;
    blur: string | null;
    location: string | null;
  };
};

/**
 * Attaches each review's project — hero photograph included — where one
 * is known. Reviews sort so the illustrated ones lead, since they are the
 * ones the layout can do something with.
 */
export async function pairTestimonials(
  testimonials: Testimonial[],
): Promise<PairedTestimonial[]> {
  const projects = await getPublishedProjects();
  const bySlug = new Map(projects.map((p) => [p.slug, p]));

  return testimonials.map((t) => {
    const ref = TESTIMONIAL_PROJECTS[t.author];
    const project = ref ? bySlug.get(ref.slug) : undefined;
    if (!project?.heroImage) return t;

    // Frame 0 is the hero; 1 and up index the gallery. An out-of-range
    // frame falls back to the hero rather than dropping the photograph —
    // galleries get re-cut between rounds, and a review losing its
    // picture is a worse outcome than two reviews sharing one.
    const gallery = project.gallery ?? [];
    const picked = ref?.frame ? gallery[ref.frame - 1] : undefined;

    return {
      ...t,
      project: {
        slug: project.slug,
        title: project.title,
        image: picked?.url ?? project.heroImage,
        blur: picked?.blurData ?? project.heroBlur,
        location: project.location,
      },
    };
  });
}

/** Reviews that have a photograph to sit beside, illustrated ones first. */
export const illustratedFirst = (items: PairedTestimonial[]) =>
  [...items].sort((a, b) => Number(Boolean(b.project)) - Number(Boolean(a.project)));
