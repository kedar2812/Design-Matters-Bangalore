"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  saveAlertSettings,
  sendTestAlert,
  type TestAlertResult,
} from "@/actions/studio-notifications";
import { useFeedback } from "@/components/studio/Feedback";
import {
  Badge,
  Button,
  Card,
  CardHead,
  inputClass,
  buttonClass,
} from "@/components/studio/ui";
import { CheckIcon, MailIcon, TrashIcon, WarningIcon } from "@/components/studio/icons";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------- toggle */

/**
 * A switch, not a checkbox.
 *
 * These two settings decide whether email leaves the building, so the
 * control has to read as on or off from across a desk. A native checkbox
 * is the right element underneath — it keeps the label association, the
 * keyboard behaviour and the form semantics — and the visible part is
 * drawn over it.
 */
function Switch({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint: string;
}) {
  const reduce = useReducedMotion();

  return (
    <label className="flex cursor-pointer items-start gap-3 py-3">
      <span className="relative mt-[2px] shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={cn(
            "block h-[22px] w-[38px] rounded-full transition-colors duration-200",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-s-accent/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-s-surface",
            checked ? "bg-s-accent" : "bg-s-border-strong",
          )}
        />
        <motion.span
          aria-hidden
          animate={{ x: checked ? 17 : 3 }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 34 }}
          className="pointer-events-none absolute left-0 top-[3px] size-4 rounded-full bg-white shadow-s"
        />
      </span>
      <span className="min-w-0">
        <span className="block text-[0.8125rem] font-medium text-s-text">{label}</span>
        <span className="mt-0.5 block text-[0.75rem] leading-relaxed text-s-text-3">{hint}</span>
      </span>
    </label>
  );
}

/* ---------------------------------------------------------- recipients */

const looksLikeEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

function RecipientRow({
  value,
  onChange,
  onRemove,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onRemove: () => void;
  autoFocus?: boolean;
}) {
  const invalid = value.trim().length > 0 && !looksLikeEmail(value);

  return (
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="name@studio.com"
          aria-label="Email address"
          aria-invalid={invalid || undefined}
          className={cn(inputClass, invalid && "border-s-bad focus:border-s-bad focus:ring-s-bad/15")}
        />
        {invalid && (
          <p className="mt-1.5 text-[0.75rem] text-s-bad">That does not look like an email address.</p>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${value || "this address"}`}
        className="grid size-[34px] shrink-0 place-items-center rounded-s-sm text-s-text-3 transition-colors hover:bg-s-bad-soft hover:text-s-bad"
      >
        <TrashIcon className="size-4" />
      </button>
    </div>
  );
}

/* ----------------------------------------------------------- the screen */

export type AlertSettingsProps = {
  initial: {
    recipients: string[];
    notifyStudio: boolean;
    acknowledgeEnquirer: boolean;
  };
  /** Resolved at render, so the panel states where mail goes right now. */
  effective: { to: string[]; source: "dashboard" | "server" | "studio-email" | "none" };
  /** Whether the server can send at all, and why not if it cannot. */
  provider: { ready: boolean; reason?: string; from?: string };
  studioEmail: string;
};

export function AlertSettings({ initial, effective, provider, studioEmail }: AlertSettingsProps) {
  const router = useRouter();
  const { toast } = useFeedback();

  const [recipients, setRecipients] = useState<string[]>(initial.recipients);
  const [notifyStudio, setNotifyStudio] = useState(initial.notifyStudio);
  const [acknowledgeEnquirer, setAcknowledgeEnquirer] = useState(initial.acknowledgeEnquirer);
  const [saving, startSaving] = useTransition();
  const [testing, startTesting] = useTransition();
  const [test, setTest] = useState<TestAlertResult | null>(null);

  const dirty =
    notifyStudio !== initial.notifyStudio ||
    acknowledgeEnquirer !== initial.acknowledgeEnquirer ||
    recipients.length !== initial.recipients.length ||
    recipients.some((r, i) => r !== initial.recipients[i]);

  const filled = recipients.map((r) => r.trim()).filter(Boolean);
  const anyInvalid = filled.some((r) => !looksLikeEmail(r));
  // Only addresses that could actually receive anything. A half-typed
  // one must not appear in the sentence below, or the screen promises
  // delivery to something that will be refused on save.
  const deliverable = filled.filter(looksLikeEmail);

  /* Where mail will land once this is saved — computed the same way the
     server does, so the sentence on screen never disagrees with what
     actually happens. */
  const destination =
    deliverable.length > 0
      ? { to: deliverable, source: "dashboard" as const }
      : effective.source === "dashboard"
        ? // The studio has just cleared the list; the server has not been
          // told yet, so describe where it is about to fall back to.
          { to: studioEmail ? [studioEmail] : [], source: studioEmail ? ("studio-email" as const) : ("none" as const) }
        : effective;

  function save() {
    if (anyInvalid) {
      toast("Fix the highlighted address first.", "error");
      return;
    }
    startSaving(async () => {
      const result = await saveAlertSettings({
        recipients: filled,
        notifyStudio,
        acknowledgeEnquirer,
      });
      if (result.ok) {
        toast("Saved. New enquiries follow these settings from now on.");
        router.refresh();
      } else {
        toast(result.error, "error");
      }
    });
  }

  function runTest() {
    startTesting(async () => {
      try {
        const result = await sendTestAlert();
        setTest(result);
        toast(
          result.ok ? "Test sent. Check the inbox." : "The test did not send.",
          result.ok ? "success" : "error",
        );
      } catch {
        setTest({ ok: false, error: "Something went wrong reaching the mail provider." });
        toast("The test did not send.", "error");
      }
    });
  }

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      {/* ------------------------------------------------ provider state */}
      <Card>
        <CardHead
          title="Email delivery"
          hint={
            provider.ready
              ? `Sending as ${provider.from}`
              : "Enquiries are still captured here and on WhatsApp"
          }
          action={
            provider.ready ? (
              <Badge tone="good" dot>
                Connected
              </Badge>
            ) : (
              <Badge tone="warn" dot>
                Not set up
              </Badge>
            )
          }
          divided
        />
        {!provider.ready && (
          <div className="px-5 py-4">
            <p className="text-[0.8125rem] leading-relaxed text-s-text-2">
              {provider.reason} Until it is, every enquiry still arrives on this dashboard and
              still reaches you on WhatsApp, and each one says plainly that no email went out.
              The settings below are saved either way and take effect the moment sending is
              switched on.
            </p>
          </div>
        )}
      </Card>

      {/* --------------------------------------------------- recipients */}
      <Card>
        <CardHead
          title="Who gets new enquiries"
          hint="Add as many people as you like. Changes apply to the next enquiry."
          divided
        />
        <div className="px-5 py-4">
          <div className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {recipients.map((value, i) => (
                <motion.div
                  key={i}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.16 }}
                >
                  <RecipientRow
                    value={value}
                    autoFocus={i === recipients.length - 1 && value === ""}
                    onChange={(v) =>
                      setRecipients((prev) => prev.map((p, j) => (j === i ? v : p)))
                    }
                    onRemove={() => setRecipients((prev) => prev.filter((_, j) => j !== i))}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={() => setRecipients((prev) => [...prev, ""])}
            className="mt-3 s-label rounded-full border border-s-border px-3 py-1 transition-colors hover:border-s-accent hover:text-s-accent"
          >
            + Add an address
          </button>

          {/* The sentence that makes this screen trustworthy: not what is
              configured, but where the next email actually goes. */}
          <div className="mt-4 rounded-s-sm border border-s-border bg-s-surface-2 px-3 py-2.5">
            <p className="flex items-start gap-2 text-[0.8125rem] leading-relaxed text-s-text-2">
              <MailIcon className="mt-[2px] size-4 shrink-0 text-s-text-3" />
              <span>
                {!notifyStudio ? (
                  <>Enquiry alerts are switched off, so nothing will be emailed to the studio.</>
                ) : destination.to.length === 0 ? (
                  <>
                    There is nowhere to send alerts. Add an address above, or set the studio
                    email under{" "}
                    <Link href="/studio/content/identity" className="text-s-accent hover:underline">
                      Studio details
                    </Link>
                    .
                  </>
                ) : (
                  <>
                    The next enquiry will be emailed to{" "}
                    <strong className="font-medium text-s-text">
                      {destination.to.join(", ")}
                    </strong>
                    {destination.source === "studio-email" && (
                      <> — the studio address, because no address is set above</>
                    )}
                    {destination.source === "server" && (
                      <> — the address configured on the server</>
                    )}
                    .
                  </>
                )}
              </span>
            </p>
            {anyInvalid && (
              <p className="mt-1.5 pl-6 text-[0.75rem] text-s-text-3">
                The address flagged above is not included, and will not save until it is fixed.
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* ------------------------------------------------------ switches */}
      <Card>
        <CardHead title="What gets sent" divided />
        <div className="divide-y divide-s-border px-5 py-1">
          <Switch
            checked={notifyStudio}
            onChange={setNotifyStudio}
            label="Email the studio when an enquiry arrives"
            hint="Turn this off and enquiries still land on this dashboard, they just do not reach an inbox."
          />
          <Switch
            checked={acknowledgeEnquirer}
            onChange={setAcknowledgeEnquirer}
            label="Send the enquirer a confirmation"
            hint="A short note under the studio's name confirming you have their message, with your phone number. Turn it off if you would rather every first reply be written by hand."
          />
        </div>
      </Card>

      {/* ------------------------------------------------------- actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" size="lg" onClick={save} disabled={saving || !dirty}>
          {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
        </Button>
        <button
          type="button"
          onClick={runTest}
          disabled={testing || dirty || !provider.ready}
          title={
            dirty
              ? "Save your changes first, so the test goes where the settings say"
              : !provider.ready
                ? "Email is not set up on the server yet"
                : undefined
          }
          className={buttonClass("secondary", "lg")}
        >
          <span
            aria-hidden
            className={cn(
              "inline-block size-3.5 rounded-full border-[1.5px] border-s-text-3 border-t-transparent",
              testing && "animate-spin",
            )}
          />
          {testing ? "Sending…" : "Send a test email"}
        </button>
      </div>

      {test && (
        <p
          role="status"
          className={cn(
            "flex items-start gap-2 text-[0.8125rem] leading-relaxed",
            test.ok ? "text-s-text-2" : "text-s-bad",
          )}
        >
          {test.ok ? (
            <CheckIcon className="mt-[2px] size-4 shrink-0 text-s-good" />
          ) : (
            <WarningIcon className="mt-[2px] size-4 shrink-0" />
          )}
          {test.ok
            ? `Sent to ${test.to.join(", ")}. If it has not arrived in a minute, check the spam folder — a domain that has never sent automated mail often lands there once.`
            : test.error}
        </p>
      )}
    </div>
  );
}
