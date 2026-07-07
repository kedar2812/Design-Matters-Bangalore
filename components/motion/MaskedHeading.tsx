"use client";

import { createElement, useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { nav } from "@/lib/first-load";

gsap.registerPlugin(SplitText, useGSAP);

/**
 * Signature moment: the headline masks up on entry.
 *
 * Two implementations, chosen by when we're rendering:
 * - FIRST LOAD → pure CSS (`.mask-rise` in globals.css). It starts
 *   before hydration, so the headline paints within ~200ms and LCP
 *   stamps early. Splitting into lines with JS here would re-render
 *   the heading seconds in and drag LCP with it.
 * - CLIENT NAVIGATION → full per-line SplitText choreography (LCP
 *   only applies to the initial load).
 *
 * Reduced motion: the global CSS rule zeroes the keyframe, and the
 * JS path bails before splitting.
 */
export function MaskedHeading({
  as = "h1",
  children,
  className,
  delay = 0,
}: {
  as?: "h1" | "h2" | "h3" | "p";
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const isFirstLoad = useRef(!nav.visited);

  useGSAP(
    () => {
      if (isFirstLoad.current) return; // CSS variant is already running
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const el = ref.current;
      if (!el) return;

      let split: SplitText | undefined;
      let cancelled = false;
      document.fonts.ready.then(() => {
        if (cancelled || !el.isConnected) return;
        split = SplitText.create(el, { type: "lines", mask: "lines" });
        gsap.from(split.lines, {
          yPercent: 115,
          duration: 1.05,
          ease: "power4.out",
          stagger: 0.09,
          delay,
          // The line masks clip serif descenders at our tight display
          // line-heights — restore the intact text once the reveal ends.
          onComplete: () => {
            split?.revert();
            split = undefined;
          },
        });
      });

      return () => {
        cancelled = true;
        split?.revert();
      };
    },
    { scope: ref },
  );

  if (isFirstLoad.current) {
    return createElement(
      as,
      { ref, className },
      <span className="mask-safe block overflow-hidden">
        <span className="mask-rise block" style={{ animationDelay: `${delay}s` }}>
          {children}
        </span>
      </span>,
    );
  }

  return createElement(as, { ref, className }, children);
}
