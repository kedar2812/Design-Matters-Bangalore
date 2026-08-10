/**
 * Optimises the studio's own photo drop (the "DMA ARCHITECTS" folder) into
 * `public/uploads/studio/`.
 *
 * Two things about the source material shape this script.
 *
 * First, the portraits are iPhone HEICs, and sharp cannot open them: its
 * prebuilt libvips ships libheif without an HEVC decoder, so the container
 * parses (metadata reads fine) but every decode fails with "Decoder plugin
 * generated an error". `heic-convert` is a pure-JS libheif/libde265 build
 * and decodes them without a system codec, which matters because this has
 * to run on a Windows box with no ffmpeg. It is slow — a second or two per
 * frame — and only used for the HEIC inputs.
 *
 * Second, the ten portraits are a single art-directed shoot: same white
 * wall, same bird-of-paradise, same standing pose, and already black and
 * white in camera. So they need no crop (3024x4032 is already the 3:4 the
 * grid wants) and they are written in a greyscale colourspace rather than
 * being desaturated in CSS alone — dropping the two empty chroma planes
 * takes roughly a quarter off the file for no visible change.
 *
 * Kiran did not send a portrait of himself, so his stays the one from the
 * old Wix site. It is re-cropped here from the 7008x4672 original rather
 * than reused at 1200px, because the principal's block renders far larger
 * than the roster tiles and the wider framing keeps the painted mural.
 *
 * Run: npx tsx scripts/import-team-media.ts
 */
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type Sharp } from "sharp";
import convert from "heic-convert";

/** The unzipped client folder. Override with SRC=... when it moves. */
const SRC =
  process.env.SRC ??
  path.join(process.cwd(), "..", "client insight", "DMA ARCHITECTS");
const OUT = path.join(process.cwd(), "public", "uploads", "studio");
const BLURS = path.join(process.cwd(), "lib", "studio-blurs.json");

/** Kiran's portrait on the old Wix site — the untransformed original. */
const KIRAN_URL =
  "https://static.wixstatic.com/media/cb4291_c1db707d6be64779ba0c4a9742f6fa9c~mv2.jpg";

type Job = {
  /** Filename inside SRC. Several arrive without an extension. */
  from: string;
  /** Destination relative to public/uploads/studio. */
  out: string;
  /** Target aspect. Portraits are already 3:4 and are not cropped. */
  ratio?: [number, number];
  /** Longest edge of the written file. */
  width: number;
  /** Crop gravity when `ratio` forces a crop. */
  position?: string;
  /** Written without chroma. Only for genuinely monochrome sources. */
  mono?: boolean;
  quality: number;
};

/* The roster shoot. 3024x4032 in, 900x1200 out: the grid renders these at
   ~445 CSS px on the widest layout, so 900 covers 2x and nothing beyond. */
const PORTRAIT = { ratio: [3, 4] as [number, number], width: 900, mono: true, quality: 84 };

const JOBS: Job[] = [
  { from: "Ar. Harshitha Chandrashekhar", out: "team/harshitha-chandrashekhar.jpg", ...PORTRAIT },
  { from: "Ar. Jerin Sabu_", out: "team/jerin-sabu.jpg", ...PORTRAIT },
  { from: "Ar. Pallavi VK", out: "team/pallavi-vk.jpg", ...PORTRAIT },
  { from: "Ar. Reshma S", out: "team/reshma-s.jpg", ...PORTRAIT },
  { from: "Ar. Mrudula VR", out: "team/mrudula-vr.jpg", ...PORTRAIT },
  { from: "Ar. Divya Malviya", out: "team/divya-malviya.jpg", ...PORTRAIT },
  { from: "Ar. Diya Shah_", out: "team/diya-shah.jpg", ...PORTRAIT },
  { from: "Ar. Prathamesh Jadhav_", out: "team/prathamesh-jadhav.jpg", ...PORTRAIT },
  { from: "Ar. Nidhi V Senan", out: "team/nidhi-v-senan.jpg", ...PORTRAIT },
  { from: "Ar. Anusha Kolli_", out: "team/anusha-kolli.jpg", ...PORTRAIT },

  /* Life at the studio. Wide crops, because every one of these is a group
     of a dozen-plus people strung out horizontally — a square would cut
     somebody off. 1600 covers the widest cell (~790 CSS px) at 2x. */
  {
    from: "Team outing - Nandi Hills.jpg",
    out: "culture/outing-nandi-hills.jpg",
    ratio: [3, 2],
    width: 1600,
    position: "north",
    quality: 82,
  },
  {
    from: "Team outing 01 - Wayanad",
    out: "culture/outing-wayanad.jpg",
    ratio: [3, 2],
    width: 1600,
    position: "north",
    quality: 82,
  },
  {
    from: "Team outing 02 - Wayanad_.jpg",
    out: "culture/outing-poolside.jpg",
    ratio: [3, 2],
    width: 1600,
    position: "centre",
    quality: 82,
  },
  {
    from: "Team outing - Summer batch 24-25.jpg",
    out: "culture/outing-lunch.jpg",
    ratio: [3, 2],
    width: 1600,
    position: "centre",
    quality: 82,
  },
  {
    from: "Office events- Summer batch 24-25_.jpg",
    out: "culture/office-events.jpg",
    ratio: [3, 2],
    width: 1600,
    position: "north",
    quality: 82,
  },
  /* The Kabini group shot. This was originally cut down to 1280x720 to
     serve as the poster for the Kabini clip — on the belief that the clip
     was 1280x720. It is not: the clip is 720x1280, shot upright on a
     phone. So the poster is now a real frame of the video, made with
     ffmpeg alongside it (see the note under VIDEO below), and this file
     goes back to being what it always was — a photograph, sized like the
     other candids, and shown next to the video on the About page. */
  {
    from: "Team outing - Kabini.jpg",
    out: "culture/outing-kabini.jpg",
    ratio: [16, 9],
    width: 1600,
    position: "centre",
    quality: 82,
  },
];

/**
 * The Kabini clip and its poster are NOT produced here — sharp does not
 * decode video. They are made once with ffmpeg and committed:
 *
 *   ffmpeg -i "<src>/Team outing Video - Kabini_.mp4" \
 *     -vf "hqdn3d=1.5:1.5:6:6,unsharp=5:5:0.55:5:5:0.0" \
 *     -c:v libx264 -profile:v high -crf 23 -preset slower -pix_fmt yuv420p \
 *     -g 60 -c:a aac -b:a 96k -movflags +faststart \
 *     public/uploads/studio/culture/outing-kabini.mp4
 *
 *   ffmpeg -ss 13.2 -i public/uploads/studio/culture/outing-kabini.mp4 \
 *     -frames:v 1 public/uploads/studio/culture/outing-kabini-poster.jpg
 *
 * The studio's copy of the clip came through a messenger app: 720x1280,
 * 1.85 Mbps, with the blocking and mosquito noise that implies. Nothing
 * can put back detail that was thrown away there, so the filter pair only
 * cleans up what the re-compression added — hqdn3d takes the noise out of
 * the sky and the still water, unsharp puts the edge back on the palm
 * fronds. CRF 23 then spends enough bits not to re-introduce the artefacts
 * that were just removed; it costs 1.1 MB over the original, which is
 * bytes nobody pays until they press play.
 *
 * If the studio can ever find the camera original, re-run this against
 * that instead and drop the filters — they exist to undo someone else's
 * compression, not to improve a clean source.
 *
 * The poster is a frame of the finished encode, so the still and the first
 * moment of playback are the same picture. 13.2s is the palm avenue, which
 * is the one shot in the clip composed for an upright frame.
 */

/** Decodes to a sharp pipeline, routing HEIC through the JS decoder. */
async function open(file: string) {
  const buf = await readFile(file);
  // ftyp brand at bytes 8..12. The client's HEICs arrive without a
  // file extension, so sniff the container rather than trusting the name.
  const brand = buf.toString("latin1", 8, 12);
  if (brand === "heic" || brand === "heix" || brand === "mif1") {
    const jpeg = await convert({ buffer: buf, format: "JPEG", quality: 1 });
    return sharp(Buffer.from(jpeg));
  }
  return sharp(buf).rotate();
}

/** A 12px-wide JPEG data URI — what next/image renders before the real file. */
async function blurOf(pipeline: Sharp) {
  const b = await pipeline
    .clone()
    .resize(12, null, { fit: "inside" })
    .jpeg({ quality: 40 })
    .toBuffer();
  return `data:image/jpeg;base64,${b.toString("base64")}`;
}

async function main() {
  const blurs: Record<string, string> = JSON.parse(
    await readFile(BLURS, "utf8").catch(() => "{}"),
  );

  for (const job of JOBS) {
    const dest = path.join(OUT, job.out);
    await mkdir(path.dirname(dest), { recursive: true });

    let img = await open(path.join(SRC, job.from));
    const meta = await img.metadata();

    if (job.ratio) {
      const [w, h] = job.ratio;
      img = img.resize(job.width, Math.round((job.width * h) / w), {
        fit: "cover",
        position: job.position ?? "centre",
      });
    } else {
      img = img.resize(job.width, null, { withoutEnlargement: true });
    }
    if (job.mono) img = img.toColourspace("b-w");

    const out = img.jpeg({ quality: job.quality, mozjpeg: true, progressive: true });
    const { size } = await out.clone().toFile(dest);
    blurs[`/uploads/studio/${job.out}`] = await blurOf(out);

    console.log(
      `${job.out.padEnd(42)} ${meta.width}x${meta.height} -> ${job.width}w  ${(size / 1024).toFixed(0)}KB`,
    );
  }

  /* Kiran — fetched rather than read from SRC, since he isn't in the drop.
     A 4:5 slice off the landscape original: tighter than the full frame so
     he holds the block, wide enough to keep the painted mural behind him. */
  const res = await fetch(KIRAN_URL);
  if (!res.ok) throw new Error(`Kiran portrait: HTTP ${res.status}`);
  const src = sharp(Buffer.from(await res.arrayBuffer()));
  const { width = 0, height = 0 } = await src.metadata();
  const cw = Math.round(height * 0.8); // 4:5 against the full frame height
  const left = Math.round(width * 0.355 - cw / 2); // centred on his head
  const kiran = src
    .extract({ left: Math.max(0, left), top: 0, width: cw, height })
    .resize(1500, 1875, { fit: "cover" })
    .jpeg({ quality: 88, mozjpeg: true, progressive: true });
  const dest = path.join(OUT, "team/kiran-hanumaiah.jpg");
  const { size } = await kiran.clone().toFile(dest);
  blurs["/uploads/studio/team/kiran-hanumaiah.jpg"] = await blurOf(kiran);
  console.log(
    `team/kiran-hanumaiah.jpg${" ".repeat(18)} ${width}x${height} -> 1500w  ${(size / 1024).toFixed(0)}KB`,
  );

  await writeFile(BLURS, `${JSON.stringify(blurs, null, 2)}\n`);
  console.log(`\n${JOBS.length + 1} files, ${Object.keys(blurs).length} blurs`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
