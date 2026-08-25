import Link from "next/link";
import { prisma } from "@/lib/db";
import { DailyBars, RankedBars, SegmentedBar, StatCard } from "@/components/studio/viz";
import { Card, CardHead, PageHead } from "@/components/studio/ui";
import { Reveal } from "@/components/studio/Reveal";
import {
  RANGES,
  bucketKey,
  buildBuckets,
  grainFor,
  grainNoun,
  resolveRange,
  spanDays,
} from "@/lib/analytics-range";
import { cn } from "@/lib/utils";

export const metadata = { title: "Studio | Analytics" };

const DAY = 86_400_000;

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: raw } = await searchParams;
  const range = resolveRange(raw);

  const now = new Date();

  /* "All time" starts at the first page view ever recorded rather than at
     some arbitrary launch date, so the chart begins where the data does.
     With no views at all it falls back to the last 30 days, which gives an
     empty chart with a sensible axis instead of an empty chart with none. */
  const firstView =
    range.days === null
      ? await prisma.pageView.findFirst({
          orderBy: { createdAt: "asc" },
          select: { createdAt: true },
        })
      : null;

  const from =
    range.days === null
      ? (firstView?.createdAt ?? new Date(now.getTime() - 30 * DAY))
      : new Date(now.getTime() - range.days * DAY);

  const span = spanDays(from, now);
  const grain = grainFor(span);
  const halfway = new Date(now.getTime() - (span / 2) * DAY);

  const [views, leadsInRange, projectTitles] = await Promise.all([
    prisma.pageView.findMany({
      where: { createdAt: { gte: from } },
      select: { path: true, source: true, device: true, createdAt: true },
    }),
    prisma.lead.findMany({
      where: { createdAt: { gte: from } },
      select: { source: true },
    }),
    prisma.project.findMany({ select: { slug: true, title: true } }),
  ]);
  const titleBySlug = new Map(projectTitles.map((p) => [p.slug, p.title]));

  /* Volumes here are small — a few thousand rows at most — so aggregating
     in JS is faster than the round-trips a set of grouped queries costs,
     and it keeps every number derived from exactly one read. */
  const buckets = buildBuckets(from, now, grain);
  const byBucket = new Map(buckets.map((b) => [b.key, b]));

  const tally = (m: Map<string, number>, k: string | null | undefined) => {
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  };

  const pages = new Map<string, number>();
  const projects = new Map<string, number>();
  const sources = new Map<string, number>();
  let recentHalf = 0;
  let mobile = 0;

  for (const v of views) {
    const b = byBucket.get(bucketKey(v.createdAt, grain));
    if (b) b.count++;
    if (v.createdAt >= halfway) recentHalf++;
    tally(pages, v.path);
    if (v.path.startsWith("/projects/")) {
      const slug = v.path.slice("/projects/".length).replace(/\/$/, "");
      if (slug) tally(projects, titleBySlug.get(slug) ?? slug);
    }
    tally(sources, v.source ?? "direct");
    if (v.device === "mobile") mobile++;
  }

  const enquirySources = new Map<string, number>();
  for (const l of leadsInRange) tally(enquirySources, l.source ?? "unknown");

  const top = (m: Map<string, number>, n = 8) =>
    [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([label, count]) => ({ key: label, label, count }));

  const total = views.length;
  const desktop = total - mobile;
  const mobileShare = total ? Math.round((mobile / total) * 100) : 0;

  const periodLabel =
    range.days === null
      ? firstView
        ? `since ${from.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
        : "all time"
      : `last ${range.label}`;

  return (
    <div>
      <PageHead
        title="Analytics"
        subtitle={`Who is looking, and at what, ${periodLabel}. First-party: no cookies, no third-party scripts.`}
        action={
          <nav
            aria-label="Date range"
            className="s-scroll flex max-w-full items-center gap-0.5 overflow-x-auto rounded-s-sm border border-s-border bg-s-surface p-0.5"
          >
            {RANGES.map((r) => (
              <Link
                key={r.key}
                href={`/studio/analytics?range=${r.key}`}
                aria-current={r.key === range.key ? "page" : undefined}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-s-xs px-2.5 py-1 text-[0.8125rem] transition-colors",
                  r.key === range.key
                    ? "bg-s-accent-soft font-medium text-s-accent"
                    : "text-s-text-2 hover:bg-s-surface-3 hover:text-s-text",
                )}
              >
                {r.label}
              </Link>
            ))}
          </nav>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Reveal delay={0} className="h-full">
          <StatCard
            label={`Views, ${range.label.toLowerCase()}`}
            value={total}
            spark={buckets.map((b) => b.count)}
          />
        </Reveal>
        <Reveal delay={0.05} className="h-full">
          <StatCard
            label="Recent half"
            value={recentHalf}
            footer={
              <span className="text-[0.75rem] text-s-text-3">
                {total
                  ? `${Math.round((recentHalf / total) * 100)}% of the period`
                  : "No views yet"}
              </span>
            }
          />
        </Reveal>
        <Reveal delay={0.1} className="h-full">
          <StatCard
            label="Enquiries"
            value={leadsInRange.length}
            href="/studio/leads"
            hint="Open every enquiry"
            footer={
              <span className="text-[0.75rem] text-s-text-3">
                {total
                  ? `${((leadsInRange.length / total) * 100).toFixed(1)}% of views enquired`
                  : "No views yet"}
              </span>
            }
          />
        </Reveal>
        <Reveal delay={0.15} className="h-full">
          <StatCard
            label="On mobile"
            value={`${mobileShare}%`}
            footer={
              <span className="text-[0.75rem] text-s-text-3">
                {mobile} mobile · {desktop} desktop
              </span>
            }
          />
        </Reveal>
      </div>

      <Reveal delay={0.1} className="mt-4">
        <Card>
          <CardHead
            title="Views over time"
            hint={`${periodLabel}, by ${grainNoun(grain)}`}
          />
          <div className="px-5 pb-5">
            <DailyBars
              days={buckets}
              caption={`Page views per ${grainNoun(grain)}, ${periodLabel}`}
            />
          </div>
        </Card>
      </Reveal>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        <Reveal delay={0.05}>
          <Card>
            <CardHead title="Top pages" hint="Where visitors land and linger" />
            <div className="px-3 pb-4">
              <RankedBars rows={top(pages)} empty="No page views in this period." />
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.1}>
          <Card>
            <CardHead title="Projects drawing attention" hint="Views per project page" />
            <div className="px-3 pb-4">
              <RankedBars rows={top(projects)} empty="No project pages viewed in this period." />
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.05}>
          <Card>
            <CardHead title="Traffic sources" hint="Where the visit came from" />
            <div className="px-3 pb-4">
              <RankedBars rows={top(sources)} empty="Nothing recorded in this period." />
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.1}>
          <Card>
            <CardHead title="Where enquiries come from" hint="The page each enquiry was sent from" />
            <div className="px-3 pb-4">
              <RankedBars rows={top(enquirySources)} empty="No enquiries in this period." />
            </div>
          </Card>
        </Reveal>
      </div>

      <Reveal delay={0.05} className="mt-4">
        <Card>
          <CardHead title="Device" hint="Coarse split, read from the user agent" />
          <div className="px-5 pb-5">
            <SegmentedBar
              className="mb-3"
              segments={[
                { key: "desktop", label: "Desktop", count: desktop, color: "var(--s-stage-3)" },
                { key: "mobile", label: "Mobile", count: mobile, color: "var(--s-stage-1)" },
              ]}
            />
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[0.8125rem]">
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="size-2 rounded-[3px]"
                  style={{ background: "var(--s-stage-3)" }}
                />
                <span className="text-s-text-2">Desktop</span>
                <span className="s-num font-medium">{desktop}</span>
              </span>
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="size-2 rounded-[3px]"
                  style={{ background: "var(--s-stage-1)" }}
                />
                <span className="text-s-text-2">Mobile</span>
                <span className="s-num font-medium">{mobile}</span>
              </span>
            </div>
          </div>
        </Card>
      </Reveal>

      <p className="mt-4 text-[0.75rem] leading-relaxed text-s-text-3">
        First-party analytics: no cookies, no visitor identifiers, nothing sent to third parties.
        Studio pages are excluded from counting.
      </p>
    </div>
  );
}
