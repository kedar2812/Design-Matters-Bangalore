"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button, type ButtonVariant } from "@/components/studio/ui";
import { CheckIcon, WarningIcon, XIcon } from "@/components/studio/icons";

/**
 * Toasts and confirmations — the two things the old dashboard had no
 * answer for.
 *
 * Saving used to be silent: the form posted, the row updated, and the
 * only evidence was the screen not changing. And destructive actions went
 * through `window.confirm`, which is the one piece of chrome no amount of
 * design controls — it renders as the browser's, sized and typed by the
 * OS, and on top of a considered interface it reads as an unfinished one.
 *
 * Both live in a single provider because they share a portal root and a
 * z-index, and keeping them together is what stops a confirm dialog and a
 * toast from ever arguing about which is on top.
 */

/* ----------------------------------------------------------------- toast */

type ToastTone = "success" | "error" | "info";

type Toast = { id: number; tone: ToastTone; message: string };

type Ctx = {
  toast: (message: string, tone?: ToastTone) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const FeedbackCtx = createContext<Ctx | null>(null);

/**
 * `useFeedback` is safe to call from any studio client component. It
 * throws outside the provider rather than no-opping: a silent save is the
 * exact bug this exists to fix, so failing loudly in development is
 * better than shipping a screen whose confirmation never appears.
 */
export function useFeedback() {
  const ctx = useContext(FeedbackCtx);
  if (!ctx) throw new Error("useFeedback must be used inside <FeedbackProvider>");
  return ctx;
}

const TONE_STYLE: Record<ToastTone, { ring: string; icon: React.ReactNode }> = {
  success: {
    ring: "text-s-good",
    icon: <CheckIcon className="size-4" />,
  },
  error: {
    ring: "text-s-bad",
    icon: <WarningIcon className="size-4" />,
  },
  info: {
    ring: "text-s-accent",
    icon: <CheckIcon className="size-4" />,
  },
};

/* --------------------------------------------------------------- confirm */

type ConfirmOptions = {
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Extract<ButtonVariant, "primary" | "danger">;
};

type PendingConfirm = ConfirmOptions & { resolve: (ok: boolean) => void };

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const [mounted, setMounted] = useState(false);
  const nextId = useRef(0);
  const reduce = useReducedMotion();
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  useEffect(() => setMounted(true), []);

  // Every pending dismissal is cancelled on unmount — a timer that fires
  // into an unmounted tree is a React warning at best and a leak at worst.
  useEffect(() => {
    const map = timers.current;
    return () => {
      for (const t of map.values()) clearTimeout(t);
      map.clear();
    };
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = "success") => {
      const id = nextId.current++;
      // Cap the stack. Six toasts is already someone hammering a button;
      // past that they just cover the screen they are reporting on.
      setToasts((list) => [...list.slice(-5), { id, tone, message }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), tone === "error" ? 6000 : 3500),
      );
    },
    [dismiss],
  );

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setPending({ ...options, resolve });
      }),
    [],
  );

  const settle = useCallback(
    (ok: boolean) => {
      setPending((p) => {
        p?.resolve(ok);
        return null;
      });
    },
    [],
  );

  // Escape closes the dialog as a cancel. Bound while one is open only,
  // so it can never swallow Escape from a drawer or a select.
  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        settle(false);
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [pending, settle]);

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <FeedbackCtx.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          // `data-studio` again: this subtree lives in document.body, so
          // it is outside the shell and would resolve none of the tokens
          // without re-declaring them here. It declares only — the paint
          // class stays on the shell, or this would cover the screen.
          <div data-studio>
            {/* Toasts */}
            <div
              className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
              role="status"
              aria-live="polite"
            >
              <AnimatePresence initial={false}>
                {toasts.map((t) => (
                  <motion.div
                    key={t.id}
                    layout={!reduce}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                    className="pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-s-sm border border-s-border bg-s-surface p-3 shadow-s-md"
                  >
                    <span className={`mt-px shrink-0 ${TONE_STYLE[t.tone].ring}`}>
                      {TONE_STYLE[t.tone].icon}
                    </span>
                    <p className="min-w-0 flex-1 text-[0.8125rem] leading-snug text-s-text">
                      {t.message}
                    </p>
                    <button
                      type="button"
                      onClick={() => dismiss(t.id)}
                      aria-label="Dismiss"
                      className="-m-1 shrink-0 rounded p-1 text-s-text-3 transition-colors hover:text-s-text"
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Confirm */}
            <AnimatePresence>
              {pending && (
                <ConfirmDialog pending={pending} settle={settle} reduce={!!reduce} />
              )}
            </AnimatePresence>
          </div>,
          document.body,
        )}
    </FeedbackCtx.Provider>
  );
}

function ConfirmDialog({
  pending,
  settle,
  reduce,
}: {
  pending: PendingConfirm;
  settle: (ok: boolean) => void;
  reduce: boolean;
}) {
  const titleId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Focus the confirm button, not the dialog: it is the action the user
  // just asked for, and it makes Enter do the obvious thing.
  useEffect(() => {
    const t = setTimeout(() => confirmRef.current?.focus(), 40);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={() => settle(false)}
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
      />
      <motion.div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 4 }}
        transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
        className="relative w-full max-w-sm rounded-s border border-s-border bg-s-surface p-5 shadow-s-lg"
      >
        <h2 id={titleId} className="text-[0.9375rem] font-semibold text-s-text">
          {pending.title}
        </h2>
        {pending.body && (
          <p className="mt-2 text-[0.8125rem] leading-relaxed text-s-text-2">{pending.body}</p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => settle(false)}>
            {pending.cancelLabel ?? "Cancel"}
          </Button>
          <Button
            ref={confirmRef}
            type="button"
            variant={pending.tone ?? "primary"}
            onClick={() => settle(true)}
          >
            {pending.confirmLabel ?? "Confirm"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
