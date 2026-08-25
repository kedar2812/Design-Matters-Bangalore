import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { auth } from "@/lib/auth";

const MAX_BYTES = 25 * 1024 * 1024;

/**
 * Studio image upload: EXIF-rotates, caps at 2560px, re-encodes to
 * JPEG (next/image serves AVIF/WebP variants on demand), computes the
 * blur placeholder, writes to the media dir Nginx serves in prod.
 */

/**
 * What the file actually is, read from its first bytes.
 *
 * The browser's `file.type` is not trustworthy here. Safari on iOS
 * reports HEIC inconsistently, and a file dragged in from some folders
 * arrives with an empty type — which the previous allow-list rejected as
 * "unsupported format" even when the file was an ordinary JPEG. Magic
 * numbers are the same four bytes on every platform.
 */
function sniff(buf: Buffer): "jpeg" | "png" | "webp" | "avif" | "heic" | "tiff" | null {
  if (buf.length < 16) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (buf.toString("latin1", 0, 8) === "\x89PNG\r\n\x1a\n") return "png";
  if (buf.toString("latin1", 0, 4) === "RIFF" && buf.toString("latin1", 8, 12) === "WEBP")
    return "webp";
  if (buf.toString("latin1", 0, 2) === "II" || buf.toString("latin1", 0, 2) === "MM")
    return "tiff";
  // ISO-BMFF: a size field, then "ftyp", then the brand.
  if (buf.toString("latin1", 4, 8) === "ftyp") {
    const brand = buf.toString("latin1", 8, 12);
    if (brand === "avif" || brand === "avis") return "avif";
    // heic/heix/hevc/hevx/mif1/msf1 are all still-image HEIF.
    if (/^(heic|heix|hevc|hevx|mif1|msf1|heim|heis)$/.test(brand)) return "heic";
  }
  return null;
}

/**
 * Decode to a sharp pipeline.
 *
 * sharp's prebuilt libvips ships libheif without an HEVC decoder, so an
 * iPhone HEIC parses far enough to read metadata and then fails on every
 * decode. The old route advertised `image/heic` in its allow-list and
 * then handed those files straight to sharp, so the studio's own camera
 * roll — the single most likely source of an upload here — failed with
 * "is the file intact?", which is both wrong and unactionable.
 *
 * `heic-convert` is a pure-JS libheif/libde265 build and needs no system
 * codec. It is slow, a second or two a frame, so it is loaded lazily and
 * only for the files that actually need it.
 */
async function decode(buf: Buffer, kind: NonNullable<ReturnType<typeof sniff>>) {
  if (kind === "heic") {
    const { default: convert } = await import("heic-convert");
    const jpeg = await convert({ buffer: buf as never, format: "JPEG", quality: 1 });
    return sharp(Buffer.from(jpeg));
  }
  return sharp(buf).rotate();
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "That file is empty." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `That image is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 25 MB.` },
      { status: 413 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const kind = sniff(buf);
  if (!kind) {
    return NextResponse.json(
      { error: "That doesn't look like an image. JPEG, PNG, WebP, AVIF, TIFF and HEIC work." },
      { status: 415 },
    );
  }

  try {
    const pipeline = await decode(buf, kind);
    const processed = await pipeline
      .resize({ width: 2560, height: 2560, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
    const blur = await sharp(processed).resize(12).jpeg({ quality: 40 }).toBuffer();

    const year = String(new Date().getFullYear());
    const base =
      path
        .parse(file.name)
        .name.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 60) || "image";
    const name = `${base}-${crypto.randomBytes(4).toString("hex")}.jpg`;

    const dir = path.join(process.cwd(), "public", "uploads", "media", year);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), processed);

    return NextResponse.json({
      url: `/uploads/media/${year}/${name}`,
      blurData: `data:image/jpeg;base64,${blur.toString("base64")}`,
    });
  } catch (err) {
    // The message matters: this is the one failure the studio sees, and
    // "is the file intact?" sent them looking at a file that was fine.
    console.error("[upload] failed", { name: file.name, kind, err });
    return NextResponse.json(
      {
        error:
          kind === "heic"
            ? "That iPhone photo couldn't be converted. Re-save it as JPEG and try again."
            : "That image couldn't be processed. It may be corrupt or use an unusual encoding.",
      },
      { status: 422 },
    );
  }
}
