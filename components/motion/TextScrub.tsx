"use client";

import { createElement, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

/**
 * Lyric-style scrubbed reveal: every word is its own animation — it
 * rises, sharpens from a blur and inks in, one after another, like a
 * subtitle lighting up. Tied to scroll position with a short lag
 * (scrub: 0.6) so it glides with Lenis rather than stepping.
 *
 * SSR renders the full paragraph (SEO + no-JS intact); reduced motion
 * leaves it untouched. Blur is skipped on coarse pointers, because filter
 * animation drops frames on low-end phones.
 *
 * Accessibility, after an audit flagged two things here:
 *
 *  - SplitText's own `aria: "auto"` puts an `aria-label` on the element
 *    it splits, which is invalid on a bare <p> and failed
 *    `aria-prohibited-attr`. It is set to "none" now, and the accessible
 *    copy is provided here instead: a visually-hidden span holding the
 *    real sentence, with the split layer marked aria-hidden. Screen
 *    readers get one clean sentence rather than a stack of word divs.
 *  - The words used to start at opacity 0.08, which is 1.17:1 against
 *    bone. That is not a scoring technicality; it is unreadable, and
 *    anyone landing mid-page or scrolling fast sees a paragraph that
 *    isn't there. The floor is 0.5 now, which clears the 3:1 that WCAG
 *    asks of large text in both themes. The rise and the blur still
 *    carry the effect.
 */
export function TextScrub({
  as = "p",
  children,
  className,
}: {
  as?: "p" | "h2" | "h3" | "blockquote";
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const el = ref.current;
      if (!el) return;

      const blurOk = window.matchMedia("(pointer: fine)").matches;

      let split: SplitText | undefined;
      let cancelled = false;
      document.fonts.ready.then(() => {
        if (cancelled || !el.isConnected) return;
        split = SplitText.create(el, { type: "words", aria: "none" });
        gsap.set(split.words, { willChange: "transform, opacity, filter" });
        gsap.fromTo(
          split.words,
          {
            opacity: 0.5,
            yPercent: 40,
            ...(blurOk && { filter: "blur(8px)" }),
          },
          {
            opacity: 1,
            yPercent: 0,
            ...(blurOk && { filter: "blur(0px)" }),
            ease: "none",
            // Long overlap: each word is mid-flight while the next
            // begins — a continuous wave instead of a ticker.
            stagger: { each: 0.35, ease: "none" },
            duration: 1.4,
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              end: "top 25%",
              scrub: 0.6,
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

  return createElement(
    as,
    { className },
    <>
      {/* The sentence, once, for assistive tech. */}
      <span className="sr-only">{children}</span>
      {/* The visible layer that gets split into words. */}
      <span ref={ref} aria-hidden="true" className="block">
        {children}
      </span>
    </>,
  );
}
