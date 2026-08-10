"use client";

import { motion, useReducedMotion } from "framer-motion";

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
  const reduce = useReducedMotion();

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, delay, ease: [0.32, 0.72, 0, 1] }}
    >
      {children}
    </motion.div>
  );
}
