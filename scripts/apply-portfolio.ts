/**
 * Applies a portfolio export (scripts/export-portfolio.ts) to this
 * database. Projects are matched by slug and upserted; any project not
 * in the file is removed. Leads, page views and users are never touched.
 *
 * Run: npx tsx scripts/apply-portfolio.ts <portfolio.json>
 */
import "dotenv/config";
import { readFile } from "node:fs/promises";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const FILE = process.argv[2];
if (!FILE) throw new Error("Usage: npx tsx scripts/apply-portfolio.ts <portfolio.json>");

type Exported = {
  projects: (Record<string, unknown> & {
    slug: string;
    gallery: Record<string, unknown>[];
    storyBlocks: Record<string, unknown>[];
  })[];
};

async function main() {
  const { projects } = JSON.parse(await readFile(FILE, "utf8")) as Exported;
  const keep = projects.map((p) => p.slug);

  const stale = await prisma.project.findMany({
    where: { slug: { notIn: keep } },
    select: { id: true, slug: true },
  });
  if (stale.length) {
    await prisma.project.deleteMany({ where: { id: { in: stale.map((s) => s.id) } } });
    console.log(`removed ${stale.length} old projects: ${stale.map((s) => s.slug).join(", ")}`);
  }

  for (const p of projects) {
    const { gallery, storyBlocks, ...scalars } = p;
    const project = await prisma.project.upsert({
      where: { slug: p.slug },
      create: scalars as never,
      update: scalars as never,
    });

    await prisma.galleryImage.deleteMany({ where: { projectId: project.id } });
    if (gallery.length) {
      await prisma.galleryImage.createMany({
        data: gallery.map((g) => ({ ...g, projectId: project.id })) as never,
      });
    }

    await prisma.storyBlock.deleteMany({ where: { projectId: project.id } });
    if (storyBlocks.length) {
      await prisma.storyBlock.createMany({
        data: storyBlocks.map((s) => ({ ...s, projectId: project.id })) as never,
      });
    }
    console.log(`✓ ${p.slug} (${gallery.length} gallery)`);
  }

  const total = await prisma.project.count();
  const published = await prisma.project.count({ where: { status: "PUBLISHED" } });
  console.log(`\n${total} projects in database, ${published} published.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
