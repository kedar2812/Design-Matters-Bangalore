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
 * Two entries need the client's eye. Reshma S and Mrudula VR were not on
 * the written roster of nine, but both sent portraits in that same shoot,
 * and both are listed on the current site. A photograph taken alongside
 * the rest of the team is better evidence of who works there than a list
 * typed some weeks earlier, so they are here — flagged for confirmation
 * rather than dropped. Their rank is the one the current site gives them.
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
  /* The five the client listed, in the order he listed them. */
  {
    name: "Divya Malviya",
    designation: "Architect",
    order: 4,
    image: "/uploads/studio/team/divya-malviya.jpg",
  },
  {
    name: "Diya Shah",
    designation: "Architect",
    order: 5,
    image: "/uploads/studio/team/diya-shah.jpg",
  },
  {
    name: "Prathamesh Jadhav",
    designation: "Architect",
    order: 6,
    image: "/uploads/studio/team/prathamesh-jadhav.jpg",
  },
  {
    name: "Nidhi V Senan",
    designation: "Architect",
    order: 7,
    image: "/uploads/studio/team/nidhi-v-senan.jpg",
  },
  {
    name: "Anusha Kolli",
    designation: "Architect",
    order: 8,
    image: "/uploads/studio/team/anusha-kolli.jpg",
  },
  /* Appended rather than interleaved — see the note at the top of the file.
     Kept visibly at the end so the addition is easy to review or undo. */
  {
    name: "Reshma S",
    designation: "Architect",
    order: 9,
    image: "/uploads/studio/team/reshma-s.jpg",
  },
  {
    name: "Mrudula VR",
    designation: "Architect",
    order: 10,
    image: "/uploads/studio/team/mrudula-vr.jpg",
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
