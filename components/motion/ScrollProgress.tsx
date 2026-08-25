"use client";

import { motion, useScroll, useReducedMotion, useSpring } from "framer-motion";

/**
 * Hairline reading-progress bar across the top of every page.
 *
 * Adopted from terraarchitecture.in, which the client pointed at in round
 * 2 ("liked the interface of this, can we have similar one"). Most of
 * what that site does — warm paper ground, serif display over a brass
 * accent, generous section rhythm, project cards captioned with their
 * category — this site already did. This was the one piece it genuinely
 * lacked, and it is worth having on its own merits: the project pages run
 * long, and a reader who can see how much of a story is left behaves
 * differently from one who cannot.
 *
 * Deliberately quiet about it. Two pixels of brass, no container, no
 * percentage readout, nothing that draws attention to the mechanism —
 * this is a piece of chrome, not a feature.
 *
 * `scaleX` on a transform rather than an animated `width`, so it never
 * touches layout. The spring smooths Lenis's own easing into something
 * that doesn't jitter at the ends of the page.
 *
 * Reduced motion removes it entirely rather than snapping it: its whole
 * content is movement, so a version that cannot move has nothing to say.
 */
export function ScrollProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 30,
    restDelta: 0.001,
  });

  if (reduce) return null;

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-brass"
    />
  );
}
