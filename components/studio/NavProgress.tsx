"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLinkStatus } from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * The bar across the top of the dashboard while a screen is loading.
 *
 * The App Router has no router events to hook, so the honest signal is
 * `useLinkStatus` — but it only reports for the `<Link>` it is rendered
 * inside. So each studio link renders an invisible reporter, and this
 * provider counts how many are pending. The bar is therefore tied to real
 * navigation work rather than to a timer that guesses.
 *
 * The fill is deliberately not linear. It runs quickly to ~90% and then
 * creeps, because a bar that reaches the end and sits there reads as
 * broken, while one still moving reads as working. The last 10% only
 * happens when the route actually commits.
 */

type Ctx = { start: () => void; stop: () => void };

const ProgressCtx = createContext<Ctx | null>(null);

export function NavProgressProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);
  const start = useCallback(() => setCount((n) => n + 1), []);
  const stop = useCallback(() => setCount((n) => Math.max(0, n - 1)), []);
  const value = useMemo(() => ({ start, stop }), [start, stop]);

  return (
    <ProgressCtx.Provider value={value}>
      <NavProgressBar active={count > 0} />
      {children}
    </ProgressCtx.Provider>
  );
}

/**
 * Rendered inside a `<Link>`. Reports that link's pending state up to the
 * provider and draws nothing itself.
 *
 * The cleanup is what makes this safe: if a link unmounts mid-navigation
 * — which is exactly what happens when the nav re-renders on the new
 * route — its increment is released, so the counter cannot strand the bar
 * on screen forever.
 */
export function LinkProgress() {
  const { pending } = useLinkStatus();
  const ctx = useContext(ProgressCtx);
  const held = useRef(false);

  useEffect(() => {
    if (!ctx) return;
    if (pending && !held.current) {
      held.current = true;
      ctx.start();
    } else if (!pending && held.current) {
      held.current = false;
      ctx.stop();
    }
  }, [pending, ctx]);

  useEffect(() => {
    return () => {
      if (held.current) {
        held.current = false;
        ctx?.stop();
      }
    };
  }, [ctx]);

  return null;
}

function NavProgressBar({ active }: { active: boolean }) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (active) {
      setVisible(true);
      setProgress(0.08);
      // Ease toward 0.9 and never arrive. Each tick closes a fixed
      // fraction of the remaining distance, so it decelerates naturally
      // without any easing maths.
      const id = setInterval(() => {
        setProgress((p) => (p >= 0.9 ? p : p + (0.9 - p) * 0.18));
      }, 180);
      return () => clearInterval(id);
    }

    if (!visible) return;
    setProgress(1);
    // Hold the full bar just long enough to be seen completing — without
    // it, a fast route makes the bar flash and look like a glitch.
    const id = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 260);
    return () => clearTimeout(id);
  }, [active, visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-[2px]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="h-full origin-left bg-s-accent"
            style={{ boxShadow: "0 0 8px 0 var(--s-accent)" }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progress }}
            transition={
              reduce ? { duration: 0 } : { duration: 0.35, ease: [0.32, 0.72, 0, 1] }
            }
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
