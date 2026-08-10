import Link from "next/link";
import { prisma } from "@/lib/db";
import { DailyBars, RankedBars, SegmentedBar, StatCard } from "@/components/studio/viz";
import { Card, CardHead, PageHead } from "@/components/studio/ui";
import { Reveal } from "@/components/studio/Reveal";
import { cn } from "@/lib/utils";

export const metadata = { title: "Studio — Analytics" };

const DAY = 86_400_000;
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/** The ranges the picker offers. Anything else in the URL falls back to 30. */
const RANGES = [7, 30, 90] as const;

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rawRange } = await searchParams;
  const parsed = Number(rawRange);
  const range = (RANGES as readonly number[]).includes(parsed) ? parsed : 30;

  const now = Date.now();
  const startRange = new Date(now - range * DAY);
  const startHalf = new Date(now - Math.round(range / 2) * DAY);

  const [views, leadsInRange, projectTitles] = await Promise.all([
    prisma.pageView.findMany({
      where: { createdAt: { gte: startRange } },
      select: { path: true, source: true, device: true, country: true, createdAt: true },
    }),
    prisma.lead.findMany({
      where: { createdAt: { gte: startRange } },
      select: { source: true },
    }),
    prisma.project.findMany({ select: { slug: true, title: true } }),
  ]);
  const titleBySlug = new Map(projectTitles.map((p) => [p.slug, p.title]));

  /* Volumes here are small — a few thousand rows at most — so aggregating
     in JS is faster than the round-trips a set of grouped queries costs,
     and it keeps every number derived from exactly one read. */
  const days: { key: string; label: string; count: number }[] = [];
  for (let i = range - 1; i >= 0; i--) {
    const d = new Date(now - i * DAY);
    days.push({
      key: dayKey(d),
      label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      count: 0,
    });
  }
  const byDay = new Map(days.map((d) => [d.key, d]));
  const tally = (m: Map<string, number>, k: string | null | undefined) => {
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  };

  const pages = new Map<string, number>();
  const projects = new Map<string, number>();
  const sources = new Map<string, number>();
  const countries = new Map<string, number>();
  let recentHalf = 0;
  let mobile = 0;

  for (const v of views) {
    const day = byDay.get(dayKey(v.createdAt));
    if (day) day.count++;
    if (v.createdAt >= startHalf) recentHalf++;
    tally(pages, v.path);
    if (v.path.startsWith("/projects/")) {
      const slug = v.path.slice("/projects/".length).replace(/\/$/, "");
      if (slug) tally(projects, titleBySlug.get(slug) ?? slug);
    }
    tally(sources, v.source ?? "direct");
    tally(countries, v.country ?? "unknown");
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

  return (
    <div>
      <PageHead
        title="Analytics"
        subtitle="Who is looking, and at what. First-party — no cookies, no third-party scripts."
        action={
          <nav
            aria-label="Date range"
            className="flex items-center gap-0.5 rounded-s-sm border border-s-border bg-s-surface p-0.5"
          >
            {RANGES.map((r) => (
              <Link
                key={r}
                href={`/studio/analytics?range=${r}`}
                aria-current={r === range ? "page" : undefined}
                className={cn(
                  "rounded-s-xs px-2.5 py-1 text-[0.8125rem] transition-colors",
                  r === range
                    ? "bg-s-accent-soft font-medium text-s-accent"
                    : "text-s-text-2 hover:bg-s-surface-3 hover:text-s-text",
                )}
              >
                {r}d
              </Link>
            ))}
          </nav>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Reveal delay={0} className="h-full">
          <StatCard
            label={`Views, ${range} days`}
            value={total}
            spark={days.map((d) => d.count)}
          />
        </Reveal>
        <Reveal delay={0.05} className="h-full">
          <StatCard
            label={`Recent half (${Math.round(range / 2)}d)`}
            value={recentHalf}
            footer={
              <span className="text-[0.75rem] text-s-text-3">
                {total ? `${Math.round((recentHalf / total) * 100)}% of the period` : "No views yet"}
              </span>
            }
          />
        </Reveal>
        <Reveal delay={0.1} className="h-full">
          <StatCard
            label={`Enquiries, ${range} days`}
            value={leadsInRange.length}
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
          <CardHead title="Daily views" hint={`Last ${range} days`} />
          <div className="px-5 pb-5">
            <DailyBars days={days} caption={`Page views per day, last ${range} days`} />
          </div>
        </Card>
      </Reveal>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Reveal delay={0.05}>
          <Card className="h-full">
            <CardHead title="Top pages" hint="Where visitors land and linger" />
            <div className="px-3 pb-4">
              <RankedBars rows={top(pages)} empty="No page views in this period." />
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.1}>
          <Card className="h-full">
            <CardHead title="Projects drawing attention" hint="Views per project page" />
            <div className="px-3 pb-4">
              <RankedBars rows={top(projects)} empty="No project pages viewed in this period." />
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.05}>
          <Card className="h-full">
            <CardHead title="Traffic sources" hint="Where the visit came from" />
            <div className="px-3 pb-4">
              <RankedBars rows={top(sources)} empty="Nothing recorded in this period." />
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.1}>
          <Card className="h-full">
            <CardHead title="Where enquiries come from" hint="The page each enquiry was sent from" />
            <div className="px-3 pb-4">
              <RankedBars
                rows={top(enquirySources)}
                empty={`No enquiries in the last ${range} days.`}
              />
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
        First-party analytics — no cookies, no visitor identifiers, nothing sent to third parties.
        Studio pages are excluded from counting.
      </p>
    </div>
  );
}
