/**
 * The site's icons — favicon, PWA icon, Apple touch icon, OG card.
 *
 * These were the last four files still shipping Next.js defaults. The
 * favicon in particular was Vercel's black triangle, which Google renders
 * beside the listing on mobile search: the studio's search result carried
 * another company's logo.
 *
 * **Since 2026-09-20 these are cut from the real logo.** Until then there
 * was no DMA logotype and the icons carried a Georgia "DM" standing in for
 * the typographic wordmark in the nav. The client has now approved an
 * actual mark, so the stand-in is gone.
 *
 * The icon uses **the D alone**, not the whole wordmark. "DMA" is nearly
 * three times as wide as it is tall; squeezed into a 16px square it is
 * three grey smudges. The D fills the square, and it is the letter that
 * carries the orange quadrant — the one part of the mark that survives
 * being shrunk to a tab. The white version is used because it sits on the
 * ink ground.
 *
 * The mark is set at roughly half the canvas rather than filling it.
 * Google and iOS both round the corners of what they are given, and
 * Android maskable icons crop to a circle inscribed in 80% of the canvas —
 * a mark set edge to edge loses its extremities to all three.
 *
 * Depends on `scripts/make-brand-assets.ts` having produced
 * `public/brand/letter-d-dark.png`. Run that first.
 *
 * Run: npx tsx scripts/make-icons.ts
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const APP = path.join(process.cwd(), "app");
const PUBLIC = path.join(process.cwd(), "public");

/* The ground token from globals.css, hard-coded: an icon has no CSS to
   read, and it must not flip with the theme — it is stamped once and
   cached by every browser and crawler that fetches it. The mark itself is
   already white, so no foreground token is needed. */
const INK = "#17150f";

const MARK = path.join(PUBLIC, "brand", "letter-d-dark.png");

/**
 * The mark on the ink ground, as a square PNG at any size.
 *
 * Rendered once at 512 and resized down, rather than composited at each
 * target size: the D is a hairline outline, and compositing it directly at
 * 16px drops the stroke to sub-pixel and it disappears. Downsampling a
 * 512px render keeps the stroke as grey energy instead, which is what
 * makes it still read as a D in a browser tab.
 */
async function markSquare(size: number) {
  const inner = Math.round(size * 0.52);
  const d = await sharp(MARK).resize({ height: inner }).png().toBuffer();
  const { width = inner, height = inner } = await sharp(d).metadata();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: INK,
    },
  })
    .composite([
      {
        input: d,
        left: Math.round((size - width) / 2),
        top: Math.round((size - height) / 2),
      },
    ])
    .png()
    .toBuffer();
}

/**
 * A minimal .ico containing PNG payloads.
 *
 * sharp has no ICO encoder and the format does not need one: since Vista
 * every entry may be a whole PNG file rather than a DIB, so the container
 * is a 6-byte header, one 16-byte directory entry per size, and the PNGs
 * end to end. Writing those 22 bytes by hand is cheaper than a dependency.
 *
 * 16/32/48 are the three sizes that are actually read — 16 in the tab, 32
 * on a HiDPI tab and in the Windows taskbar, 48 for Google's favicon
 * crawler, which rejects anything that is not a multiple of 48.
 */
async function ico(sizes: number[]) {
  const pngs = await Promise.all(
    sizes.map(async (s) => sharp(await markSquare(512)).resize(s, s).png().toBuffer()),
  );

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(sizes.length, 4);

  let offset = 6 + sizes.length * 16;
  const entries = sizes.map((s, i) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(s >= 256 ? 0 : s, 0); // width  (0 means 256)
    e.writeUInt8(s >= 256 ? 0 : s, 1); // height
    e.writeUInt8(0, 2); // palette size — 0 for truecolour
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(pngs[i]!.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += pngs[i]!.length;
    return e;
  });

  return Buffer.concat([header, ...entries, ...pngs]);
}

/**
 * The Open Graph card — what WhatsApp, LinkedIn and Instagram DMs render
 * when somebody shares a link, which for this studio is most of how links
 * travel.
 *
 * It is a real photograph rather than a generated card. A studio whose
 * entire proposition is the work should lead with the work; a 1200x630
 * slab of wordmark says nothing a link preview does not already say. The
 * hero of the strongest published house, cropped to 1.91:1 from the top —
 * these are tall frames and centring one cuts the sky off the building.
 *
 * It is written to /public rather than left as a path into /uploads
 * because that is exactly how the previous card was lost: the root layout
 * pointed at `/uploads/placeholders/vivek-residence-hero.jpg`, and
 * `import-client-projects` deletes the whole placeholders directory once
 * the real photography lands. The card 404'd from that day on, which is
 * every link the studio has shared since. A file under /public belongs to
 * the site, not to the import pipeline, and nothing sweeps it.
 */
async function ogCard(source: string) {
  return sharp(source)
    .resize(1200, 630, { fit: "cover", position: "north" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}

async function main() {
  await writeFile(path.join(APP, "favicon.ico"), await ico([16, 32, 48]));

  // 512 for the manifest and the browser's <link rel="icon">.
  await writeFile(
    path.join(APP, "icon.png"),
    await markSquare(512),
  );

  // iOS pins this to the home screen at 180 and applies its own mask.
  await writeFile(
    path.join(APP, "apple-icon.png"),
    await sharp(await markSquare(512)).resize(180, 180).png().toBuffer(),
  );

  await writeFile(
    path.join(PUBLIC, "og-default.jpg"),
    await ogCard(
      path.join(PUBLIC, "uploads", "projects", "vivek-residence", "hero.jpg"),
    ),
  );

  console.log("icons written: favicon.ico, icon.png, apple-icon.png, og-default.jpg");
}

main();
