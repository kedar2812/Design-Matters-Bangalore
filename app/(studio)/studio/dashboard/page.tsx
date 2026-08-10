import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { STAGES } from "@/lib/lead-stages";
import {
  DailyBars,
  Delta,
  SegmentedBar,
  StatCard,
  type DayPoint,
} from "@/components/studio/viz";
import { Badge, Card, CardHead, Chip, EmptyState, buttonClass } from "@/components/studio/ui";
import { Reveal } from "@/components/studio/Reveal";
import {
  ContentIcon,
  EnquiriesIcon,
  PlusIcon,
  ProjectsIcon,
  StudioIcon,
  WarningIcon,
} from "@/components/studio/icons";
import { QuickReply } from "@/components/studio/QuickReply";

export const metadata = { title: "Studio — Overview" };

const DAY = 86_400_000;
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Pipeline colours: a single bronze ramp that deepens with commitment, so
 * the bar reads as a funnel rather than as five unrelated categories.
 * Lost sits outside the ramp in the neutral tone — it is not a further
 * stage, it is the exit.
 */
const STAGE_FILL: Record<string, string> = {
  NEW: "var(--s-stage-1)",
  CONTACTED: "var(--s-stage-2)",
  DISCUSSION: "var(--s-stage-3)",
  WON: "var(--s-stage-4)",
  LOST: "var(--s-muted)",
};

export default async function StudioOverview() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const start84 = new Date(now.getTime() - 84 * DAY);
  const start60 = new Date(now.getTime() - 60 * DAY);
  const start30 = new Date(now.getTime() - 30 * DAY);

  const [leadTotal, newLeads, pipeline, recentLeads, leadDates, views60, projects] =
    await Promise.all([
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
        select: {
          id: true,
          slug: true,
          title: true,
          heroImage: true,
          heroBlur: true,
          status: true,
          category: true,
          _count: { select: { gallery: true } },
        },
        orderBy: { order: "asc" },
      }),
    ]);

  /* ---------------------------------------------------- enquiry numbers */
  const leadsThisMonth = leadDates.filter((l) => l.createdAt >= startOfMonth).length;
  const leadsLastMonth = leadDates.filter(
    (l) => l.createdAt >= startOfLastMonth && l.createdAt < startOfMonth,
  ).length;

  // Weekly enquiry trend, oldest → newest (12 buckets of 7 days).
  const leadWeekly = Array.from({ length: 12 }, () => 0);
  for (const l of leadDates) {
    const bucket =
      11 - Math.min(11, Math.floor((now.getTime() - l.createdAt.getTime()) / (7 * DAY)));
    leadWeekly[bucket]++;
  }

  /* ---------------------------------------------------- traffic numbers */
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
  // Views survive the project they pointed at, so drop slugs that no
  // longer resolve — otherwise deleted work lingers here as a bare slug.
  const topProjects = [...projectViews.entries()]
    .filter(([slug]) => bySlug.has(slug))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([slug, count]) => ({ project: bySlug.get(slug)!, count }));

  /* -------------------------------------------------- pipeline + portfolio */
  const stageCount = (s: string) => pipeline.find((p) => p.status === s)?._count ?? 0;
  const won = stageCount("WON");
  const lost = stageCount("LOST");
  const decided = won + lost;

  const published = projects.filter((p) => p.status === "PUBLISHED");
  const drafts = projects.filter((p) => p.status !== "PUBLISHED");
  // Things worth fixing before a client notices.
  const needsWork = projects.filter((p) => !p.heroImage || p._count.gallery === 0);
  const categories = [...new Set(published.map((p) => p.category))].sort();

  const actions = [
    { href: "/studio/projects/new", label: "Add project", Icon: PlusIcon, primary: true },
    { href: "/studio/projects", label: "Portfolio", Icon: ProjectsIcon },
    { href: "/studio/content", label: "Site copy", Icon: ContentIcon },
    { href: "/studio/content/identity", label: "Studio details", Icon: StudioIcon },
  ];

  return (
    <div className="space-y-4">
      {/* Header. One line of state, then straight to the work. */}
      <Reveal className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.8125rem] text-s-text-3">{formatDate(now)}</p>
          <h1 className="mt-1 text-[1.375rem] font-semibold tracking-[-0.02em] text-s-text">
            {newLeads > 0 ? (
              <>
                {newLeads} new {newLeads === 1 ? "enquiry" : "enquiries"} waiting
              </>
            ) : (
              "All caught up"
            )}
          </h1>
        </div>

        <nav aria-label="Quick actions" className="flex flex-wrap gap-2">
          {actions.map(({ href, label, Icon, primary }) => (
            <Link
              key={href}
              href={href}
              className={buttonClass(primary ? "primary" : "secondary", "md")}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
      </Reveal>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Reveal delay={0} className="h-full">
          <StatCard
            label="Enquiries, all time"
            value={leadTotal}
            spark={leadWeekly}
            footer={
              newLeads > 0 ? (
                <Badge tone="accent" dot>
                  {newLeads} unread
                </Badge>
              ) : (
                <span className="text-[0.75rem] text-s-text-3">Nothing unread</span>
              )
            }
          />
        </Reveal>
        <Reveal delay={0.05} className="h-full">
          <StatCard
            label="Enquiries this month"
            value={leadsThisMonth}
            footer={<Delta now={leadsThisMonth} prev={leadsLastMonth} period="last month" />}
          />
        </Reveal>
        <Reveal delay={0.1} className="h-full">
          <StatCard
            label="Views, 30 days"
            value={views30}
            footer={<Delta now={views30} prev={viewsPrev30} period="previous 30" />}
          />
        </Reveal>
        <Reveal delay={0.15} className="h-full">
          <StatCard
            label="Views this week"
            value={viewsWeek}
            footer={<Delta now={viewsWeek} prev={viewsPrevWeek} period="week before" />}
          />
        </Reveal>
      </div>

      {/* Traffic + pipeline */}
      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <Reveal delay={0.1}>
          <Card className="h-full">
            <CardHead
              title="Traffic"
              hint="Page views, last 30 days"
              action={
                <Link href="/studio/analytics" className={buttonClass("ghost", "sm")}>
                  Analytics
                </Link>
              }
            />
            <div className="px-5 pb-5">
              <DailyBars days={days} caption="Page views per day, last 30 days" />
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.15}>
          <Card className="flex h-full flex-col">
            <CardHead
              title="Pipeline"
              hint={decided > 0 ? `${Math.round((won / decided) * 100)}% won of ${decided} decided` : "Nothing decided yet"}
              action={
                <Link href="/studio/leads" className={buttonClass("ghost", "sm")}>
                  Open
                </Link>
              }
            />
            <div className="flex flex-1 flex-col px-5 pb-5">
              <SegmentedBar
                className="mb-4"
                segments={STAGES.map(([value, label]) => ({
                  key: value,
                  label,
                  count: stageCount(value),
                  color: STAGE_FILL[value] ?? "var(--s-muted)",
                }))}
              />
              <ul className="flex flex-col gap-2">
                {STAGES.map(([value, label]) => (
                  <li key={value}>
                    <Link
                      href={`/studio/leads?stage=${value}`}
                      className="flex items-center gap-2.5 rounded-s-xs px-1.5 py-1 text-[0.8125rem] transition-colors hover:bg-s-surface-3"
                    >
                      <span
                        aria-hidden
                        className="size-2 shrink-0 rounded-[3px]"
                        style={{ background: STAGE_FILL[value] }}
                      />
                      <span className="min-w-0 flex-1 truncate text-s-text-2">{label}</span>
                      <span className="s-num font-medium">{stageCount(value)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </Reveal>
      </div>

      {/* Portfolio + most viewed */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Reveal delay={0.05}>
          <Card className="flex h-full flex-col">
            <CardHead
              title="Portfolio"
              hint={`${published.length} live · ${drafts.length} draft`}
              action={
                <Link href="/studio/projects" className={buttonClass("ghost", "sm")}>
                  Manage
                </Link>
              }
            />
            <div className="flex flex-1 flex-col px-5 pb-5">
              <div className="flex flex-wrap gap-1.5">
                {categories.map((c) => (
                  <Chip key={c}>
                    {c} · {published.filter((p) => p.category === c).length}
                  </Chip>
                ))}
              </div>

              {needsWork.length > 0 && (
                <div className="mt-4 rounded-s-sm border border-s-border bg-s-surface-2 p-3">
                  <p className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-s-text">
                    <WarningIcon className="size-4 shrink-0 text-s-warn" />
                    {needsWork.length} {needsWork.length === 1 ? "project needs" : "projects need"}{" "}
                    photographs
                  </p>
                  <ul className="mt-2 flex flex-col gap-1">
                    {needsWork.slice(0, 4).map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/studio/projects/${p.id}`}
                          className="flex items-center gap-2 text-[0.8125rem] text-s-text-2 transition-colors hover:text-s-accent"
                        >
                          <span className="min-w-0 truncate">{p.title}</span>
                          <span className="shrink-0 text-[0.75rem] text-s-text-3">
                            {!p.heroImage ? "no cover" : "no gallery"}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.1}>
          <Card className="flex h-full flex-col">
            <CardHead
              title="Most viewed"
              hint="Projects, last 30 days"
              action={
                <Link href="/studio/analytics" className={buttonClass("ghost", "sm")}>
                  All
                </Link>
              }
            />
            <div className="flex-1 px-3 pb-4">
              {topProjects.length === 0 ? (
                <EmptyState
                  title="No project views yet"
                  body="Once the site has visitors, the work drawing the most attention shows up here."
                />
              ) : (
                <ul className="flex flex-col">
                  {topProjects.map(({ project, count }) => (
                    <li key={project.id}>
                      <Link
                        href={`/studio/projects/${project.id}`}
                        className="flex items-center gap-3 rounded-s-xs px-2 py-2 transition-colors hover:bg-s-surface-3"
                      >
                        <span className="relative size-9 shrink-0 overflow-hidden rounded-s-xs bg-s-surface-3">
                          {project.heroImage && (
                            <Image
                              src={project.heroImage}
                              alt=""
                              fill
                              sizes="36px"
                              placeholder={project.heroBlur ? "blur" : "empty"}
                              blurDataURL={project.heroBlur ?? undefined}
                              className="object-cover"
                            />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[0.8125rem] font-medium text-s-text">
                            {project.title}
                          </span>
                          <span className="block truncate text-[0.75rem] text-s-text-3">
                            {project.category}
                          </span>
                        </span>
                        <span className="s-num shrink-0 text-[0.8125rem] font-medium">{count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </Reveal>
      </div>

      {/* Recent enquiries */}
      <Reveal delay={0.05}>
        <Card>
          <CardHead
            title="Recent enquiries"
            divided
            action={
              <Link href="/studio/leads" className={buttonClass("ghost", "sm")}>
                All enquiries
              </Link>
            }
          />
          {recentLeads.length === 0 ? (
            <EmptyState
              icon={<EnquiriesIcon className="size-5" />}
              title="No enquiries yet"
              body="Everything submitted through the contact page and the project pages lands here."
            />
          ) : (
            <ul className="divide-y divide-s-border">
              {recentLeads.map((lead) => (
                <li key={lead.id} className="flex flex-wrap items-start gap-x-4 gap-y-2 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <Link
                        href={`/studio/leads?open=${lead.id}`}
                        className="text-[0.8125rem] font-medium text-s-text transition-colors hover:text-s-accent"
                      >
                        {lead.name}
                      </Link>
                      {lead.status === "NEW" && (
                        <Badge tone="accent" dot>
                          New
                        </Badge>
                      )}
                      <span className="text-[0.75rem] text-s-text-3">
                        {formatDate(lead.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 max-w-3xl text-[0.8125rem] leading-relaxed text-s-text-2">
                      {lead.message}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {[lead.topic, lead.budget, lead.location]
                        .filter((t): t is string => Boolean(t))
                        .map((t) => (
                          <Chip key={t}>{t}</Chip>
                        ))}
                    </div>
                  </div>
                  {lead.phone && (
                    <QuickReply name={lead.name} phone={lead.phone} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </Reveal>
    </div>
  );
}
