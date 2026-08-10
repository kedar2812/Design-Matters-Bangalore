"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Reorder, useDragControls } from "framer-motion";
import {
  deleteTestimonial,
  reorderTestimonials,
  toggleTestimonialFeatured,
  toggleTestimonialPublished,
} from "@/actions/studio-testimonials";
import { useFeedback } from "@/components/studio/Feedback";
import { Button, EmptyState, Select } from "@/components/studio/ui";
import { Stars } from "@/components/site/Stars";
import { GripIcon, SearchIcon, TestimonialsIcon, TrashIcon, XIcon } from "@/components/studio/icons";
import { cn } from "@/lib/utils";

export type TestimonialRow = {
  id: string;
  author: string;
  context: string | null;
  rating: number;
  text: string;
  source: string;
  sourceDate: string | null;
  featured: boolean;
  published: boolean;
};

/**
 * The testimonial list.
 *
 * Same shape as the projects list and for the same reason: order here is
 * order on the site, so it drags. Thirty-one reviews came across from
 * Google, which is far too many to walk one row at a time through a pair
 * of arrows.
 *
 * `featured` only means anything once a review is published — a hidden
 * review cannot lead the home-page strip — so the star is disabled rather
 * than silently ineffective when the review is off the site.
 */
export function TestimonialList({ testimonials }: { testimonials: TestimonialRow[] }) {
  const [order, setOrder] = useState(testimonials);
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState("all");
  const [saving, startSaving] = useTransition();
  const { toast, confirm } = useFeedback();

  useEffect(() => setOrder(testimonials), [testimonials]);

  const filtering = query.trim() !== "" || visibility !== "all";

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return order.filter((t) => {
      if (visibility === "live" && !t.published) return false;
      if (visibility === "hidden" && t.published) return false;
      if (visibility === "featured" && !t.featured) return false;
      if (!q) return true;
      return [t.author, t.text, t.context].filter(Boolean).some((f) => String(f).toLowerCase().includes(q));
    });
  }, [order, query, visibility]);

  function persist(next: TestimonialRow[]) {
    setOrder(next);
    startSaving(async () => {
      try {
        await reorderTestimonials(next.map((t) => t.id));
        toast("Order saved.");
      } catch {
        setOrder(testimonials);
        toast("Couldn't save the new order.", "error");
      }
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-s-text-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reviews…"
            aria-label="Search testimonials"
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
        <Select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
          aria-label="Filter testimonials"
        >
          <option value="all">All reviews</option>
          <option value="live">On the site</option>
          <option value="hidden">Hidden</option>
          <option value="featured">On the home page</option>
        </Select>
        {filtering && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery("");
              setVisibility("all");
            }}
          >
            Reset
          </Button>
        )}
      </div>

      <p className="mb-2 flex items-center gap-2 text-[0.75rem] text-s-text-3">
        {filtering ? (
          <>
            Showing {visible.length} of {order.length} — clear the filters to reorder.
          </>
        ) : (
          <>
            Drag to reorder. The first featured review leads the home-page strip.
            {saving && <span className="text-s-accent">Saving…</span>}
          </>
        )}
      </p>

      {visible.length === 0 ? (
        <EmptyState
          icon={<TestimonialsIcon className="size-5" />}
          title={query || filtering ? "Nothing matches those filters" : "No testimonials yet"}
          body={
            filtering
              ? undefined
              : "Add one by hand, or pull the studio's Google reviews in with Sync."
          }
          action={
            filtering ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery("");
                  setVisibility("all");
                }}
              >
                Reset filters
              </Button>
            ) : undefined
          }
        />
      ) : filtering ? (
        <ul className="flex flex-col">
          {visible.map((t) => (
            <li key={t.id}>
              <Row t={t} draggable={false} confirm={confirm} toast={toast} />
            </li>
          ))}
        </ul>
      ) : (
        <Reorder.Group axis="y" values={order} onReorder={persist} className="flex flex-col">
          {order.map((t) => (
            <DraggableRow key={t.id} t={t} confirm={confirm} toast={toast} />
          ))}
        </Reorder.Group>
      )}
    </div>
  );
}

type Feedback = ReturnType<typeof useFeedback>;

function DraggableRow({
  t,
  confirm,
  toast,
}: {
  t: TestimonialRow;
  confirm: Feedback["confirm"];
  toast: Feedback["toast"];
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={t}
      dragListener={false}
      dragControls={controls}
      className="rounded-s-sm bg-s-surface"
      whileDrag={{ scale: 1.005, boxShadow: "var(--s-shadow-md)", zIndex: 5, position: "relative" }}
    >
      <Row t={t} draggable onDragStart={(e) => controls.start(e)} confirm={confirm} toast={toast} />
    </Reorder.Item>
  );
}

function Row({
  t,
  draggable,
  onDragStart,
  confirm,
  toast,
}: {
  t: TestimonialRow;
  draggable: boolean;
  onDragStart?: (e: React.PointerEvent) => void;
  confirm: Feedback["confirm"];
  toast: Feedback["toast"];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div
      className={cn(
        "group flex items-center gap-3 border-b border-s-border px-2 py-2.5 transition-colors hover:bg-s-surface-2",
        pending && "opacity-55",
        !t.published && "opacity-70",
      )}
    >
      {draggable ? (
        <button
          type="button"
          onPointerDown={onDragStart}
          aria-label={`Reorder review from ${t.author}`}
          className="grid size-7 shrink-0 cursor-grab touch-none place-items-center rounded-s-xs text-s-text-3 transition-colors hover:bg-s-surface-3 hover:text-s-text-2 active:cursor-grabbing"
        >
          <GripIcon className="size-4" />
        </button>
      ) : (
        <span className="size-7 shrink-0" aria-hidden />
      )}

      <Link href={`/studio/testimonials/${t.id}`} className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="truncate text-[0.8125rem] font-medium text-s-text transition-colors group-hover:text-s-accent">
            {t.author}
          </span>
          <Stars rating={t.rating} size={11} />
        </span>
        <span className="mt-0.5 block truncate text-[0.75rem] text-s-text-2">{t.text}</span>
        <span className="mt-0.5 block truncate text-[0.75rem] text-s-text-3">
          {[t.source === "google" ? "Google" : "Manual", t.sourceDate, t.context]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </Link>

      <button
        type="button"
        disabled={pending || !t.published}
        title={
          t.published
            ? "Featured reviews appear on the home page"
            : "Publish this review before featuring it"
        }
        onClick={() =>
          startTransition(async () => {
            try {
              await toggleTestimonialFeatured(t.id);
              toast(t.featured ? "Removed from the home page." : "Added to the home page.");
            } catch {
              toast("Couldn't change that.", "error");
            }
          })
        }
        className={cn(
          "shrink-0 rounded-full px-2 py-[3px] text-[0.75rem] font-medium leading-none transition-colors disabled:opacity-40",
          t.featured
            ? "bg-s-accent-soft text-s-accent"
            : "bg-s-muted-soft text-s-muted hover:bg-s-accent-soft hover:text-s-accent",
        )}
      >
        {t.featured ? "★ Home" : "Home"}
      </button>

      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              await toggleTestimonialPublished(t.id);
              toast(t.published ? "Hidden from the site." : "Now on the site.");
            } catch {
              toast("Couldn't change that.", "error");
            }
          })
        }
        className={cn(
          "shrink-0 rounded-full px-2 py-[3px] text-[0.75rem] font-medium leading-none transition-colors",
          t.published
            ? "bg-s-good-soft text-s-good hover:bg-s-muted-soft hover:text-s-muted"
            : "bg-s-muted-soft text-s-muted hover:bg-s-good-soft hover:text-s-good",
        )}
      >
        {t.published ? "On site" : "Hidden"}
      </button>

      <div className="flex shrink-0 items-center gap-0.5">
        <Link
          href={`/studio/testimonials/${t.id}`}
          className="rounded-s-xs px-2 py-1 text-[0.8125rem] text-s-text-2 transition-colors hover:bg-s-surface-3 hover:text-s-text"
        >
          Edit
        </Link>
        <button
          type="button"
          disabled={pending}
          aria-label={`Delete review from ${t.author}`}
          onClick={async () => {
            const ok = await confirm({
              title: `Delete the review from ${t.author}?`,
              body:
                t.source === "google"
                  ? "It stays on Google — this only removes the copy shown on the site. A future sync may bring it back as a hidden draft."
                  : "This can't be undone.",
              confirmLabel: "Delete",
              tone: "danger",
            });
            if (!ok) return;
            startTransition(async () => {
              try {
                await deleteTestimonial(t.id);
                toast(`Review from ${t.author} deleted.`);
              } catch {
                toast("Couldn't delete that review.", "error");
              }
            });
          }}
          className="grid size-7 place-items-center rounded-s-xs text-s-text-3 opacity-0 transition-all hover:bg-s-bad-soft hover:text-s-bad focus-visible:opacity-100 group-hover:opacity-100"
        >
          <TrashIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}
