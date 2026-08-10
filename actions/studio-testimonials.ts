"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/require-auth";

const testimonialSchema = z.object({
  id: z.string().optional(),
  author: z.string().trim().min(2, "Who said it?").max(120),
  context: z.string().max(160).optional().or(z.literal("")),
  rating: z.coerce.number().int().min(1).max(5),
  text: z.string().trim().min(10, "The testimonial itself is missing.").max(8000),
  excerpt: z.string().max(600).optional().or(z.literal("")),
  sourceDate: z.string().max(60).optional().or(z.literal("")),
  featured: z.boolean(),
  published: z.boolean(),
});

export type SaveTestimonialResult =
  | { ok: true; id: string }
  | { ok: false; errors: Record<string, string[]> };

function revalidateTestimonials() {
  revalidatePath("/");
  revalidatePath("/testimonials");
  revalidatePath("/studio/testimonials");
}

export async function saveTestimonial(input: unknown): Promise<SaveTestimonialResult> {
  await requireUser();

  const parsed = testimonialSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    };
  }
  const d = parsed.data;

  const data = {
    author: d.author,
    context: d.context || null,
    rating: d.rating,
    text: d.text,
    excerpt: d.excerpt || null,
    sourceDate: d.sourceDate || null,
    featured: d.featured,
    published: d.published,
  };

  let id = d.id;
  if (id) {
    await prisma.testimonial.update({ where: { id }, data });
  } else {
    const last = await prisma.testimonial.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const created = await prisma.testimonial.create({
      data: { ...data, source: "manual", order: (last?.order ?? -1) + 1 },
    });
    id = created.id;
  }

  revalidateTestimonials();
  return { ok: true, id };
}

export async function toggleTestimonialPublished(id: string) {
  await requireUser();
  const t = await prisma.testimonial.findUnique({ where: { id } });
  if (!t) return;
  await prisma.testimonial.update({ where: { id }, data: { published: !t.published } });
  revalidateTestimonials();
}

export async function toggleTestimonialFeatured(id: string) {
  await requireUser();
  const t = await prisma.testimonial.findUnique({ where: { id } });
  if (!t) return;
  await prisma.testimonial.update({ where: { id }, data: { featured: !t.featured } });
  revalidateTestimonials();
}

export async function deleteTestimonial(id: string) {
  await requireUser();
  await prisma.testimonial.delete({ where: { id } });
  revalidateTestimonials();
}

/** Swap display order with the neighbour above/below. */
/**
 * Persist a whole display order at once.
 *
 * Replaces a swap-two-neighbours action that wrote array *indices* into
 * `order`. That is only correct while the stored values are exactly
 * 0..n-1, and they stop being that as soon as a row is deleted or the
 * Google sync appends — after which writing an index can collide with a
 * row nobody touched, leaving two testimonials sharing a position and
 * their relative order up to Postgres. The projects list had already
 * reached that state; this is the same fix applied before it bites here.
 */
export async function reorderTestimonials(ids: string[]) {
  await requireUser();

  const all = await prisma.testimonial.findMany({
    orderBy: { order: "asc" },
    select: { id: true },
  });
  const known = new Set(all.map((t) => t.id));

  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const id of ids) {
    if (known.has(id) && !seen.has(id)) {
      seen.add(id);
      ordered.push(id);
    }
  }
  // Anything the client didn't know about — a review synced in another
  // tab mid-drag — keeps its relative position at the end rather than
  // being dropped from the ordering.
  for (const t of all) {
    if (!seen.has(t.id)) ordered.push(t.id);
  }

  await prisma.$transaction(
    ordered.map((id, order) => prisma.testimonial.update({ where: { id }, data: { order } })),
  );
  revalidateTestimonials();
}

/* ----------------------------------------------------- Google sync */

export type SyncResult =
  | { ok: true; added: number; rating: number; count: number }
  | { ok: false; error: string };

type PlacesReview = {
  name?: string;
  rating?: number;
  text?: { text?: string };
  authorAttribution?: { displayName?: string };
  publishTime?: string;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Pull the studio's Google rating and its latest reviews via the
 * Places API (New) and fold them into the dashboard.
 *
 *  - the live rating + review count land in the editable
 *    "testimonials" content section, so the badge on the site updates
 *    itself;
 *  - reviews we haven't seen before are created as HIDDEN drafts for
 *    the studio to curate — nothing goes on the site unreviewed.
 *
 * Google only returns the five most relevant reviews per place — this
 * keeps the rating fresh and catches new writing, it does not replace
 * the full seeded archive. Needs GOOGLE_PLACES_API_KEY in the server
 * env (and optionally GOOGLE_PLACE_ID to skip the lookup step).
 */
export async function syncGoogleReviews(): Promise<SyncResult> {
  await requireUser();

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    return {
      ok: false,
      error:
        "No Google Places API key is configured. Add GOOGLE_PLACES_API_KEY to the server's .env (Google Cloud Console → enable “Places API (New)” → create an API key) and restart the app.",
    };
  }

  try {
    // Resolve the place id once per sync unless it's pinned in the env.
    let placeId = process.env.GOOGLE_PLACE_ID;
    if (!placeId) {
      const search = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": key,
          "X-Goog-FieldMask": "places.id,places.displayName",
        },
        body: JSON.stringify({
          textQuery: "DesignMatters architects, 12th A Main Rd, HAL 2nd Stage, Indiranagar, Bengaluru",
        }),
        cache: "no-store",
      });
      if (!search.ok) throw new Error(`Place lookup failed (${search.status}).`);
      const found = (await search.json()) as { places?: { id: string }[] };
      placeId = found.places?.[0]?.id;
      if (!placeId) throw new Error("Google couldn't find the studio's listing.");
    }

    const res = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        headers: {
          "X-Goog-Api-Key": key,
          "X-Goog-FieldMask": "rating,userRatingCount,reviews",
        },
        cache: "no-store",
      },
    );
    if (!res.ok) throw new Error(`Review fetch failed (${res.status}).`);
    const place = (await res.json()) as {
      rating?: number;
      userRatingCount?: number;
      reviews?: PlacesReview[];
    };

    // Fold the live rating into the editable page copy, keeping any
    // other overrides the studio has saved on that section.
    if (place.rating && place.userRatingCount) {
      const row = await prisma.siteSetting.findUnique({ where: { key: "testimonials" } });
      const value = {
        ...(row?.value && typeof row.value === "object" ? (row.value as object) : {}),
        ratingValue: place.rating.toFixed(1),
        reviewCount: String(place.userRatingCount),
      };
      await prisma.siteSetting.upsert({
        where: { key: "testimonials" },
        update: { value },
        create: { key: "testimonials", value },
      });
    }

    // New reviews arrive as hidden drafts. Dedupe on the review's
    // resource name AND on author (the seeded archive predates the
    // API ids, so the same person must not come back as a duplicate).
    let added = 0;
    const existing = await prisma.testimonial.findMany({
      select: { googleId: true, author: true },
    });
    const seenIds = new Set(existing.map((t) => t.googleId).filter(Boolean));
    const seenAuthors = new Set(existing.map((t) => t.author.trim().toLowerCase()));

    for (const r of place.reviews ?? []) {
      const text = r.text?.text?.trim();
      const author = r.authorAttribution?.displayName?.trim();
      if (!text || !author || !r.name) continue;
      if (seenIds.has(r.name) || seenAuthors.has(author.toLowerCase())) continue;

      const published = r.publishTime ? new Date(r.publishTime) : null;
      const last = await prisma.testimonial.findFirst({
        orderBy: { order: "desc" },
        select: { order: true },
      });
      await prisma.testimonial.create({
        data: {
          author,
          rating: r.rating ?? 5,
          text,
          source: "google",
          sourceDate: published
            ? `${MONTHS[published.getMonth()]} ${published.getFullYear()}`
            : null,
          googleId: r.name,
          featured: false,
          published: false,
          order: (last?.order ?? -1) + 1,
        },
      });
      added++;
    }

    revalidateTestimonials();
    return {
      ok: true,
      added,
      rating: place.rating ?? 0,
      count: place.userRatingCount ?? 0,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Sync failed." };
  }
}
