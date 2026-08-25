/**
 * Import the studio's real portfolio — metadata from "Project Details.md",
 * photography from the three client zips (Residential / Interiors /
 * Institutional).
 *
 * Replaces the stock/demo projects wholesale: every project below is
 * upserted by slug, every photograph in its folder is resized into
 * public/uploads/projects/<slug>/, and any project NOT listed here is
 * deleted along with its old placeholder files.
 *
 * Run: npx tsx scripts/import-client-projects.ts <photos-dir>
 * where <photos-dir> contains Residential/, Interiors/, Institutional/.
 */
import "dotenv/config";
import { readdir, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const PHOTOS_DIR = process.argv[2];
if (!PHOTOS_DIR) {
  throw new Error("Usage: npx tsx scripts/import-client-projects.ts <photos-dir>");
}

const PUBLIC_DIR = path.join(process.cwd(), "public");
const OUT_ROOT = path.join(PUBLIC_DIR, "uploads", "projects");

type Seed = {
  slug: string;
  title: string;
  category: "Residential" | "Interiors" | "Institutional";
  /** Folder inside <photos-dir>, relative. Null = client sent no photos yet. */
  folder: string | null;
  year: number | null;
  statusNote: string;
  location?: string;
  client?: string;
  typology?: string;
  area?: string;
  siteArea?: string;
  photographer?: string;
  collaborator?: string;
  units?: string;
};

/* ------------------------------------------------------------ portfolio */
// Order below is the order the site shows them in.
const PROJECTS: Seed[] = [
  /* ---------------------------------------------------- residential */
  {
    slug: "house-of-levels",
    title: "House of Levels",
    category: "Residential",
    folder: "Residential/Ellappan",
    year: 2025,
    statusNote: "Completed in 2025",
    location: "Banashankari 6th Stage, Bengaluru",
    client: "Mr. Venkatesh Ellappan",
    typology: "Private residence",
    siteArea: "1,200 sq ft",
    area: "3,278 sq ft",
  },
  {
    slug: "mohan-residence",
    title: "Mohan Residence",
    category: "Residential",
    folder: "Residential/Mohan Hennur",
    year: 2025,
    statusNote: "Completed in 2025",
    location: "Hennur Road, Bengaluru",
    client: "Mr. Mohan",
    typology: "Private residence",
    siteArea: "4,000 sq ft",
    area: "10,000 sq ft",
  },
  {
    slug: "shambhavi-residence",
    title: "Shambhavi Residence",
    category: "Residential",
    folder: "Residential/Shambhavi",
    year: 2025,
    statusNote: "Completed in 2025",
    location: "Ullal, Bengaluru",
    client: "Mr. Chandan",
    typology: "Private residence",
    area: "3,400 sq ft",
  },
  {
    slug: "vaibhav-residence",
    title: "Vaibhav Residence",
    category: "Residential",
    folder: "Residential/Vaibhav Varshey",
    year: 2025,
    statusNote: "Completed in 2025",
    location: "Odion Woods of the East, Sarjapur Road, Bengaluru",
    client: "Mr. Vaibhav",
    typology: "Private residence",
    area: "4,500 sq ft",
  },
  {
    slug: "the-minimal-indian-house",
    title: "The Minimal, Indian House",
    category: "Residential",
    folder: "Residential/Anitha & Tejas",
    year: 2023,
    statusNote: "Completed in 2023",
    location: "J P Nagar, Bengaluru",
    client: "Anitha and Tejas",
    typology: "Private residence",
    siteArea: "1,200 sq ft",
    area: "3,800 sq ft",
  },
  {
    slug: "jibeesh-residence",
    title: "Jibeesh Residence",
    category: "Residential",
    folder: "Residential/Jibeesh",
    year: 2023,
    statusNote: "Completed in 2023",
    location: "Sarjapur, Bengaluru",
    client: "Mr. Jibeesh",
    typology: "Private residence",
    siteArea: "1,500 sq ft",
    area: "4,000 sq ft",
    photographer: "Ajay Devasia",
  },
  {
    slug: "soumya-and-chetan-residence",
    title: "Soumya and Chetan Residence",
    category: "Residential",
    folder: "Residential/Soumya Chethan",
    year: 2023,
    statusNote: "Completed in 2023",
    location: "Akshayanagar, Bengaluru",
    client: "Mrs. Soumya and Mr. Chetan",
    typology: "Private residence",
    siteArea: "1,200 sq ft",
    area: "4,600 sq ft",
  },
  {
    slug: "vivek-residence",
    title: "Vivek Residence",
    category: "Residential",
    folder: "Residential/Vivek",
    year: 2023,
    statusNote: "Completed in 2023",
    location: "Banashankari 6th Stage, Bengaluru",
    client: "Mr. Vivek",
    typology: "Private residence",
    siteArea: "1,200 sq ft",
    area: "3,000 sq ft",
  },
  {
    // The client's sheet lists this one but sent no photography for it —
    // it stays a draft until they do (a project can't publish without a hero).
    slug: "neeraj-residence",
    title: "Neeraj Residence",
    category: "Residential",
    folder: null,
    year: 2023,
    statusNote: "Completed in 2023",
    location: "Odion Rainbow Retreat, Sarjapur, Bengaluru",
    client: "Mr. Neeraj Sharma",
    typology: "Private residence",
    siteArea: "2,500 sq ft",
    area: "5,000 sq ft",
  },

  /* ------------------------------------------------------- interiors */
  {
    slug: "la-palazzo",
    title: "La Palazzo",
    category: "Interiors",
    folder: "Interiors/La Palazzo",
    year: 2025,
    statusNote: "Completed in 2025",
    location: "Sarjapur, Bengaluru",
    client: "Mr. Nitin and Mrs. Priya",
    typology: "Apartment interiors",
    area: "3,500 sq ft",
  },

  /* --------------------------------------------------- institutional */
  {
    slug: "badami-cbse-school-and-montessori",
    title: "Badami CBSE School and Montessori",
    category: "Institutional",
    folder: "Institutional/Badami CBSE & Montesseri",
    year: null,
    statusNote: "Construction phase",
    location: "Badami, Karnataka",
    typology: "School campus",
    siteArea: "1,79,512 sq ft",
    area: "Montessori block 8,112 sq ft · CBSE block 30,257 sq ft",
  },
  {
    slug: "badami-public-library",
    title: "Badami Public Library",
    category: "Institutional",
    folder: "Institutional/Badami Public Library",
    year: null,
    statusNote: "Construction pending",
    location: "Badami, Karnataka",
    typology: "Public library",
    area: "10,000 sq ft",
  },
  {
    slug: "kerur-school-and-college",
    title: "Kerur School & College",
    category: "Institutional",
    folder: "Institutional/Kerur college",
    year: null,
    statusNote: "Completed",
    location: "Kerur, Karnataka",
    typology: "School and college campus",
    area: "2,01,000 sq ft",
  },
  {
    slug: "club-nadora-woodsvale",
    title: "Club Nadora, Woodsvale",
    category: "Institutional",
    folder: "Institutional/Woodsvale",
    year: null,
    statusNote: "Completed",
    location: "Sarjapur, Bengaluru",
    typology: "Clubhouse",
    area: "20,000 sq ft",
  },
  {
    slug: "life-by-lake-keya-homes",
    title: "Life by Lake, Keya Homes",
    category: "Institutional",
    folder: "Institutional/Life by the lake",
    year: 2022,
    statusNote: "Completed in 2022",
    location: "Jakkur, Bengaluru",
    client: "Keya Homes",
    typology: "Villaments",
    area: "2,00,000 sq ft",
    units: "55 villaments",
    collaborator: "In association with Studio Parametric",
  },
  {
    slug: "pcoc-lanai",
    title: "PCOC Lanai",
    category: "Institutional",
    folder: "Institutional/PCOC Lanai",
    year: 2022,
    statusNote: "Completed in 2022",
    location: "Koramangala, Bengaluru",
    typology: "Residential development",
    area: "40,000 sq ft",
    units: "15 units",
    collaborator: "In association with Studio Parametric",
  },
  {
    slug: "the-green-terraces-keya-homes",
    title: "The Green Terraces, Keya Homes",
    category: "Institutional",
    folder: "Institutional/The Green terraces-Keya Homes",
    year: 2020,
    statusNote: "Completed in 2020",
    location: "Electronic City, Bengaluru",
    client: "Keya Homes",
    typology: "Residential development",
    area: "5,00,000 sq ft",
    collaborator: "In association with Studio Parametric",
  },
  {
    slug: "icon-bricksquare-goa",
    title: "Icon Bricksquare, Goa",
    category: "Institutional",
    folder: "Institutional/Icon Bricksquare Goa",
    year: 2015,
    statusNote: "Completed in 2015",
    location: "Santa Cruz, Goa",
    client: "Icon",
    typology: "Mixed-use development",
    area: "25,000 sq ft",
  },
  {
    slug: "prayaag-montessori",
    title: "Prayaag Montessori",
    category: "Institutional",
    folder: "Institutional/Prayaag Montesseri",
    year: 2014,
    statusNote: "Completed in 2014",
    client: "Prayaag",
    typology: "Montessori school",
    area: "9,000 sq ft",
  },
];

/* -------------------------------------------------------------- images */

type Frame = { file: string; width: number; height: number };

async function probe(dir: string): Promise<Frame[]> {
  let names: string[];
  try {
    names = (await readdir(dir)).sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  } catch {
    return [];
  }
  const frames: Frame[] = [];
  for (const name of names) {
    if (name.startsWith(".")) continue;
    const file = path.join(dir, name);
    try {
      const meta = await sharp(file).metadata();
      if (!meta.width || !meta.height) continue;
      // Drop only icons/sprites. The floor is deliberately low: the
      // client's set mixes 9000px pro shots with small WhatsApp exports
      // (all of Icon Bricksquare is ~600px), and every frame they sent
      // is meant to be on the site.
      if (Math.max(meta.width, meta.height) < 320) continue;
      frames.push({ file, width: meta.width, height: meta.height });
    } catch {
      console.warn(`  ! unreadable, skipped: ${name}`);
    }
  }
  return frames;
}

async function writeJpeg(src: string, dest: string, maxLongEdge: number, quality: number) {
  const meta = await sharp(src).metadata();
  const landscape = (meta.width ?? 0) >= (meta.height ?? 0);
  await sharp(src)
    .rotate() // respect EXIF orientation (phone shots)
    .resize(
      landscape
        ? { width: maxLongEdge, withoutEnlargement: true }
        : { height: maxLongEdge, withoutEnlargement: true },
    )
    .flatten({ background: "#f3efe7" }) // PNG/TIFF alpha lands on bone
    .jpeg({ quality, mozjpeg: true })
    .toFile(dest);
  const blur = await sharp(dest).resize(12).jpeg({ quality: 40 }).toBuffer();
  return `data:image/jpeg;base64,${blur.toString("base64")}`;
}

/* ---------------------------------------------------------------- main */

async function main() {
  const keep = new Set(PROJECTS.map((p) => p.slug));

  // 1. Drop the stock/demo projects and their placeholder files.
  const stale = await prisma.project.findMany({
    where: { slug: { notIn: [...keep] } },
    select: { id: true, slug: true },
  });
  if (stale.length) {
    await prisma.project.deleteMany({ where: { id: { in: stale.map((s) => s.id) } } });
    console.log(`removed ${stale.length} stock projects: ${stale.map((s) => s.slug).join(", ")}`);
  }
  await rm(path.join(PUBLIC_DIR, "uploads", "placeholders"), { recursive: true, force: true });
  console.log("removed public/uploads/placeholders (stock imagery)\n");

  let totalImages = 0;

  for (const [order, seed] of PROJECTS.entries()) {
    const { folder, ...fields } = seed;

    const frames = folder ? await probe(path.join(PHOTOS_DIR, folder)) : [];

    // Hero: widest true landscape reads best in the carousel; fall back
    // to the first frame so a portrait-only set still gets a hero.
    const landscapes = frames.filter((f) => f.width > f.height);
    const hero =
      landscapes.sort((a, b) => b.width - a.width)[0] ?? frames[0] ?? null;
    const rest = frames.filter((f) => f !== hero);

    const outDir = path.join(OUT_ROOT, seed.slug);
    let heroImage: string | null = null;
    let heroBlur: string | null = null;
    const gallery: { url: string; alt: string; blurData: string; order: number }[] = [];

    if (hero) {
      await rm(outDir, { recursive: true, force: true }); // idempotent re-runs
      await mkdir(outDir, { recursive: true });

      heroBlur = await writeJpeg(hero.file, path.join(outDir, "hero.jpg"), 2560, 80);
      heroImage = `/uploads/projects/${seed.slug}/hero.jpg`;

      for (const [i, f] of rest.entries()) {
        const name = `${String(i + 1).padStart(2, "0")}.jpg`;
        const blurData = await writeJpeg(f.file, path.join(outDir, name), 2200, 78);
        gallery.push({
          url: `/uploads/projects/${seed.slug}/${name}`,
          alt: `${seed.title}, Design Matters Architects, view ${i + 1}`,
          blurData,
          order: i,
        });
      }
    }

    const data = {
      ...fields,
      order,
      heroImage,
      heroBlur,
      // Nothing to show = nothing to publish.
      status: (heroImage ? "PUBLISHED" : "DRAFT") as "PUBLISHED" | "DRAFT",
      metaDesc: `${seed.title}, ${seed.typology ?? seed.category} by Design Matters Architects${
        seed.location ? `, ${seed.location}` : ""
      }.`,
    };

    const project = await prisma.project.upsert({
      where: { slug: seed.slug },
      create: data,
      update: data,
    });

    await prisma.galleryImage.deleteMany({ where: { projectId: project.id } });
    if (gallery.length) {
      await prisma.galleryImage.createMany({
        data: gallery.map((g) => ({ ...g, projectId: project.id })),
      });
    }

    totalImages += frames.length;
    console.log(
      hero
        ? `✓ ${seed.slug.padEnd(36)} hero ${hero.width}×${hero.height} + ${gallery.length} gallery`
        : `· ${seed.slug.padEnd(36)} no photography, saved as DRAFT`,
    );
  }

  console.log(`\n${PROJECTS.length} projects, ${totalImages} photographs imported.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
