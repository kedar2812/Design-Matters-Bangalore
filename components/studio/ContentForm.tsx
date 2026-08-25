"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { saveSection, resetSection } from "@/actions/studio-settings";
import type { SectionKey } from "@/lib/settings";
import { inputClass } from "@/components/studio/ui";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------- schema */

/**
 * A section's editable shape, described once and rendered generically —
 * so adding a field to `lib/settings` means adding one line here, not a
 * new form.
 */
export type FieldSpec =
  | { kind: "text"; name: string; label: string; hint?: string; placeholder?: string }
  | { kind: "textarea"; name: string; label: string; hint?: string; rows?: number }
  | { kind: "number"; name: string; label: string; hint?: string }
  /** A list of plain strings — team names, hero words, paragraphs. */
  | {
      kind: "list";
      name: string;
      label: string;
      hint?: string;
      itemLabel: string;
      multiline?: boolean;
    }
  /** A list of objects with a fixed set of text fields. */
  | {
      kind: "group";
      name: string;
      label: string;
      hint?: string;
      itemLabel: string;
      fields: { name: string; label: string; multiline?: boolean; hint?: string }[];
    };

export type FieldGroup = { title: string; fields: FieldSpec[] };

/* ------------------------------------------------------------ styling */

const input = inputClass;

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5">
      <span className="s-label block">{children}</span>
      {hint && <span className="mt-0.5 block text-xs text-s-text-3">{hint}</span>}
    </div>
  );
}

function GhostButton({
  children,
  onClick,
  tone = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "s-label rounded-full border border-s-border px-3 py-1 transition-colors",
        tone === "danger"
          ? "text-s-text-3 hover:border-s-bad hover:text-s-bad"
          : "hover:border-s-accent hover:text-s-accent",
      )}
    >
      {children}
    </button>
  );
}

/* --------------------------------------------------------------- form */

type Values = Record<string, unknown>;

export function ContentForm({
  section,
  groups,
  initial,
  isEdited,
}: {
  section: SectionKey;
  groups: FieldGroup[];
  initial: Values;
  isEdited: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<Values>(initial);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saved, setSaved] = useState(false);
  const reduce = useReducedMotion();

  const set = (name: string, v: unknown) => {
    setValues((prev) => ({ ...prev, [name]: v }));
    setSaved(false);
  };

  const list = (name: string) => (values[name] as string[]) ?? [];
  const groupList = (name: string) => (values[name] as Record<string, string>[]) ?? [];

  function submit() {
    startTransition(async () => {
      const result = await saveSection(section, values);
      if (result.ok) {
        setErrors({});
        setSaved(true);
        router.refresh();
        // The confirmation is the only signal the studio gets that the
        // edit reached the live site — hold it long enough to be read.
        setTimeout(() => setSaved(false), 6000);
      } else {
        setErrors(result.errors);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  function reset() {
    if (!confirm("Restore this section to its original wording? Your edits will be lost.")) return;
    startTransition(async () => {
      await resetSection(section);
      router.refresh();
      window.location.reload();
    });
  }

  return (
    <div className="max-w-3xl space-y-10">
      {Object.keys(errors).length > 0 && (
        <p className="rounded-xl border border-s-bad/30 bg-s-bad-soft px-4 py-3 text-sm text-s-bad" role="alert">
          Some fields need attention — check the notes below.
        </p>
      )}

      {groups.map((group) => (
        <section key={group.title} className="rounded-2xl border border-s-border bg-s-surface p-5 sm:p-6">
          <h2 className="s-label mb-5 border-b border-s-border pb-3">{group.title}</h2>
          <div className="space-y-6">
            {group.fields.map((f) => {
              const err = errors[f.name]?.[0];
              return (
                <div key={f.name}>
                  <Label hint={f.hint}>{f.label}</Label>

                  {f.kind === "text" && (
                    <input
                      className={input}
                      value={(values[f.name] as string) ?? ""}
                      placeholder={f.placeholder}
                      onChange={(e) => set(f.name, e.target.value)}
                    />
                  )}

                  {f.kind === "number" && (
                    <input
                      className={input}
                      inputMode="numeric"
                      value={String(values[f.name] ?? "")}
                      onChange={(e) => set(f.name, e.target.value)}
                    />
                  )}

                  {f.kind === "textarea" && (
                    <textarea
                      className={cn(input, "resize-y leading-relaxed")}
                      rows={f.rows ?? 3}
                      value={(values[f.name] as string) ?? ""}
                      onChange={(e) => set(f.name, e.target.value)}
                    />
                  )}

                  {f.kind === "list" && (
                    <div className="space-y-2">
                      {list(f.name).map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="s-label w-6 shrink-0 pt-2.5 text-s-text-3">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          {f.multiline ? (
                            <textarea
                              className={cn(input, "resize-y leading-relaxed")}
                              rows={3}
                              value={item}
                              onChange={(e) => {
                                const next = [...list(f.name)];
                                next[i] = e.target.value;
                                set(f.name, next);
                              }}
                            />
                          ) : (
                            <input
                              className={input}
                              value={item}
                              onChange={(e) => {
                                const next = [...list(f.name)];
                                next[i] = e.target.value;
                                set(f.name, next);
                              }}
                            />
                          )}
                          <button
                            type="button"
                            aria-label={`Remove ${f.itemLabel} ${i + 1}`}
                            className="s-label shrink-0 px-1 pt-2.5 text-s-text-3 transition-colors hover:text-s-bad"
                            onClick={() => set(f.name, list(f.name).filter((_, j) => j !== i))}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <GhostButton onClick={() => set(f.name, [...list(f.name), ""])}>
                        + Add {f.itemLabel}
                      </GhostButton>
                    </div>
                  )}

                  {f.kind === "group" && (
                    <div className="space-y-3">
                      {groupList(f.name).map((item, i) => (
                        <div key={i} className="rounded-xl border border-s-border bg-s-surface-2 p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <span className="s-label text-s-text-3">
                              {f.itemLabel} {String(i + 1).padStart(2, "0")}
                            </span>
                            <div className="flex gap-1">
                              {i > 0 && (
                                <GhostButton
                                  onClick={() => {
                                    const next = [...groupList(f.name)];
                                    [next[i - 1], next[i]] = [next[i], next[i - 1]];
                                    set(f.name, next);
                                  }}
                                >
                                  ↑
                                </GhostButton>
                              )}
                              {i < groupList(f.name).length - 1 && (
                                <GhostButton
                                  onClick={() => {
                                    const next = [...groupList(f.name)];
                                    [next[i + 1], next[i]] = [next[i], next[i + 1]];
                                    set(f.name, next);
                                  }}
                                >
                                  ↓
                                </GhostButton>
                              )}
                              <GhostButton
                                tone="danger"
                                onClick={() =>
                                  set(f.name, groupList(f.name).filter((_, j) => j !== i))
                                }
                              >
                                Remove
                              </GhostButton>
                            </div>
                          </div>
                          <div className="space-y-3">
                            {f.fields.map((sub) => (
                              <div key={sub.name}>
                                <Label hint={sub.hint}>{sub.label}</Label>
                                {sub.multiline ? (
                                  <textarea
                                    className={cn(input, "resize-y leading-relaxed")}
                                    rows={3}
                                    value={item[sub.name] ?? ""}
                                    onChange={(e) => {
                                      const next = [...groupList(f.name)];
                                      next[i] = { ...next[i], [sub.name]: e.target.value };
                                      set(f.name, next);
                                    }}
                                  />
                                ) : (
                                  <input
                                    className={input}
                                    value={item[sub.name] ?? ""}
                                    onChange={(e) => {
                                      const next = [...groupList(f.name)];
                                      next[i] = { ...next[i], [sub.name]: e.target.value };
                                      set(f.name, next);
                                    }}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      <GhostButton
                        onClick={() =>
                          set(f.name, [
                            ...groupList(f.name),
                            Object.fromEntries(f.fields.map((s) => [s.name, ""])),
                          ])
                        }
                      >
                        + Add {f.itemLabel}
                      </GhostButton>
                    </div>
                  )}

                  {err && (
                    <p className="mt-1.5 text-xs text-s-bad" role="alert">
                      {err}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {/* Sticky action bar — saving is always one click away */}
      <div className="bg-s-surface sticky bottom-4 flex flex-wrap items-center gap-3 rounded-2xl border border-s-border p-3 shadow-s-md">
        <button
          type="button"
          disabled={pending}
          onClick={submit}
          className="group flex items-center gap-2 rounded-full bg-s-solid px-6 py-2.5 text-sm text-s-on-solid transition-all duration-300 hover:bg-s-solid-hover disabled:opacity-60"
        >
          {pending && (
            <span
              aria-hidden
              className="size-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current"
            />
          )}
          {pending ? "Saving…" : saved ? "Saved" : "Save changes"}
        </button>

        <AnimatePresence>
          {saved && !pending && (
            <motion.span
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="s-label flex items-center gap-1.5 text-s-accent"
              role="status"
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-3.5"
                aria-hidden
              >
                <path d="m4 10.5 4 4 8-9" />
              </svg>
              Live on the site
            </motion.span>
          )}
        </AnimatePresence>
        {isEdited && (
          <button
            type="button"
            disabled={pending}
            onClick={reset}
            className="s-label ml-auto text-s-text-3 transition-colors hover:text-s-bad"
          >
            Restore original wording
          </button>
        )}
      </div>
    </div>
  );
}
