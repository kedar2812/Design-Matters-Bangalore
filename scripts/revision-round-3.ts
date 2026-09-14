/**
 * Client revision round 3: the database half of Kiran's final note.
 *
 * The note ("website comments 14.9.26.docx") arrived as a first draft and
 * a corrected copy pasted one after the other in the same file. Where the
 * two disagree the second one wins, which matters for exactly one number:
 * the draft gave Aadya Mane a 4,000 sq ft plot and 7,000 sq ft built-up,
 * the correction says 6,000 and 6,500.
 *
 * What it does:
 *   - Dr. Ashwini Residence becomes Aadya Mane. The slug changes with the
 *     title, and so does the photograph folder, because a renamed house
 *     usually means the owner would rather their name were not on it, and
 *     image URLs are as public as page URLs. The old address is caught by
 *     a 301 in next.config.ts. Page views recorded against the old path
 *     are moved across so "most viewed" in the dashboard stays whole.
 *   - Facts for Aadya Mane and Praangana Heritage ("Pragrame Heritage" in
 *     the note is a slip; the folder he sent says Praangana).
 *   - Four project stories still carried long dashes or "Bengaluru" in
 *     the database. The round that banned both fixed them in
 *     scripts/import-copy.ts but never re-ran it, so the rows kept the old
 *     text. Two of them (House of Levels, Vivek) now open the home page,
 *     on the slideshow card, so they are corrected here, by exact match.
 *
 * The slideshow order and the Services copy are code, in
 * lib/content-defaults.ts, not rows.
 *
 * Safe to re-run: every step either checks before it acts or writes the
 * same values again, so a second run changes nothing.
 *
 * Run: npx tsx scripts/revision-round-3.ts
 * Then: npm run snapshot
 */
import "dotenv/config";
import { access, rename } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const OLD_SLUG = "dr-ashwini-residence";
const NEW_SLUG = "aadya-mane";
const OLD_DIR = `/uploads/projects/${OLD_SLUG}/`;
const NEW_DIR = `/uploads/projects/${NEW_SLUG}/`;

const exists = (p: string) =>
  access(p).then(
    () => true,
    () => false,
  );

/** Points a stored image path at the renamed folder; anything else is left alone. */
const moved = <T extends string | null>(url: T): T =>
  (url?.startsWith(OLD_DIR) ? NEW_DIR + url.slice(OLD_DIR.length) : url) as T;

async function aadyaMane() {
  const project = await prisma.project.findFirst({
    where: { slug: { in: [OLD_SLUG, NEW_SLUG] } },
    include: { gallery: true, storyBlocks: true },
  });
  if (!project) throw new Error(`Neither ${OLD_SLUG} nor ${NEW_SLUG} exists in this database`);

  // Files first. If the database were updated and the move then failed,
  // every photograph on the page would 404.
  const root = path.join(process.cwd(), "public", "uploads", "projects");
  const from = path.join(root, OLD_SLUG);
  const to = path.join(root, NEW_SLUG);
  if (await exists(from)) {
    if (await exists(to)) throw new Error(`Both ${from} and ${to} exist; resolve by hand`);
    await rename(from, to);
    console.log(`+ moved photographs to ${NEW_DIR}`);
  } else if (await exists(to)) {
    console.log(`· photographs already in ${NEW_DIR}`);
  } else {
    // A database without the photographs beside it (the Vercel preview
    // build, say) still gets its rows corrected.
    console.log(`! no photograph folder found under ${root}; rows updated anyway`);
  }

  await prisma.project.update({
    where: { id: project.id },
    data: {
      slug: NEW_SLUG,
      title: "Aadya Mane",
      // The note spells it "Vajraharalli". The locality, its metro station
      // and every map spell it Vajarahalli, and the place name is what
      // people search for, so the map spelling is used.
      location: "Vajarahalli, Bangalore",
      siteArea: "6,000 sq ft",
      area: "6,500 sq ft",
      statusNote: "Completed",
      heroImage: moved(project.heroImage),
      metaDesc:
        "Aadya Mane, an exposed-brick house in Vajarahalli, Bangalore, by Design Matters Architects, with carved timber columns, a double-height entrance hall and kolam drawn on the walls.",
    },
  });

  for (const g of project.gallery) {
    const url = moved(g.url);
    // The one frame that had no written description fell back to the
    // project's old name.
    const alt = g.alt?.replace(/Dr\. Ashwini Residence/g, "Aadya Mane") ?? null;
    if (url !== g.url || alt !== g.alt) {
      await prisma.galleryImage.update({ where: { id: g.id }, data: { url, alt } });
    }
  }
  for (const s of project.storyBlocks) {
    const image = moved(s.image);
    const text = s.text?.replace(/Dr\. Ashwini Residence/g, "Aadya Mane") ?? null;
    if (image !== s.image || text !== s.text) {
      await prisma.storyBlock.update({ where: { id: s.id }, data: { image, text } });
    }
  }

  const views = await prisma.pageView.updateMany({
    where: { path: `/projects/${OLD_SLUG}` },
    data: { path: `/projects/${NEW_SLUG}` },
  });

  console.log(
    project.slug === OLD_SLUG
      ? `+ ${OLD_SLUG} -> ${NEW_SLUG}, facts set, ${views.count} page views moved`
      : `· ${NEW_SLUG} already renamed; facts re-applied, ${views.count} stray page views moved`,
  );
}

async function praangana() {
  const res = await prisma.project.updateMany({
    where: { slug: "praangana-heritage" },
    data: {
      location: "Malavalli, Karnataka",
      siteArea: "1.5 acres",
      area: "1,500 sq ft",
      statusNote: "Completed",
      metaDesc:
        "Praangana Heritage, a courtyard farmhouse in Malavalli by Design Matters Architects, in brick and terracotta with verandahs on every side, tiled pitched roofs and patterned oxide floors.",
    },
  });
  console.log(res.count ? "+ praangana-heritage facts set" : "! praangana-heritage not found");
}

/** [old text, new text]. Exact matches only, so an edit made in the dashboard is never touched. */
const STORY_FIXES: [string, string][] = [
  [
    "A compact 30×40 Bengaluru home that",
    "A compact 30×40 Bangalore home that",
  ],
  [
    "lend depth to every zone — from an acoustically treated hobby room",
    "lend depth to every zone, from an acoustically treated hobby room",
  ],
  [
    "sheer curtains diffuse natural light — artwork and greenery bringing the rooms to life.",
    "sheer curtains diffuse natural light, while artwork and greenery bring the rooms to life.",
  ],
  [
    "Internal walls are minimised to open up the first floor — living, dining, kitchen and pooja in one continuous plan — while a double-height volume",
    "Internal walls are minimised so that living, dining, kitchen and pooja share one continuous plan on the first floor, while a double-height volume",
  ],
];

async function storyCopy() {
  let changed = 0;
  for (const [from, to] of STORY_FIXES) {
    const blocks = await prisma.storyBlock.findMany({ where: { text: { contains: from } } });
    for (const b of blocks) {
      await prisma.storyBlock.update({
        where: { id: b.id },
        data: { text: b.text!.replace(from, to) },
      });
      changed++;
    }
  }
  console.log(changed ? `+ ${changed} story blocks corrected` : "· story blocks already corrected");
}

/** The slideshow lives in the defaults; a saved override would hide the new order. */
async function warnOnHomeOverride() {
  const home = await prisma.siteSetting.findUnique({ where: { key: "home" } });
  if (!home) return;
  const raw = JSON.stringify(home.value);
  console.log(
    raw.includes(OLD_SLUG)
      ? `! the saved Home page content still names ${OLD_SLUG}; that slide will be dropped until it is edited in the dashboard`
      : "! Home page content has been saved from the dashboard, so its slideshow overrides the new default order",
  );
}

async function main() {
  await aadyaMane();
  await praangana();
  await storyCopy();
  await warnOnHomeOverride();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
