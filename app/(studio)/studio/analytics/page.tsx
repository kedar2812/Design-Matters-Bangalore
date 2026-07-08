import { prisma } from "@/lib/db";

export const metadata = { title: "Studio — Analytics" };

const DAY = 86_400_000;

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Horizontal magnitude list — doubles as the table view. */
function BarList({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: [string, number][];
  empty: string;
}) {
  const max = Math.max(1, ...rows.map(([, n]) => n));
  return (
    <section>
      <h2 className="mono-label rule pt-4">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-stone">{empty}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map(([label, n]) => (
            <li key={label} className="grid grid-cols-[minmax(0,14rem)_1fr_auto] items-center gap-3">
              <span className="truncate text-sm text-ink-soft" title={label}>{label}</span>
              <span className="h-1.5 rounded-[2px] bg-chart" style={{ width: `${(n / max) * 100}%` }} />
              <span className="mono-label tabular-nums">{n}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function AnalyticsPage() {
  const now = Date.now();
  const start30 = new Date(now - 30 * DAY);
  const start7 = new Date(now - 7 * DAY);

  const [views, leads30, projectTitles] = await Promise.all([
    prisma.pageView.findMany({
      where: { createdAt: { gte: start30 } },
      select: { path: true, source: true, device: true, createdAt: true },
    }),
    prisma.lead.findMany({
      where: { createdAt: { gte: start30 } },
      select: { source: true },
    }),
    prisma.project.findMany({ select: { slug: true, title: true } }),
  ]);
  const titleBySlug = new Map(projectTitles.map((p) => [p.slug, p.title]));

  /* ---- aggregate (volumes are small; JS is fine) ---- */
  const days: { key: string; label: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
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
  let views7 = 0;
  let mobile = 0;

  for (const v of views) {
    const day = byDay.get(dayKey(v.createdAt));
    if (day) day.count++;
    if (v.createdAt >= start7) views7++;
    tally(pages, v.path);
    if (v.path.startsWith("/projects/")) {
      const slug = v.path.slice("/projects/".length).replace(/\/$/, "");
      if (slug) tally(projects, titleBySlug.get(slug) ?? slug);
    }
    tally(sources, v.source ?? "direct");
    if (v.device === "mobile") mobile++;
  }

  const enquirySources = new Map<string, number>();
  for (const l of leads30) tally(enquirySources, l.source ?? "unknown");

  const top = (m: Map<string, number>, n: number): [string, number][] =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);

  const maxDay = Math.max(1, ...days.map((d) => d.count));
  const desktop = views.length - mobile;

  return (
    <div className="max-w-5xl">
      <header className="mb-12">
        <p className="mono-label mb-2">Analytics — last 30 days</p>
        <h1 className="font-display text-h2">Who&rsquo;s looking, and at what.</h1>
      </header>

      {/* Vitals */}
      <div className="rule grid grid-cols-2 gap-8 pt-6 sm:grid-cols-4">
        {[
          ["Views, 30 days", views.length],
          ["Views, 7 days", views7],
          ["Enquiries, 30 days", leads30.length],
          ["On mobile", views.length ? `${Math.round((mobile / views.length) * 100)}%` : "—"],
        ].map(([label, value]) => (
          <div key={String(label)}>
            <p className="font-display text-h1 tabular-nums">{String(value)}</p>
            <p className="mono-label mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Daily views */}
      <section className="mt-14">
        <h2 className="mono-label rule pt-4">Daily views</h2>
        {views.length === 0 ? (
          <p className="mt-4 text-sm text-stone">
            Collecting starts the moment someone browses the site — check back
            after launch (studio pages are never counted).
          </p>
        ) : (
          <>
            <div className="mt-6 flex h-40 items-end gap-[2px] border-b border-hairline" role="img"
              aria-label={`Daily page views, last 30 days, peak ${maxDay}`}>
              {days.map((d) => (
                <div key={d.key} className="group relative flex h-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-[2px] bg-chart transition-opacity group-hover:opacity-70"
                    style={{ height: d.count ? `${Math.max(3, (d.count / maxDay) * 100)}%` : "2px" }}
                  />
                  {/* CSS-only tooltip */}
                  <span className="mono-label pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap border border-hairline bg-paper px-2 py-1 group-hover:block">
                    {d.label} — {d.count}
                  </span>
                </div>
              ))}
            </div>
            <div className="mono-label mt-2 flex justify-between">
              <span>{days[0].label}</span>
              <span>{days[days.length - 1].label}</span>
            </div>
            {/* Screen-reader table view */}
            <table className="sr-only">
              <caption>Daily page views, last 30 days</caption>
              <thead><tr><th>Date</th><th>Views</th></tr></thead>
              <tbody>
                {days.map((d) => (
                  <tr key={d.key}><td>{d.label}</td><td>{d.count}</td></tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>

      {/* Lists */}
      <div className="mt-14 grid gap-x-16 gap-y-14 lg:grid-cols-2">
        <BarList
          title="Top pages"
          rows={top(pages, 8)}
          empty="No visits recorded yet."
        />
        <BarList
          title="Projects drawing attention"
          rows={top(projects, 8)}
          empty="No project pages viewed yet."
        />
        <BarList
          title="Traffic sources"
          rows={top(sources, 8)}
          empty="No referrers seen yet."
        />
        <BarList
          title="Where enquiries come from"
          rows={top(enquirySources, 8)}
          empty="No enquiries in the last 30 days."
        />
      </div>

      {/* Device split */}
      {views.length > 0 && (
        <section className="mt-14 max-w-xl">
          <h2 className="mono-label rule pt-4">Device</h2>
          <div className="mt-4 flex h-1.5 gap-[2px]">
            <span className="rounded-[2px] bg-chart" style={{ width: `${(mobile / views.length) * 100}%` }} />
            <span className="rounded-[2px] bg-stone" style={{ width: `${(desktop / views.length) * 100}%` }} />
          </div>
          <div className="mt-3 flex gap-8">
            <p className="mono-label"><span className="mr-2 inline-block h-2 w-2 rounded-[2px] bg-chart align-middle" />Mobile — {mobile}</p>
            <p className="mono-label"><span className="mr-2 inline-block h-2 w-2 rounded-[2px] bg-stone align-middle" />Desktop — {desktop}</p>
          </div>
        </section>
      )}

      <p className="mono-label rule mt-16 pt-4 text-stone">
        First-party analytics — no cookies, no visitor identifiers, nothing sent
        to third parties. Studio pages are excluded.
      </p>
    </div>
  );
}
