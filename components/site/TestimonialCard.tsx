"use client";

import { useEffect, useRef, useState } from "react";
import { Stars } from "@/components/site/Stars";
import { cn } from "@/lib/utils";

/**
 * One review in the testimonials masonry. Long reviews are clamped to
 * keep the grid's rhythm; a quiet "read on" control expands them in
 * place — the text itself stays verbatim, exactly as written on Google.
 */
export function TestimonialCard({
  author,
  context,
  rating,
  text,
  sourceDate,
  source,
}: {
  author: string;
  context?: string | null;
  rating: number;
  text: string;
  sourceDate?: string | null;
  source: string;
}) {
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  // Only offer the toggle when the clamp is actually hiding something.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const check = () => setOverflowing(el.scrollHeight > el.clientHeight + 2);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <figure className="break-inside-avoid rounded-2xl border border-hairline bg-paper p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-noir/5 sm:p-7">
      <div className="flex items-center justify-between gap-4">
        <Stars rating={rating} />
        {sourceDate && <span className="mono-label text-stone/80">{sourceDate}</span>}
      </div>

      <blockquote className="mt-5">
        <p
          ref={bodyRef}
          className={cn(
            "text-sm leading-relaxed text-ink-soft",
            !open && "line-clamp-[9]",
          )}
        >
          {text}
        </p>
        {(overflowing || open) && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="mono-label mt-3 text-brass underline-offset-4 transition-colors hover:text-brass-deep hover:underline"
          >
            {open ? "Show less" : "Read the full review"}
          </button>
        )}
      </blockquote>

      <figcaption className="rule mt-6 flex items-baseline justify-between gap-4 pt-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{author}</p>
          {context && <p className="mono-label mt-1 text-stone/80">{context}</p>}
        </div>
        {source === "google" && (
          <span className="mono-label shrink-0 text-stone/70">via Google</span>
        )}
      </figcaption>
    </figure>
  );
}
