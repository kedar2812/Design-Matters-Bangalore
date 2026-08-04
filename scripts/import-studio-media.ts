/**
 * Pulls the studio photography off the old Wix site and optimises it into
 * `public/uploads/studio/`.
 *
 * Wix serves the untouched original when the `/v1/<transforms>/` chain is
 * stripped off a `static.wixstatic.com/media/<id>~mv2.jpg` URL — the site
 * only ever rendered these at a few hundred pixels, but the files behind
 * them are 6–18 MB camera originals. Those are what we want; the brief is
 * explicit that assets get committed here rather than hotlinked.
 *
 * The name↔face mapping below is not guesswork. On the old About page each
 * portrait appears in the markup immediately before that person's name,
 * and five of the eight files are named after their subject (Jerin_edited,
 * MAITRI_edited, RESHMA, MRUDULA, SHEFREEN) — those five confirm the
 * offset, which is what lets the three unnamed files be placed.
 *
 * SUPERSEDED IN PART — do not re-run this without reading the list below.
 * The studio has since sent its own photography, imported by
 * scripts/import-team-media.ts, and that is now the source of truth for:
 *
 *   team/kiran-hanumaiah.jpg   re-cropped larger from the same original
 *   team/jerin-sabu.jpg        replaced by the studio's own shoot
 *   team/pallavi-vk.jpg        replaced by the studio's own shoot
 *   team/harshitha.jpg         replaced by team/harshitha-chandrashekhar.jpg
 *
 * Re-running this file would quietly overwrite four current portraits with
 * the older, smaller Wix versions and resurrect four culture photographs
 * that the About page no longer uses. The collage jobs are still live and
 * still correct. Kept whole, rather than trimmed, because it is the record
 * of where the collage came from and how to get any of it back.
 *
 * Run: npx tsx scripts/import-studio-media.ts
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const MEDIA = (id: string) => `https://static.wixstatic.com/media/${id}~mv2.jpg`;
const OUT = path.join(process.cwd(), "public", "uploads", "studio");

type Job = {
  id: string;
  /** Destination, relative to public/uploads/studio. */
  out: string;
  /** Longest edge after resize. */
  width: number;
  /** Portraits are cropped to a common 3:4 so the grid stays even. */
  ratio?: [number, number];
  note: string;
};

const JOBS: Job[] = [
  /* -------- §2.4 the collage Kiran asked us to keep, in its own order */
  {
    id: "cb4291_317762d5d3f3497d9d594be898c82ce0",
    out: "collage/signage.jpg",
    width: 1800,
    note: "studio signage wall with the plumeria (tall left)",
  },
  {
    id: "cb4291_f68276250ece4af2a61205a01f007352",
    out: "collage/materials.jpg",
    width: 2400,
    note: "materials flat-lay — timber samples, swatches, open book",
  },
  {
    id: "cb4291_14a989dc063a428eae53bd8510031dab",
    out: "collage/jaali.jpg",
    width: 1800,
    note: "terracotta jaali screen with the pale green chair",
  },
  {
    id: "cb4291_8a22b3cbfdcd4f5195f8d2e60894873a",
    out: "collage/meeting-room.jpg",
    width: 2400,
    note: "mural-walled meeting room",
  },

  /* ---------------------------------- §2.5 portraits we actually have */
  {
    id: "cb4291_c1db707d6be64779ba0c4a9742f6fa9c",
    out: "team/kiran-hanumaiah.jpg",
    width: 1200,
    ratio: [3, 4],
    note: "Kiran Hanumaiah — the photo Kiran pointed at",
  },
  {
    id: "cb4291_cbf7c40751924038aadf2a95af56dc7b",
    out: "team/harshitha.jpg",
    width: 1200,
    ratio: [3, 4],
    note: "Harshitha",
  },
  {
    id: "cb4291_ae304e6faa9c49e1a45351202cf0fb27",
    out: "team/jerin-sabu.jpg",
    width: 1200,
    ratio: [3, 4],
    note: "Jerin Sabu",
  },
  {
    id: "cb4291_61ec2c662d63415598b951963d65611a",
    out: "team/pallavi-vk.jpg",
    width: 1200,
    ratio: [3, 4],
    note: "Pallavi VK — source is black and white, hence the site-wide grayscale treatment",
  },

  /* ------------------------------------------- §2.5 the culture block */
  {
    id: "cb4291_5fd2435da3eb45809f380a9de53e8b6b",
    out: "culture/team-group.jpg",
    width: 2400,
    note: "the whole studio, seated on the steps outdoors",
  },
  {
    id: "cb4291_aeca1cdaf09e4309bfcb4632d7125be2",
    out: "culture/outing-walkway.jpg",
    width: 2000,
    note: "team on the covered walkway, Nandi Hills outing",
  },
  {
    id: "cb4291_ad29b7a04f9347d8b0a84dcb7a500182",
    out: "culture/studio-signage.jpg",
    width: 2400,
    note: "team in the studio in front of the signage wall",
  },
  {
    id: "cb4291_3d3729a29619432da070841cc8de33e3",
    out: "culture/studio-desks.jpg",
    width: 2400,
    note: "the studio at work — the long desk under the blue wall",
  },
  {
    id: "cb4291_940e643901a9459497599c86b5ad6c0f",
    out: "culture/studio-lounge.jpg",
    width: 2000,
    note: "the studio lounge corner",
  },
];

/** The 12px JPEG data URI next/image wants for `blurDataURL`. */
async function blurOf(buf: Buffer) {
  const b = await sharp(buf).resize(12).jpeg({ quality: 40 }).toBuffer();
  return `data:image/jpeg;base64,${b.toString("base64")}`;
}

async function main() {
  const blurs: Record<string, string> = {};

  for (const job of JOBS) {
    const dest = path.join(OUT, job.out);
    await mkdir(path.dirname(dest), { recursive: true });

    const res = await fetch(MEDIA(job.id));
    if (!res.ok) {
      console.error(`✗ ${job.out} — ${res.status} ${res.statusText}`);
      continue;
    }
    const source = Buffer.from(await res.arrayBuffer());
    const meta = await sharp(source).metadata();

    let pipeline = sharp(source).rotate();
    if (job.ratio) {
      const [rw, rh] = job.ratio;
      pipeline = pipeline.resize(job.width, Math.round((job.width * rh) / rw), {
        fit: "cover",
        // Portraits: keep the head in frame rather than centre-cropping it.
        position: sharp.strategy.attention,
      });
    } else {
      // Never upscale — `withoutEnlargement` keeps a small source honest.
      pipeline = pipeline.resize(job.width, undefined, { withoutEnlargement: true });
    }

    const out = await pipeline.jpeg({ quality: 88, mozjpeg: true }).toBuffer();
    await writeFile(dest, out);
    blurs[`/uploads/studio/${job.out}`] = await blurOf(out);

    const after = await sharp(out).metadata();
    console.log(
      `✓ ${job.out.padEnd(30)} ${meta.width}×${meta.height} → ${after.width}×${after.height}` +
        `  ${Math.round(out.length / 1024)} KB  — ${job.note}`,
    );
  }

  // One generated file so the components can render a blur placeholder
  // without a database round-trip; these are static assets, not content.
  const blurFile = path.join(process.cwd(), "lib", "studio-blurs.json");
  await writeFile(blurFile, JSON.stringify(blurs, null, 2) + "\n");
  console.log(`\nWrote ${Object.keys(blurs).length} blur placeholders → lib/studio-blurs.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
