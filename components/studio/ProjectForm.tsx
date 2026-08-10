"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Reorder } from "framer-motion";
import { saveProject, deleteProject } from "@/actions/studio-projects";
import { CATEGORY_LABELS, resolveCategory } from "@/lib/categories";
import { useUpload } from "@/lib/use-upload";
import { useUnsavedChanges } from "@/lib/use-unsaved";
import { UploadProgress } from "@/components/studio/UploadProgress";
import { useFeedback } from "@/components/studio/Feedback";
import { Button, Card, Field, inputClass, textareaClass } from "@/components/studio/ui";
import { WarningIcon } from "@/components/studio/icons";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------- types */

type GalleryItem = { key: string; url: string; alt: string; blurData: string };
type StorySection = { type: "CONCEPT" | "PROCESS" | "FINAL"; text: string; image: string };

export type ProjectFormData = {
  id?: string;
  title: string;
  slug: string;
  category: string;
  year: string;
  location: string;
  typology: string;
  area: string;
  siteArea: string;
  team: string;
  client: string;
  photographer: string;
  collaborator: string;
  units: string;
  statusNote: string;
  heroImage: string;
  heroBlur: string;
  metaTitle: string;
  metaDesc: string;
  status: "DRAFT" | "PUBLISHED";
  story: StorySection[];
  gallery: Omit<GalleryItem, "key">[];
};

const STORY_TYPES = [
  ["CONCEPT", "Concept", "Where the design started — the site, the brief, the idea."],
  ["PROCESS", "Process", "How it developed — decisions, materials, iterations."],
  ["FINAL", "The result", "What got built, and how it's lived in."],
] as const;

// The three practice areas come first — each has its own page on the
// site, and a project must match one of these labels to appear there.
// The trailing two are legacy values kept so older projects still
// round-trip; they show on the main index only.
const CATEGORY_OPTIONS = [...CATEGORY_LABELS, "Commercial", "Hospitality"];

/* ------------------------------------------------------------- helpers */

/* ---------------------------------------------------------------- form */

export function ProjectForm({ initial }: { initial?: ProjectFormData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  // Progress and failures for every file in flight; `busy` blocks save
  // so a project can't be written with a half-uploaded photograph.
  const { jobs, upload, cancel, dismiss, busy } = useUpload();
  const { toast, confirm } = useFeedback();
  // `saved` flips true the moment a save succeeds, so the redirect that
  // follows is not stopped by our own unsaved-changes guard.
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  useUnsavedChanges(dirty && !saved, "This project has unsaved changes.");

  const [form, setForm] = useState<ProjectFormData>(
    initial ?? {
      title: "",
      slug: "",
      category: "Residential",
      year: "",
      location: "Bengaluru",
      typology: "",
      area: "",
      siteArea: "",
      team: "",
      client: "",
      photographer: "",
      collaborator: "",
      units: "",
      statusNote: "",
      heroImage: "",
      heroBlur: "",
      metaTitle: "",
      metaDesc: "",
      status: "DRAFT",
      story: STORY_TYPES.map(([type]) => ({ type, text: "", image: "" })),
      gallery: [],
    },
  );
  const [gallery, setGallery] = useState<GalleryItem[]>(
    (initial?.gallery ?? []).map((g, i) => ({ ...g, key: `g${i}` })),
  );
  const keyRef = useRef(gallery.length);

  const set = <K extends keyof ProjectFormData>(k: K, v: ProjectFormData[K]) => {
    setDirty(true);
    setForm((f) => ({ ...f, [k]: v }));
  };

  // Each handler is fire-and-forget: `upload` resolves to null on
  // failure or cancellation and leaves the message on the job row, so
  // there is nothing to catch and nothing to alert().
  async function onHeroFile(file: File | undefined) {
    if (!file) return;
    const result = await upload(file);
    if (result) {
      setForm((f) => ({ ...f, heroImage: result.url, heroBlur: result.blurData }));
    }
  }

  async function onGalleryFiles(files: FileList | null) {
    if (!files?.length) return;
    // Sequential, not parallel: the server re-encodes each file with
    // sharp, and a dozen at once would starve the box the studio's site
    // runs on. Each lands in the gallery as soon as it finishes.
    for (const file of Array.from(files)) {
      const result = await upload(file);
      if (result) {
        setDirty(true);
        setGallery((g) => [
          ...g,
          { key: `g${keyRef.current++}`, url: result.url, alt: "", blurData: result.blurData },
        ]);
      }
    }
  }

  async function onStoryFile(type: StorySection["type"], file: File | undefined) {
    if (!file) return;
    const result = await upload(file);
    if (result) {
      setForm((f) => ({
        ...f,
        story: f.story.map((s) => (s.type === type ? { ...s, image: result.url } : s)),
      }));
    }
  }

  function submit(status: "DRAFT" | "PUBLISHED") {
    startTransition(async () => {
      try {
        const result = await saveProject({
          ...form,
          status,
          year: form.year ? Number(form.year) : null,
          gallery: gallery.map(({ url, alt, blurData }) => ({ url, alt, blurData })),
        });
        if (result.ok) {
          setErrors({});
          setSaved(true);
          setDirty(false);
          toast(
            status === "PUBLISHED"
              ? `${form.title} saved and live on the site.`
              : `${form.title} saved as a draft.`,
          );
          router.push("/studio/projects");
          router.refresh();
        } else {
          setErrors(result.errors);
          toast("Some fields need attention.", "error");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } catch {
        toast("Couldn't save — nothing has been lost, try again.", "error");
      }
    });
  }

  return (
    <div className="max-w-3xl space-y-4 pb-28">
      {/* Upload queue. Pinned rather than inline: a gallery drop can run
          for a minute across several files, and the studio should see
          progress no matter which section they've scrolled to. */}
      {jobs.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 w-[min(22rem,calc(100vw-2rem))]">
          <div className="rounded-s border border-s-border bg-s-surface p-3 shadow-s-lg">
            <p className="s-label mb-2 px-0.5">{busy ? "Uploading" : "Upload report"}</p>
            <UploadProgress jobs={jobs} onCancel={cancel} onDismiss={dismiss} />
          </div>
        </div>
      )}

      {Object.keys(errors).length > 0 && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-s-sm border border-s-bad/30 bg-s-bad-soft px-3.5 py-2.5 text-[0.8125rem] text-s-bad"
        >
          <WarningIcon className="size-4 shrink-0" />
          A few things need attention — check the highlighted fields below.
        </p>
      )}

      {/* Identity */}
      <Card className="space-y-5 p-5">
        <h2 className="text-[0.9375rem] font-semibold text-s-text">The project</h2>
        <Field label="Project name" error={errors.title}>
          <input
            className={inputClass}
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Wellington Street Residence"
          />
        </Field>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label="Category"
            // Category decides which practice-area page the project
            // shows on, so say so rather than leaving it to guesswork.
            hint={
              resolveCategory(form.category)
                ? `Appears on the ${resolveCategory(form.category)!.label} page`
                : "Not one of the three practice areas — shows on the main projects index only"
            }
            error={errors.category}
          >
            <div className="mb-2 flex flex-wrap gap-1.5">
              {CATEGORY_LABELS.map((c) => {
                const on = resolveCategory(form.category)?.label === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set("category", c)}
                    aria-pressed={on}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition-colors",
                      on
                        ? "border-s-solid bg-s-solid text-s-on-solid"
                        : "border-s-border text-s-text-2 hover:border-s-accent/40 hover:bg-s-accent-soft hover:text-s-accent",
                    )}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
            <input
              className={inputClass}
              list="dma-categories"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            />
            <datalist id="dma-categories">
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Year completed" error={errors.year}>
            <input
              className={inputClass}
              inputMode="numeric"
              value={form.year}
              onChange={(e) => set("year", e.target.value)}
              placeholder="2024"
            />
          </Field>
          <Field label="Location" error={errors.location}>
            <input className={inputClass} value={form.location} onChange={(e) => set("location", e.target.value)} />
          </Field>
          <Field label="Typology" hint="e.g. Duplex residence, Villa interiors" error={errors.typology}>
            <input className={inputClass} value={form.typology} onChange={(e) => set("typology", e.target.value)} />
          </Field>
          <Field label="Site area" hint="The plot — e.g. 1,200 sq ft" error={errors.siteArea}>
            <input className={inputClass} value={form.siteArea} onChange={(e) => set("siteArea", e.target.value)} />
          </Field>
          <Field label="Built-up area" hint="e.g. 4,200 sq ft" error={errors.area}>
            <input className={inputClass} value={form.area} onChange={(e) => set("area", e.target.value)} />
          </Field>
          <Field label="Client" hint="Shown on the project page" error={errors.client}>
            <input className={inputClass} value={form.client} onChange={(e) => set("client", e.target.value)} placeholder="Mr. and Mrs. Sharma" />
          </Field>
          <Field label="Status" hint="e.g. Completed in 2023, Construction phase" error={errors.statusNote}>
            <input className={inputClass} value={form.statusNote} onChange={(e) => set("statusNote", e.target.value)} />
          </Field>
          <Field label="Units" hint="Only for multi-unit projects — e.g. 55 villaments" error={errors.units}>
            <input className={inputClass} value={form.units} onChange={(e) => set("units", e.target.value)} />
          </Field>
          <Field label="Project team" error={errors.team}>
            <input className={inputClass} value={form.team} onChange={(e) => set("team", e.target.value)} placeholder="Ar. Kiran Hanumaiah, Ar. Harshitha" />
          </Field>
          <Field label="Photography" hint="Credited on the project page" error={errors.photographer}>
            <input className={inputClass} value={form.photographer} onChange={(e) => set("photographer", e.target.value)} placeholder="Ajay Devasia" />
          </Field>
          <Field label="Collaboration" hint="e.g. In association with Studio Parametric" error={errors.collaborator}>
            <input className={inputClass} value={form.collaborator} onChange={(e) => set("collaborator", e.target.value)} />
          </Field>
        </div>
      </Card>

      {/* Hero */}
      <Card className="space-y-4 p-5">
        <h2 className="text-[0.9375rem] font-semibold text-s-text">Hero photograph</h2>
        {form.heroImage && (
          <div className="relative aspect-[8/5] max-w-md overflow-hidden bg-s-surface-3">
            <Image src={form.heroImage} alt="" fill sizes="448px" className="object-cover" />
          </div>
        )}
        <label className="inline-flex h-[34px] cursor-pointer items-center gap-1.5 rounded-s-sm border border-s-border bg-s-surface px-3 text-[0.8125rem] font-medium text-s-text transition-colors hover:bg-s-surface-2 hover:border-s-border-strong">
          {form.heroImage ? "Replace hero" : "Upload hero"}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              onHeroFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      </Card>

      {/* Story */}
      <Card className="space-y-7 p-5">
        <h2 className="text-[0.9375rem] font-semibold text-s-text">The story <span className="font-normal text-s-text-3">— concept, process, result</span></h2>
        {form.story.map((s) => {
          const [, label, hint] = STORY_TYPES.find(([t]) => t === s.type)!;
          return (
            <div key={s.type} className="space-y-3">
              <Field label={label} hint={hint}>
                <textarea
                  className={textareaClass}
                  rows={4}
                  value={s.text}
                  onChange={(e) =>
                    set("story", form.story.map((x) => (x.type === s.type ? { ...x, text: e.target.value } : x)))
                  }
                />
              </Field>
              <div className="flex items-center gap-4">
                {s.image && (
                  <div className="relative h-16 w-24 overflow-hidden bg-s-surface-3">
                    <Image src={s.image} alt="" fill sizes="96px" className="object-cover" />
                  </div>
                )}
                <label className="inline-flex h-[30px] cursor-pointer items-center gap-1.5 rounded-s-sm border border-s-border bg-s-surface px-2.5 text-[0.8125rem] text-s-text transition-colors hover:bg-s-surface-2">
                  {s.image ? "Replace image" : "Add an image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={busy}
                    onChange={(e) => {
                      onStoryFile(s.type, e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
                {s.image && (
                  <button
                    type="button"
                    className="text-[0.8125rem] text-s-text-3 transition-colors hover:text-s-bad"
                    onClick={() =>
                      set("story", form.story.map((x) => (x.type === s.type ? { ...x, image: "" } : x)))
                    }
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </Card>

      {/* Gallery */}
      <Card className="space-y-4 p-5">
        <h2 className="text-[0.9375rem] font-semibold text-s-text">Gallery <span className="font-normal text-s-text-3">— drag to reorder</span></h2>
        <Reorder.Group axis="y" values={gallery} onReorder={setGallery} className="space-y-2">
          {gallery.map((img) => (
            <Reorder.Item
              key={img.key}
              value={img}
              className="mb-2 flex cursor-grab items-center gap-3 rounded-s-sm border border-s-border bg-s-surface p-2 transition-colors hover:border-s-border-strong active:cursor-grabbing"
            >
              <span className="pl-1 text-s-text-3" aria-hidden>⁙</span>
              <div className="relative h-14 w-20 shrink-0 overflow-hidden bg-s-surface-3">
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </div>
              <input
                className="min-w-0 flex-1 border-0 bg-transparent text-[0.8125rem] text-s-text outline-none placeholder:text-s-text-3"
                placeholder="Describe this photo (alt text, helps Google too)"
                value={img.alt}
                onChange={(e) =>
                  setGallery((g) => g.map((x) => (x.key === img.key ? { ...x, alt: e.target.value } : x)))
                }
                onPointerDown={(e) => e.stopPropagation()}
              />
              <button
                type="button"
                className="shrink-0 rounded-s-xs px-2 py-1 text-[0.8125rem] text-s-text-3 transition-colors hover:bg-s-bad-soft hover:text-s-bad"
                onClick={() => setGallery((g) => g.filter((x) => x.key !== img.key))}
              >
                Remove
              </button>
            </Reorder.Item>
          ))}
        </Reorder.Group>
        <label className="inline-flex h-[34px] cursor-pointer items-center gap-1.5 rounded-s-sm border border-s-border bg-s-surface px-3 text-[0.8125rem] font-medium text-s-text transition-colors hover:bg-s-surface-2 hover:border-s-border-strong">
          Add photographs
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              onGalleryFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </Card>

      {/* SEO */}
      <Card className="space-y-5 p-5">
        <h2 className="text-[0.9375rem] font-semibold text-s-text">Search &amp; sharing <span className="font-normal text-s-text-3">(optional)</span></h2>
        <Field label="URL slug" hint="Leave blank to generate from the name" error={errors.slug}>
          <input className={inputClass} value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="wellington-street-residence" />
        </Field>
        <Field label="Meta title" error={errors.metaTitle}>
          <input className={inputClass} value={form.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} />
        </Field>
        <Field label="Meta description" error={errors.metaDesc}>
          <textarea className={textareaClass} rows={2} value={form.metaDesc} onChange={(e) => set("metaDesc", e.target.value)} />
        </Field>
      </Card>

      {/* Actions.

          Pinned to the bottom of the viewport rather than sitting at the
          end of a long form. This form runs well past a screen, and a
          save button you have to scroll to find is one people stop
          trusting — they scroll down to check it is still there. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-s-border bg-s-surface/90 backdrop-blur-md lg:left-[236px]">
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center gap-2 px-4 py-3 lg:px-7">
          <Button
            type="button"
            variant="primary"
            size="lg"
            disabled={pending || busy}
            onClick={() => submit("PUBLISHED")}
          >
            {pending ? "Saving…" : "Save & publish"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            disabled={pending || busy}
            onClick={() => submit("DRAFT")}
          >
            Save as draft
          </Button>

          <span className="text-[0.75rem] text-s-text-3">
            {busy
              ? "Waiting for photographs to finish uploading…"
              : dirty
                ? "Unsaved changes"
                : saved
                  ? "Saved"
                  : ""}
          </span>

          {form.id && (
            <Button
              type="button"
              variant="danger"
              size="lg"
              className="ml-auto"
              disabled={pending}
              onClick={async () => {
                const ok = await confirm({
                  title: `Delete ${form.title || "this project"}?`,
                  body: "The project, its story and all of its photographs come off the site immediately. This can't be undone.",
                  confirmLabel: "Delete project",
                  tone: "danger",
                });
                if (!ok) return;
                startTransition(async () => {
                  try {
                    await deleteProject(form.id!);
                    setDirty(false);
                    setSaved(true);
                    toast(`${form.title} deleted.`);
                    router.push("/studio/projects");
                    router.refresh();
                  } catch {
                    toast("Couldn't delete that project.", "error");
                  }
                });
              }}
            >
              Delete project
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
