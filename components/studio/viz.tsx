import { cn } from "@/lib/utils";

/* Server-rendered studio data-viz primitives. No client JS — hover
   states are CSS-only, so the dashboard stays a pure server render. */

const nf = new Intl.NumberFormat("en-IN");
const nfCompact = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCount(n: number) {
  return n >= 10_000 ? nfCompact.format(n) : nf.format(n);
}

/** 12-point trend in the de-emphasis tone; current period gets the accent dot. */
export function Sparkline({ points, label }: { points: number[]; label: string }) {
  const w = 120;
  const h = 34;
  const max = Math.max(1, ...points);
  const step = points.length > 1 ? w / (points.length - 1) : w;
  const xy = points.map((v, i) => [i * step, h - 3 - (v / max) * (h - 8)] as const);
  const path = xy.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const [ex, ey] = xy[xy.length - 1] ?? [w, h - 3];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-[34px] w-full max-w-[120px] text-stone/50"
      role="img"
      aria-label={label}
    >
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* end marker: surface ring keeps it legible where it crosses the line */}
      <circle cx={ex} cy={ey} r="4" fill="var(--color-chart)" stroke="var(--color-paper)" strokeWidth="2" />
    </svg>
  );
}

/** Signed change vs a named period. Direction arrow, text stays in text tokens. */
export function Delta({ now, prev, period }: { now: number; prev: number; period: string }) {
  if (prev === 0 && now === 0) return <p className="mono-label mt-1.5">no change vs {period}</p>;
  const diff = now - prev;
  const pct = prev > 0 ? Math.round((diff / prev) * 100) : null;
  return (
    <p className="mono-label mt-1.5">
      <span className={cn("mr-1", diff >= 0 ? "text-brass" : "text-stone")} aria-hidden>
        {diff >= 0 ? "▲" : "▼"}
      </span>
      {pct !== null ? `${Math.abs(pct)}%` : nf.format(Math.abs(diff))}{" "}
      {diff >= 0 ? "up" : "down"} vs {period}
    </p>
  );
}

/** KPI stat tile — label, big value, then one optional footer (delta or trend). */
export function StatTile({
  label,
  value,
  children,
}: {
  label: string;
  value: string | number;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-paper p-5">
      <p className="mono-label">{label}</p>
      <p className="mt-2 font-display text-[2.6rem] leading-none tracking-tight">
        {typeof value === "number" ? formatCount(value) : value}
      </p>
      {children}
    </div>
  );
}

export type DayPoint = { key: string; label: string; count: number };

/** Daily bar chart — CSS bars, hover tooltip per bar, sr-only table view. */
export function DailyBars({ days, caption }: { days: DayPoint[]; caption: string }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  return (
    <>
      <div
        className="flex h-36 items-end gap-[2px] border-b border-hairline"
        role="img"
        aria-label={`${caption}, peak ${max}`}
      >
        {days.map((d) => (
          <div key={d.key} className="group relative flex h-full flex-1 items-end">
            <div
              className="w-full rounded-t-[3px] bg-chart transition-opacity group-hover:opacity-70"
              style={{ height: d.count ? `${Math.max(3, (d.count / max) * 100)}%` : "2px" }}
            />
            <span className="mono-label pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-hairline bg-paper px-2 py-1 group-hover:block">
              {d.label} — {d.count}
            </span>
          </div>
        ))}
      </div>
      <div className="mono-label mt-2 flex justify-between">
        <span>{days[0]?.label}</span>
        <span>{days[days.length - 1]?.label}</span>
      </div>
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
    </>
  );
}
