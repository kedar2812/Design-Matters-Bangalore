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
      {/* Filter rail */}
      <div className="rule mb-10 flex flex-wrap gap-x-7 gap-y-3 pt-4" role="group" aria-label="Filter projects by category">
        {[null, ...categories].map((cat) => (
          <button
            key={cat ?? "all"}
            type="button"
            onClick={() => setActive(cat)}
            aria-pressed={active === cat}
            className={cn(
              "mono-label transition-colors hover:text-ink",
              active === cat ? "text-brass" : undefined,
            )}
          >
            {cat ?? "All"}
          </button>
        ))}
        <span className="mono-label ml-auto hidden sm:inline">
          {visible.length} {visible.length === 1 ? "project" : "projects"}
        </span>
      </div>

      {/* Grid */}
      <motion.ul layout={!reduce} className="grid gap-gutter sm:grid-cols-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {visible.map((p, i) => (
            <motion.li
              key={p.id}
              layout={!reduce}
              initial={reduce ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              <ProjectCard
                slug={p.slug}
                title={p.title}
                category={p.category}
                year={p.year}
                location={p.location}
                heroImage={p.heroImage}
                heroBlur={p.heroBlur}
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
