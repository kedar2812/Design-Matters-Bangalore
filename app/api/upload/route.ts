import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { auth } from "@/lib/auth";

const MAX_BYTES = 25 * 1024 * 1024;
const ACCEPTED = /^image\/(jpeg|png|webp|avif|tiff|heic)$/;

/**
 * Studio image upload: EXIF-rotates, caps at 2560px, re-encodes to
 * JPEG (next/image serves AVIF/WebP variants on demand), computes the
 * blur placeholder, writes to the media dir Nginx serves in prod.
 */
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
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image is larger than 25 MB." }, { status: 413 });
  }
  if (!ACCEPTED.test(file.type)) {
    return NextResponse.json({ error: "Unsupported image format." }, { status: 415 });
  }

  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const processed = await sharp(buf)
      .rotate()
      .resize({ width: 2560, height: 2560, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
    const blur = await sharp(processed).resize(12).jpeg({ quality: 40 }).toBuffer();

    const year = String(new Date().getFullYear());
    const base = path.parse(file.name).name.toLowerCase()
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
  } catch {
    return NextResponse.json(
      { error: "Could not process that image — is the file intact?" },
      { status: 422 },
    );
  }
}
