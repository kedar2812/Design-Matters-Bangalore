"use client";

import { motion, useReducedMotion } from "framer-motion";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/**
 * Reveal-on-scroll: fade + gentle rise, replaying every time the
 * element re-enters the viewport (scroll down, back up, down again —
 * it animates again). Transform + opacity only.
 */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: "-10% 0px" }}
      transition={{ duration: 0.8, delay, ease: EASE_OUT_EXPO }}
    >
      {children}
    </motion.div>
  );
}
