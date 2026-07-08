import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { STAGES } from "@/lib/lead-stages";
import {
  DailyBars,
  Delta,
  Sparkline,
  StatTile,
  formatCount,
  type DayPoint,
} from "@/components/studio/viz";

export const metadata = { title: "Studio — Overview" };

const DAY = 86_400_000;
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

// Pipeline segment colors: brass ramp deepens with commitment; LOST is
// the neutral de-emphasis tone. Utilities resolve to CSS vars, so the
// ramp flips direction in dark mode (tokens in globals.css).
const STAGE_COLOR: Record<string, string> = {
  NEW: "bg-stage-1",
  CONTACTED: "bg-stage-2",
  DISCUSSION: "bg-stage-3",
  WON: "bg-stage-4",
  LOST: "bg-stone/50",
};

export default async function StudioOverview() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const start84 = new Date(now.getTime() - 84 * DAY);
  const start60 = new Date(now.getTime() - 60 * DAY);
  const start30 = new Date(now.getTime() - 30 * DAY);

  const [
    leadTotal,
    newLeads,
    pipeline,
    recentLeads,
    leadDates,
    views60,
    projects,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "NEW" } }),
    prisma.lead.groupBy({ by: ["status"], _count: true }),
    prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.lead.findMany({
      where: { createdAt: { gte: start84 } },
      select: { createdAt: true },
    }),
    prisma.pageView.findMany({
      where: { createdAt: { gte: start60 } },
      select: { path: true, createdAt: true },
    }),
    prisma.project.findMany({
      select: { id: true, slug: true, title: true, heroImage: true, status: true },
    }),
  ]);

  /* ---- enquiry numbers ---- */
  const leadsThisMonth = leadDates.filter((l) => l.createdAt >= startOfMonth).length;
  const leadsLastMonth = leadDates.filter(
    (l) => l.createdAt >= startOfLastMonth && l.createdAt < startOfMonth,
  ).length;

  // Weekly enquiry trend, oldest → newest (12 buckets of 7 days).
  const leadWeekly = Array.from({ length: 12 }, () => 0);
  for (const l of leadDates) {
    const bucket = 11 - Math.min(11, Math.floor((now.getTime() - l.createdAt.getTime()) / (7 * DAY)));
    leadWeekly[bucket]++;
  }

  /* ---- traffic numbers ---- */
  const days: DayPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY);
    days.push({
      key: dayKey(d),
      label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      count: 0,
    });
  }
  const byDay = new Map(days.map((d) => [d.key, d]));

  const startWeek = new Date(now.getTime() - 7 * DAY);
  const startPrevWeek = new Date(now.getTime() - 14 * DAY);
  let views30 = 0;
  let viewsPrev30 = 0;
  let viewsWeek = 0;
  let viewsPrevWeek = 0;
  const projectViews = new Map<string, number>();

  for (const v of views60) {
    if (v.createdAt >= start30) {
      views30++;
      const day = byDay.get(dayKey(v.createdAt));
      if (day) day.count++;
      if (v.path.startsWith("/projects/")) {
        const slug = v.path.slice("/projects/".length).replace(/\/$/, "");
        if (slug) projectViews.set(slug, (projectViews.get(slug) ?? 0) + 1);
      }
      if (v.createdAt >= startWeek) viewsWeek++;
      else if (v.createdAt >= startPrevWeek) viewsPrevWeek++;
    } else {
      viewsPrev30++;
    }
  }

  const bySlug = new Map(projects.map((p) => [p.slug, p]));
  const topProjects = [...projectViews.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([slug, count]) => ({ project: bySlug.get(slug), slug, count }));
  const maxProjectViews = Math.max(1, ...topProjects.map((t) => t.count));

  /* ---- pipeline ---- */
  const stageCount = (s: string) => pipeline.find((p) => p.status === s)?._count ?? 0;
  const won = stageCount("WON");
  const lost = stageCount("LOST");
  const decided = won + lost;
  const published = projects.filter((p) => p.status === "PUBLISHED").length;

  return (
    <div className="max-w-6xl">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mono-label mb-2">Overview — {formatDate(now)}</p>
          <h1 className="font-display text-h2">
            {newLeads > 0
              ? `${newLeads} new ${newLeads === 1 ? "enquiry" : "enquiries"} waiting.`
              : "All caught up."}
          </h1>
        </div>
        <Link
          href="/studio/projects/new"
          className="rounded-full border border-ink bg-ink px-6 py-2.5 text-sm text-bone transition-colors hover:bg-transparent hover:text-ink"
        >
          Add a project
        </Link>
      </header>

      {/* KPI row — the four numbers the studio said it would check */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatTile label="Total enquiries" value={leadTotal}>
          <div className="mt-3">
            <Sparkline points={leadWeekly} label="Enquiries per week, last 12 weeks" />
            <p className="mono-label mt-1">weekly, last 12 weeks</p>
          </div>
        </StatTile>
        <StatTile label="Enquiries this month" value={leadsThisMonth}>
          <Delta now={leadsThisMonth} prev={leadsLastMonth} period="last month" />
          <p className="mono-label mt-3 text-stone">
            {leadsLastMonth} last month
          </p>
        </StatTile>
        <StatTile label="Site views, 30 days" value={views30}>
          <Delta now={views30} prev={viewsPrev30} period="previous 30 days" />
          <p className="mono-label mt-3 text-stone">{formatCount(viewsPrev30)} the 30 before</p>
        </StatTile>
        <StatTile label="Views this week" value={viewsWeek}>
          <Delta now={viewsWeek} prev={viewsPrevWeek} period="week before" />
          <p className="mono-label mt-3 text-stone">{formatCount(viewsPrevWeek)} week before</p>
        </StatTile>
      </div>

      {/* Traffic + pipeline */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[3fr_2fr]">
        <section className="rounded-2xl border border-hairline bg-paper p-5">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="mono-label">Traffic — last 30 days</h2>
            <Link href="/studio/analytics" className="mono-label hover:text-brass">
              Full analytics &rarr;
            </Link>
          </div>
          {views30 === 0 ? (
            <p className="text-sm text-stone">
              Counting starts the moment someone browses the site — studio
              pages are never included.
            </p>
          ) : (
            <DailyBars days={days} caption="Daily page views, last 30 days" />
          )}
        </section>

        <section className="rounded-2xl border border-hairline bg-paper p-5">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="mono-label">Enquiry pipeline</h2>
            <Link href="/studio/leads" className="mono-label hover:text-brass">
              Open &rarr;
            </Link>
          </div>

          {leadTotal === 0 ? (
            <p className="text-sm text-stone">
              Enquiries from the site will move through the pipeline here.
            </p>
          ) : (
            <>
              {/* Part-to-whole: brass deepens with commitment, lost goes quiet */}
              <div className="flex h-2.5 gap-[2px]" role="img" aria-label="Enquiries by stage">
                {STAGES.map(([value]) => {
                  const n = stageCount(value);
                  if (!n) return null;
                  return (
                    <span
                      key={value}
                      className={`rounded-[2px] ${STAGE_COLOR[value]}`}
                      style={{ width: `${(n / leadTotal) * 100}%` }}
                    />
                  );
                })}
              </div>
              <ul className="mt-5 space-y-2.5">
                {STAGES.map(([value, label]) => (
                  <li key={value} className="flex items-center gap-3">
                    <span
                      className={`inline-block h-2.5 w-2.5 rounded-[2px] ${STAGE_COLOR[value]}`}
                      aria-hidden
                    />
                    <Link
                      href={`/studio/leads?stage=${value}`}
                      className="text-sm text-ink-soft transition-colors hover:text-brass"
                    >
                      {label}
                    </Link>
                    <span className="mono-label ml-auto tabular-nums">{stageCount(value)}</span>
                  </li>
                ))}
              </ul>
              <p className="mono-label rule mt-5 pt-4">
                {decided > 0
                  ? `${won} of ${decided} decided enquiries won — ${Math.round((won / decided) * 100)}%`
                  : "No enquiries decided yet"}
              </p>
            </>
          )}
        </section>
      </div>

      {/* Most viewed projects + recent enquiries */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-hairline bg-paper p-5">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="mono-label">Most viewed projects — 30 days</h2>
            <span className="mono-label text-stone">
              {published} on site · {projects.length - published} draft
              {projects.length - published === 1 ? "" : "s"}
            </span>
          </div>
          {topProjects.length === 0 ? (
            <p className="text-sm text-stone">
              No project pages viewed yet — this fills in as visitors browse
              the portfolio.
            </p>
          ) : (
            <ul className="space-y-4">
              {topProjects.map(({ project, slug, count }) => (
                <li key={slug} className="flex items-center gap-4">
                  <div className="relative h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-stone/20">
                    {project?.heroImage && (
                      <Image
                        src={project.heroImage}
                        alt=""
                        fill
                        sizes="64px"
                        className="rounded-none object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {project ? (
                      <Link
                        href={`/studio/projects/${project.id}`}
                        className="block truncate text-sm font-medium transition-colors hover:text-brass"
                      >
                        {project.title}
                      </Link>
                    ) : (
                      <p className="truncate text-sm font-medium">{slug}</p>
                    )}
                    <div className="mt-1.5 h-1.5 max-w-[12rem] rounded-[2px] bg-bone">
                      <div
                        className="h-full rounded-[2px] bg-chart"
                        style={{ width: `${(count / maxProjectViews) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="mono-label tabular-nums">{formatCount(count)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-hairline bg-paper p-5">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="mono-label">Recent enquiries</h2>
            <Link href="/studio/leads" className="mono-label hover:text-brass">
              All enquiries &rarr;
            </Link>
          </div>
          {recentLeads.length === 0 ? (
            <p className="text-sm text-stone">
              Nothing yet — enquiries land here the moment they arrive.
            </p>
          ) : (
            <ul className="divide-y divide-hairline">
              {recentLeads.map((lead) => {
                const wa =
                  lead.phone &&
                  `https://wa.me/${lead.phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
                    `Hello ${lead.name.split(" ")[0]}, thank you for reaching out to Design Matters. We'd be glad to hear more about your project — when is a good time to talk?`,
                  )}`;
                return (
                  <li key={lead.id} className="flex items-start gap-4 py-3.5 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {lead.status === "NEW" ? (
                          <span className="text-brass">{lead.name}</span>
                        ) : (
                          lead.name
                        )}
                        <span className="mono-label ml-3">{formatDate(lead.createdAt)}</span>
                      </p>
                      {(lead.topic || lead.budget || lead.location) && (
                        <p className="mt-1 flex flex-wrap gap-1.5">
                          {[lead.topic, lead.budget, lead.location].filter(Boolean).map((t) => (
                            <span
                              key={t}
                              className="mono-label rounded-full border border-hairline px-2.5 py-0.5"
                            >
                              {t}
                            </span>
                          ))}
                        </p>
                      )}
                      <p className="mt-1 line-clamp-1 text-sm text-ink-soft">{lead.message}</p>
                    </div>
                    {wa && (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mono-label shrink-0 rounded-full border border-hairline px-3 py-1.5 transition-colors hover:border-brass hover:text-brass"
                      >
                        WhatsApp
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Quick actions */}
      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Link
          href="/studio/projects/new"
          className="rounded-full border border-ink bg-ink px-6 py-2.5 text-sm text-bone transition-colors hover:bg-transparent hover:text-ink"
        >
          Add a project
        </Link>
        <Link
          href="/studio/projects"
          className="rounded-full border border-ink px-6 py-2.5 text-sm transition-colors hover:bg-ink hover:text-bone"
        >
          Reorder the portfolio
        </Link>
        <Link
          href="/studio/leads"
          className="rounded-full border border-ink px-6 py-2.5 text-sm transition-colors hover:bg-ink hover:text-bone"
        >
          Review enquiries
        </Link>
        <p className="mono-label ml-auto text-stone">
          First-party analytics — no cookies, nothing sent to third parties.
        </p>
      </div>
    </div>
  );
}
