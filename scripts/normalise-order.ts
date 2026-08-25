/**
 * One-off repair: rewrite `Project.order` and `Testimonial.order` as a
 * contiguous 0..n-1 sequence, preserving the current display order.
 *
 * The old swap-two-neighbours reorder actions wrote array indices into a
 * column whose values were not indices, so a reorder could collide with a
 * row nobody touched. The live database ended up with two projects
 * sharing `order = 8` and a gap at 13 — meaning the site's project order,
 * and therefore which project is the homepage hero, was decided by
 * whatever Postgres returned for the tie.
 *
 * `reorderProjects` / `reorderTestimonials` now always write a full
 * sequence, so this cannot recur. This script cleans up what the old code
 * already did.
 *
 * Safe to re-run: on healthy data it is a no-op.
 *
 * Run: npx tsx scripts/normalise-order.ts
 */
import "dotenv/config";
import { prisma } from "../lib/db";

async function main() {
  // Ties broken by createdAt so the result is deterministic rather than
  // whatever order this particular read happened to return.
  const projects = await prisma.project.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true, order: true, title: true },
  });
  const projectFixes = projects.filter((p, i) => p.order !== i);

  const testimonials = await prisma.testimonial.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true, order: true, author: true },
  });
  const testimonialFixes = testimonials.filter((t, i) => t.order !== i);

  if (projectFixes.length === 0 && testimonialFixes.length === 0) {
    console.log("Nothing to do, both sequences are already 0..n-1.");
    await prisma.$disconnect();
    return;
  }

  await prisma.$transaction([
    ...projects.map((p, order) => prisma.project.update({ where: { id: p.id }, data: { order } })),
    ...testimonials.map((t, order) =>
      prisma.testimonial.update({ where: { id: t.id }, data: { order } }),
    ),
  ]);

  console.log(`projects: renumbered ${projectFixes.length} of ${projects.length}`);
  for (const p of projectFixes) console.log("   " + p.order + " -> " + projects.indexOf(p) + "  " + p.title);
  console.log(`testimonials: renumbered ${testimonialFixes.length} of ${testimonials.length}`);

  await prisma.$disconnect();
}

main();
