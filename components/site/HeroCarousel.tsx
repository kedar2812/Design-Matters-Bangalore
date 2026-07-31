"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { IMG_Q, SIZES } from "@/lib/images";

export type HeroSlide = {
  slug: string;
  title: string;
  category: string;
  location: string | null;
  heroImage: string;
  heroBlur: string | null;
  hook: string | null;
};

const SLIDE_MS = 3000;

/**
 * Full-bleed featured-work carousel behind the homepage headline.
 *
 * - Auto-advances every 3s; a glass pause/play control and per-slide
 *   progress bars make the pacing visible and controllable.
 * - Hovering the detail card holds the timer so the story can be read.
 * - Active slide drifts slowly (Ken Burns) — zeroed by the global
 *   reduced-motion rule, and auto-play never starts for those users.
 * - Slide 0 renders server-side with `priority`, so LCP is unaffected.
 * - The headline is passed in as server-rendered children.
 */
export function HeroCarousel({
  slides,
  children,
}: {
  slides: HeroSlide[];
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(null);

  const count = slides.length;
  const playing = !paused && !held && !reduce && count > 1;

  const goTo = useCallback(
    (i: number) => setIndex(((i % count) + count) % count),
    [count],
  );

  useEffect(() => {
    if (!playing) return;
    timer.current = setTimeout(() => goTo(index + 1), SLIDE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [index, playing, goTo]);

  const active = slides[index];

  return (
    // Inset frame: the photography sits in a large rounded panel with a
    // sliver of bone around it — modern, and consistent with the
    // site-wide rounded-image rule.
    <section aria-roledescription="carousel" aria-label="Featured projects" className="p-2.5">
      <div
        className="relative flex min-h-[calc(100dvh-1.25rem)] flex-col justify-end overflow-hidden rounded-[1.5rem]"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") goTo(index + 1);
          if (e.key === "ArrowLeft") goTo(index - 1);
        }}
      >
      {/* Slides */}
      {slides.map((s, i) => (
        <div
          key={s.slug}
          aria-hidden={i !== index}
          className={cn(
            "absolute inset-0 transition-opacity duration-[1100ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
            i === index ? "opacity-100" : "opacity-0",
          )}
        >
          <Image
            src={s.heroImage}
            alt={`${s.title} — ${s.category}${s.location ? `, ${s.location}` : ""}`}
            fill
            priority={i === 0}
            // 107vw, not 100vw: the active slide drifts to scale(1.07),
            // so the painted area is 7% wider than the slot.
            sizes={SIZES.heroCarousel}
            // Slide 0 is the LCP element and the frame the client judges
            // the site by, so it gets the top tier. The rotating slides
            // are only ever seen in motion, where 85 and 90 are
            // indistinguishable — and holding them at 85 keeps ~120 KB
            // off the initial load, since all five slides are in the DOM.
            quality={i === 0 ? IMG_Q.hero : IMG_Q.feature}
            placeholder={s.heroBlur ? "blur" : "empty"}
            blurDataURL={s.heroBlur ?? undefined}
            className={cn("rounded-[inherit] object-cover", i === index && "ken-burns")}
          />
        </div>
      ))}

      {/* Scrims — nav and copy stay legible over light or dark photos */}
      <div className="absolute inset-0 bg-gradient-to-b from-noir/45 via-noir/5 to-noir/70" />

      {/* Foreground */}
      <div className="relative grid items-end gap-8 px-gutter pb-10 pt-40 lg:grid-cols-12">
        <div className="lg:col-span-7">{children}</div>

        {/* Glass project card */}
        <div
          className="w-full max-w-md lg:col-span-5 lg:justify-self-end"
          onMouseEnter={() => setHeld(true)}
          onMouseLeave={() => setHeld(false)}
          onFocus={() => setHeld(true)}
          onBlur={() => setHeld(false)}
        >
          <div className="glass-dark rounded-2xl p-6 text-cream shadow-2xl shadow-noir/30 sm:p-7">
            <p aria-live="polite" className="mono-label mb-3 text-cream/75">
              <span className="text-brass-bright">
                {String(index + 1).padStart(2, "0")}
              </span>
              {" / "}
              {String(count).padStart(2, "0")} — {active.category}
              {active.location && ` · ${active.location}`}
            </p>
            <h2 className="font-display text-h3">
              <Link
                href={`/projects/${active.slug}`}
                className="transition-colors hover:text-brass-bright"
              >
                {active.title}
              </Link>
            </h2>
            {active.hook && (
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-cream/80">
                {active.hook}
              </p>
            )}
            <Link
              href={`/projects/${active.slug}`}
              className="mono-label mt-4 inline-block text-cream/90 underline underline-offset-4 transition-colors hover:text-brass-bright"
            >
              Read the story &rarr;
            </Link>

            {/* Controls */}
            <div className="mt-6 flex items-center gap-3 border-t border-cream/15 pt-5">
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                aria-label="Previous project"
                className="glass-dark flex size-9 shrink-0 items-center justify-center rounded-full transition-colors hover:border-cream/40"
              >
                <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M10 3 5 8l5 5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                aria-label="Next project"
                className="glass-dark flex size-9 shrink-0 items-center justify-center rounded-full transition-colors hover:border-cream/40"
              >
                <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="m6 3 5 5-5 5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setPaused((v) => !v)}
                aria-label={paused ? "Play slideshow" : "Pause slideshow"}
                aria-pressed={paused}
                className="glass-dark flex size-9 shrink-0 items-center justify-center rounded-full transition-colors hover:border-cream/40"
              >
                {paused ? (
                  <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor" aria-hidden="true">
                    <path d="M5 3.5v9l7-4.5-7-4.5Z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor" aria-hidden="true">
                    <path d="M5 3h2.2v10H5V3Zm3.8 0H11v10H8.8V3Z" />
                  </svg>
                )}
              </button>

              {/* Slide progress */}
              <div className="ml-1 flex min-w-0 flex-1 items-center gap-1.5" role="tablist" aria-label="Slides">
                {slides.map((s, i) => (
                  <button
                    key={s.slug}
                    type="button"
                    role="tab"
                    aria-selected={i === index}
                    aria-label={`Go to ${s.title}`}
                    onClick={() => goTo(i)}
                    className="group flex h-6 min-w-0 flex-1 items-center"
                  >
                    <span className="block h-[3px] w-full overflow-hidden rounded-full bg-cream/25 transition-colors group-hover:bg-cream/40">
                      <span
                        key={`${i}-${index}`}
                        className={cn(
                          "block h-full origin-left rounded-full bg-brass-bright",
                          i < index && "scale-x-100",
                          i > index && "scale-x-0",
                        )}
                        style={
                          i === index
                            ? {
                                animation: `slide-progress ${SLIDE_MS}ms linear both`,
                                animationPlayState: playing ? "running" : "paused",
                              }
                            : undefined
                        }
                      />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
