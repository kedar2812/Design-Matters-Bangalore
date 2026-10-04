"use client";

import { usePathname } from "next/navigation";

/**
 * Screen transition for the studio. Keyed on the pathname so each route
 * change remounts it and replays the entry — a short rise and fade that
 * makes moving between screens feel deliberate rather than abrupt.
 *
 * The rise is the CSS `.s-rise` animation, not framer-motion: a motion
 * `initial` is server-rendered as `opacity:0` and waits for hydration, so
 * on a new device every dashboard screen stayed blank until the whole
 * bundle had downloaded (see studio.css).
 *
 * `children` stay server components: they are passed through as a prop
 * and never re-rendered on the client. No exit animation, because the
 * outgoing screen has already been replaced by the time this mounts.
 */
export function StudioTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div
      key={pathname}
      className="s-rise"
      style={
        {
          "--s-rise": "10px",
          animationDuration: "0.45s",
          animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
