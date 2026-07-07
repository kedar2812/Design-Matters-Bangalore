"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export type LightboxImage = {
  url: string;
  alt: string;
  blur?: string | null;
};

const LightboxContext = createContext<{ open: (i: number) => void } | null>(null);

/**
 * Gallery lightbox for project photography. Wrap a page section in
 * <LightboxProvider images={...}> and mark each visible photo with
 * <LightboxTrigger index={i}> — clicking opens a full-screen frosted
 * viewer with arrows, keyboard navigation, counter and caption.
 */
export function LightboxProvider({
  images,
  children,
}: {
  images: LightboxImage[];
  children: React.ReactNode;
}) {
  const [current, setCurrent] = useState<number | null>(null);
  const reduce = useReducedMotion();
  const isOpen = current !== null;

  const open = useCallback((i: number) => setCurrent(i), []);
  const close = useCallback(() => setCurrent(null), []);
  const step = useCallback(
    (dir: 1 | -1) =>
      setCurrent((c) =>
        c === null ? c : (c + dir + images.length) % images.length,
      ),
    [images.length],
  );

  // Keyboard + scroll lock while open (Lenis drives window scroll, so
  // pause it too — see LenisProvider).
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    window.__lenis?.stop();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      window.__lenis?.start();
    };
  }, [isOpen, close, step]);

  const img = current !== null ? images[current] : null;

  return (
    <LightboxContext.Provider value={{ open }}>
      {children}

      <AnimatePresence>
        {img && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Photo viewer — ${img.alt}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.3 }}
            className="fixed inset-0 z-[70] bg-noir/85 backdrop-blur-2xl"
            onClick={close}
          >
            {/* Frame — frames stack absolutely and crossfade, so the
                outgoing photo stays visible until the next has faded
                in over it: no blank flash between arrows. */}
            <div
              className="absolute inset-x-4 bottom-24 top-20 sm:inset-x-20"
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence initial={false}>
                <motion.div
                  key={current}
                  className="absolute inset-0"
                  initial={reduce ? false : { opacity: 0, scale: 0.99 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Image
                    src={img.url}
                    alt={img.alt}
                    fill
                    sizes="100vw"
                    quality={88}
                    loading="eager"
                    placeholder={img.blur ? "blur" : "empty"}
                    blurDataURL={img.blur ?? undefined}
                    className="object-contain"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Chrome — stop propagation so controls don't close */}
            <div
              className="absolute inset-x-0 top-0 flex items-center justify-between px-5 py-4 sm:px-8"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="mono-label text-cream/80">
                <span className="text-brass-bright">
                  {String((current ?? 0) + 1).padStart(2, "0")}
                </span>
                {" — "}
                {String(images.length).padStart(2, "0")}
              </p>
              <button
                type="button"
                onClick={close}
                aria-label="Close photo viewer"
                className="glass-dark flex size-11 items-center justify-center rounded-full text-cream transition-colors hover:border-cream/40"
              >
                <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="m3.5 3.5 9 9m0-9-9 9" />
                </svg>
              </button>
            </div>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    step(-1);
                  }}
                  aria-label="Previous photo"
                  className="glass-dark absolute left-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-cream transition-colors hover:border-cream/40 sm:left-6"
                >
                  <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M10 3 5 8l5 5" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    step(1);
                  }}
                  aria-label="Next photo"
                  className="glass-dark absolute right-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-cream transition-colors hover:border-cream/40 sm:right-6"
                >
                  <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="m6 3 5 5-5 5" />
                  </svg>
                </button>
              </>
            )}

            <p
              className="mono-label absolute inset-x-0 bottom-8 px-gutter text-center text-cream/70"
              onClick={(e) => e.stopPropagation()}
            >
              {img.alt}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </LightboxContext.Provider>
  );
}

/** Clickable wrapper around a photo that opens it in the lightbox. */
export function LightboxTrigger({
  index,
  className,
  children,
}: {
  index: number;
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = useContext(LightboxContext);
  return (
    <button
      type="button"
      onClick={() => ctx?.open(index)}
      aria-label="View photo full screen"
      className={cn("block w-full cursor-zoom-in text-left", className)}
    >
      {children}
    </button>
  );
}
