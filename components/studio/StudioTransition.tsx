"use client";

import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Screen transition for the studio. Keyed on the pathname so each route
 * change replays the entry — a short rise and fade that makes moving
 * between screens feel deliberate rather than abrupt.
 *
 * `children` stay server components: they are passed through as a prop
 * and never re-rendered on the client. No exit animation, because the
 * outgoing screen has already been replaced by the time this mounts.
 */
export function StudioTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    <motion.div
      key={pathname}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
