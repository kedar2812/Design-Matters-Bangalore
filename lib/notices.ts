import { prisma } from "@/lib/db";

/**
 * The dashboard's notification centre.
 *
 * Nothing here is a stored "notification" — every notice is derived from
 * the current state of the data each time the shell renders. That is the
 * whole design: a notice cannot go stale, cannot be about a project that
 * has since been deleted, and cannot need a background job to create it.
 * An enquiry that gets answered stops being new, and its notice
 * disappears on its own.
 *
 * The only thing persisted is dismissal. `NoticeDismissal` stores the key
 * of anything the studio has waved away, so "clear" survives a reload and
 * a different machine. Keys are stable and identity-bearing —
 * `lead:<id>`, not `lead-3` — so dismissing one enquiry never silences
 * the next.
 *
 * Deliberately not included: anything the studio cannot act on from here.
 * "Traffic is down this week" is a fact, not a task, and a notification
 * centre that fills with facts stops being read.
 */

export type NoticeTone = "accent" | "warn" | "info" | "neutral";

export type Notice = {
  key: string;
  tone: NoticeTone;
  title: string;
  body: string;
  href: string;
  /** ISO — what the list sorts by, newest first. */
  at: string;
};

/** How many of each kind to raise before collapsing into one summary. */
const MAX_PER_KIND = 5;

export async function getNotices(): Promise<Notice[]> {
  const [newLeads, thinProjects, drafts, hiddenReviews, dismissed] = await Promise.all([
    prisma.lead.findMany({
      where: { status: "NEW" },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, topic: true, location: true, createdAt: true },
    }),
    prisma.project.findMany({
      where: { status: "PUBLISHED", OR: [{ heroImage: null }, { gallery: { none: {} } }] },
      orderBy: { order: "asc" },
      select: { id: true, title: true, heroImage: true, updatedAt: true },
    }),
    prisma.project.findMany({
      where: { status: "DRAFT" },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, updatedAt: true },
    }),
    /* Google sync lands new reviews hidden, on purpose — they are
       somebody else's words and should be read before they go up.

       The window matters. "Hidden and from Google" on its own also
       describes every review the studio has already looked at and chosen
       to keep off the site, of which there are seven from the initial
       import; flagging those turns a curation decision into a permanent
       nag, which is how a notification centre teaches people to ignore
       it. A review that arrived in the last three weeks is plausibly
       unread. One from months ago has been decided. */
    prisma.testimonial.findMany({
      where: {
        published: false,
        source: "google",
        createdAt: { gte: new Date(Date.now() - 21 * 86_400_000) },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, author: true, createdAt: true },
    }),
    prisma.noticeDismissal.findMany({ select: { key: true } }),
  ]);

  const gone = new Set(dismissed.map((d) => d.key));
  const out: Notice[] = [];

  for (const l of newLeads.slice(0, MAX_PER_KIND)) {
    out.push({
      key: `lead:${l.id}`,
      tone: "accent",
      title: `New enquiry from ${l.name}`,
      body: [l.topic, l.location].filter(Boolean).join(" · ") || "Waiting for a first reply.",
      href: `/studio/leads?open=${l.id}`,
      at: l.createdAt.toISOString(),
    });
  }
  if (newLeads.length > MAX_PER_KIND) {
    out.push({
      key: `lead-overflow:${newLeads.length}`,
      tone: "accent",
      title: `${newLeads.length - MAX_PER_KIND} more new enquiries`,
      body: "Open the pipeline to work through them.",
      href: "/studio/leads?stage=NEW",
      at: newLeads[MAX_PER_KIND]!.createdAt.toISOString(),
    });
  }

  // Live on the site with nothing to show is the one that embarrasses the
  // studio in front of a client, so it outranks an unfinished draft.
  for (const p of thinProjects.slice(0, MAX_PER_KIND)) {
    out.push({
      key: `thin:${p.id}`,
      tone: "warn",
      title: `${p.title} is live without photographs`,
      body: p.heroImage ? "It has a cover but no gallery." : "It has no cover image.",
      href: `/studio/projects/${p.id}`,
      at: p.updatedAt.toISOString(),
    });
  }

  for (const r of hiddenReviews.slice(0, MAX_PER_KIND)) {
    out.push({
      key: `review:${r.id}`,
      tone: "info",
      title: `Google review from ${r.author} is waiting`,
      body: "Synced from Google and hidden until you publish it.",
      href: `/studio/testimonials/${r.id}`,
      at: r.createdAt.toISOString(),
    });
  }

  for (const d of drafts.slice(0, MAX_PER_KIND)) {
    out.push({
      key: `draft:${d.id}`,
      tone: "neutral",
      title: `${d.title} is still a draft`,
      body: "Not visible on the site yet.",
      href: `/studio/projects/${d.id}`,
      at: d.updatedAt.toISOString(),
    });
  }

  return out
    .filter((n) => !gone.has(n.key))
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}
