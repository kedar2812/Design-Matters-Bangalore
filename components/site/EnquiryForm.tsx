"use client";

import {
  useActionState,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { submitEnquiry, type EnquiryState } from "@/actions/leads";
import { cn } from "@/lib/utils";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/* useLayoutEffect warns during server rendering. The success branch can
   only appear after an interaction, so the layout pass never runs on the
   server — but the hook itself would still be called there. */
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// The client's own project categories — one tap of context per lead.
const TOPICS = ["New home", "Interiors", "Commercial", "Consultation"];

const BUDGETS = [
  "Under ₹50 lakh",
  "₹50 lakh to 1 crore",
  "₹1 to 2 crore",
  "Above ₹2 crore",
  "Not sure yet",
];

const field =
  "w-full rounded-xl border border-hairline bg-bone px-4 py-3 text-[15px] text-ink outline-none transition-all duration-300 placeholder:text-stone/60 focus:border-brass focus:ring-[3px] focus:ring-brass/15 hover:border-stone/50";

function Error({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p className="mt-1.5 text-xs text-brass-deep" role="alert">
      {messages[0]}
    </p>
  );
}

/**
 * The lead form. Every submission becomes a Lead row and appears in
 * /studio/leads (no email involved yet). Type / budget / location are
 * optional context the studio asked to capture in discovery.
 */
export function EnquiryForm({ source }: { source?: string }) {
  const [state, action, pending] = useActionState<EnquiryState, FormData>(
    submitEnquiry,
    null,
  );
  const [topic, setTopic] = useState<string | null>(null);
  // Refilled after a refused submission; see `values` on EnquiryState.
  const typed = state?.ok === false ? state.values : undefined;

  const sent = state?.ok === true;
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);
  /** The height the form occupied, captured while it was still on screen. */
  const formHeight = useRef<number | null>(null);
  const [reserved, setReserved] = useState<number | null>(null);

  /* Keep the form's height current while it is mounted. */
  useEffect(() => {
    if (sent) return;
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      formHeight.current = el.offsetHeight;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [sent]);

  /**
   * Hold the space the form occupied.
   *
   * The confirmation is a fraction of the form's height, so swapping one
   * for the other used to shorten the document by the difference — six
   * hundred-odd pixels. When the visitor had scrolled the form up the
   * page, that put `scrollY` past the new maximum, the browser clamped
   * it, and the page appeared to lurch toward the footer at the exact
   * moment it was meant to feel resolved.
   *
   * Reserving the height keeps the document exactly as tall as it was, so
   * there is nothing for the browser to clamp and the panel holds its
   * place in the composition. Set in a layout effect, before paint, so
   * there is never a frame at the collapsed height.
   */
  useIsoLayoutEffect(() => {
    if (sent && reserved === null) setReserved(formHeight.current);
  }, [sent, reserved]);

  /**
   * Bring the confirmation into view if it is not already there.
   *
   * Runs from a callback ref rather than an effect on `sent`, so it fires
   * exactly when the element attaches and is measured against real
   * layout. An effect keyed on `sent` is a frame early and can find a
   * null ref, and having found one it never runs again.
   *
   * Lenis drives the page, so a native smooth scroll would be fought by
   * it; fall back to the native one only if Lenis is absent.
   */
  const didScroll = useRef(false);
  const attachConfirm = (el: HTMLDivElement | null) => {
    confirmRef.current = el;
    if (!el || didScroll.current) return;
    didScroll.current = true;
    requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      if (r.top >= 0 && r.bottom <= window.innerHeight) return;
      const top = Math.max(
        0,
        window.scrollY + r.top - (window.innerHeight - r.height) / 2,
      );
      if (window.__lenis) {
        window.__lenis.scrollTo(top, { duration: reduce ? 0 : 0.9 });
      } else {
        window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
      }
    });
  };

  return (
    <div
      ref={wrapRef}
      style={reserved ? { minHeight: reserved } : undefined}
      className={cn(sent && "flex items-center")}
    >
      {/* No `AnimatePresence mode="wait"` here, deliberately. It holds the
          incoming child back until the outgoing one finishes exiting, and
          the outgoing form had an `exit` but no `initial`/`animate`, so
          framer-motion had no start value to animate from ("animate
          opacity from undefined"), the exit never completed, and the
          confirmation never mounted at all — the form sat on "Sending…"
          for ever even though the action had returned `{ok:true}`.
          A plain swap plus a mount animation on the confirmation cannot
          get stuck, and the reserved height above is what actually keeps
          the page still. */}
      {sent ? (
        <motion.div
          key="sent"
          ref={attachConfirm}
          role="status"
          className="w-full rounded-2xl border border-hairline bg-paper/80 p-8 backdrop-blur-xl"
          initial={
            reduce ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.985 }
          }
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: reduce ? 0.2 : 0.7, ease: EASE_OUT_EXPO }}
        >
          <span className="mb-5 flex size-12 items-center justify-center rounded-full bg-brass/12 text-brass">
            <svg
              viewBox="0 0 20 20"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              {/* The tick draws itself — the one flourish here, and it
                    reads as the confirmation completing rather than as
                    decoration. */}
              <motion.path
                d="m4 10.5 4 4 8-9"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: reduce ? 0 : 0.5,
                  delay: reduce ? 0 : 0.25,
                  ease: EASE_OUT_EXPO,
                }}
              />
            </svg>
          </span>
          <p className="font-display text-h3 mb-3">Received, with thanks.</p>
          <p className="max-w-md text-sm leading-relaxed text-ink-soft">
            {state.message ??
              "We've received your enquiry and will be in touch within a working day."}
          </p>
        </motion.div>
      ) : (
        <div className="w-full">
          <FormBody
            action={action}
            pending={pending}
            state={state}
            typed={typed}
            topic={topic}
            setTopic={setTopic}
            source={source}
          />
        </div>
      )}
    </div>
  );
}

function FormBody({
  action,
  pending,
  state,
  typed,
  topic,
  setTopic,
  source,
}: {
  action: (formData: FormData) => void;
  pending: boolean;
  state: EnquiryState;
  typed: Record<string, string> | undefined;
  topic: string | null;
  setTopic: (t: string | null) => void;
  source?: string;
}) {
  return (
    <form
      action={action}
      className="rounded-2xl border border-hairline bg-paper/80 p-6 shadow-sm backdrop-blur-xl sm:p-8"
      noValidate
    >
      {source && <input type="hidden" name="source" value={source} />}
      {topic && <input type="hidden" name="topic" value={topic} />}
      {/* Honeypot, hidden from real visitors */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Project type, optional, one tap */}
      <fieldset className="mb-7">
        <legend className="mono-label mb-3">What are you planning?</legend>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => {
            const selected = topic === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTopic(selected ? null : t)}
                aria-pressed={selected}
                className={cn(
                  "rounded-full border px-4 py-2 font-mono text-[0.75rem] uppercase tracking-[0.08em] transition-all duration-300",
                  selected
                    ? "border-ink bg-ink text-bone"
                    : "border-hairline text-stone hover:border-brass hover:text-brass",
                )}
              >
                {t}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="mono-label mb-2 block">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              defaultValue={typed?.name}
              className={field}
            />
            <Error messages={state?.errors?.name} />
          </div>
          <div>
            <label htmlFor="phone" className="mono-label mb-2 block">
              Phone <span className="normal-case">(optional)</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              defaultValue={typed?.phone}
              className={field}
            />
            <Error messages={state?.errors?.phone} />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="email" className="mono-label mb-2 block">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={typed?.email}
              className={field}
            />
            <Error messages={state?.errors?.email} />
          </div>
          <div>
            <label htmlFor="location" className="mono-label mb-2 block">
              Site location <span className="normal-case">(optional)</span>
            </label>
            <input
              id="location"
              name="location"
              type="text"
              defaultValue={typed?.location}
              placeholder="e.g. Indiranagar, Bangalore"
              className={field}
            />
            <Error messages={state?.errors?.location} />
          </div>
        </div>

        <div>
          <label htmlFor="budget" className="mono-label mb-2 block">
            Budget <span className="normal-case">(optional)</span>
          </label>
          <div className="relative">
            <select
              id="budget"
              name="budget"
              defaultValue={typed?.budget ?? ""}
              className={cn(field, "appearance-none pr-10")}
            >
              <option value="">Select a range</option>
              {BUDGETS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <svg
              viewBox="0 0 16 16"
              className="pointer-events-none absolute right-4 top-1/2 size-3.5 -translate-y-1/2 text-stone"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="m3 6 5 5 5-5" />
            </svg>
          </div>
          <Error messages={state?.errors?.budget} />
        </div>

        <div>
          <label htmlFor="message" className="mono-label mb-2 block">
            About your project
          </label>
          <textarea
            id="message"
            name="message"
            defaultValue={typed?.message}
            required
            rows={4}
            placeholder="Site, brief, timeline, whatever you have so far."
            className={cn(field, "resize-y")}
          />
          <Error messages={state?.errors?.message} />
        </div>

        {/* A refusal that is not about one field (the hourly limit). It
            used to be returned and never shown, so the button simply
            went back to "Send enquiry" and the visitor had no idea why. */}
        {state?.ok === false && state.message && (
          <p
            className="rounded-xl border border-brass/30 bg-brass/8 px-4 py-3 text-sm text-brass-deep"
            role="alert"
          >
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="group/submit inline-flex items-center gap-3 rounded-full bg-ink px-8 py-3.5 text-sm tracking-wide text-bone transition-all duration-300 hover:bg-brass disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send enquiry"}
          {!pending && (
            <svg
              viewBox="0 0 16 16"
              className="size-3.5 transition-transform duration-300 group-hover/submit:translate-x-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M2 8h12m0 0-4.5-4.5M14 8l-4.5 4.5" />
            </svg>
          )}
        </button>
      </div>
    </form>
  );
}
