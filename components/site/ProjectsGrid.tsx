"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ProjectCard } from "@/components/site/ProjectCard";
import { cn } from "@/lib/utils";

export type ProjectTile = {
  id: string;
  slug: string;
  title: string;
  category: string;
  year: number | null;
  location: string | null;
  heroImage: string | null;
  heroBlur: string | null;
};

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Filterable portfolio grid — filter swaps animate in place
 * (opacity + scale, no reload, no layout thrash).
 */
export function ProjectsGrid({
  projects,
  categories,
}: {
  projects: ProjectTile[];
  categories: string[];
}) {
  const [active, setActive] = useState<string | null>(null);
  const reduce = useReducedMotion();

  const visible = active
    ? projects.filter((p) => p.category === active)
    : projects;

  return (
    <div>
      {/* Filter rail — pills, with the active state carried by a shared
          layout element that slides between them. */}
      <div
        className="mb-12 flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Filter projects by category"
      >
        {[null, ...categories].map((cat) => {
          const on = active === cat;
          return (
            <button
              key={cat ?? "all"}
              type="button"
              onClick={() => setActive(cat)}
              aria-pressed={on}
              className={cn(
                "mono-label relative rounded-full px-4 py-2 transition-colors duration-300",
                on ? "text-bone" : "text-stone hover:text-ink",
              )}
            >
              {on && (
                <motion.span
                  layoutId="projects-filter-pill"
                  className="absolute inset-0 rounded-full bg-ink"
                  transition={{ type: "spring", stiffness: 380, damping: 34 }}
                />
              )}
              <span className="relative">{cat ?? "All work"}</span>
            </button>
          );
        })}
        <span className="mono-label ml-auto hidden sm:inline">
          {String(visible.length).padStart(2, "0")}{" "}
          {visible.length === 1 ? "project" : "projects"}
        </span>
      </div>

      {/* Grid */}
      {/* Grid. Every other tile drops half a step so the column edges
          stagger instead of marching in lockstep. */}
      <motion.ul layout={!reduce} className="grid gap-x-gutter gap-y-16 sm:grid-cols-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {visible.map((p, i) => (
            <motion.li
              key={p.id}
              layout={!reduce}
              initial={reduce ? false : { opacity: 0, y: 16, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.5, ease: EASE }}
              className={i % 2 === 1 ? "sm:mt-16" : undefined}
            >
              <ProjectCard
                slug={p.slug}
                title={p.title}
                category={p.category}
                year={p.year}
                location={p.location}
                heroImage={p.heroImage}
                heroBlur={p.heroBlur}
                index={i + 1}
                aspect={i % 4 === 1 || i % 4 === 2 ? "aspect-[3/4]" : "aspect-[4/3]"}
                sizes="(min-width: 640px) 50vw, 100vw"
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </div>
  );
}
