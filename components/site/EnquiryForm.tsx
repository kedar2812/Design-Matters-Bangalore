"use client";

import { useActionState, useState } from "react";
import { submitEnquiry, type EnquiryState } from "@/actions/leads";
import { cn } from "@/lib/utils";

// The client's own project categories — one tap of context per lead.
const TOPICS = ["New home", "Interiors", "Commercial", "Consultation"];

const BUDGETS = [
  "Under ₹50 lakh",
  "₹50 lakh – 1 crore",
  "₹1 – 2 crore",
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

  if (state?.ok) {
    return (
      <div
        className="fade-rise rounded-2xl border border-hairline bg-paper/80 p-8 backdrop-blur-xl"
        role="status"
      >
        <span className="mb-5 flex size-12 items-center justify-center rounded-full bg-brass/12 text-brass">
          <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="m4 10.5 4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <p className="font-display text-h3 mb-3">Received, with thanks.</p>
        <p className="max-w-md text-sm leading-relaxed text-ink-soft">
          {state.message ??
            "We've received your enquiry and will be in touch within a working day."}
        </p>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="rounded-2xl border border-hairline bg-paper/80 p-6 shadow-sm backdrop-blur-xl sm:p-8"
      noValidate
    >
      {source && <input type="hidden" name="source" value={source} />}
      {topic && <input type="hidden" name="topic" value={topic} />}
      {/* Honeypot — hidden from real visitors */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {/* Project type — optional, one tap */}
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
            <input id="name" name="name" type="text" required autoComplete="name" className={field} />
            <Error messages={state?.errors?.name} />
          </div>
          <div>
            <label htmlFor="phone" className="mono-label mb-2 block">
              Phone <span className="normal-case">(optional)</span>
            </label>
            <input id="phone" name="phone" type="tel" autoComplete="tel" className={field} />
            <Error messages={state?.errors?.phone} />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="email" className="mono-label mb-2 block">
              Email
            </label>
            <input id="email" name="email" type="email" required autoComplete="email" className={field} />
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
              placeholder="e.g. Indiranagar, Bengaluru"
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
              defaultValue=""
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
            required
            rows={4}
            placeholder="Site, brief, timeline — whatever you have so far."
            className={cn(field, "resize-y")}
          />
          <Error messages={state?.errors?.message} />
        </div>

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
