/**
 * Encode one photograph as a home-hero slide.
 *
 * The hero slideshow is curated by hand, and its slides do not have to be
 * a project's own hero image. When they aren't, the obvious shortcut is to
 * point the slide at a gallery frame, but gallery frames are encoded for a
 * half-width slot: 2200px at q78. Stretched across a full-bleed 100dvh
 * hero on a wide screen, that is visibly soft, and the hero is the one
 * frame the client judges the whole site by.
 *
 * So a slide that isn't a project hero gets its own encode at the hero
 * tier, written beside the project's photographs as `slide-<n>.jpg`.
 *
 * Prints the blur placeholder to paste into `heroSlides` alongside it.
 * That is deliberately manual: the slide list lives in
 * `lib/content-defaults.ts` so the studio can edit it from the dashboard,
 * and a build-time lookup would mean a slide added there could never have
 * a placeholder.
 *
 * Run:
 *   npx tsx scripts/hero-slide.ts <source.jpg> <project-slug> [name]
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const [src, slug, name = "slide-1"] = process.argv.slice(2);
if (!src || !slug) {
  throw new Error("Usage: npx tsx scripts/hero-slide.ts <source.jpg> <project-slug> [name]");
}

/** Matches the hero tier used by the project importer. */
const EDGE = 2560;
const QUALITY = 80;

async function main() {
  const outDir = path.join(process.cwd(), "public", "uploads", "projects", slug);
  await mkdir(outDir, { recursive: true });
  const dest = path.join(outDir, `${name}.jpg`);

  const meta = await sharp(src).metadata();
  const landscape = (meta.width ?? 0) >= (meta.height ?? 0);
  await sharp(src)
    .rotate()
    .resize(
      landscape
        ? { width: EDGE, withoutEnlargement: true }
        : { height: EDGE, withoutEnlargement: true },
    )
    .flatten({ background: "#f3efe7" })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toFile(dest);

  const out = await sharp(dest).metadata();
  const blur = await sharp(dest).resize(12).jpeg({ quality: 40 }).toBuffer();

  console.log(`wrote /uploads/projects/${slug}/${name}.jpg  ${out.width}x${out.height}`);
  console.log(`source ${meta.width}x${meta.height}\n`);
  console.log(`blur: "data:image/jpeg;base64,${blur.toString("base64")}"`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
