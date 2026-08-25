"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveTestimonial, deleteTestimonial } from "@/actions/studio-testimonials";
import { Stars } from "@/components/site/Stars";
import { inputClass } from "@/components/studio/ui";
import { cn } from "@/lib/utils";

export type TestimonialFormData = {
  id?: string;
  author: string;
  context: string;
  rating: number;
  text: string;
  excerpt: string;
  sourceDate: string;
  source: string;
  featured: boolean;
  published: boolean;
};

const input = inputClass;

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="s-label mb-1.5 block">{label}</span>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-s-text-3">{hint}</p>}
      {error && (
        <p className="mt-1 text-xs text-s-bad" role="alert">
          {error[0]}
        </p>
      )}
    </div>
  );
}

export function TestimonialForm({ initial }: { initial?: TestimonialFormData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [form, setForm] = useState<TestimonialFormData>(
    initial ?? {
      author: "",
      context: "",
      rating: 5,
      text: "",
      excerpt: "",
      sourceDate: "",
      source: "manual",
      featured: false,
      published: true,
    },
  );

  const set = <K extends keyof TestimonialFormData>(k: K, v: TestimonialFormData[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function submit() {
    startTransition(async () => {
      const result = await saveTestimonial(form);
      if (result.ok) {
        router.push("/studio/testimonials");
        router.refresh();
      } else {
        setErrors(result.errors);
        window.scrollTo({ top: 0 });
      }
    });
  }

  function remove() {
    if (!form.id) return;
    startTransition(async () => {
      await deleteTestimonial(form.id!);
      router.push("/studio/testimonials");
      router.refresh();
    });
  }

  return (
    <div className="max-w-3xl space-y-14">
      {Object.keys(errors).length > 0 && (
        <p className="border border-s-bad px-4 py-3 text-sm text-s-bad" role="alert">
          A few things need attention, check the highlighted fields below.
        </p>
      )}

      {/* Who */}
      <section className="space-y-6">
        <h2 className="s-label rule pt-4">The client</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Name" error={errors.author}>
            <input
              className={input}
              value={form.author}
              onChange={(e) => set("author", e.target.value)}
              placeholder="e.g. Shaila Vivek"
            />
          </Field>
          <Field
            label="Project"
            hint="Shown under the name, e.g. Private residence"
            error={errors.context}
          >
            <input
              className={input}
              value={form.context}
              onChange={(e) => set("context", e.target.value)}
              placeholder="Leave blank to hide"
            />
          </Field>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Rating" error={errors.rating}>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    onClick={() => set("rating", n)}
                    className={cn(
                      "rounded-md border px-2.5 py-1.5 text-sm transition-colors",
                      form.rating === n
                        ? "border-s-accent text-s-accent"
                        : "border-s-border text-s-text-3 hover:border-s-accent hover:text-s-accent",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <Stars rating={form.rating} />
            </div>
          </Field>
          <Field
            label="When"
            hint="A display label, e.g. June 2026, leave blank to hide"
            error={errors.sourceDate}
          >
            <input
              className={input}
              value={form.sourceDate}
              onChange={(e) => set("sourceDate", e.target.value)}
              placeholder="e.g. June 2026"
            />
          </Field>
        </div>
      </section>

      {/* What they said */}
      <section className="space-y-6">
        <h2 className="s-label rule pt-4">What they said</h2>
        <Field
          label="The testimonial"
          hint="Shown in full on the testimonials page"
          error={errors.text}
        >
          <textarea
            className={input}
            rows={8}
            value={form.text}
            onChange={(e) => set("text", e.target.value)}
          />
        </Field>
        <Field
          label="Short version"
          hint="Used where space is tight, the home page strip. Blank = the full text is used."
          error={errors.excerpt}
        >
          <textarea
            className={input}
            rows={3}
            value={form.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
          />
        </Field>
        {form.source === "google" && (
          <p className="text-xs text-s-text-3">
            Pulled from the studio&rsquo;s Google reviews, edits here change the site only,
            never the review on Google.
          </p>
        )}
      </section>

      {/* Where it shows */}
      <section className="space-y-4">
        <h2 className="s-label rule pt-4">Where it shows</h2>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => set("published", e.target.checked)}
            className="mt-0.5 size-4 accent-[var(--s-accent)]"
          />
          <span>
            <span className="block text-sm font-medium">On the testimonials page</span>
            <span className="block text-xs text-s-text-3">
              Unticked keeps it in the dashboard only.
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => set("featured", e.target.checked)}
            className="mt-0.5 size-4 accent-[var(--s-accent)]"
          />
          <span>
            <span className="block text-sm font-medium">Featured on the home page</span>
            <span className="block text-xs text-s-text-3">
              The first featured testimonial leads the home-page strip; the next two support it.
            </span>
          </span>
        </label>
      </section>

      {/* Save / delete */}
      <div className="rule flex flex-wrap items-center gap-4 pt-8">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="rounded-xl bg-s-solid px-6 py-2.5 text-sm text-s-on-solid transition-all duration-300 hover:bg-s-solid-hover disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save testimonial"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/studio/testimonials")}
          className="s-label transition-colors hover:text-s-accent"
        >
          Cancel
        </button>

        {form.id && (
          <div className="ml-auto flex items-center gap-3">
            {confirmDelete && (
              <span className="text-xs text-s-text-3">Remove this testimonial for good?</span>
            )}
            <button
              type="button"
              onClick={() => (confirmDelete ? remove() : setConfirmDelete(true))}
              disabled={pending}
              className={cn(
                "s-label transition-colors",
                confirmDelete ? "text-s-bad" : "text-s-text-3 hover:text-s-bad",
              )}
            >
              {confirmDelete ? "Yes, delete" : "Delete"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
