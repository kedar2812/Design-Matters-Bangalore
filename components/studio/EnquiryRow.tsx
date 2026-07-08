"use client";

import { useState, useTransition } from "react";
import { updateLeadStatus, saveLeadNotes, deleteLead } from "@/actions/studio-leads";
import { STAGES } from "@/lib/lead-stages";
import { cn, formatDate } from "@/lib/utils";

export type Enquiry = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  source: string | null;
  topic: string | null;
  budget: string | null;
  location: string | null;
  status: string;
  notes: string | null;
  createdAt: string; // ISO — serialized for the client
};

/** wa.me link with a courteous prefilled opener — the one-tap reply the
    client asked for in discovery. */
export function whatsAppReply(name: string, phone: string) {
  const text = `Hello ${name.split(" ")[0]}, thank you for reaching out to Design Matters. We'd be glad to hear more about your project — when is a good time to talk?`;
  return `https://wa.me/${phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(text)}`;
}

export function EnquiryRow({ enquiry }: { enquiry: Enquiry }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(enquiry.notes ?? "");
  const [saved, setSaved] = useState(true);
  const [pending, startTransition] = useTransition();

  return (
    <li className={cn("py-5", pending && "opacity-60")}>
      {/* Header row */}
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="text-left"
        >
          <span className={cn("text-sm font-medium", enquiry.status === "NEW" && "text-brass")}>
            {enquiry.name}
          </span>
          <span className="mono-label ml-3">{formatDate(enquiry.createdAt)}</span>
        </button>

        <div className="ml-auto flex items-center gap-4">
          {enquiry.source && <span className="mono-label">via {enquiry.source}</span>}
          {enquiry.phone && (
            <a
              href={whatsAppReply(enquiry.name, enquiry.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="mono-label rounded-full border border-hairline px-3 py-1.5 transition-colors hover:border-brass hover:text-brass"
            >
              WhatsApp reply
            </a>
          )}
          <select
            value={enquiry.status}
            onChange={(e) =>
              startTransition(() => updateLeadStatus(enquiry.id, e.target.value))
            }
            aria-label={`Stage for ${enquiry.name}`}
            className="mono-label border border-hairline bg-paper px-2 py-1.5 outline-none focus:border-brass"
          >
            {STAGES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {(enquiry.topic || enquiry.budget || enquiry.location) && (
        <p className="mt-2.5 flex flex-wrap gap-1.5">
          {[enquiry.topic, enquiry.budget, enquiry.location]
            .filter((t): t is string => Boolean(t))
            .map((t) => (
              <span
                key={t}
                className="mono-label rounded-full border border-hairline px-2.5 py-0.5"
              >
                {t}
              </span>
            ))}
        </p>
      )}

      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-soft">
        {enquiry.message}
      </p>

      {/* Expanded: contact + private notes */}
      {open && (
        <div className="mt-5 grid gap-6 border-l border-hairline pl-5 md:grid-cols-2">
          <div className="space-y-1.5">
            <p className="mono-label mb-2">Reach them</p>
            <p className="text-sm">
              <a href={`mailto:${enquiry.email}`} className="hover:text-brass">
                {enquiry.email}
              </a>
            </p>
            {enquiry.phone && (
              <>
                <p className="text-sm">
                  <a href={`tel:${enquiry.phone}`} className="hover:text-brass">
                    {enquiry.phone}
                  </a>
                </p>
                <p className="text-sm">
                  <a
                    href={whatsAppReply(enquiry.name, enquiry.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-brass"
                  >
                    WhatsApp them &rarr;
                  </a>
                </p>
              </>
            )}
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete the enquiry from ${enquiry.name}? This can't be undone.`))
                  startTransition(() => deleteLead(enquiry.id));
              }}
              className="mono-label mt-4 block text-stone transition-colors hover:text-brass-deep"
            >
              Delete enquiry
            </button>
          </div>

          <div>
            <label htmlFor={`notes-${enquiry.id}`} className="mono-label mb-2 block">
              Private notes {saved ? "" : "— unsaved"}
            </label>
            <textarea
              id={`notes-${enquiry.id}`}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setSaved(false);
              }}
              rows={4}
              placeholder="Follow-ups, budget, site details…"
              className="w-full border border-hairline bg-paper p-3 text-sm outline-none focus:border-brass"
            />
            <button
              type="button"
              disabled={saved || pending}
              onClick={() =>
                startTransition(async () => {
                  await saveLeadNotes(enquiry.id, notes);
                  setSaved(true);
                })
              }
              className="mono-label mt-2 underline underline-offset-4 disabled:no-underline disabled:opacity-50"
            >
              Save notes
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
