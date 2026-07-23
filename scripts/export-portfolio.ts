/**
 * Exports every project (drafts included) with its gallery and story
 * blocks to JSON, so the same portfolio can be applied to another
 * database — e.g. the VPS — without re-processing the photography.
 *
 * Run: npx tsx scripts/export-portfolio.ts <out-file>
 */
import "dotenv/config";
import { writeFile } from "node:fs/promises";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const OUT = process.argv[2] ?? "portfolio.json";

async function main() {
  const projects = await prisma.project.findMany({
    orderBy: { order: "asc" },
    include: {
      gallery: { orderBy: { order: "asc" } },
      storyBlocks: { orderBy: { order: "asc" } },
    },
  });

  const payload = {
    exportedAt: new Date().toISOString(),
    projects: projects.map((p) => ({
      slug: p.slug,
      title: p.title,
      category: p.category,
      year: p.year,
      location: p.location,
      typology: p.typology,
      area: p.area,
      siteArea: p.siteArea,
      team: p.team,
      client: p.client,
      photographer: p.photographer,
      collaborator: p.collaborator,
      units: p.units,
      statusNote: p.statusNote,
      heroImage: p.heroImage,
      heroBlur: p.heroBlur,
      status: p.status,
      order: p.order,
      metaTitle: p.metaTitle,
      metaDesc: p.metaDesc,
      gallery: p.gallery.map((g) => ({
        url: g.url,
        alt: g.alt,
        blurData: g.blurData,
        order: g.order,
      })),
      storyBlocks: p.storyBlocks.map((s) => ({
        type: s.type,
        text: s.text,
        image: s.image,
        order: s.order,
      })),
    })),
  };

  await writeFile(OUT, JSON.stringify(payload, null, 1));
  const images = payload.projects.reduce(
    (n, p) => n + p.gallery.length + (p.heroImage ? 1 : 0),
    0,
  );
  console.log(`exported ${payload.projects.length} projects, ${images} images → ${OUT}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
