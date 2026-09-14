/**
 * Serves photographs uploaded from the dashboard.
 *
 * `/api/upload` writes into `public/uploads/media/<year>/`, and in
 * production Next.js only serves the files `public/` held when the server
 * started. So every image the studio uploaded answered 404 (and 400
 * through the image optimiser) until the app was next restarted: a
 * project saved with a new photograph showed a broken frame on the live
 * site. Nothing had caught it because nobody had uploaded through the
 * dashboard on the server yet.
 *
 * Files that did exist at startup are still served by Next.js directly and
 * never reach this handler. Everything newer lands here and is read from
 * disk, which is also the path the image optimiser follows, so `next/image`
 * works on a fresh upload immediately.
 */
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

const ROOT = path.join(process.cwd(), "public", "uploads", "media");

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const segments = (await params).path;
  const type = TYPES[path.extname(segments.at(-1) ?? "").toLowerCase()];
  const file = path.resolve(ROOT, ...segments);

  // Only files inside the media folder, and only image types: a `..` in
  // the URL must never walk out into the rest of the application.
  if (!type || !file.startsWith(ROOT + path.sep)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const info = await stat(file);
    if (!info.isFile()) return new Response("Not found", { status: 404 });
    return new Response(new Uint8Array(await readFile(file)), {
      headers: {
        "Content-Type": type,
        "Content-Length": String(info.size),
        // Upload names carry a random suffix, so a URL never changes content.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
