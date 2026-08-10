/**
 * The analytics date ranges, and the bucketing each one needs.
 *
 * Two things drive this. First, a chart is only readable while the bars
 * are wide enough to hover: thirty daily bars across a card is
 * comfortable, three hundred and sixty-five is a smear. So longer ranges
 * roll up into weeks and then months. Second, "all time" has no fixed
 * length — it starts at the first page view ever recorded, which on a
 * site that launched last month is thirty days and in three years is a
 * thousand. It has to pick its own granularity from what it finds.
 *
 * Kept out of the page so the bucketing can be reasoned about — and
 * corrected — without touching layout.
 */

export const RANGES = [
  { key: "7", label: "7 days", days: 7 },
  { key: "30", label: "30 days", days: 30 },
  { key: "90", label: "90 days", days: 90 },
  { key: "365", label: "12 months", days: 365 },
  { key: "all", label: "All time", days: null },
] as const;

export type RangeKey = (typeof RANGES)[number]["key"];

export const DEFAULT_RANGE: RangeKey = "30";

export function resolveRange(raw: string | undefined): (typeof RANGES)[number] {
  return RANGES.find((r) => r.key === raw) ?? RANGES.find((r) => r.key === DEFAULT_RANGE)!;
}

export type Grain = "day" | "week" | "month";

/** Roughly 40–90 buckets is the readable band for a card-width chart. */
export function grainFor(spanDays: number): Grain {
  if (spanDays <= 92) return "day";
  if (spanDays <= 730) return "week";
  return "month";
}

const DAY = 86_400_000;

/** Local-time day key. `toISOString` would bucket by UTC and shift the
 *  boundary by five and a half hours for a studio in Bengaluru. */
function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** The Monday on or before `d`. */
function startOfWeek(d: Date) {
  const c = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const shift = (c.getDay() + 6) % 7; // Sunday = 0 → 6
  c.setDate(c.getDate() - shift);
  return c;
}

export type Bucket = { key: string; label: string; count: number };

/**
 * An empty series covering `from`..`to` at the given grain, oldest first.
 *
 * Pre-seeded with zeroes so a quiet week is a row of empty bars rather
 * than a gap the eye reads as "no data recorded".
 */
export function buildBuckets(from: Date, to: Date, grain: Grain): Bucket[] {
  const out: Bucket[] = [];

  if (grain === "day") {
    const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    while (cursor <= to) {
      out.push({
        key: dayKey(cursor),
        label: cursor.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        count: 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return out;
  }

  if (grain === "week") {
    const cursor = startOfWeek(from);
    while (cursor <= to) {
      out.push({
        key: dayKey(cursor),
        label: cursor.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        count: 0,
      });
      cursor.setDate(cursor.getDate() + 7);
    }
    return out;
  }

  const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  while (cursor <= to) {
    out.push({
      key: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`,
      label: cursor.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      count: 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return out;
}

/** Which bucket a timestamp belongs to, matching `buildBuckets` keys. */
export function bucketKey(d: Date, grain: Grain) {
  if (grain === "month") {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  if (grain === "week") return dayKey(startOfWeek(d));
  return dayKey(d);
}

export const grainNoun = (g: Grain) => (g === "day" ? "day" : g === "week" ? "week" : "month");

/** Whole days between two dates, at least 1. */
export const spanDays = (from: Date, to: Date) =>
  Math.max(1, Math.round((to.getTime() - from.getTime()) / DAY));
