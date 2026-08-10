"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { UploadJob } from "@/lib/use-upload";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * The upload queue: one row per file, each with a determinate bar while
 * bytes are going up and an indeterminate shimmer while the server
 * re-encodes. Failed rows stay put with their message until dismissed,
 * so an error can't scroll past unnoticed.
 */
export function UploadProgress({
  jobs,
  onCancel,
  onDismiss,
  className,
}: {
  jobs: UploadJob[];
  onCancel: (id: string) => void;
  onDismiss: (id: string) => void;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (jobs.length === 0) return null;

  return (
    <ul className={cn("space-y-2", className)}>
      <AnimatePresence initial={false}>
        {jobs.map((job) => (
          <motion.li
            key={job.id}
            layout={!reduce}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, height: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className={cn(
              "overflow-hidden rounded-xl border bg-s-surface px-3.5 py-3",
              job.error ? "border-s-bad/30" : "border-s-border",
            )}
          >
            <div className="flex items-center gap-3">
              <p className="min-w-0 flex-1 truncate text-xs text-s-text-2">{job.name}</p>

              <span className="s-label shrink-0 tabular-nums">
                {job.error
                  ? "Failed"
                  : job.processing
                    ? "Processing"
                    : `${job.progress}%`}
              </span>

              <button
                type="button"
                onClick={() => (job.error ? onDismiss(job.id) : onCancel(job.id))}
                className="s-label shrink-0 text-s-text-3 transition-colors hover:text-s-bad"
              >
                {job.error ? "Dismiss" : "Cancel"}
              </button>
            </div>

            {job.error ? (
              <p className="mt-1.5 text-xs text-s-bad" role="alert">
                {job.error}
              </p>
            ) : (
              <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-s-surface-3">
                {job.processing ? (
                  // Bytes are up; sharp is still working and there is no
                  // honest percentage to show — so a travelling sliver.
                  <motion.div
                    className="h-full w-1/3 rounded-full bg-s-accent"
                    animate={reduce ? { opacity: 0.6 } : { x: ["-100%", "300%"] }}
                    transition={
                      reduce
                        ? undefined
                        : { duration: 1.1, repeat: Infinity, ease: "easeInOut" }
                    }
                  />
                ) : (
                  <motion.div
                    className="h-full rounded-full bg-s-accent"
                    initial={{ width: 0 }}
                    animate={{ width: `${job.progress}%` }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  />
                )}
              </div>
            )}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
