import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { EnquiryTable } from "@/components/studio/EnquiryRow";
import { STAGES } from "@/lib/lead-stages";
import { getSection } from "@/lib/settings";
import { mailStatus } from "@/lib/mail";
import { Card, PageHead } from "@/components/studio/ui";
import { Reveal } from "@/components/studio/Reveal";
import { cn } from "@/lib/utils";

export const metadata = { title: "Studio | Enquiries" };

export default async function EnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const { stage } = await searchParams;
  const valid = STAGES.map(([v]) => v as string);
  const filter = stage && valid.includes(stage) ? stage : undefined;

  const [leads, counts, alerts] = await Promise.all([
    prisma.lead.findMany({
      where: filter ? { status: filter as never } : undefined,
      orderBy: { createdAt: "desc" },
      // The trail comes down with the list rather than being fetched
      // when a panel opens: the panel is already client-side state, and
      // an enquiry carries a handful of events, not a feed.
      include: { events: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.lead.groupBy({ by: ["status"], _count: true }),
    getSection("notifications"),
  ]);

  // Why an enquiry was not emailed is a property of the studio's
  // settings, not of the enquiry, so it is resolved once here rather
  // than stored on every row. It is what lets the panel tell "you turned
  // this off" apart from "this broke".
  const delivery = !alerts.notifyStudio
    ? ("off" as const)
    : mailStatus().ready
      ? ("on" as const)
      : ("unconfigured" as const);

  const countFor = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const total = counts.reduce((sum, c) => sum + c._count, 0);

  const tabs = [
    { href: "/studio/leads", label: "All", count: total, active: !filter },
    ...STAGES.map(([value, label]) => ({
      href: `/studio/leads?stage=${value}`,
      label,
      count: countFor(value),
      active: filter === value,
    })),
  ];

  return (
    <div>
      <PageHead
        title="Enquiries"
        subtitle="Everything the website sends you, and where each one has got to."
      />

      {/* Stage tabs. Server-rendered links rather than client state, so a
          stage is a real URL the studio can bookmark or send to a
          colleague, and so the counts are always the database's. */}
      <Reveal className="mb-4">
        <nav
          aria-label="Filter by stage"
          className="s-scroll -mx-1 flex gap-1 overflow-x-auto px-1 pb-1"
        >
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              aria-current={t.active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-s-sm px-2.5 py-1.5 text-[0.8125rem] transition-colors",
                t.active
                  ? "bg-s-accent-soft font-medium text-s-accent"
                  : "text-s-text-2 hover:bg-s-surface-3 hover:text-s-text",
              )}
            >
              {t.label}
              <span
                className={cn(
                  "s-num rounded-full px-1.5 py-[1px] text-[0.6875rem] leading-[1.4]",
                  t.active ? "bg-s-accent/15" : "bg-s-surface-3 text-s-text-3",
                )}
              >
                {t.count}
              </span>
            </Link>
          ))}
        </nav>
      </Reveal>

      <Reveal delay={0.05}>
        <Card className="overflow-hidden p-4">
          {/* `useSearchParams` inside the table needs a Suspense boundary
              or the whole route is forced out of static rendering. */}
          <Suspense fallback={null}>
            <EnquiryTable
              delivery={delivery}
              enquiries={leads.map((lead) => ({
                ...lead,
                createdAt: lead.createdAt.toISOString(),
                notifiedAt: lead.notifiedAt?.toISOString() ?? null,
                events: lead.events.map((e) => ({
                  id: e.id,
                  type: e.type,
                  summary: e.summary,
                  createdAt: e.createdAt.toISOString(),
                })),
              }))}
            />
          </Suspense>
        </Card>
      </Reveal>
    </div>
  );
}
