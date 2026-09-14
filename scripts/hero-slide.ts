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
 * Portrait sources can be cut to a landscape frame first with `--crop`,
 * given as `<width/height>@<vertical position 0..1>`. The hero is full
 * bleed and 1.8 to 2.3:1 on a desktop, so a tall elevation shipped whole
 * spends most of its bytes on sky and pavement that `object-cover` then
 * throws away. Crop to 3:2 rather than straight to the hero's ratio, so
 * `focus` still has some room to work with on unusual screens.
 *
 * Run:
 *   npx tsx scripts/hero-slide.ts <source.jpg> <project-slug> [name] [--crop=1.5@0.45]
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const args = process.argv.slice(2);
const cropArg = args.find((a) => a.startsWith("--crop="));
const [src, slug, name = "slide-1"] = args.filter((a) => !a.startsWith("--"));
if (!src || !slug) {
  throw new Error(
    "Usage: npx tsx scripts/hero-slide.ts <source.jpg> <project-slug> [name] [--crop=1.5@0.45]",
  );
}

/** `--crop=1.5@0.45` -> a 3:2 band, its top 45% of the way down the spare height. */
function parseCrop(arg: string | undefined) {
  if (!arg) return null;
  const m = /^--crop=([\d.]+)@([\d.]+)$/.exec(arg);
  const ratio = Number(m?.[1]);
  const y = Number(m?.[2]);
  if (!m || !(ratio > 0) || !(y >= 0 && y <= 1)) {
    throw new Error(`Bad ${arg}: expected --crop=<width/height>@<0..1>, e.g. --crop=1.5@0.45`);
  }
  return { ratio, y };
}
const crop = parseCrop(cropArg);

/** Matches the hero tier used by the project importer. */
const EDGE = 2560;
const QUALITY = 80;

async function main() {
  const outDir = path.join(process.cwd(), "public", "uploads", "projects", slug);
  await mkdir(outDir, { recursive: true });
  const dest = path.join(outDir, `${name}.jpg`);

  const meta = await sharp(src).metadata();
  // EXIF orientation 5-8 swaps the axes once `rotate()` has applied it.
  const upright = (meta.orientation ?? 1) >= 5;
  const srcW = (upright ? meta.height : meta.width) ?? 0;
  const srcH = (upright ? meta.width : meta.height) ?? 0;

  let pipeline = sharp(src).rotate();
  const outW = srcW;
  let outH = srcH;
  if (crop) {
    // Cut across the full width; only a source taller than the band can be cropped.
    const bandH = Math.round(srcW / crop.ratio);
    if (bandH > srcH) throw new Error(`Source is already wider than ${crop.ratio}:1`);
    const top = Math.round((srcH - bandH) * crop.y);
    // Re-open from the rotated buffer: extract() before rotate() would cut the unrotated pixels.
    pipeline = sharp(await pipeline.toBuffer()).extract({ left: 0, top, width: srcW, height: bandH });
    outH = bandH;
  }

  const landscape = outW >= outH;
  await pipeline
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
