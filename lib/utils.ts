/** Tiny class-name joiner — no runtime dep needed. */
export function cn(...parts: Array<string | undefined | null | false>) {
  return parts.filter(Boolean).join(" ");
}

/**
 * The studio's timezone, pinned.
 *
 * Without it this formatted in whatever zone the process happened to be
 * in: IST in the browser, UTC on the server. Any timestamp within five
 * and a half hours of midnight UTC then rendered as one date in the
 * server HTML and a different one after hydration — React threw a text
 * mismatch, and the first paint showed the wrong day. A real enquiry
 * submitted at 00:29 IST is exactly that case.
 *
 * Pinning it also makes the date *correct* rather than merely consistent:
 * this is a Bengaluru studio, and "when did that enquiry arrive" means
 * the day it arrived there, not the day it was in London.
 */
const STUDIO_TZ = "Asia/Kolkata";

export function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: STUDIO_TZ,
  });
}
