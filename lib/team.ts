/**
 * The studio roster (§2.5).
 *
 * One array, sorted by an explicit `order` — not by position in the file,
 * so re-arranging entries can't silently re-rank people. Kiran's team
 * changes every few months; the next update should be an edit here and
 * nothing else.
 *
 * Names and photographs both come from the studio's own "DMA ARCHITECTS"
 * drop: a single shoot against one wall, in one session, already black and
 * white. The filenames in that folder carry each person's full name, which
 * is where the surnames come from — earlier rounds had first names only,
 * and a magazine credit that suggested "Divya Shankar" turns out to have
 * been the wrong Divya. Nothing here is completed from guesswork.
 *
 * The sequence below is the client's own, sent 2026-08-10 and described by
 * him as seniority order. It supersedes the arrangement we inferred from
 * the old site, and it also settles the open question about Reshma S and
 * Mrudula VR: they were missing from the written roster of nine but sent
 * portraits with everyone else, and he has now placed them fourth and
 * fifth himself. Eleven people, confirmed.
 *
 * Rank and sequence are deliberately separate. Three people carry "Senior
 * Architect" and they happen to lead the list, but the order is his, not a
 * sort on `designation` — so a future reshuffle inside one rank survives.
 */

export type Rank = "Principal Architect" | "Senior Architect" | "Architect";

export type TeamMember = {
  name: string;
  designation: Rank;
  /** Display order within the whole roster. */
  order: number;
  /** Path under /public. Absent = initials tile. */
  image?: string;
};

export const TEAM: TeamMember[] = [
  {
    name: "Kiran Hanumaiah",
    designation: "Principal Architect",
    order: 0,
    image: "/uploads/studio/team/kiran-hanumaiah.jpg",
  },
  {
    name: "Harshitha Chandrashekhar",
    designation: "Senior Architect",
    order: 1,
    image: "/uploads/studio/team/harshitha-chandrashekhar.jpg",
  },
  {
    name: "Jerin Sabu",
    designation: "Senior Architect",
    order: 2,
    image: "/uploads/studio/team/jerin-sabu.jpg",
  },
  {
    name: "Pallavi VK",
    designation: "Senior Architect",
    order: 3,
    image: "/uploads/studio/team/pallavi-vk.jpg",
  },
  {
    name: "Mrudula VR",
    designation: "Architect",
    order: 4,
    image: "/uploads/studio/team/mrudula-vr.jpg",
  },
  {
    name: "Reshma S",
    designation: "Architect",
    order: 5,
    image: "/uploads/studio/team/reshma-s.jpg",
  },
  {
    name: "Anusha Kolli",
    designation: "Architect",
    order: 6,
    image: "/uploads/studio/team/anusha-kolli.jpg",
  },
  {
    name: "Diya Shah",
    designation: "Architect",
    order: 7,
    image: "/uploads/studio/team/diya-shah.jpg",
  },
  {
    name: "Divya Malviya",
    designation: "Architect",
    order: 8,
    image: "/uploads/studio/team/divya-malviya.jpg",
  },
  {
    name: "Prathamesh Jadhav",
    designation: "Architect",
    order: 9,
    image: "/uploads/studio/team/prathamesh-jadhav.jpg",
  },
  {
    name: "Nidhi V Senan",
    designation: "Architect",
    order: 10,
    image: "/uploads/studio/team/nidhi-v-senan.jpg",
  },
];

const byOrder = (a: TeamMember, b: TeamMember) => a.order - b.order;

/** The principal. Rendered in a block of his own, not in the roster grid. */
export const principal = (): TeamMember | undefined =>
  [...TEAM].sort(byOrder).find((m) => m.designation === "Principal Architect");

/**
 * Everyone else, in display order — seniors first, then architects.
 *
 * A single even grid rather than one grid per rank: with the whole studio
 * shot the same way, splitting it under sub-headings breaks the rhythm the
 * photographs already have, and rank reads perfectly well from the line
 * under each name.
 */
export const roster = (): TeamMember[] =>
  [...TEAM].sort(byOrder).filter((m) => m.designation !== "Principal Architect");

/** "Anusha Kolli" → "AK", "Divya" → "D". Used for the placeholder tile. */
export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
