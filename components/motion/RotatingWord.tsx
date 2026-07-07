"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Rolling word for the hero headline: each word rises in through a
 * text mask while the previous one exits upward, on a slow clock.
 * The first word is server-rendered (LCP-safe); reduced motion keeps
 * it static. `mask-safe` padding keeps serif descenders unclipped.
 */
export function RotatingWord({
  words,
  interval = 2800,
  className,
}: {
  words: readonly string[];
  interval?: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || words.length < 2) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % words.length),
      interval,
    );
    return () => clearInterval(id);
  }, [reduce, words.length, interval]);

  return (
    <span
      className={cn(
        "mask-safe relative inline-flex overflow-hidden align-baseline",
        className,
      )}
    >
      {/* mode="wait": the outgoing word fully clears the mask before the
          next rises in — words can never overlap, even under jank. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={words[index]}
          initial={reduce ? false : { y: "115%" }}
          animate={{ y: 0 }}
          exit={reduce ? { opacity: 0 } : { y: "-115%" }}
          transition={{ duration: 0.55, ease: EASE }}
          className="inline-block whitespace-nowrap"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
