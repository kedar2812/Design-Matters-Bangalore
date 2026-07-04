import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Studio — Overview" };

export default async function StudioOverview() {
  const [newLeads, recentLeads, projectCount, publishedCount, latestPosts] =
    await Promise.all([
      prisma.lead.count({ where: { status: "NEW" } }),
      prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.project.count(),
      prisma.project.count({ where: { status: "PUBLISHED" } }),
      prisma.post.findMany({ orderBy: { updatedAt: "desc" }, take: 3 }),
    ]);

  return (
    <div className="max-w-5xl">
      <header className="mb-12">
        <p className="mono-label mb-2">Overview</p>
        <h1 className="font-display text-h2">
          {newLeads > 0
            ? `${newLeads} new ${newLeads === 1 ? "enquiry" : "enquiries"} waiting.`
            : "All caught up."}
        </h1>
      </header>

      {/* Vitals */}
      <div className="rule grid grid-cols-2 gap-8 pt-6 sm:grid-cols-4">
        {[
          ["New enquiries", newLeads, "/studio/leads"],
          ["Projects on site", publishedCount, "/studio/projects"],
          ["Projects total", projectCount, "/studio/projects"],
          ["Journal entries", latestPosts.length, "/studio/journal"],
        ].map(([label, value, href]) => (
          <Link key={String(label)} href={String(href)} className="group">
            <p className="font-display text-h1 transition-colors group-hover:text-brass">
              {String(value)}
            </p>
            <p className="mono-label mt-1">{label}</p>
          </Link>
        ))}
      </div>

      {/* Recent enquiries */}
      <section className="mt-16">
        <div className="rule flex items-baseline justify-between pt-4">
          <h2 className="font-display text-h3">Recent enquiries</h2>
          <Link href="/studio/leads" className="mono-label hover:text-brass">
            All enquiries &rarr;
          </Link>
        </div>
        {recentLeads.length === 0 ? (
          <p className="mt-6 text-sm text-stone">
            Nothing yet — enquiries from the contact page land here the moment
            they arrive.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-hairline">
            {recentLeads.map((lead) => (
              <li key={lead.id} className="py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium">{lead.name}</p>
                  <p className="mono-label">
                    {lead.status === "NEW" ? (
                      <span className="text-brass">New</span>
                    ) : (
                      lead.status.toLowerCase()
                    )}
                    {" — "}
                    {formatDate(lead.createdAt)}
                  </p>
                </div>
                <p className="mt-1 line-clamp-2 max-w-2xl text-sm text-ink-soft">
                  {lead.message}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Quick actions */}
      <section className="mt-16">
        <div className="rule pt-4">
          <h2 className="font-display text-h3 mb-6">Quick actions</h2>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/studio/projects/new"
            className="border border-ink bg-ink px-6 py-2.5 text-sm text-bone transition-colors hover:bg-transparent hover:text-ink"
          >
            Add a project
          </Link>
          <Link
            href="/studio/journal/new"
            className="border border-ink px-6 py-2.5 text-sm transition-colors hover:bg-ink hover:text-bone"
          >
            Write a journal entry
          </Link>
          <Link
            href="/studio/leads"
            className="border border-ink px-6 py-2.5 text-sm transition-colors hover:bg-ink hover:text-bone"
          >
            Review enquiries
          </Link>
        </div>
      </section>
    </div>
  );
}
