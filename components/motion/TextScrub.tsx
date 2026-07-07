"use client";

import { createElement, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

/**
 * Scroll-scrubbed statement reveal: the text splits into words that
 * brighten from a whisper to full ink as the paragraph moves up the
 * viewport — tied to scroll position (scrub), so with Lenis smoothing
 * it reads as one continuous, buttery wash of light.
 *
 * SSR renders the full paragraph (SEO + no-JS intact); reduced motion
 * leaves it untouched.
 */
export function TextScrub({
  as = "p",
  children,
  className,
}: {
  as?: "p" | "h2" | "h3";
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const el = ref.current;
      if (!el) return;

      let split: SplitText | undefined;
      let cancelled = false;
      document.fonts.ready.then(() => {
        if (cancelled || !el.isConnected) return;
        split = SplitText.create(el, { type: "words" });
        gsap.fromTo(
          split.words,
          { opacity: 0.12 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.06,
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              end: "top 32%",
              scrub: 0.4,
            },
          },
        );
      });

      return () => {
        cancelled = true;
        split?.revert();
      };
    },
    { scope: ref },
  );

  return createElement(as, { ref, className }, children);
}
