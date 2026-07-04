"use client";

import { useActionState } from "react";
import { submitEnquiry, type EnquiryState } from "@/actions/leads";
import { cn } from "@/lib/utils";

const field =
  "w-full border-b border-hairline bg-transparent py-2 text-ink outline-none transition-colors focus:border-brass";

function Error({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p className="mt-1.5 text-xs text-brass-deep" role="alert">
      {messages[0]}
    </p>
  );
}

export function EnquiryForm({ source }: { source?: string }) {
  const [state, action, pending] = useActionState<EnquiryState, FormData>(
    submitEnquiry,
    null,
  );

  if (state?.ok) {
    return (
      <div className="rule pt-6" role="status">
        <p className="font-display text-h3 mb-3">Received, with thanks.</p>
        <p className="max-w-md text-sm leading-relaxed text-ink-soft">
          {state.message ??
            "We've received your enquiry and will be in touch within a working day."}
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-7" noValidate>
      {source && <input type="hidden" name="source" value={source} />}
      {/* Honeypot — hidden from real visitors */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-7 sm:grid-cols-2">
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

      <div>
        <label htmlFor="email" className="mono-label mb-2 block">
          Email
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className={field} />
        <Error messages={state?.errors?.email} />
      </div>

      <div>
        <label htmlFor="message" className="mono-label mb-2 block">
          About your project
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="Site, brief, timeline — whatever you have so far."
          className={cn(field, "resize-y placeholder:text-stone/70")}
        />
        <Error messages={state?.errors?.message} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="border border-ink bg-ink px-10 py-3 text-sm tracking-wide text-bone transition-colors hover:bg-transparent hover:text-ink disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send enquiry"}
      </button>
    </form>
  );
}
