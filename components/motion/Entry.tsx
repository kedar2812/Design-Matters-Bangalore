import { cn } from "@/lib/utils";

/**
 * Entry reveal for ABOVE-FOLD content: pure CSS (`.fade-rise`), so it
 * begins before hydration and never delays LCP. No client JS at all —
 * this is a server component. For below-fold, scroll-triggered
 * reveals use <Reveal /> instead.
 */
export function Entry({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("fade-rise", className)}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}
