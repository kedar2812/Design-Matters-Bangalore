"use client";

import { createElement, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

/**
 * Lyric-style scrubbed reveal, one word at a time: each word rises,
 * sharpens from a blur and inks in as the reader scrolls it into the
 * reading zone, like a subtitle lighting up. Scroll position drives it
 * (scrub, with a short lag so it glides with Lenis rather than stepping).
 *
 * Where the wave runs is the whole effect, and it was wrong before. The
 * range used to be keyed to the paragraph's top only ("top 85%" to
 * "top 25%"). The home statement is nine lines on a laptop and sixteen on
 * a phone, so the paragraph's top reached 25% long before its last line
 * was on screen: the word in flight always sat at, or below, the bottom
 * edge of the window. On a laptop you saw a smudge along the fold; on a
 * phone the second half finished animating before it ever appeared, and
 * the text simply looked static. The range now runs from the first line
 * reaching 80% of the viewport to the last line reaching 60%, so the
 * active word is always in the lower-middle of the screen, where the eye
 * is, whatever the paragraph's length or the screen's size.
 *
 * SSR renders the full paragraph (SEO and no-JS intact); reduced motion
 * leaves it untouched. The split is deferred until the paragraph is
 * within a screen of the viewport, so a page loaded above it (and an
 * audit tool scanning the whole document) sees ordinary text.
 *
 * Blur only on fine pointers: filter animation drops frames on low-end
 * phones, which get a slightly deeper rise instead.
 *
 * Accessibility: SplitText's `aria: "auto"` puts an `aria-label` on a
 * bare element, which is invalid there, so it is "none" and a
 * visually-hidden copy of the sentence is provided instead, with the
 * split layer aria-hidden. The dimmed state is only ever seen by words
 * still below the 80% line; everything above the reading zone is at full
 * contrast, including for anyone who lands mid-page.
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
    (_, contextSafe) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const el = ref.current;
      if (!el || !contextSafe) return;

      const fine = window.matchMedia("(pointer: fine)").matches;
      let split: SplitText | undefined;

      // contextSafe: this runs after the effect has returned (fonts, then
      // the observer), and animations created outside the context are not
      // reverted on unmount. They used to leak one ScrollTrigger per visit
      // on client-side navigation.
      const build = contextSafe(() => {
        if (split || !el.isConnected) return;
        split = SplitText.create(el, { type: "words", aria: "none" });

        gsap.fromTo(
          split.words,
          {
            opacity: 0.2,
            yPercent: fine ? 35 : 45,
            ...(fine && { filter: "blur(6px)" }),
          },
          {
            opacity: 1,
            yPercent: 0,
            ...(fine && { filter: "blur(0px)" }),
            // Each word eases into place on its own, and roughly two and a
            // half are in flight at once: distinct words, one continuous wave.
            ease: "power2.out",
            duration: 0.5,
            stagger: 0.2,
            scrollTrigger: {
              trigger: el,
              start: "top 80%",
              end: "bottom 60%",
              scrub: 0.5,
              // No `invalidateOnRefresh`. On a staggered fromTo it throws
              // away the start state of every word that has not begun yet
              // at the first refresh (which ScrollTrigger runs on load), so
              // the words ahead of the wave sat at full ink and each one
              // blinked out and back as it was reached. Start and end are
              // recomputed on refresh regardless.
            },
          },
        );
      });

      const observer = new IntersectionObserver(
        (entries, self) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          self.disconnect();
          document.fonts.ready.then(build);
        },
        { rootMargin: "100% 0px" },
      );
      observer.observe(el);

      return () => {
        observer.disconnect();
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
