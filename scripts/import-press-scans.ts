/**
 * Cuts the three Deccan Herald cuttings out of the single scan sheet in
 * `client insight/press.jpg` so each press entry has its own image.
 *
 * The supplied scan is one 1152×817 sheet holding all three cuttings side
 * by side, which is fine as a reference and useless as page furniture.
 * Crop boxes are in source pixels and were read off the sheet by eye —
 * re-run after replacing the scan and check the output.
 *
 * NOTE: this scan is too low-resolution to read the publication dates in
 * the page headers. The dates are deliberately absent from lib/press.ts
 * rather than approximated; a better scan is on the request list.
 *
 * Run: npx tsx scripts/import-press-scans.ts
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SOURCE = path.join(
  process.cwd(),
  "..",
  "client insight",
  "press.jpg",
);
const OUT = path.join(process.cwd(), "public", "uploads", "studio", "press");

type Crop = {
  out: string;
  /** left, top, width, height — in source pixels. */
  box: [number, number, number, number];
  note: string;
};

const CROPS: Crop[] = [
  {
    out: "dh-natural-light.jpg",
    box: [272, 4, 528, 810],
    note: "Let There Be Natural Light — skylights",
  },
  // These two sit on a shared newspaper page: the DMA article on the left
  // of the column, an unrelated books column on the right. Cropped to the
  // article only — the neighbouring piece in frame reads as carelessness.
  {
    out: "dh-culinary-haven.jpg",
    box: [804, 4, 252, 404],
    note: "Creating a culinary haven — kitchens",
  },
  {
    out: "dh-gazebos-pergolas.jpg",
    box: [804, 418, 250, 396],
    note: "Gazebos, pergolas now garden musts",
  },
];

async function main() {
  await mkdir(OUT, { recursive: true });
  const meta = await sharp(SOURCE).metadata();
  console.log(`source: ${meta.width}×${meta.height}`);

  const blurs: Record<string, string> = {};

  for (const c of CROPS) {
    const [left, top, width, height] = c.box;
    const buf = await sharp(SOURCE)
      .extract({ left, top, width, height })
      // Upscaling a scan doesn't add detail, but the frames render around
      // 600px wide and a 2x file keeps the newsprint texture from turning
      // to mush in the optimiser.
      .resize(width * 2, height * 2, { kernel: "lanczos3" })
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer();

    const dest = path.join(OUT, c.out);
    await writeFile(dest, buf);

    const b = await sharp(buf).resize(12).jpeg({ quality: 40 }).toBuffer();
    blurs[`/uploads/studio/press/${c.out}`] = `data:image/jpeg;base64,${b.toString("base64")}`;

    console.log(
      `✓ ${c.out.padEnd(26)} ${width}×${height} → ${width * 2}×${height * 2}  ` +
        `${Math.round(buf.length / 1024)} KB  — ${c.note}`,
    );
  }

  // Merge into the studio blur map the other studio assets already use.
  const blurFile = path.join(process.cwd(), "lib", "studio-blurs.json");
  const existing = JSON.parse(
    await import("node:fs/promises").then((fs) => fs.readFile(blurFile, "utf8")),
  ) as Record<string, string>;
  await writeFile(blurFile, JSON.stringify({ ...existing, ...blurs }, null, 2) + "\n");
  console.log(`\nMerged ${Object.keys(blurs).length} blurs into lib/studio-blurs.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
