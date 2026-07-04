"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { nav } from "@/lib/first-load";

/**
 * Route transition: a quiet fade + settle — but ONLY on client-side
 * navigations. On the initial load the page must paint immediately
 * (animating here would serialize opacity:0 into the SSR HTML and
 * hold the whole page invisible until hydration — an LCP disaster).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const isFirstLoad = useRef(!nav.visited);
  useEffect(() => {
    nav.visited = true;
  }, []);

  const skip = reduce || isFirstLoad.current;

  return (
    <motion.div
      initial={skip ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
