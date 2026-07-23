/** Cross-checks image files on disk against what the database references. */
import "dotenv/config";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const ROOT = path.join(process.cwd(), "public", "uploads", "projects");

async function main() {
  const projects = await prisma.project.findMany({
    include: { gallery: true },
    orderBy: { order: "asc" },
  });

  const referenced = new Set<string>();
  for (const p of projects) {
    if (p.heroImage) referenced.add(p.heroImage);
    for (const g of p.gallery) referenced.add(g.url);
  }

  const onDisk = new Set<string>();
  for (const dir of await readdir(ROOT)) {
    const full = path.join(ROOT, dir);
    if (!(await stat(full)).isDirectory()) continue;
    for (const f of await readdir(full)) onDisk.add(`/uploads/projects/${dir}/${f}`);
  }

  const orphans = [...onDisk].filter((f) => !referenced.has(f));
  const missing = [...referenced].filter((f) => !onDisk.has(f));

  console.log(`files on disk:   ${onDisk.size}`);
  console.log(`db references:   ${referenced.size}`);
  console.log(`orphan files:    ${orphans.length}${orphans.length ? ` → ${orphans.join(", ")}` : ""}`);
  console.log(`broken links:    ${missing.length}${missing.length ? ` → ${missing.join(", ")}` : ""}`);

  console.log("\nper project:");
  for (const p of projects) {
    console.log(
      `  ${p.slug.padEnd(36)} ${p.status.padEnd(9)} hero:${p.heroImage ? "yes" : "NO "} gallery:${String(p.gallery.length).padStart(2)}`,
    );
  }
  const total = projects.reduce((n, p) => n + p.gallery.length + (p.heroImage ? 1 : 0), 0);
  console.log(`\ntotal images in use: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
