"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Light/dark switch. Light is the site default; the choice persists in
 * localStorage and is applied pre-paint by the inline script in the
 * root layout. The icon morphs between a sun and a crescent.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(false);

  // Read the actual state after hydration (the pre-paint script may
  // have set it before React mounted).
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("dma-theme", next ? "dark" : "light");
    } catch {
      // private mode — theme just won't persist
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={dark}
      className={cn(
        "relative flex size-9 items-center justify-center rounded-full border transition-colors duration-300",
        className,
      )}
    >
      <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden="true">
        {/* Core disc — shared by both states */}
        <circle
          cx="10"
          cy="10"
          r="4"
          className="fill-current transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ transform: dark ? "scale(1.4)" : "scale(1)", transformOrigin: "center" }}
        />
        {/* Rays — collapse into the disc in dark mode */}
        <g
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          className="transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            opacity: dark ? 0 : 1,
            transform: dark ? "rotate(45deg) scale(0.6)" : "none",
            transformOrigin: "center",
          }}
        >
          <path d="M10 1.5v2M10 16.5v2M1.5 10h2M16.5 10h2M4 4l1.4 1.4M14.6 14.6 16 16M16 4l-1.4 1.4M5.4 14.6 4 16" />
        </g>
        {/* Crescent bite — slides in for dark */}
        <circle
          cx="12.5"
          cy="8"
          r="4"
          className="fill-(--color-bone) transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ opacity: dark ? 1 : 0, transform: dark ? "none" : "translate(3px,-3px)" }}
        />
      </svg>
    </button>
  );
}
