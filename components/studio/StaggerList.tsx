import { Children, cloneElement, isValidElement } from "react";
import { cn } from "@/lib/utils";

/**
 * A <ul> whose rows fade up one after another.
 *
 * Deliberately CSS-only (the shared `.fade-rise` keyframe plus a
 * per-row `animation-delay`), for two reasons: a list screen stays a
 * server component, and the animation starts at first paint rather than
 * waiting on hydration. A framer-motion wrapper can't do this job here
 * — wrapping each <li> would break `divide-y`, and `display: contents`
 * on the wrapper would make it untransformable.
 *
 * The stagger is capped: past a dozen rows the delay stops growing, or
 * the tail of a long portfolio would arrive noticeably late. The global
 * reduced-motion rule collapses the whole thing to an instant show.
 */
export function StaggerList({
  children,
  className,
  step = 0.04,
  maxDelay = 0.48,
}: {
  children: React.ReactNode;
  className?: string;
  step?: number;
  maxDelay?: number;
}) {
  return (
    <ul className={className}>
      {Children.map(children, (child, i) => {
        if (!isValidElement<{ className?: string; style?: React.CSSProperties }>(child)) {
          return child;
        }
        return cloneElement(child, {
          className: cn("fade-rise", child.props.className),
          style: {
            ...child.props.style,
            animationDelay: `${Math.min(i * step, maxDelay)}s`,
          },
        });
      })}
    </ul>
  );
}
