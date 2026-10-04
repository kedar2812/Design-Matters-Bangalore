import { cn } from "@/lib/utils";

/**
 * The entry animation for a dashboard card.
 *
 * Deliberately smaller and faster than the public site's reveals. On a
 * portfolio a slow rise is part of the experience; on a tool it is
 * latency you added on purpose. 8px and 260ms is enough to read as
 * "arriving" and short enough that a studio clicking through five screens
 * in ten seconds never waits on it.
 *
 * It runs on mount rather than on scroll: a dashboard screen is short,
 * everything is above the fold, and a viewport trigger would leave the
 * lower cards blank until the page happened to be scrolled.
 *
 * Plain CSS (`.s-rise` in studio.css), so a card is visible from first
 * paint instead of waiting on hydration; reduced motion is handled by the
 * global rule.
 */
export function Reveal({
  delay = 0,
  className,
  children,
}: {
  delay?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn("s-rise", className)}
      style={delay ? ({ "--s-delay": `${delay}s` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
