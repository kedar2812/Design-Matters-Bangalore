/**
 * Temporary placeholder imagery until DMA's photography arrives.
 * Muted, tone-on-tone gradients in the site's warm palette — honest
 * stand-ins for layout/motion work, swapped file-for-file later.
 *
 * Run: npx tsx scripts/gen-placeholders.ts
 */
import "dotenv/config";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const OUT = path.join(process.cwd(), "public", "uploads", "placeholders");

// Warm architectural tone pairs [from, to] — deliberately quiet.
const TONES: [string, string][] = [
  ["#8b857a", "#6e685e"], // stone
  ["#a39b8b", "#7d7466"], // sand
  ["#5d5a52", "#3d3a31"], // charcoal
  ["#96754a", "#6e5636"], // brass shadow
  ["#7a7d72", "#5a5d53"], // olive grey
  ["#9b9186", "#6f665c"], // warm taupe
];

function svgGradient(w: number, h: number, [a, b]: [string, string], angle: number) {
  const rad = (angle * Math.PI) / 180;
  const x2 = Math.round(50 + 50 * Math.cos(rad));
  const y2 = Math.round(50 + 50 * Math.sin(rad));
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <defs><linearGradient id="g" x1="0%" y1="0%" x2="${x2}%" y2="${y2}%">
        <stop offset="0%" stop-color="${a}"/><stop offset="100%" stop-color="${b}"/>
      </linearGradient></defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
    </svg>`,
  );
}

async function makeImage(file: string, w: number, h: number, tone: [string, string], angle: number) {
  const img = sharp(svgGradient(w, h, tone, angle)).jpeg({ quality: 72, mozjpeg: true });
  await img.toFile(file);
  // Tiny blur placeholder (what next/image expects in blurDataURL)
  const blur = await sharp(file).resize(12).jpeg({ quality: 40 }).toBuffer();
  return `data:image/jpeg;base64,${blur.toString("base64")}`;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const projects = await prisma.project.findMany({ orderBy: { order: "asc" } });

  for (const [i, p] of projects.entries()) {
    const tone = TONES[i % TONES.length];

    // Hero: landscape 2400x1500
    const heroFile = path.join(OUT, `${p.slug}-hero.jpg`);
    const heroBlur = await makeImage(heroFile, 2400, 1500, tone, 20 + i * 13);

    await prisma.project.update({
      where: { id: p.id },
      data: {
        heroImage: `/uploads/placeholders/${p.slug}-hero.jpg`,
        heroBlur,
      },
    });

    // Gallery: 4 mixed-orientation frames
    await prisma.galleryImage.deleteMany({ where: { projectId: p.id } });
    const frames = [
      { w: 1600, h: 2000 }, // portrait
      { w: 2400, h: 1500 }, // landscape
      { w: 1600, h: 2000 },
      { w: 2400, h: 1500 },
    ];
    for (const [j, f] of frames.entries()) {
      const galFile = path.join(OUT, `${p.slug}-${j + 1}.jpg`);
      const t = TONES[(i + j + 1) % TONES.length];
      const blurData = await makeImage(galFile, f.w, f.h, t, 45 + j * 30);
      await prisma.galleryImage.create({
        data: {
          projectId: p.id,
          url: `/uploads/placeholders/${p.slug}-${j + 1}.jpg`,
          alt: `${p.title}, placeholder frame ${j + 1}`,
          blurData,
          order: j,
        },
      });
    }
    console.log(`✓ ${p.slug}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
