/**
 * Derives every brand asset the site and the emails need from the two
 * files the client approved: `dma_logo_light.png` (dark artwork, for light
 * grounds) and `dma_logo_dark.png` (white artwork, for dark grounds).
 *
 * Nothing here redraws the mark. Every output is a crop or a resize of the
 * approved artwork, because the approved artwork is the deliverable and a
 * hand-tuned lookalike would drift from it the first time either file is
 * reissued.
 *
 * The reason crops are needed at all: the approved file is a *square
 * lockup* — a ruled frame around "DMA", with "Architecture + Design" set
 * beneath it. That is right where there is room for it, and wrong in a
 * navigation bar, where the whole thing would be about thirty pixels tall
 * and the tagline would resolve to grey mush. So the lockup goes in the
 * footer and the emails' header, and the DMA wordmark inside it — which
 * is a clean ~2.9:1 horizontal band, clear of the frame rails — is cropped
 * out for the nav.
 *
 * The bands are measured rather than hard-coded, because the two files do
 * not share a canvas size (849x854 and 869x858) and a fixed rectangle
 * would be a pixel off on one of them.
 *
 * Run: npx tsx scripts/make-brand-assets.ts
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, "public");
const BRAND = path.join(PUBLIC, "brand");
const EMAIL = path.join(PUBLIC, "email");

type Box = { left: number; top: number; width: number; height: number };

/**
 * Finds the horizontal bands of actual artwork, ignoring the frame rails.
 *
 * The frame runs the full height of the canvas, so a naive row profile
 * finds content on every row and no gaps at all. Skipping a margin on
 * each side removes the rails and leaves the three real bands: the DMA
 * wordmark, then "Architecture", then "+ Design".
 */
async function bands(file: string) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const rail = Math.round(W * 0.07);

  const alphaAt = (x: number, y: number) => data[(y * W + x) * C + 3]!;

  const rows: number[] = [];
  for (let y = 0; y < H; y++) {
    let n = 0;
    for (let x = rail; x < W - rail; x++) if (alphaAt(x, y) > 12) n++;
    rows.push(n);
  }

  const found: Array<[number, number]> = [];
  let start: number | null = null;
  for (let y = 0; y < H; y++) {
    const on = rows[y]! > 3;
    if (on && start === null) start = y;
    if (!on && start !== null) {
      if (y - start > 10) found.push([start, y - 1]);
      start = null;
    }
  }
  if (start !== null) found.push([start, H - 1]);

  /** Horizontal extent of one band, so the crop is tight on both axes. */
  const extent = (y0: number, y1: number, x0 = rail, x1 = W - rail) => {
    let mn = W;
    let mx = -1;
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x < x1; x++)
        if (alphaAt(x, y) > 12) {
          if (x < mn) mn = x;
          if (x > mx) mx = x;
        }
    return { mn, mx };
  };

  return { W, H, found, extent };
}

/** The DMA wordmark band, cropped tight with a breath of padding. */
async function wordmarkBox(file: string): Promise<Box> {
  const { W, H, found, extent } = await bands(file);
  const [y0, y1] = found[0]!; // the wordmark is the topmost band
  const { mn, mx } = extent(y0, y1);
  const pad = Math.round((y1 - y0) * 0.06);
  const left = Math.max(0, mn - pad);
  const top = Math.max(0, y0 - pad);
  return {
    left,
    top,
    width: Math.min(W - left, mx - mn + 1 + pad * 2),
    height: Math.min(H - top, y1 - y0 + 1 + pad * 2),
  };
}

/**
 * Just the D, for the favicon.
 *
 * "DMA" is nearly three times as wide as it is tall, so squeezed into a
 * 16px square it is three grey smudges. The D alone fills the square, and
 * it is the letter carrying the orange quadrant — the one piece of the
 * mark that survives being shrunk to a tab.
 */
async function letterDBox(file: string): Promise<Box> {
  const wm = await wordmarkBox(file);
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .extract(wm)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;

  // Column profile across the wordmark: the three letters are separated
  // by empty columns, so the first run of ink is the D.
  const cols: number[] = [];
  for (let x = 0; x < W; x++) {
    let n = 0;
    for (let y = 0; y < H; y++) if (data[(y * W + x) * C + 3]! > 12) n++;
    cols.push(n);
  }
  let x0: number | null = null;
  let x1 = W - 1;
  for (let x = 0; x < W; x++) {
    const on = cols[x]! > 1;
    if (on && x0 === null) x0 = x;
    if (!on && x0 !== null && x - x0 > 20) {
      x1 = x - 1;
      break;
    }
  }
  const left = wm.left + (x0 ?? 0);
  return { left, top: wm.top, width: x1 - (x0 ?? 0) + 1, height: wm.height };
}

/** Trim the transparent surround off the full lockup. */
const lockup = (file: string, width: number) =>
  sharp(file).trim({ threshold: 6 }).resize({ width }).png({ compressionLevel: 9 }).toBuffer();

async function main() {
  await mkdir(BRAND, { recursive: true });
  await mkdir(EMAIL, { recursive: true });

  const LIGHT = path.join(ROOT, "dma_logo_light.png");
  const DARK = path.join(ROOT, "dma_logo_dark.png");

  for (const [name, file] of [
    ["light", LIGHT],
    ["dark", DARK],
  ] as const) {
    // The full lockup, for the footer and anywhere else with room.
    await writeFile(path.join(BRAND, `logo-${name}.png`), await lockup(file, 900));

    // The DMA wordmark, for the nav and the email header.
    const box = await wordmarkBox(file);
    await writeFile(
      path.join(BRAND, `wordmark-${name}.png`),
      await sharp(file)
        .extract(box)
        .resize({ width: 1200 })
        .png({ compressionLevel: 9 })
        .toBuffer(),
    );
    console.log(`${name}: wordmark box`, box);
  }

  // Email clients strip SVG and many do not honour prefers-color-scheme on
  // images, so the email header gets one fixed file: the dark artwork,
  // which is what the bone-coloured mail shell needs. ~100px tall, per
  // SETUP-EMAIL.md, which displays it at 34.
  await writeFile(
    path.join(EMAIL, "logo.png"),
    await sharp(LIGHT)
      .extract(await wordmarkBox(LIGHT))
      .resize({ height: 100 })
      .png({ compressionLevel: 9 })
      .toBuffer(),
  );

  // The favicon source: the white D, so it reads on the ink ground the
  // icons already use.
  await writeFile(
    path.join(BRAND, "letter-d-dark.png"),
    await sharp(DARK)
      .extract(await letterDBox(DARK))
      .resize({ height: 512 })
      .png({ compressionLevel: 9 })
      .toBuffer(),
  );

  console.log("brand assets written to public/brand and public/email");
}

main();
