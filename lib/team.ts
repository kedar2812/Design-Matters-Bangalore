/**
 * The studio roster (§2.5).
 *
 * One array, sorted by an explicit `order` — not by position in the file,
 * so re-arranging entries can't silently re-rank people. Kiran's team
 * changes every few months; the next update should be an edit here and
 * nothing else.
 *
 * `image` is optional on purpose. Five of the nine have no photograph on
 * file and the component draws an initials tile for them, so a missing
 * headshot degrades to something deliberate rather than a broken frame.
 * Drop a file into `public/uploads/studio/team/` and add the path here.
 *
 * Names are reproduced exactly as the studio supplied them. Four are
 * first-name-only because that is all we were given — do not "complete"
 * them from guesswork.
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
    name: "Harshitha",
    designation: "Senior Architect",
    order: 1,
    image: "/uploads/studio/team/harshitha.jpg",
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
  { name: "Divya", designation: "Architect", order: 4 },
  { name: "Diya", designation: "Architect", order: 5 },
  { name: "Prathamesh", designation: "Architect", order: 6 },
  { name: "Nidhi", designation: "Architect", order: 7 },
  { name: "Anusha Kolli", designation: "Architect", order: 8 },
];

/** The roster in display order, grouped by rank, empty ranks dropped. */
export function teamByRank(): { rank: Rank; members: TeamMember[] }[] {
  const sorted = [...TEAM].sort((a, b) => a.order - b.order);
  const ranks: Rank[] = ["Principal Architect", "Senior Architect", "Architect"];
  return ranks
    .map((rank) => ({ rank, members: sorted.filter((m) => m.designation === rank) }))
    .filter((g) => g.members.length > 0);
}

/** "Anusha Kolli" → "AK", "Divya" → "D". Used for the placeholder tile. */
export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
