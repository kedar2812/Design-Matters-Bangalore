"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { dismissNotice, dismissNotices } from "@/actions/studio-notices";
import type { Notice, NoticeTone } from "@/lib/notices";
import { useFeedback } from "@/components/studio/Feedback";
import { Button, EmptyState } from "@/components/studio/ui";
import { BellIcon, CheckIcon, XIcon } from "@/components/studio/icons";
import { cn } from "@/lib/utils";

const TONE_DOT: Record<NoticeTone, string> = {
  accent: "bg-s-accent",
  warn: "bg-s-warn",
  info: "bg-s-info",
  neutral: "bg-s-muted",
};

/** "3 hours ago" / "2 days ago" — enough precision for a to-do list. */
function ago(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 31) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/**
 * The notification centre.
 *
 * Notices are derived server-side (lib/notices.ts) and passed in, so this
 * component owns presentation and dismissal only. Dismissal is optimistic
 * — the row leaves immediately and the write follows — because waiting on
 * a round-trip to remove something you have just decided is noise is the
 * opposite of what clearing a list is for.
 *
 * "Clear all" clears exactly what is on screen. It sends the keys it can
 * see rather than a "delete everything" flag, so a notice that arrived in
 * another tab a second ago is not silently swallowed by a click aimed at
 * the five you had read.
 */
export function Notifications({ notices }: { notices: Notice[] }) {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState<string[]>([]);
  const [, startTransition] = useTransition();
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { toast } = useFeedback();

  // Server data is the truth: once it comes back without the dismissed
  // rows, the local hide-list has done its job and must be dropped, or it
  // would suppress a future notice that happens to reuse a key.
  useEffect(() => {
    setHidden((h) => h.filter((k) => notices.some((n) => n.key === k)));
  }, [notices]);

  const visible = useMemo(
    () => notices.filter((n) => !hidden.includes(n.key)),
    [notices, hidden],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  function dismissOne(key: string) {
    setHidden((h) => [...h, key]);
    startTransition(async () => {
      try {
        await dismissNotice(key);
      } catch {
        setHidden((h) => h.filter((k) => k !== key));
        toast("Couldn't dismiss that.", "error");
      }
    });
  }

  function clearAll() {
    const keys = visible.map((n) => n.key);
    if (keys.length === 0) return;
    setHidden((h) => [...h, ...keys]);
    startTransition(async () => {
      try {
        await dismissNotices(keys);
        toast(`Cleared ${keys.length} ${keys.length === 1 ? "update" : "updates"}.`);
      } catch {
        setHidden((h) => h.filter((k) => !keys.includes(k)));
        toast("Couldn't clear those.", "error");
      }
    });
  }

  const count = visible.length;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={count > 0 ? `Updates, ${count} unread` : "Updates"}
        className={cn(
          "relative grid size-9 place-items-center rounded-s-sm text-s-text-2 transition-colors hover:bg-s-surface-3 hover:text-s-text",
          open && "bg-s-surface-3 text-s-text",
        )}
      >
        <BellIcon className="size-[18px]" />
        {count > 0 && (
          <span className="absolute right-1 top-1 grid min-w-[15px] place-items-center rounded-full bg-s-accent px-[3px] text-[0.625rem] font-semibold leading-[15px] text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Updates"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.16, ease: [0.32, 0.72, 0, 1] }}
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(24rem,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-s border border-s-border bg-s-surface shadow-s-lg"
          >
            <div className="flex items-center justify-between gap-2 border-b border-s-border px-4 py-2.5">
              <p className="text-[0.8125rem] font-semibold text-s-text">
                Updates
                {count > 0 && <span className="ml-1.5 font-normal text-s-text-3">{count}</span>}
              </p>
              {count > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  Clear all
                </Button>
              )}
            </div>

            <div className="s-scroll max-h-[min(26rem,60vh)] overflow-y-auto">
              {count === 0 ? (
                <EmptyState
                  icon={<CheckIcon className="size-5" />}
                  title="Nothing needs you"
                  body="New enquiries, projects missing photographs and reviews waiting to be published show up here."
                  className="py-10"
                />
              ) : (
                <ul>
                  <AnimatePresence initial={false}>
                    {visible.map((n) => (
                      <motion.li
                        key={n.key}
                        layout={!reduce}
                        exit={
                          reduce
                            ? { opacity: 0 }
                            : { opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }
                        }
                        transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
                        className="overflow-hidden border-b border-s-border last:border-0"
                      >
                        <div className="group relative flex gap-2.5 px-4 py-3 transition-colors hover:bg-s-surface-2">
                          <span
                            aria-hidden
                            className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", TONE_DOT[n.tone])}
                          />
                          <Link
                            href={n.href}
                            onClick={() => setOpen(false)}
                            className="min-w-0 flex-1"
                          >
                            <span className="block text-[0.8125rem] font-medium leading-snug text-s-text">
                              {n.title}
                            </span>
                            <span className="mt-0.5 block text-[0.75rem] leading-snug text-s-text-2">
                              {n.body}
                            </span>
                            <span className="mt-1 block text-[0.6875rem] text-s-text-3">
                              {ago(n.at)}
                            </span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => dismissOne(n.key)}
                            aria-label={`Dismiss: ${n.title}`}
                            className="-mr-1 -mt-1 grid size-7 shrink-0 place-items-center self-start rounded-s-xs text-s-text-3 opacity-0 transition-all hover:bg-s-surface-3 hover:text-s-text focus-visible:opacity-100 group-hover:opacity-100"
                          >
                            <XIcon className="size-3.5" />
                          </button>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
