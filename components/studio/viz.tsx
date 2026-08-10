import { cn } from "@/lib/utils";
import { Card } from "@/components/studio/ui";

/**
 * Studio data-viz primitives.
 *
 * Server-rendered with no client JS — every hover state here is CSS, so a
 * dashboard full of charts still costs nothing to hydrate. Anything that
 * genuinely needs interaction (a range picker) is a separate client
 * component that re-renders these on the server with new numbers.
 *
 * One hue throughout. These are all single-series counts, and a
 * categorical palette across charts that share no categories is the
 * fastest way to make a dashboard look like a template — colour has to
 * mean something or it should not be spent.
 */

const nf = new Intl.NumberFormat("en-IN");
const nfCompact = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCount(n: number) {
  return n >= 10_000 ? nfCompact.format(n) : nf.format(n);
}

/* ------------------------------------------------------------ sparkline */

/**
 * A filled trend, not just a line. At 40px tall a bare stroke reads as
 * decoration; the fill gives it enough body to register as a shape while
 * staying quiet under the number it belongs to.
 */
export function Sparkline({
  points,
  label,
  className,
}: {
  points: number[];
  label: string;
  className?: string;
}) {
  const w = 132;
  const h = 40;
  const max = Math.max(1, ...points);
  const step = points.length > 1 ? w / (points.length - 1) : w;
  const xy = points.map((v, i) => [i * step, h - 3 - (v / max) * (h - 9)] as const);
  const line = xy
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  const [ex, ey] = xy[xy.length - 1] ?? [w, h - 3];
  // A gradient id must be unique per document or the first one wins for
  // every chart on the page.
  const gid = `spark-${label.replace(/\W+/g, "-").toLowerCase()}`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={cn("h-10 w-full text-s-chart", className)}
      role="img"
      aria-label={label}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={ex} cy={ey} r="2.75" fill="currentColor" />
    </svg>
  );
}

/* ---------------------------------------------------------------- delta */

/**
 * Change against the previous period.
 *
 * "Up" is not automatically good — enquiries rising is good, a bounce
 * rate rising is not — but everything this dashboard counts is a good
 * thing to have more of, so up is green here and that is honest.
 */
export function Delta({ now, prev, period }: { now: number; prev: number; period: string }) {
  if (prev === 0 && now === 0) {
    return <span className="text-[0.75rem] text-s-text-3">No activity yet</span>;
  }
  const diff = now - prev;
  const pct = prev > 0 ? Math.round((diff / prev) * 100) : null;
  const flat = diff === 0;

  return (
    <span className="inline-flex items-center gap-1.5 text-[0.75rem]">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 rounded-full px-1.5 py-[2px] font-medium leading-none",
          flat
            ? "bg-s-muted-soft text-s-muted"
            : diff > 0
              ? "bg-s-good-soft text-s-good"
              : "bg-s-bad-soft text-s-bad",
        )}
      >
        {!flat && (
          <svg viewBox="0 0 12 12" className="size-2.5" aria-hidden>
            <path
              d={diff > 0 ? "M6 2.5 10 8H2z" : "M6 9.5 2 4h8z"}
              fill="currentColor"
            />
          </svg>
        )}
        {pct !== null ? `${Math.abs(pct)}%` : nf.format(Math.abs(diff))}
      </span>
      <span className="text-s-text-3">vs {period}</span>
    </span>
  );
}

/* ------------------------------------------------------------ stat card */

export function StatCard({
  label,
  value,
  footer,
  spark,
}: {
  label: string;
  value: string | number;
  footer?: React.ReactNode;
  spark?: number[];
}) {
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="p-4 pb-3">
        <p className="text-[0.8125rem] font-medium text-s-text-3">{label}</p>
        <p className="s-display mt-1.5 text-[2rem] leading-none text-s-text">
          {typeof value === "number" ? formatCount(value) : value}
        </p>
        {footer && <div className="mt-2.5">{footer}</div>}
      </div>
      {spark && spark.length > 1 && (
        <div className="mt-auto px-0 pb-0" aria-hidden>
          <Sparkline points={spark} label={`${label} trend`} />
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------ bar chart */

export type DayPoint = { key: string; label: string; count: number };

/**
 * Daily counts.
 *
 * Bars rather than a line: these are discrete days with frequent zeroes,
 * and a line drawn through zeroes implies a continuous quantity that was
 * measured between the points, which it was not. A zero day still gets a
 * 2px stub so the axis reads as a series of days rather than a gap.
 */
export function DailyBars({
  days,
  caption,
  height = "h-44",
}: {
  days: DayPoint[];
  caption: string;
  height?: string;
}) {
  const max = Math.max(1, ...days.map((d) => d.count));
  const total = days.reduce((s, d) => s + d.count, 0);

  return (
    <div>
      <div
        className={cn("flex items-end gap-[3px] border-b border-s-border", height)}
        role="img"
        aria-label={`${caption}. ${total} in total, peak ${max}.`}
      >
        {days.map((d) => (
          <div key={d.key} className="group relative flex h-full flex-1 items-end">
            <div
              className="w-full rounded-t-[2px] bg-s-chart/85 transition-colors duration-150 group-hover:bg-s-chart"
              style={{ height: d.count ? `${Math.max(4, (d.count / max) * 100)}%` : "2px" }}
            />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-s-xs border border-s-border bg-s-surface px-2 py-1 text-[0.75rem] text-s-text shadow-s-md group-hover:block">
              <span className="font-medium">{d.count}</span>{" "}
              <span className="text-s-text-3">· {d.label}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[0.75rem] text-s-text-3">
        <span>{days[0]?.label}</span>
        <span>{days[days.length - 1]?.label}</span>
      </div>

      {/* The same numbers, reachable by a screen reader and by anyone who
          would rather read them than hover thirty bars. */}
      <table className="sr-only">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Views</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.key}>
              <td>{d.label}</td>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* --------------------------------------------------------- ranked lists */

/**
 * A ranked list where the bar is the row background rather than a
 * separate element beside the label. It lets the label use the full width
 * and keeps long paths from being squeezed into a third of the row.
 */
export function RankedBars({
  rows,
  empty = "Nothing recorded yet.",
  href,
}: {
  rows: { key: string; label: string; count: number; sub?: string }[];
  empty?: string;
  href?: (key: string) => string | undefined;
}) {
  if (rows.length === 0) {
    return <p className="px-5 py-8 text-center text-[0.8125rem] text-s-text-3">{empty}</p>;
  }
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <ul className="flex flex-col">
      {rows.map((r) => {
        const link = href?.(r.key);
        const inner = (
          <>
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 rounded-s-xs bg-s-chart/12 transition-[width] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
              style={{ width: `${Math.max(2, (r.count / max) * 100)}%` }}
            />
            <span className="relative min-w-0 flex-1 truncate">{r.label}</span>
            {r.sub && (
              <span className="relative shrink-0 text-[0.75rem] text-s-text-3">{r.sub}</span>
            )}
            <span className="s-num relative shrink-0 font-medium tabular-nums">{r.count}</span>
          </>
        );

        return (
          <li key={r.key}>
            {link ? (
              <a
                href={link}
                className="relative flex items-center gap-3 overflow-hidden rounded-s-xs px-2 py-2 text-[0.8125rem] text-s-text transition-colors hover:bg-s-surface-3"
              >
                {inner}
              </a>
            ) : (
              <div className="relative flex items-center gap-3 overflow-hidden rounded-s-xs px-2 py-2 text-[0.8125rem] text-s-text">
                {inner}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* --------------------------------------------------------- segmented bar */

/**
 * One bar split into parts — the lead pipeline, or a device split.
 *
 * Segments below 1.5% are given that as a floor: a single lead out of a
 * hundred is worth seeing, and a sub-pixel sliver is the same as not
 * drawing it. The legend carries the real numbers, so the floor cannot
 * mislead anyone who reads on.
 */
export function SegmentedBar({
  segments,
  className,
}: {
  segments: { key: string; label: string; count: number; color: string }[];
  className?: string;
}) {
  const total = segments.reduce((s, x) => s + x.count, 0);
  if (total === 0) {
    return <div className={cn("h-2 rounded-full bg-s-surface-3", className)} />;
  }
  return (
    <div className={cn("flex h-2 gap-[2px] overflow-hidden rounded-full", className)}>
      {segments
        .filter((s) => s.count > 0)
        .map((s) => (
          <div
            key={s.key}
            className="h-full rounded-full first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${Math.max(1.5, (s.count / total) * 100)}%`,
              background: s.color,
            }}
            title={`${s.label}: ${s.count}`}
          />
        ))}
    </div>
  );
}
