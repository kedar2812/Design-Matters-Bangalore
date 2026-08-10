import { cn } from "@/lib/utils";

/**
 * Loading placeholders for the studio's Suspense boundaries.
 *
 * Server components — a loading screen that had to hydrate before it
 * could animate would defeat its own purpose. The shimmer is a pure CSS
 * keyframe (`.s-skeleton` in app/studio.css), silent under the global
 * reduced-motion rule.
 *
 * These shapes deliberately match the real screens: same card radius,
 * same row height, same column positions. A skeleton that does not match
 * what replaces it produces a visible jolt on every load, which reads as
 * slower than showing nothing at all.
 */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("s-skeleton", className)} />;
}

/** Page title + blurb — every studio screen opens with this shape. */
export function SkeletonHeader() {
  return (
    <div className="mb-6">
      <Skeleton className="h-6 w-44 max-w-full" />
      <Skeleton className="mt-2.5 h-3.5 w-80 max-w-full" />
    </div>
  );
}

/** A stack of list rows — projects, enquiries, journal entries. */
export function SkeletonRows({ rows = 6, thumb = true }: { rows?: number; thumb?: boolean }) {
  return (
    <div className="rounded-s border border-s-border bg-s-surface p-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b border-s-border px-2 py-2.5 last:border-0"
          // Each row starts its shimmer a beat later, so the list reads
          // as filling in rather than pulsing as one block.
          style={{ animationDelay: `${i * 90}ms` }}
        >
          {thumb && <Skeleton className="size-11 shrink-0" />}
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-1/3 min-w-[8rem]" />
            <Skeleton className="mt-2 h-3 w-1/2 min-w-[10rem]" />
          </div>
          <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** A grid of cards — the content index and dashboard tiles. */
export function SkeletonCards({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-s border border-s-border bg-s-surface p-4 shadow-s">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="mt-3 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-2/3" />
          <Skeleton className="mt-4 h-5 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** A long editing form — the project and journal editors. */
export function SkeletonForm() {
  return (
    <div className="max-w-3xl space-y-4">
      <div className="rounded-s border border-s-border bg-s-surface p-5 shadow-s">
        <Skeleton className="h-4 w-28" />
        <div className="mt-5 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-[34px] w-full" />
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-[34px] w-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-s border border-s-border bg-s-surface p-5 shadow-s">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="mt-4 aspect-[8/5] w-full max-w-md rounded-s-sm" />
      </div>
    </div>
  );
}

/** The overview's KPI strip. */
export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-s border border-s-border bg-s-surface p-4 shadow-s">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-8 w-16" />
          <Skeleton className="mt-3 h-4 w-28 rounded-full" />
        </div>
      ))}
    </div>
  );
}
