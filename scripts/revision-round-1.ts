/**
 * Client revision round 1 — content changes that live in the database.
 *
 * Idempotent: safe to re-run, and safe to run against the VPS after the
 * code deploys. Two changes, both from Kiran's feedback brief:
 *
 *  §2.2  "Club Nadora, Woodsvale" was filed as an Institutional clubhouse.
 *        It is actually a villa development — Woodsvale, off Sarjapur Road —
 *        and Club Nadora is the clubhouse *inside* it. The project becomes
 *        Residential/Villas named Woodsvale, keeps only the villa
 *        photography in its gallery, and the two clubhouse frames move to
 *        the Club Nadora sub-section (see lib/project-features.ts).
 *
 *  §2.3  Life by the Lake — the interiors were another studio's work, so
 *        the exteriors have to lead. The hero was a bedroom; it becomes the
 *        aerial, and the gallery is re-ordered exteriors first.
 *
 * Alt text is rewritten in both cases — the imported text was "view 1",
 * "view 2", which fails the accessibility bar in the brief.
 *
 * Run: npx tsx scripts/revision-round-1.ts
 * Then: npm run snapshot   (refreshes content/site-snapshot.json)
 */
import "dotenv/config";
import path from "node:path";
import sharp from "sharp";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/** The 12px JPEG data URI next/image wants for `blurDataURL`. */
async function blurFor(publicPath: string) {
  const file = path.join(process.cwd(), "public", publicPath);
  const buf = await sharp(file).resize(12).jpeg({ quality: 40 }).toBuffer();
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

/** Replaces a project's gallery with the given frames, in order. */
async function setGallery(
  projectId: string,
  frames: { url: string; alt: string }[],
) {
  await prisma.galleryImage.deleteMany({ where: { projectId } });
  for (const [order, f] of frames.entries()) {
    await prisma.galleryImage.create({
      data: { projectId, url: f.url, alt: f.alt, blurData: await blurFor(f.url), order },
    });
  }
}

/* ------------------------------------------------------- §2.2 Woodsvale */

const WOODSVALE_DIR = "/uploads/projects/club-nadora-woodsvale";

async function woodsvale() {
  // Match on either slug so a second run is a no-op rather than an error.
  const project = await prisma.project.findFirst({
    where: { slug: { in: ["club-nadora-woodsvale", "woodsvale"] } },
  });
  if (!project) {
    console.log("· Woodsvale: no matching project, skipping");
    return;
  }

  await prisma.project.update({
    where: { id: project.id },
    data: {
      slug: "woodsvale",
      title: "Woodsvale",
      category: "Residential",
      typology: "Villas",
      location: "Off Sarjapur Road, Bengaluru",
      // The 20,000 sq ft on the old record was the clubhouse's footprint,
      // not the development's — it belongs to the Club Nadora sub-section
      // now. The villa-count and site area are still to come from Kiran.
      area: null,
      statusNote: "Completed",
      // Sits at the end of the Residential run, ahead of Interiors.
      order: 8,
      metaTitle: "Woodsvale — Villas off Sarjapur Road | Design Matters",
      metaDesc:
        "Woodsvale, a villa development off Sarjapur Road, Bengaluru, by Design Matters Architects — including Club Nadora, the clubhouse at its centre.",
    },
  });

  // Villa photography only. The two clubhouse frames are rendered by the
  // Club Nadora sub-section instead, so they don't sit in this gallery.
  await setGallery(project.id, [
    {
      url: `${WOODSVALE_DIR}/03.jpg`,
      alt: "Woodsvale — villa frontages along the internal avenue, brick and rendered façades set back behind planted verges",
    },
  ]);

  console.log("✓ §2.2 Woodsvale — renamed, recategorised Residential/Villas, gallery split");
}

/* --------------------------------------------- §2.3 Life by the Lake */

const LBL_DIR = "/uploads/projects/life-by-lake-keya-homes";

async function lifeByTheLake() {
  const project = await prisma.project.findUnique({
    where: { slug: "life-by-lake-keya-homes" },
  });
  if (!project) {
    console.log("· Life by the Lake: not found, skipping");
    return;
  }

  // The hero was an interior — a bedroom — on a project whose interiors
  // were designed by someone else. The aerial leads instead: it is an
  // exterior, and it is the one frame that shows the lake the project is
  // named for.
  const hero = `${LBL_DIR}/04.jpg`;
  await prisma.project.update({
    where: { id: project.id },
    data: { heroImage: hero, heroBlur: await blurFor(hero) },
  });

  // Exteriors first and largest, interiors as a smaller later group.
  // Note the old hero file re-enters here as an interior frame.
  await setGallery(project.id, [
    {
      url: `${LBL_DIR}/05.jpg`,
      alt: "Life by the Lake — the central courtyard, stacked balconies and louvred screens facing a landscaped garden",
    },
    {
      url: `${LBL_DIR}/06.jpg`,
      alt: "Life by the Lake — courtyard elevation at dusk, projecting balconies framed in timber-toned louvres",
    },
    {
      url: `${LBL_DIR}/02.jpg`,
      alt: "Life by the Lake — a private roof terrace planted to its parapet, looking north across Jakkur lake",
    },
    {
      url: `${LBL_DIR}/hero.jpg`,
      alt: "Life by the Lake — principal bedroom, full-height glazing opening to the lake side",
    },
    {
      url: `${LBL_DIR}/01.jpg`,
      alt: "Life by the Lake — the double-height living room, clerestory glazing above the terrace doors",
    },
    {
      url: `${LBL_DIR}/03.jpg`,
      alt: "Life by the Lake — bedroom with a glazed bay looking onto the courtyard",
    },
  ]);

  console.log("✓ §2.3 Life by the Lake — exterior hero, gallery re-ordered exteriors first");
}

async function main() {
  await woodsvale();
  await lifeByTheLake();
  console.log("\nDone. Run `npm run snapshot` to refresh the committed content export.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
