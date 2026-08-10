"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

const field =
  "w-full rounded-xl border border-s-border bg-s-surface px-4 py-3 text-sm text-s-text outline-none transition-all duration-300 placeholder:text-s-text-3/55 focus:border-s-accent focus:ring-4 focus:ring-s-accent/15";

/* --------------------------------------------------------------- icons */

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-[18px]"
      aria-hidden
    >
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.75" />
      {off && <path d="m4 20 16-16" />}
    </svg>
  );
}

/* -------------------------------------------------------------- button */

/**
 * Submit button. `useFormStatus` reads the pending state of the form it
 * sits inside, so the button knows the sign-in is in flight without any
 * state plumbing — hence the separate component.
 */
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "group relative mt-2 flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-s-solid py-3.5",
        "text-sm font-medium tracking-wide text-s-on-solid transition-all duration-300",
        "hover:bg-s-solid-hover disabled:cursor-wait disabled:opacity-80",
      )}
    >
      {pending && (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-current/30 border-t-current"
        />
      )}
      {pending ? "Signing in…" : "Sign in"}
      {!pending && (
        <span
          aria-hidden
          className="transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
        >
          &rarr;
        </span>
      )}
    </button>
  );
}

/* ---------------------------------------------------------------- form */

export function LoginForm({
  action,
  error,
}: {
  action: (formData: FormData) => Promise<void>;
  error?: boolean;
}) {
  const [show, setShow] = useState(false);
  const reduce = useReducedMotion();

  return (
    <motion.form
      action={action}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
      className="space-y-4"
    >
      <div>
        <label htmlFor="email" className="s-label mb-1.5 block">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          placeholder="Enter your email"
          className={field}
        />
      </div>

      <div>
        <label htmlFor="password" className="s-label mb-1.5 block">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="Enter your password"
            className={cn(field, "pr-12")}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Hide password" : "Show password"}
            aria-pressed={show}
            className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-lg text-s-text-3 transition-colors hover:text-s-text"
          >
            <EyeIcon off={show} />
          </button>
        </div>
      </div>

      {error && (
        <motion.p
          initial={reduce ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="rounded-xl border border-s-bad/30 bg-s-bad-soft px-4 py-3 text-sm text-s-bad"
          role="alert"
        >
          That email and password don&rsquo;t match our records.
        </motion.p>
      )}

      <SubmitButton />
    </motion.form>
  );
}
