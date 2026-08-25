/**
 * Client revision round 2 — photography, and the projects it unlocks.
 *
 * Kiran sent one folder ("Main pictures", 2026-08-25) holding 109 frames
 * across eight project folders plus a curated "Hero slides" pick, with a
 * covering note listing twelve changes. This script is the half of that
 * note which is photographs and database rows; the copy and layout
 * changes live in the components and in `lib/content-defaults.ts`.
 *
 * What it does, against the numbered note:
 *   §2  every project below is re-shot from the new high-res originals.
 *       The old web exports scraped off the Wix site are replaced
 *       outright, which is what "not the ones used in the website" asks.
 *   §3  Praangana Heritage (the Vivek farmhouse) is created and sorted to
 *       the front as the latest project.
 *   §6  House of Levels gets the better set he attached.
 *   §12 Dr. Ashwini Residence is created. Anita Residence is created too —
 *       it arrived in the same drop without being named in the note.
 *       Neeraj Residence already existed as an empty DRAFT row; it now has
 *       photographs, so it is published.
 *
 * Every hero and gallery sequence is an explicit ordered list, not a
 * heuristic. Round 1 picked heroes by "first landscape frame over 1400px"
 * and produced a kitchen standing in for a house — which is exactly what
 * §5 of this round complains about. These were chosen by eye, over all
 * 109 frames.
 *
 * The hero rule, written down so the next round can argue with it: the
 * hero is the frame that tells you what the building IS — an elevation or
 * a whole-room architectural view, never a kitchen or a bathroom — and it
 * breaks ties by being landscape, because the hero slot is 85dvh of
 * full-bleed width and a portrait source loses its top and bottom to the
 * crop.
 *
 * Re-runnable: projects upsert by slug and galleries are rebuilt from
 * scratch, so a second run is a no-op rather than a duplicate.
 *
 * Run: npx tsx scripts/revision-round-2.ts "<path to Main pictures>"
 */
import "dotenv/config";
import { mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SRC_ROOT = process.argv[2];
if (!SRC_ROOT) {
  throw new Error('Usage: npx tsx scripts/revision-round-2.ts "<path to Main pictures>"');
}

const OUT_ROOT = path.join(process.cwd(), "public", "uploads", "projects");

/** Same tiers the round-1 importer used, so the set stays consistent. */
const HERO_EDGE = 2560;
const HERO_Q = 80;
const GALLERY_EDGE = 2200;
const GALLERY_Q = 78;

type Shoot = {
  /** Folder name inside "Main pictures". */
  dir: string;
  slug: string;
  /** Set for rows this script creates; omitted for rows that exist. */
  create?: {
    title: string;
    category: string;
    year?: number;
    location?: string;
    typology?: string;
    metaDesc?: string;
  };
  /** Sort to this position; the whole list is renumbered afterwards. */
  order?: number;
  /** Publish the row (Neeraj is a DRAFT until it has pictures). */
  publish?: boolean;
  hero: string;
  /** Ordered. Anything in the folder not named here goes unused. */
  gallery: string[];
  /** Per-frame alt text, keyed by filename. */
  alt: Record<string, string>;
};

const SHOOTS: Shoot[] = [
  {
    dir: "Praangana Heritage-Vivek Farmhouse",
    slug: "praangana-heritage",
    order: 0,
    publish: true,
    create: {
      title: "Praangana Heritage",
      category: "Residential",
      year: 2026,
      typology: "Farmhouse",
      metaDesc:
        "A courtyard farmhouse in brick and terracotta by Design Matters Architects, verandahs on every side, tiled pitched roofs and patterned oxide floors.",
    },
    hero: "DSC_5257.jpg",
    gallery: [
      "DSC_4804.jpg",
      "DJI_20260804080248_0049_D.jpg",
      "DSC_5019.jpg",
      "DSC_4977.jpg",
      "DSC_5194.jpg",
      "DSC_4834-HDR.jpg",
      "DSC_4950-HDR.jpg",
      "DSC_5001-HDR.jpg",
      "DSC_4963-HDR.jpg",
      "DSC_5172.jpg",
      "DSC_5267.jpg",
      "DSC_5258.jpg",
    ],
    alt: {
      "DSC_5257.jpg":
        "The farmhouse at dusk, tiled roofs and a lit verandah above the lawn, coconut palms behind",
      "DSC_4804.jpg":
        "The entrance elevation across the lawn, a gabled porch centred between two tiled wings",
      "DJI_20260804080248_0049_D.jpg":
        "Overhead view of the plan, terracotta roofs wrapped around a planted central courtyard",
      "DSC_5019.jpg":
        "The verandah looking into the courtyard, timber columns carrying a sloped tile roof",
      "DSC_4977.jpg":
        "A figure crossing the verandah between carved timber doors, cement tiles underfoot",
      "DSC_5194.jpg": "A hanging cane chair in the courtyard, banana leaves in the foreground",
      "DSC_4834-HDR.jpg":
        "A bedroom under the exposed rafters of the pitched roof, a round window above the bed",
      "DSC_4950-HDR.jpg":
        "The living room opening through full-height timber doors onto the garden",
      "DSC_5001-HDR.jpg":
        "The sitting room in brick and timber, red oxide floor with an inlaid pattern",
      "DSC_4963-HDR.jpg": "A swing seat on the verandah beside the open courtyard doors",
      "DSC_5172.jpg": "A bedroom with green patterned tiles, light coming off the courtyard",
      "DSC_5267.jpg": "The house seen from the approach road at dusk, its windows lit",
      "DSC_5258.jpg": "The lit verandah and planting along the front of the house after sunset",
    },
  },
  {
    dir: "Dr.Ashwini residence",
    slug: "dr-ashwini-residence",
    order: 3,
    publish: true,
    create: {
      title: "Dr. Ashwini Residence",
      category: "Residential",
      location: "Bengaluru",
      typology: "Private residence",
      metaDesc:
        "An exposed-brick house in Bengaluru by Design Matters Architects, carved timber columns, a double-height entrance hall and kolam drawn on the walls.",
    },
    hero: "NSP-12.jpg",
    gallery: [
      "NSP-5.jpg",
      "NSP-30.jpg",
      "NSP-44.jpg",
      "NSP-24.jpg",
      "NSP-50.jpg",
      "NSP-15.jpg",
      "NSP-2.jpg",
      "NSP-58.jpg",
      "NSP-47.jpg",
      "NSP-54.jpg",
      "NSP-10.jpg",
      "NSP-23.jpg",
    ],
    alt: {
      "NSP-12.jpg":
        "The double-height entrance hall in brick and white plaster, a timber stair rising under the gable",
      "NSP-5.jpg": "The brick gable and screened terrace seen from outside",
      "NSP-30.jpg": "A kolam drawn in white across the plaster wall above the timber stair rail",
      "NSP-44.jpg": "The staircase past a row of blue-painted arched niches",
      "NSP-24.jpg": "The stair from below, a garlanded timber column at the turn",
      "NSP-50.jpg": "A corridor of carved timber columns and brackets against white walls",
      "NSP-15.jpg": "The carved timber entrance door standing open",
      "NSP-2.jpg": "A window set into the brick wall, a palm in the light beneath it",
      "NSP-58.jpg": "The upper landing under the exposed gable, brick on one side",
      "NSP-47.jpg": "Carved timber wall brackets in a row, garlanded",
      "NSP-54.jpg": "Flowering creeper over the steel pergola on the roof terrace",
      "NSP-10.jpg": "The roof terrace and its lawn, the city beyond the planting",
    },
  },
  {
    dir: "Anita residence-JP nagar",
    slug: "anita-residence",
    order: 6,
    publish: true,
    create: {
      title: "Anita Residence",
      category: "Residential",
      location: "JP Nagar, Bengaluru",
      typology: "Private residence",
      metaDesc:
        "A house in JP Nagar, Bengaluru by Design Matters Architects, exposed block walls, terracotta jaali screens and timber louvres tuned to the light.",
    },
    hero: "NIGHT VIEW.jpg",
    gallery: [
      "DSCF6940-HDR.jpg",
      "DSCF7027.jpg",
      "DSCF7058-HDR.jpg",
      "DSCF7064-HDR.jpg",
      "DSCF7381-HDR.jpg",
      "DSCF7402-HDR.jpg",
      "DSCF7399-HDR_1.jpg",
      "DSCF7274-HDR.jpg",
    ],
    alt: {
      "NIGHT VIEW.jpg":
        "The house at night from the street, balconies and jaali screens lit from within",
      "DSCF6940-HDR.jpg":
        "The street elevation by day, stacked balconies, terracotta jaali and timber shutters",
      "DSCF7027.jpg":
        "A figure at the end of a corridor, jaali light falling in patterns across the floor",
      "DSCF7058-HDR.jpg": "A window seat with timber shutters folded open against the block wall",
      "DSCF7064-HDR.jpg": "A terracotta jaali screen filling the wall beside a shuttered window",
      "DSCF7381-HDR.jpg": "The pooja room, its backlit screen set into the wall",
      "DSCF7402-HDR.jpg": "Pendant lights over the stairwell against the perforated ceiling",
      "DSCF7399-HDR_1.jpg": "A window seat under full-height curtains, block wall beside it",
      "DSCF7274-HDR.jpg": "The kitchen, timber and stone around a peninsula counter",
    },
  },
  {
    dir: "Neeraj Residence",
    slug: "neeraj-residence",
    publish: true,
    hero: "elevation night view 3.jpg",
    gallery: [
      "C1.living room.jpg",
      "F4.family.jpg",
      "C6.living seating double height wall.jpg",
      "I1master bedroom 2.jpg",
      "C8.outdoor sitout.jpg",
      "C9.First floor landscaped deck.jpg",
      "K2.Terrace seater.jpg",
      "K6.Terrace bar area.jpg",
      "F3.Steps detail.jpg",
      "L3.gate and compound wall close up.jpg",
    ],
    alt: {
      "elevation night view 3.jpg":
        "The house at night behind its tree, balconies and glazing lit against the dark",
      "C1.living room.jpg":
        "The double-height living room, full-height glazing onto the garden, yellow armchairs",
      "F4.family.jpg": "The family room along its window wall, the garden beyond",
      "C6.living seating double height wall.jpg":
        "A yellow armchair against the double-height wall and its stencilled lotus motifs",
      "I1master bedroom 2.jpg": "The master bedroom opening to a balcony through sliding glass",
      "C8.outdoor sitout.jpg": "The timber deck outside the living room, a child in the doorway",
      "C9.First floor landscaped deck.jpg":
        "The first-floor deck and lawn enclosed by the glazed wings of the house",
      "K2.Terrace seater.jpg":
        "Terrace seating under a steel-framed skylight, planting along the parapet",
      "K6.Terrace bar area.jpg": "The terrace bar under the skylight, patterned floor tiles",
      "F3.Steps detail.jpg": "The stair, timber treads lit from beneath a glass balustrade",
      "L3.gate and compound wall close up.jpg":
        "The entrance gate and compound wall lit at night, the house behind",
    },
  },
  {
    dir: "House of Levels-Ellappan Residence",
    slug: "house-of-levels",
    hero: "3.jpg",
    gallery: [
      "1.jpg",
      "_DSC9987 2.jpg",
      "_DSC0022 2.jpg",
      "_DSC0058-HDR.jpg",
      "_DSC0121 2-HDR.jpg",
      "_DSC0123.jpg",
      "_DSC0230-HDR.jpg",
      "_DSC0145-HDR.jpg",
      "_DSC0027.jpg",
    ],
    alt: {
      "3.jpg": "The narrow street elevation at dusk, its stacked levels lit and planted",
      "1.jpg": "The entrance gate and ground floor seen from the street",
      "_DSC9987 2.jpg":
        "The stair seen through a timber and steel screen, pendant lights hanging beside it",
      "_DSC0022 2.jpg": "A figure climbing the stair past a planted pot and patterned floor",
      "_DSC0058-HDR.jpg":
        "The stair volume from below, flights crossing the full height of the house",
      "_DSC0121 2-HDR.jpg": "The living room with a boy reading in the window, timber ceiling above",
      "_DSC0123.jpg": "The kitchen in pale blue and white, patterned tiles behind the counter",
      "_DSC0230-HDR.jpg":
        "The terrace behind its perforated screen wall, a woman reading on the bench",
      "_DSC0145-HDR.jpg": "A swing seat beside the painted lotus mural, brass bells above",
      "_DSC0027.jpg": "A bedroom with a study nook built into the window wall",
    },
  },
  {
    dir: "Mohan Hennur Road residence",
    slug: "mohan-residence",
    hero: "ASH04527.jpg",
    gallery: [
      "ASH04962.jpg",
      "ASH04475.jpg",
      "ASH04612.jpg",
      "ASH04608.jpg",
      "ASH04633.jpg",
      "DSC05578.jpg",
      "DSC05583.jpg",
    ],
    alt: {
      "ASH04527.jpg":
        "The roof terrace under its steel pergola, the city spread out beyond the glass balustrade",
      "ASH04962.jpg":
        "The street elevation at dusk, stone, timber louvres and planting, lit from within",
      "ASH04475.jpg": "The house from across the road, children running past in the shade",
      "ASH04612.jpg": "A figure at the terrace edge among the planters, the city beyond",
      "ASH04608.jpg": "Timber benches and planting along the terrace under the pergola",
      "ASH04633.jpg": "A lily pond set into the terrace floor beside the seating",
      "DSC05578.jpg": "The cantilevered upper floors seen through the branches of a tree",
      "DSC05583.jpg": "Looking up the timber-louvred facade against the sky",
    },
  },
  {
    dir: "Shambhavi",
    slug: "shambhavi-residence",
    hero: "IMG_3373.JPG",
    gallery: [
      "IMG_3343.JPG",
      "IMG_3344.JPG",
      "IMG_3347.JPG",
      "IMG_3360.JPG",
      "IMG_3362.JPG",
      "IMG_3363.JPG",
      "IMG_3364.JPG",
      "IMG_3352.JPG",
      "IMG_3354.JPG",
      "IMG_3358.JPG",
      "IMG_3361.JPG",
      "IMG_3365.JPG",
      "IMG_3368.JPG",
    ],
    alt: {
      "IMG_3373.JPG": "The street elevation, brick and white render around a large circular window",
      "IMG_3343.JPG": "A woman passing the house on the pavement, the round window above her",
      "IMG_3344.JPG": "The living room under its arched window, curtains drawn back to the garden",
      "IMG_3347.JPG": "Turned timber columns screening the dining room from the hall",
      "IMG_3360.JPG": "The living room seen between the turned columns, stone wall behind",
      "IMG_3362.JPG": "A figure reaching to the arched window between the timber columns",
      "IMG_3363.JPG": "The dining table beyond the columns, cane chairs around it",
      "IMG_3364.JPG": "The living room along its length, tiled ceiling and slot windows",
      "IMG_3352.JPG": "A seat in the arched alcove under the terracotta-tiled ceiling",
      "IMG_3354.JPG": "The niche wall and its shelves under the sloped tiled roof",
      "IMG_3358.JPG": "The television wall in cane and timber, slot windows beside it",
      "IMG_3361.JPG": "Two figures at the balcony doors, terrazzo floor in the foreground",
      "IMG_3365.JPG": "The dining area with its timber sideboard and framed painting",
      "IMG_3368.JPG": "A rocking chair by the slot windows, patterned tiles underfoot",
    },
  },
  {
    dir: "Vivek Residence",
    slug: "vivek-residence",
    hero: "_DSF8504.jpg",
    gallery: ["_DSF8551.jpg", "1.jpg", "3.jpg", "2.jpg"],
    alt: {
      "_DSF8504.jpg":
        "A carved jaali screen dividing the bedroom, timber shutters folded back beside it",
      "_DSF8551.jpg": "Woven pendant lights over the landing, a figure reflected in the mirror",
      "1.jpg": "The jaali screen between the living room and the stair, shutters on either side",
      "3.jpg": "The double-height space from above, woven pendants against the tiled ceiling",
      "2.jpg": "A detail of the timber screen and the light coming through it",
    },
  },
];

/* ------------------------------------------------------------ encoding */

async function writeJpeg(src: string, dest: string, maxLongEdge: number, quality: number) {
  const meta = await sharp(src).metadata();
  const landscape = (meta.width ?? 0) >= (meta.height ?? 0);
  await sharp(src)
    .rotate() // respect EXIF orientation
    .resize(
      landscape
        ? { width: maxLongEdge, withoutEnlargement: true }
        : { height: maxLongEdge, withoutEnlargement: true },
    )
    .flatten({ background: "#f3efe7" })
    .jpeg({ quality, mozjpeg: true })
    .toFile(dest);
  const blur = await sharp(dest).resize(12).jpeg({ quality: 40 }).toBuffer();
  return `data:image/jpeg;base64,${blur.toString("base64")}`;
}

/* ---------------------------------------------------------------- main */

async function main() {
  for (const shoot of SHOOTS) {
    const srcDir = path.join(SRC_ROOT, shoot.dir);
    const present = new Set(await readdir(srcDir));

    // Fail loudly on a typo rather than shipping a project whose hero
    // silently went missing. Every name here was read off the real folder.
    const missing = [shoot.hero, ...shoot.gallery].filter((f) => !present.has(f));
    if (missing.length) {
      throw new Error(`${shoot.slug}: not found in "${shoot.dir}": ${missing.join(", ")}`);
    }

    const outDir = path.join(OUT_ROOT, shoot.slug);
    // Wipe first. Several of these had nine web exports and now have five
    // good frames; a stale 06.jpg left on disk would go on being served to
    // anyone holding cached HTML.
    await rm(outDir, { recursive: true, force: true });
    await mkdir(outDir, { recursive: true });

    const heroBlur = await writeJpeg(
      path.join(srcDir, shoot.hero),
      path.join(outDir, "hero.jpg"),
      HERO_EDGE,
      HERO_Q,
    );

    const heroImage = `/uploads/projects/${shoot.slug}/hero.jpg`;
    const published = shoot.publish ? { status: "PUBLISHED" as const } : {};

    const project = shoot.create
      ? await prisma.project.upsert({
          where: { slug: shoot.slug },
          create: {
            slug: shoot.slug,
            ...shoot.create,
            heroImage,
            heroBlur,
            order: shoot.order ?? 0,
            ...published,
          },
          update: { ...shoot.create, heroImage, heroBlur, ...published },
        })
      : await prisma.project.update({
          where: { slug: shoot.slug },
          data: { heroImage, heroBlur, ...published },
        });

    await prisma.galleryImage.deleteMany({ where: { projectId: project.id } });
    for (const [i, file] of shoot.gallery.entries()) {
      const name = `${String(i + 1).padStart(2, "0")}.jpg`;
      const blurData = await writeJpeg(
        path.join(srcDir, file),
        path.join(outDir, name),
        GALLERY_EDGE,
        GALLERY_Q,
      );
      await prisma.galleryImage.create({
        data: {
          projectId: project.id,
          url: `/uploads/projects/${shoot.slug}/${name}`,
          alt: shoot.alt[file] ?? `${project.title}, Design Matters Architects`,
          blurData,
          order: i,
        },
      });
    }

    console.log(
      `+ ${shoot.slug}: hero + ${shoot.gallery.length} frames` +
        (shoot.create ? " (created)" : " (replaced)"),
    );
  }

  /* Ordering.
     §3 wants the farmhouse first, as the latest project. Sorting by
     (order, title) is not enough on its own: a new row given order 0
     ties with whatever already held 0 and then loses the tie on title,
     which is how "Praangana Heritage" ended up second to "House of
     Levels" on the first run. So the front of the list is named
     outright. Everything not named keeps its relative order behind
     them, and re-running is idempotent. */
  const PINNED = [
    "praangana-heritage",
    "house-of-levels",
    "mohan-residence",
    "shambhavi-residence",
    "dr-ashwini-residence",
    "neeraj-residence",
    "anita-residence",
    "vivek-residence",
  ];
  const rank = (slug: string) => {
    const i = PINNED.indexOf(slug);
    return i === -1 ? PINNED.length : i;
  };
  const all = (
    await prisma.project.findMany({ orderBy: [{ order: "asc" }, { title: "asc" }] })
  ).sort((a, b) => rank(a.slug) - rank(b.slug));
  for (const [i, p] of all.entries()) {
    if (p.order !== i) await prisma.project.update({ where: { id: p.id }, data: { order: i } });
  }
  console.log(`\n= reordered ${all.length} projects`);
  for (const [i, p] of all.entries()) {
    console.log(`  ${String(i).padStart(2)} ${p.slug}${p.status === "DRAFT" ? "  (draft)" : ""}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
