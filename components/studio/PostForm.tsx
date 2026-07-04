"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { savePost, deletePost } from "@/actions/studio-posts";
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

const input =
  "w-full border border-hairline bg-paper px-3 py-2 text-sm outline-none transition-colors focus:border-brass";

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

/* ---------------------------------------------------------------- form */

export function PostForm({ initial }: { initial?: PostFormData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState(false);

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

  async function onCover(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const { url, blurData } = await upload(file);
      setForm((f) => ({ ...f, cover: url, coverBlur: blurData }));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onBlockImage(key: string, file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const { url } = await upload(file);
      updateBlock(key, { url });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
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
      {Object.keys(errors).length > 0 && (
        <p className="border border-brass-deep px-4 py-3 text-sm text-brass-deep" role="alert">
          A few things need attention — check the fields below.
          {errors.slug && ` ${errors.slug[0]}`}
        </p>
      )}

      {/* Title + cover */}
      <section className="space-y-6">
        <div>
          <label className="mono-label mb-1.5 block" htmlFor="post-title">Title</label>
          <input
            id="post-title"
            className={cn(input, "font-display text-xl")}
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. On building for the Bengaluru climate"
          />
          {errors.title && <p className="mt-1 text-xs text-brass-deep">{errors.title[0]}</p>}
        </div>

        <div className="flex items-center gap-5">
          {form.cover && (
            <div className="relative h-20 w-32 overflow-hidden bg-stone/20">
              <Image src={form.cover} alt="" fill sizes="128px" className="object-cover" />
            </div>
          )}
          <label className="mono-label cursor-pointer underline underline-offset-4 hover:text-brass">
            {busy ? "Uploading…" : form.cover ? "Replace cover" : "Upload cover image"}
            <input type="file" accept="image/*" className="sr-only" disabled={busy}
              onChange={(e) => onCover(e.target.files?.[0])} />
          </label>
        </div>

        <div>
          <label className="mono-label mb-1.5 block" htmlFor="post-tags">
            Tags — comma separated
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
        <h2 className="mono-label rule pt-4">Entry</h2>
        {blocks.map((b, i) => (
          <div key={b.key} className="group border border-hairline bg-paper p-4">
            <div className="mb-3 flex items-center gap-4">
              <span className="mono-label">{b.type}</span>
              <div className="ml-auto flex gap-3">
                <button type="button" onClick={() => move(b.key, -1)} disabled={i === 0}
                  className="mono-label text-stone hover:text-ink disabled:opacity-25" aria-label="Move block up">↑</button>
                <button type="button" onClick={() => move(b.key, 1)} disabled={i === blocks.length - 1}
                  className="mono-label text-stone hover:text-ink disabled:opacity-25" aria-label="Move block down">↓</button>
                <button type="button" onClick={() => setBlocks((bs) => bs.filter((x) => x.key !== b.key))}
                  className="mono-label text-stone hover:text-brass-deep" aria-label="Remove block">Remove</button>
              </div>
            </div>

            {b.type === "paragraph" && (
              <textarea className={cn(input, "resize-y")} rows={4} value={b.text}
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
                <textarea className={cn(input, "resize-y")} rows={2} value={b.text}
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
                  <div className="relative h-40 w-full max-w-sm overflow-hidden bg-stone/20">
                    <Image src={b.url} alt="" fill sizes="384px" className="object-cover" />
                  </div>
                ) : null}
                <label className="mono-label cursor-pointer underline underline-offset-4 hover:text-brass">
                  {busy ? "Uploading…" : b.url ? "Replace image" : "Upload image"}
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
              className="mono-label border border-hairline px-4 py-2 transition-colors hover:border-brass hover:text-brass">
              + {label}
            </button>
          ))}
        </div>
      </section>

      {/* SEO */}
      <section className="space-y-5">
        <h2 className="mono-label rule pt-4">Search & sharing (optional)</h2>
        <div>
          <label className="mono-label mb-1.5 block" htmlFor="post-slug">URL slug</label>
          <input id="post-slug" className={input} value={form.slug}
            placeholder="Leave blank to generate from the title"
            onChange={(e) => set("slug", e.target.value)} />
          {errors.slug && <p className="mt-1 text-xs text-brass-deep">{errors.slug[0]}</p>}
        </div>
        <div>
          <label className="mono-label mb-1.5 block" htmlFor="post-mt">Meta title</label>
          <input id="post-mt" className={input} value={form.metaTitle}
            onChange={(e) => set("metaTitle", e.target.value)} />
        </div>
        <div>
          <label className="mono-label mb-1.5 block" htmlFor="post-md">Meta description</label>
          <textarea id="post-md" className={cn(input, "resize-y")} rows={2} value={form.metaDesc}
            onChange={(e) => set("metaDesc", e.target.value)} />
        </div>
      </section>

      {/* Actions */}
      <section className="rule flex flex-wrap items-center gap-4 pt-6">
        <button type="button" disabled={pending || busy} onClick={() => submit(true)}
          className="border border-ink bg-ink px-8 py-2.5 text-sm text-bone transition-colors hover:bg-transparent hover:text-ink disabled:opacity-50">
          {pending ? "Saving…" : "Publish"}
        </button>
        <button type="button" disabled={pending || busy} onClick={() => submit(false)}
          className="border border-ink px-8 py-2.5 text-sm transition-colors hover:bg-ink hover:text-bone disabled:opacity-50">
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
            className="mono-label ml-auto text-stone transition-colors hover:text-brass-deep">
            Delete entry
          </button>
        )}
      </section>
    </div>
  );
}
