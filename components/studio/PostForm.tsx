"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { savePost, deletePost } from "@/actions/studio-posts";
import { useUpload } from "@/lib/use-upload";
import { UploadProgress } from "@/components/studio/UploadProgress";
import { inputClass, textareaClass } from "@/components/studio/ui";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------- types */

type Block =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "quote"; text: string; cite?: string }
  | { type: "image"; url: string; alt?: string; caption?: string };

type KeyedBlock = Block & { key: string };

export type PostFormData = {
  id?: string;
  title: string;
  slug: string;
  cover: string;
  coverBlur: string;
  tags: string; // comma-separated in the form
  metaTitle: string;
  metaDesc: string;
  published: boolean;
  body: Block[];
};

const input = inputClass;
const textarea = textareaClass;

/* ---------------------------------------------------------------- form */

export function PostForm({ initial }: { initial?: PostFormData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const { jobs, upload, cancel, dismiss, busy } = useUpload();

  const [form, setForm] = useState(
    initial ?? {
      title: "",
      slug: "",
      cover: "",
      coverBlur: "",
      tags: "",
      metaTitle: "",
      metaDesc: "",
      published: false,
      body: [] as Block[],
    },
  );
  const keyRef = useRef(0);
  const [blocks, setBlocks] = useState<KeyedBlock[]>(
    (initial?.body ?? [{ type: "paragraph", text: "" } as Block]).map((b) => ({
      ...b,
      key: `b${keyRef.current++}`,
    })),
  );

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const updateBlock = (key: string, patch: Partial<Block>) =>
    setBlocks((bs) => bs.map((b) => (b.key === key ? ({ ...b, ...patch } as KeyedBlock) : b)));

  const addBlock = (block: Block) =>
    setBlocks((bs) => [...bs, { ...block, key: `b${keyRef.current++}` }]);

  const move = (key: string, dir: -1 | 1) =>
    setBlocks((bs) => {
      const i = bs.findIndex((b) => b.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= bs.length) return bs;
      const next = [...bs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  // `upload` reports failures on the job row itself, so these just act
  // on success — see the same pattern in ProjectForm.
  async function onCover(file: File | undefined) {
    if (!file) return;
    const result = await upload(file);
    if (result) setForm((f) => ({ ...f, cover: result.url, coverBlur: result.blurData }));
  }

  async function onBlockImage(key: string, file: File | undefined) {
    if (!file) return;
    const result = await upload(file);
    if (result) updateBlock(key, { url: result.url });
  }

  function submit(published: boolean) {
    startTransition(async () => {
      const result = await savePost({
        ...form,
        published,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        body: blocks.map((b) => {
          const { key, ...block } = b;
          void key; // strip the client-side list key before persisting
          return block;
        }),
      });
      if (result.ok) {
        router.push("/studio/journal");
        router.refresh();
      } else {
        setErrors(result.errors);
        window.scrollTo({ top: 0 });
      }
    });
  }

  return (
    <div className="max-w-3xl space-y-12">
      {/* Pinned upload queue, same treatment as the project editor. */}
      {jobs.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 w-[min(22rem,calc(100vw-2rem))]">
          <div className="bg-s-surface rounded-2xl border border-s-border p-3 shadow-s-lg">
            <p className="s-label mb-2 px-0.5">
              {busy ? "Uploading" : "Upload report"}
            </p>
            <UploadProgress jobs={jobs} onCancel={cancel} onDismiss={dismiss} />
          </div>
        </div>
      )}

      {Object.keys(errors).length > 0 && (
        <p className="border border-s-bad px-4 py-3 text-sm text-s-bad" role="alert">
          A few things need attention, check the fields below.
          {errors.slug && ` ${errors.slug[0]}`}
        </p>
      )}

      {/* Title + cover */}
      <section className="space-y-6">
        <div>
          <label className="s-label mb-1.5 block" htmlFor="post-title">Title</label>
          <input
            id="post-title"
            className={cn(input, "font-display text-xl")}
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. On building for the Bengaluru climate"
          />
          {errors.title && <p className="mt-1 text-xs text-s-bad">{errors.title[0]}</p>}
        </div>

        <div className="flex items-center gap-5">
          {form.cover && (
            <div className="relative h-20 w-32 overflow-hidden bg-s-surface-3">
              <Image src={form.cover} alt="" fill sizes="128px" className="object-cover" />
            </div>
          )}
          <label className="s-label cursor-pointer underline underline-offset-4 hover:text-s-accent">
            {form.cover ? "Replace cover" : "Upload cover image"}
            <input type="file" accept="image/*" className="sr-only" disabled={busy}
              onChange={(e) => onCover(e.target.files?.[0])} />
          </label>
        </div>

        <div>
          <label className="s-label mb-1.5 block" htmlFor="post-tags">
            Tags, comma separated
          </label>
          <input
            id="post-tags"
            className={input}
            value={form.tags}
            onChange={(e) => set("tags", e.target.value)}
            placeholder="materials, climate, process"
          />
        </div>
      </section>

      {/* Blocks */}
      <section className="space-y-5">
        <h2 className="s-label rule pt-4">Entry</h2>
        {blocks.map((b, i) => (
          <div key={b.key} className="group border border-s-border bg-s-surface p-4">
            <div className="mb-3 flex items-center gap-4">
              <span className="s-label">{b.type}</span>
              <div className="ml-auto flex gap-3">
                <button type="button" onClick={() => move(b.key, -1)} disabled={i === 0}
                  className="s-label text-s-text-3 hover:text-s-text disabled:opacity-25" aria-label="Move block up">↑</button>
                <button type="button" onClick={() => move(b.key, 1)} disabled={i === blocks.length - 1}
                  className="s-label text-s-text-3 hover:text-s-text disabled:opacity-25" aria-label="Move block down">↓</button>
                <button type="button" onClick={() => setBlocks((bs) => bs.filter((x) => x.key !== b.key))}
                  className="s-label text-s-text-3 hover:text-s-bad" aria-label="Remove block">Remove</button>
              </div>
            </div>

            {b.type === "paragraph" && (
              <textarea className={textarea} rows={4} value={b.text}
                placeholder="Write…"
                onChange={(e) => updateBlock(b.key, { text: e.target.value })} />
            )}
            {b.type === "heading" && (
              <input className={cn(input, "font-display")} value={b.text}
                placeholder="Section heading"
                onChange={(e) => updateBlock(b.key, { text: e.target.value })} />
            )}
            {b.type === "quote" && (
              <div className="space-y-2">
                <textarea className={textarea} rows={2} value={b.text}
                  placeholder="The quote"
                  onChange={(e) => updateBlock(b.key, { text: e.target.value })} />
                <input className={input} value={b.cite ?? ""}
                  placeholder="Attribution (optional)"
                  onChange={(e) => updateBlock(b.key, { cite: e.target.value })} />
              </div>
            )}
            {b.type === "image" && (
              <div className="space-y-3">
                {b.url ? (
                  <div className="relative h-40 w-full max-w-sm overflow-hidden bg-s-surface-3">
                    <Image src={b.url} alt="" fill sizes="384px" className="object-cover" />
                  </div>
                ) : null}
                <label className="s-label cursor-pointer underline underline-offset-4 hover:text-s-accent">
                  {b.url ? "Replace image" : "Upload image"}
                  <input type="file" accept="image/*" className="sr-only" disabled={busy}
                    onChange={(e) => onBlockImage(b.key, e.target.files?.[0])} />
                </label>
                <input className={input} value={b.alt ?? ""} placeholder="Describe the image (alt text)"
                  onChange={(e) => updateBlock(b.key, { alt: e.target.value })} />
                <input className={input} value={b.caption ?? ""} placeholder="Caption (optional)"
                  onChange={(e) => updateBlock(b.key, { caption: e.target.value })} />
              </div>
            )}
          </div>
        ))}

        <div className="flex flex-wrap gap-3">
          {(
            [
              ["Paragraph", { type: "paragraph", text: "" }],
              ["Heading", { type: "heading", text: "" }],
              ["Quote", { type: "quote", text: "", cite: "" }],
              ["Image", { type: "image", url: "", alt: "", caption: "" }],
            ] as [string, Block][]
          ).map(([label, block]) => (
            <button key={label} type="button" onClick={() => addBlock(block)}
              className="s-label border border-s-border px-4 py-2 transition-colors hover:border-s-accent hover:text-s-accent">
              + {label}
            </button>
          ))}
        </div>
      </section>

      {/* SEO */}
      <section className="space-y-5">
        <h2 className="s-label rule pt-4">Search & sharing (optional)</h2>
        <div>
          <label className="s-label mb-1.5 block" htmlFor="post-slug">URL slug</label>
          <input id="post-slug" className={input} value={form.slug}
            placeholder="Leave blank to generate from the title"
            onChange={(e) => set("slug", e.target.value)} />
          {errors.slug && <p className="mt-1 text-xs text-s-bad">{errors.slug[0]}</p>}
        </div>
        <div>
          <label className="s-label mb-1.5 block" htmlFor="post-mt">Meta title</label>
          <input id="post-mt" className={input} value={form.metaTitle}
            onChange={(e) => set("metaTitle", e.target.value)} />
        </div>
        <div>
          <label className="s-label mb-1.5 block" htmlFor="post-md">Meta description</label>
          <textarea id="post-md" className={textarea} rows={2} value={form.metaDesc}
            onChange={(e) => set("metaDesc", e.target.value)} />
        </div>
      </section>

      {/* Actions */}
      <section className="rule flex flex-wrap items-center gap-4 pt-6">
        <button type="button" disabled={pending || busy} onClick={() => submit(true)}
          className="border border-ink bg-s-solid px-8 py-2.5 text-sm text-s-on-solid transition-colors hover:bg-transparent hover:text-s-text disabled:opacity-50">
          {pending ? "Saving…" : "Publish"}
        </button>
        <button type="button" disabled={pending || busy} onClick={() => submit(false)}
          className="border border-ink px-8 py-2.5 text-sm transition-colors hover:bg-s-solid hover:text-s-on-solid disabled:opacity-50">
          Save as draft
        </button>
        {form.id && (
          <button type="button" disabled={pending}
            onClick={() => {
              if (confirm(`Delete “${form.title}”? This can't be undone.`)) {
                startTransition(async () => {
                  await deletePost(form.id!);
                  router.push("/studio/journal");
                  router.refresh();
                });
              }
            }}
            className="s-label ml-auto text-s-text-3 transition-colors hover:text-s-bad">
            Delete entry
          </button>
        )}
      </section>
    </div>
  );
}
