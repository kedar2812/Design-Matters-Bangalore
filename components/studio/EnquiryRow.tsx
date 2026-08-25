"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  deleteLead,
  resendLeadNotification,
  saveLeadNotes,
  updateLeadStatus,
} from "@/actions/studio-leads";
import { EVENT_TONE, STAGES } from "@/lib/lead-stages";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import { useFeedback } from "@/components/studio/Feedback";
import { QuickReply, whatsAppReply } from "@/components/studio/QuickReply";
import { Badge, Button, Chip, EmptyState, Select, Td, textareaClass, Th } from "@/components/studio/ui";
import {
  ClockIcon,
  EnquiriesIcon,
  MailIcon,
  PhoneIcon,
  SearchIcon,
  TrashIcon,
  WarningIcon,
  XIcon,
} from "@/components/studio/icons";

export type LeadEventView = {
  id: string;
  type: string; // LeadEventType, widened — the enum lives with the database
  summary: string;
  createdAt: string; // ISO — serialized for the client
};

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
  notifiedAt: string | null;
  notifyError: string | null;
  events: LeadEventView[];
};

const STAGE_TONE: Record<string, "accent" | "info" | "warn" | "good" | "bad" | "neutral"> = {
  NEW: "accent",
  CONTACTED: "info",
  DISCUSSION: "warn",
  WON: "good",
  LOST: "neutral",
};

const STAGE_SELECT: Record<string, string> = {
  NEW: "bg-s-accent-soft text-s-accent hover:border-s-accent/30",
  CONTACTED: "bg-s-info-soft text-s-info hover:border-s-info/30",
  DISCUSSION: "bg-s-warn-soft text-s-warn hover:border-s-warn/30",
  WON: "bg-s-good-soft text-s-good hover:border-s-good/30",
  LOST: "bg-s-muted-soft text-s-muted hover:border-s-muted/30",
};

const stageLabel = (v: string) => STAGES.find(([s]) => s === v)?.[1] ?? v;

/** Timeline dots — the tone tokens as solid fills rather than soft chips. */
const EVENT_DOT: Record<string, string> = {
  accent: "bg-s-accent",
  info: "bg-s-info",
  good: "bg-s-good",
  bad: "bg-s-bad",
  neutral: "bg-s-border-strong",
};

/**
 * The enquiries screen.
 *
 * The old version put every enquiry's contact details behind a click on
 * the person's name — a name that carried no affordance suggesting it was
 * a button. So the email address and phone number, which are the entire
 * point of an enquiry, were invisible unless you happened to click the
 * one thing that did not look clickable.
 *
 * Now the table shows who, how to reach them, what they want and where
 * they are, and the row opens a panel with the full message, the notes
 * and the destructive action. Search is client-side because the whole
 * list is already on the client and twenty-one rows do not need a
 * round-trip — it filters name, message, email, phone and location, which
 * covers "what was that person from Whitefield called".
 */
export function EnquiryTable({ enquiries }: { enquiries: Enquiry[] }) {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const params = useSearchParams();

  // The overview links straight to a specific enquiry (?open=<id>). Read
  // it once on mount, then strip it so a refresh or a back-navigation
  // doesn't keep re-opening the panel after it has been closed.
  //
  // The strip goes through history.replaceState rather than router.replace
  // on purpose. router.replace is a real navigation: it re-runs the server
  // component and re-renders this subtree, which threw away the panel's
  // local state — including anything typed into the notes field in the
  // first moment after opening. history.replaceState changes the address
  // bar and nothing else.
  const requested = params.get("open");
  useEffect(() => {
    if (!requested) return;
    setOpenId(requested);
    const next = new URLSearchParams(window.location.search);
    next.delete("open");
    const qs = next.toString();
    window.history.replaceState(null, "", `/studio/leads${qs ? `?${qs}` : ""}`);
  }, [requested]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return enquiries;
    return enquiries.filter((e) =>
      [e.name, e.email, e.phone, e.message, e.location, e.topic, e.budget]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q)),
    );
  }, [enquiries, query]);

  const open = enquiries.find((e) => e.id === openId) ?? null;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-s-text-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, message, location…"
            aria-label="Search enquiries"
            className="h-[34px] w-full rounded-s-sm border border-s-border bg-s-surface pl-8 pr-8 text-[0.8125rem] text-s-text outline-none transition-colors placeholder:text-s-text-3 hover:border-s-border-strong focus:border-s-accent focus:ring-2 focus:ring-s-accent/15"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-s-text-3 transition-colors hover:text-s-text"
            >
              <XIcon className="size-3.5" />
            </button>
          )}
        </div>
        <p className="text-[0.75rem] text-s-text-3">
          {filtered.length === enquiries.length
            ? `${enquiries.length} ${enquiries.length === 1 ? "enquiry" : "enquiries"}`
            : `${filtered.length} of ${enquiries.length}`}
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<EnquiriesIcon className="size-5" />}
          title={query ? "Nothing matches that" : "No enquiries at this stage"}
          body={
            query
              ? "Try a name, a locality, or a word from the message."
              : "Everything submitted through the site lands here."
          }
          action={
            query ? (
              <Button variant="secondary" onClick={() => setQuery("")}>
                Clear search
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="s-scroll overflow-x-auto">
          <table className="w-full border-collapse text-left text-[0.8125rem]">
            <thead>
              <tr>
                <Th className="rounded-tl-s">Who</Th>
                <Th className="hidden md:table-cell">Reach them</Th>
                <Th className="hidden lg:table-cell">Looking for</Th>
                <Th>Stage</Th>
                <Th className="hidden sm:table-cell">Received</Th>
                <Th className="rounded-tr-s text-right">
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <EnquiryTr key={e.id} enquiry={e} onOpen={() => setOpenId(e.id)} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {open && <EnquiryPanel enquiry={open} onClose={() => setOpenId(null)} />}
      </AnimatePresence>
    </>
  );
}

function EnquiryTr({ enquiry, onOpen }: { enquiry: Enquiry; onOpen: () => void }) {
  const [pending, startTransition] = useTransition();
  const { toast } = useFeedback();
  // The select is optimistic: the server round-trip plus a revalidate is
  // long enough that a control snapping back to its old value reads as a
  // failed click.
  const [stage, setStage] = useState(enquiry.status);
  useEffect(() => setStage(enquiry.status), [enquiry.status]);

  return (
    <tr className={cn("group transition-colors hover:bg-s-surface-2", pending && "opacity-60")}>
      <Td>
        <button
          type="button"
          onClick={onOpen}
          className="text-left font-medium text-s-text transition-colors hover:text-s-accent"
        >
          {enquiry.name}
          {enquiry.status === "NEW" && (
            <span className="ml-2 inline-block size-1.5 translate-y-[-1px] rounded-full bg-s-accent align-middle" />
          )}
        </button>
        {enquiry.location && (
          <span className="mt-0.5 block truncate text-[0.75rem] text-s-text-3">
            {enquiry.location}
          </span>
        )}
        {/* A notification that never arrived is the one thing on this
            screen you need to know without opening anything, because it
            means the enquiry is sitting here unread by anyone. */}
        {!enquiry.notifiedAt && enquiry.notifyError && (
          <span className="mt-1 flex items-center gap-1 text-[0.75rem] text-s-bad">
            <WarningIcon className="size-3.5 shrink-0" />
            Not emailed
          </span>
        )}
      </Td>

      <Td className="hidden md:table-cell">
        <div className="flex flex-col gap-0.5">
          <a
            href={`mailto:${enquiry.email}`}
            className="truncate text-s-text-2 transition-colors hover:text-s-accent"
          >
            {enquiry.email}
          </a>
          {enquiry.phone && (
            <a
              href={`tel:${enquiry.phone}`}
              className="s-num truncate text-[0.75rem] text-s-text-3 transition-colors hover:text-s-accent"
            >
              {enquiry.phone}
            </a>
          )}
        </div>
      </Td>

      <Td className="hidden lg:table-cell">
        <div className="flex flex-wrap gap-1">
          {[enquiry.topic, enquiry.budget]
            .filter((t): t is string => Boolean(t))
            .map((t) => (
              <Chip key={t}>{t}</Chip>
            ))}
        </div>
      </Td>

      <Td>
        <Select
          value={stage}
          disabled={pending}
          onChange={(ev) => {
            const next = ev.target.value;
            setStage(next);
            startTransition(async () => {
              try {
                await updateLeadStatus(enquiry.id, next);
                toast(`${enquiry.name} moved to ${stageLabel(next)}.`);
              } catch {
                setStage(enquiry.status);
                toast("Couldn't change the stage. Try again.", "error");
              }
            });
          }}
          aria-label={`Stage for ${enquiry.name}`}
          // Tinted by stage, so the column reads as a status at a glance
          // rather than as twenty-one identical grey boxes. The control
          // stays a real select — colour is added information, not a
          // replacement for being able to change it in one click.
          className={cn("h-[30px] border-transparent text-[0.75rem] font-medium", STAGE_SELECT[stage])}
        >
          {STAGES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Td>

      <Td className="hidden whitespace-nowrap text-s-text-3 sm:table-cell">
        {formatDate(enquiry.createdAt)}
      </Td>

      <Td className="text-right">
        <div className="flex items-center justify-end gap-1.5">
          {enquiry.phone && <QuickReply name={enquiry.name} phone={enquiry.phone} />}
          <Button variant="ghost" size="sm" onClick={onOpen}>
            Open
          </Button>
        </div>
      </Td>
    </tr>
  );
}

/* -------------------------------------------------------------- delivery */

/**
 * Whether the studio was actually told about this enquiry.
 *
 * The whole point of adding email was that nobody should have to open
 * the dashboard to learn an enquiry exists — which makes a notification
 * that silently failed the most dangerous state in the system, because
 * it looks exactly like an ordinary quiet week. So the failure is stated
 * in words, with the provider's own reason, and with the button that
 * fixes it right there.
 */
function DeliveryStatus({ enquiry }: { enquiry: Enquiry }) {
  const { toast } = useFeedback();
  const [pending, startTransition] = useTransition();

  const resend = () =>
    startTransition(async () => {
      try {
        await resendLeadNotification(enquiry.id);
        toast("Notification sent.");
      } catch (err) {
        toast(err instanceof Error ? err.message : "Couldn't send that email.", "error");
      }
    });

  if (enquiry.notifiedAt) {
    return (
      <section>
        <h3 className="s-label mb-2">Notification</h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Badge tone="good" dot>
            Emailed {formatDateTime(enquiry.notifiedAt)}
          </Badge>
          <Button variant="ghost" size="sm" disabled={pending} onClick={resend}>
            {pending ? "Sending…" : "Send again"}
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h3 className="s-label mb-2">Notification</h3>
      <div className="rounded-s-sm border border-s-bad/25 bg-s-bad-soft p-3">
        <p className="flex items-start gap-2 text-[0.8125rem] font-medium text-s-bad">
          <WarningIcon className="mt-[1px] size-4 shrink-0" />
          {enquiry.notifyError
            ? "This enquiry was never emailed out"
            : "No notification has been sent yet"}
        </p>
        {enquiry.notifyError && (
          <p className="mt-1.5 pl-6 text-[0.75rem] leading-relaxed text-s-text-2">
            {enquiry.notifyError}
          </p>
        )}
        <div className="mt-2.5 pl-6">
          <Button variant="secondary" size="sm" disabled={pending} onClick={resend}>
            {pending ? "Sending…" : "Send it now"}
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- panel */

function EnquiryPanel({ enquiry, onClose }: { enquiry: Enquiry; onClose: () => void }) {
  const reduce = useReducedMotion();
  const { toast, confirm } = useFeedback();
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState(enquiry.notes ?? "");
  const [dirty, setDirty] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistNotes = useCallback(
    async (value: string) => {
      try {
        await saveLeadNotes(enquiry.id, value);
        setDirty(false);
      } catch {
        toast("Couldn't save that note.", "error");
      }
    },
    [enquiry.id, toast],
  );

  /* Notes autosave a second after typing stops. The old form had a Save
     button beside the field and no warning if you left without pressing
     it, which is the shape of bug that loses somebody's site notes. */
  useEffect(() => {
    if (!dirty) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void persistNotes(notes), 900);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [notes, dirty, persistNotes]);

  // Whatever is unsaved when the panel closes gets written on the way out.
  const close = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (dirty) void persistNotes(notes);
    onClose();
  }, [dirty, notes, persistNotes, onClose]);

  /**
   * Open-once side effects: lock the page behind the panel and move focus
   * into it.
   *
   * The empty dependency list is load-bearing. This used to depend on
   * `close`, which is rebuilt whenever the notes text changes — so every
   * single keystroke re-ran the effect and called `panelRef.focus()`,
   * pulling focus straight back out of the textarea. Exactly one
   * character ever made it in.
   */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Escape closes. Held in a ref so the listener always calls the current
  // `close` — which knows about the unsaved note — without the effect
  // needing `close` as a dependency.
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const stage = STAGES.find(([s]) => s === enquiry.status);

  return (
    <div className="fixed inset-0 z-[60]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={close}
        className="absolute inset-0 bg-black/35"
      />
      <motion.div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Enquiry from ${enquiry.name}`}
        initial={reduce ? { opacity: 0 } : { x: "100%" }}
        animate={reduce ? { opacity: 1 } : { x: 0 }}
        exit={reduce ? { opacity: 0 } : { x: "100%" }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        className="s-scroll absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col overflow-y-auto border-l border-s-border bg-s-surface shadow-s-lg outline-none"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-s-border bg-s-surface/90 px-5 py-4 backdrop-blur-md">
          <div className="min-w-0">
            <h2 className="truncate text-[0.9375rem] font-semibold text-s-text">{enquiry.name}</h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-[0.75rem] text-s-text-3">
              <ClockIcon className="size-3.5" />
              {formatDate(enquiry.createdAt)}
              {enquiry.source && <span className="truncate">· via {enquiry.source}</span>}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="-mr-1 grid size-8 shrink-0 place-items-center rounded-s-sm text-s-text-3 transition-colors hover:bg-s-surface-3 hover:text-s-text"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-6 p-5">
          <div className="flex flex-wrap items-center gap-2">
            {stage && <Badge tone={STAGE_TONE[enquiry.status] ?? "neutral"}>{stage[1]}</Badge>}
            {[enquiry.topic, enquiry.budget, enquiry.location]
              .filter((t): t is string => Boolean(t))
              .map((t) => (
                <Chip key={t}>{t}</Chip>
              ))}
          </div>

          <section>
            <h3 className="s-label mb-2">Message</h3>
            <p className="whitespace-pre-line text-[0.8125rem] leading-relaxed text-s-text-2">
              {enquiry.message}
            </p>
          </section>

          <section>
            <h3 className="s-label mb-2">Reach them</h3>
            <div className="flex flex-col gap-1.5">
              <a
                href={`mailto:${enquiry.email}`}
                className="flex items-center gap-2 rounded-s-xs px-2 py-1.5 text-[0.8125rem] text-s-text transition-colors hover:bg-s-surface-3"
              >
                <MailIcon className="size-4 shrink-0 text-s-text-3" />
                <span className="truncate">{enquiry.email}</span>
              </a>
              {enquiry.phone && (
                <>
                  <a
                    href={`tel:${enquiry.phone}`}
                    className="flex items-center gap-2 rounded-s-xs px-2 py-1.5 text-[0.8125rem] text-s-text transition-colors hover:bg-s-surface-3"
                  >
                    <PhoneIcon className="size-4 shrink-0 text-s-text-3" />
                    <span className="s-num truncate">{enquiry.phone}</span>
                  </a>
                  <a
                    href={whatsAppReply(enquiry.name, enquiry.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex h-[34px] items-center justify-center gap-1.5 rounded-s-sm border border-s-border bg-s-surface px-3 text-[0.8125rem] font-medium text-s-text transition-colors hover:border-s-good/40 hover:bg-s-good-soft hover:text-s-good"
                  >
                    Reply on WhatsApp
                  </a>
                </>
              )}
            </div>
          </section>

          <DeliveryStatus enquiry={enquiry} />

          {enquiry.events.length > 0 && (
            <section>
              <h3 className="s-label mb-3">History</h3>
              <ol className="relative flex flex-col gap-3 pl-4">
                {/* One hairline behind the dots, rather than a border on
                    each item, otherwise the line breaks at every gap. */}
                <span
                  aria-hidden
                  className="absolute bottom-1 left-[3px] top-1 w-px bg-s-border"
                />
                {enquiry.events.map((event) => (
                  <li key={event.id} className="relative">
                    <span
                      aria-hidden
                      className={cn(
                        "absolute -left-4 top-[5px] size-[7px] rounded-full ring-2 ring-s-surface",
                        EVENT_DOT[EVENT_TONE[event.type] ?? "neutral"],
                      )}
                    />
                    <p className="text-[0.8125rem] leading-snug text-s-text-2">{event.summary}</p>
                    <p className="s-num mt-0.5 text-[0.75rem] text-s-text-3">
                      {formatDateTime(event.createdAt)}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section>
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <h3 className="s-label">Private notes</h3>
              <span className="text-[0.75rem] text-s-text-3">
                {dirty ? "Saving…" : notes ? "Saved" : "Only you see these"}
              </span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setDirty(true);
              }}
              onBlur={() => dirty && void persistNotes(notes)}
              rows={5}
              placeholder="Site visit booked for the 14th. Wants to see the Vivek house…"
              className={textareaClass}
            />
          </section>

          <section className="mt-auto border-t border-s-border pt-4">
            <Button
              variant="danger"
              disabled={pending}
              onClick={async () => {
                const ok = await confirm({
                  title: `Delete the enquiry from ${enquiry.name}?`,
                  body: "The message, the contact details and any notes go with it. This can't be undone.",
                  confirmLabel: "Delete",
                  tone: "danger",
                });
                if (!ok) return;
                startTransition(async () => {
                  try {
                    await deleteLead(enquiry.id);
                    toast(`Enquiry from ${enquiry.name} deleted.`);
                    onClose();
                  } catch {
                    toast("Couldn't delete that enquiry.", "error");
                  }
                });
              }}
            >
              <TrashIcon className="size-4" />
              Delete enquiry
            </Button>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
