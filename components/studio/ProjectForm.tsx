"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Reorder } from "framer-motion";
import { saveProject, deleteProject } from "@/actions/studio-projects";
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
  team: string;
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

// The client's own taxonomy, verbatim from the discovery form.
const CATEGORIES = ["Residential", "Commercial", "Hospitality", "Institutional", "Interiors"];

/* ------------------------------------------------------------- helpers */

async function upload(file: File): Promise<{ url: string; blurData: string }> {
  const fd = new FormData();
  fd.set("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Upload failed.");
  }
  return res.json();
}

const input =
  "w-full border border-hairline bg-paper px-3 py-2 text-sm outline-none transition-colors focus:border-brass";

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
      <span className="mono-label mb-1.5 block">{label}</span>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-stone">{hint}</p>}
      {error && <p className="mt-1 text-xs text-brass-deep" role="alert">{error[0]}</p>}
    </div>
  );
}

/* ---------------------------------------------------------------- form */

export function ProjectForm({ initial }: { initial?: ProjectFormData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState<string | null>(null); // which uploader is working

  const [form, setForm] = useState<ProjectFormData>(
    initial ?? {
      title: "",
      slug: "",
      category: "Residential",
      year: "",
      location: "Bengaluru",
      typology: "",
      area: "",
      team: "",
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

  const set = <K extends keyof ProjectFormData>(k: K, v: ProjectFormData[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function onHeroFile(file: File | undefined) {
    if (!file) return;
    setBusy("hero");
    try {
      const { url, blurData } = await upload(file);
      setForm((f) => ({ ...f, heroImage: url, heroBlur: blurData }));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(null);
    }
  }

  async function onGalleryFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy("gallery");
    try {
      for (const file of Array.from(files)) {
        const { url, blurData } = await upload(file);
        setGallery((g) => [...g, { key: `g${keyRef.current++}`, url, alt: "", blurData }]);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(null);
    }
  }

  async function onStoryFile(type: StorySection["type"], file: File | undefined) {
    if (!file) return;
    setBusy(type);
    try {
      const { url } = await upload(file);
      setForm((f) => ({
        ...f,
        story: f.story.map((s) => (s.type === type ? { ...s, image: url } : s)),
      }));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(null);
    }
  }

  function submit(status: "DRAFT" | "PUBLISHED") {
    startTransition(async () => {
      const result = await saveProject({
        ...form,
        status,
        year: form.year ? Number(form.year) : null,
        gallery: gallery.map(({ url, alt, blurData }) => ({ url, alt, blurData })),
      });
      if (result.ok) {
        router.push("/studio/projects");
        router.refresh();
      } else {
        setErrors(result.errors);
        window.scrollTo({ top: 0 });
      }
    });
  }

  return (
    <div className="max-w-3xl space-y-14">
      {Object.keys(errors).length > 0 && (
        <p className="border border-brass-deep px-4 py-3 text-sm text-brass-deep" role="alert">
          A few things need attention — check the highlighted fields below.
        </p>
      )}

      {/* Identity */}
      <section className="space-y-6">
        <h2 className="mono-label rule pt-4">The project</h2>
        <Field label="Project name" error={errors.title}>
          <input
            className={input}
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Wellington Street Residence"
          />
        </Field>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Category" error={errors.category}>
            <input
              className={input}
              list="dma-categories"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            />
            <datalist id="dma-categories">
              {CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Year completed" error={errors.year}>
            <input
              className={input}
              inputMode="numeric"
              value={form.year}
              onChange={(e) => set("year", e.target.value)}
              placeholder="2024"
            />
          </Field>
          <Field label="Location" error={errors.location}>
            <input className={input} value={form.location} onChange={(e) => set("location", e.target.value)} />
          </Field>
          <Field label="Typology" hint="e.g. Duplex residence, Villa interiors" error={errors.typology}>
            <input className={input} value={form.typology} onChange={(e) => set("typology", e.target.value)} />
          </Field>
          <Field label="Built-up area" hint="e.g. 4,200 sq ft" error={errors.area}>
            <input className={input} value={form.area} onChange={(e) => set("area", e.target.value)} />
          </Field>
          <Field label="Project team" error={errors.team}>
            <input className={input} value={form.team} onChange={(e) => set("team", e.target.value)} placeholder="Ar. Kiran Hanumaiah, Ar. Harshitha" />
          </Field>
        </div>
      </section>

      {/* Hero */}
      <section className="space-y-4">
        <h2 className="mono-label rule pt-4">Hero photograph</h2>
        {form.heroImage && (
          <div className="relative aspect-[8/5] max-w-md overflow-hidden bg-stone/20">
            <Image src={form.heroImage} alt="" fill sizes="448px" className="object-cover" />
          </div>
        )}
        <label className="mono-label inline-block cursor-pointer underline underline-offset-4 hover:text-brass">
          {busy === "hero" ? "Uploading…" : form.heroImage ? "Replace hero" : "Upload hero"}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={busy !== null}
            onChange={(e) => onHeroFile(e.target.files?.[0])}
          />
        </label>
      </section>

      {/* Story */}
      <section className="space-y-8">
        <h2 className="mono-label rule pt-4">The story — concept, process, result</h2>
        {form.story.map((s) => {
          const [, label, hint] = STORY_TYPES.find(([t]) => t === s.type)!;
          return (
            <div key={s.type} className="space-y-3">
              <Field label={label} hint={hint}>
                <textarea
                  className={cn(input, "resize-y")}
                  rows={4}
                  value={s.text}
                  onChange={(e) =>
                    set("story", form.story.map((x) => (x.type === s.type ? { ...x, text: e.target.value } : x)))
                  }
                />
              </Field>
              <div className="flex items-center gap-4">
                {s.image && (
                  <div className="relative h-16 w-24 overflow-hidden bg-stone/20">
                    <Image src={s.image} alt="" fill sizes="96px" className="object-cover" />
                  </div>
                )}
                <label className="mono-label cursor-pointer underline underline-offset-4 hover:text-brass">
                  {busy === s.type ? "Uploading…" : s.image ? "Replace image" : "Add an image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={busy !== null}
                    onChange={(e) => onStoryFile(s.type, e.target.files?.[0])}
                  />
                </label>
                {s.image && (
                  <button
                    type="button"
                    className="mono-label text-stone hover:text-brass-deep"
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
      </section>

      {/* Gallery */}
      <section className="space-y-4">
        <h2 className="mono-label rule pt-4">Gallery — drag to reorder</h2>
        <Reorder.Group axis="y" values={gallery} onReorder={setGallery} className="space-y-2">
          {gallery.map((img) => (
            <Reorder.Item
              key={img.key}
              value={img}
              className="flex cursor-grab items-center gap-4 border border-hairline bg-paper p-2 active:cursor-grabbing"
            >
              <span className="mono-label pl-1 text-stone" aria-hidden>⠿</span>
              <div className="relative h-14 w-20 shrink-0 overflow-hidden bg-stone/20">
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </div>
              <input
                className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-stone/60"
                placeholder="Describe this photo (alt text, helps Google too)"
                value={img.alt}
                onChange={(e) =>
                  setGallery((g) => g.map((x) => (x.key === img.key ? { ...x, alt: e.target.value } : x)))
                }
                onPointerDown={(e) => e.stopPropagation()}
              />
              <button
                type="button"
                className="mono-label pr-2 text-stone hover:text-brass-deep"
                onClick={() => setGallery((g) => g.filter((x) => x.key !== img.key))}
              >
                Remove
              </button>
            </Reorder.Item>
          ))}
        </Reorder.Group>
        <label className="mono-label inline-block cursor-pointer underline underline-offset-4 hover:text-brass">
          {busy === "gallery" ? "Uploading…" : "Add photographs"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={busy !== null}
            onChange={(e) => {
              onGalleryFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </section>

      {/* SEO */}
      <section className="space-y-6">
        <h2 className="mono-label rule pt-4">Search & sharing (optional)</h2>
        <Field label="URL slug" hint="Leave blank to generate from the name" error={errors.slug}>
          <input className={input} value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="wellington-street-residence" />
        </Field>
        <Field label="Meta title" error={errors.metaTitle}>
          <input className={input} value={form.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} />
        </Field>
        <Field label="Meta description" error={errors.metaDesc}>
          <textarea className={cn(input, "resize-y")} rows={2} value={form.metaDesc} onChange={(e) => set("metaDesc", e.target.value)} />
        </Field>
      </section>

      {/* Actions */}
      <section className="rule flex flex-wrap items-center gap-4 pt-6">
        <button
          type="button"
          disabled={pending || busy !== null}
          onClick={() => submit("PUBLISHED")}
          className="border border-ink bg-ink px-8 py-2.5 text-sm text-bone transition-colors hover:bg-transparent hover:text-ink disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save & publish"}
        </button>
        <button
          type="button"
          disabled={pending || busy !== null}
          onClick={() => submit("DRAFT")}
          className="border border-ink px-8 py-2.5 text-sm transition-colors hover:bg-ink hover:text-bone disabled:opacity-50"
        >
          Save as draft
        </button>
        {form.id && (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (confirm(`Delete “${form.title}” and its images from the site? This can't be undone.`)) {
                startTransition(async () => {
                  await deleteProject(form.id!);
                  router.push("/studio/projects");
                  router.refresh();
                });
              }
            }}
            className="mono-label ml-auto text-stone transition-colors hover:text-brass-deep"
          >
            Delete project
          </button>
        )}
      </section>
    </div>
  );
}
