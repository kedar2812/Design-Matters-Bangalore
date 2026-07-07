/**
 * Import real project photography scraped from DMA's current website
 * (designmattersarchitects.com, plus Buildofy for House of Levels).
 *
 * Reads originals from IMPORT_DIR/<slug>/NN.<ext> (DOM order from the
 * old site), picks a hero + up to 4 gallery frames per project, writes
 * web-sized JPEGs over the existing placeholder paths, regenerates
 * blur placeholders, and refreshes gallery rows.
 *
 * Run: npx tsx scripts/import-photos.ts <import-dir>
 */
import "dotenv/config";
import { readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const IMPORT_DIR = process.argv[2];
if (!IMPORT_DIR) throw new Error("Usage: npx tsx scripts/import-photos.ts <import-dir>");

const OUT = path.join(process.cwd(), "public", "uploads", "placeholders");

type Frame = { file: string; width: number; height: number };

async function probe(dir: string): Promise<Frame[]> {
  let names: string[];
  try {
    names = (await readdir(dir)).sort();
  } catch {
    return [];
  }
  const frames: Frame[] = [];
  for (const name of names) {
    const file = path.join(dir, name);
    try {
      const meta = await sharp(file).metadata();
      if (!meta.width || !meta.height) continue;
      // Drop icons/thumbnails; keep everything photographic. The floor
      // is low on purpose — some of DMA's older projects only exist as
      // small web exports (client confirmed a pro/phone mix).
      if (Math.max(meta.width, meta.height) < 600) continue;
      frames.push({ file, width: meta.width, height: meta.height });
    } catch {
      // unreadable file — skip
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
      landscape ? { width: maxLongEdge, withoutEnlargement: true } : { height: maxLongEdge, withoutEnlargement: true },
    )
    .flatten({ background: "#f3efe7" }) // PNGs with alpha land on bone
    .jpeg({ quality, mozjpeg: true })
    .toFile(dest);
  const blur = await sharp(dest).resize(12).jpeg({ quality: 40 }).toBuffer();
  return `data:image/jpeg;base64,${blur.toString("base64")}`;
}

async function main() {
  const projects = await prisma.project.findMany({ orderBy: { order: "asc" } });

  for (const p of projects) {
    const frames = await probe(path.join(IMPORT_DIR, p.slug));
    if (frames.length === 0) {
      console.warn(`! ${p.slug}: no images found — placeholder kept`);
      continue;
    }

    // Hero: first good landscape; fall back to the first frame (old
    // site's DOM order puts the lead image first).
    const hero =
      frames.find((f) => f.width > f.height && f.width >= 1400) ??
      frames.find((f) => f.width >= 1000) ??
      frames[0];
    const rest = frames.filter((f) => f !== hero).slice(0, 4);

    const heroFile = path.join(OUT, `${p.slug}-hero.jpg`);
    const heroBlur = await writeJpeg(hero.file, heroFile, 2560, 80);
    await prisma.project.update({
      where: { id: p.id },
      data: { heroImage: `/uploads/placeholders/${p.slug}-hero.jpg`, heroBlur },
    });

    await prisma.galleryImage.deleteMany({ where: { projectId: p.id } });
    for (const [j, f] of rest.entries()) {
      const galFile = path.join(OUT, `${p.slug}-${j + 1}.jpg`);
      const blurData = await writeJpeg(f.file, galFile, 2200, 78);
      await prisma.galleryImage.create({
        data: {
          projectId: p.id,
          url: `/uploads/placeholders/${p.slug}-${j + 1}.jpg`,
          alt: `${p.title} — Design Matters Architects, view ${j + 1}`,
          blurData,
          order: j,
        },
      });
    }
    console.log(
      `✓ ${p.slug}: hero ${hero.width}x${hero.height}, ${rest.length} gallery frames`,
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
