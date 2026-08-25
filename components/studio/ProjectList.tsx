"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Reorder, useDragControls } from "framer-motion";
import { deleteProject, reorderProjects, togglePublish } from "@/actions/studio-projects";
import { useFeedback } from "@/components/studio/Feedback";
import { Badge, Button, EmptyState, Select } from "@/components/studio/ui";
import { GripIcon, ProjectsIcon, SearchIcon, TrashIcon, XIcon } from "@/components/studio/icons";
import { cn } from "@/lib/utils";

export type ProjectRow = {
  id: string;
  title: string;
  slug: string;
  category: string;
  location: string | null;
  status: string;
  heroImage: string | null;
  heroBlur: string | null;
  images: number;
  /** Practice-area label, or null when the project is index-only. */
  area: string | null;
};

/**
 * The portfolio list.
 *
 * Order here is the order on the site, so this list is a real editing
 * surface rather than a report — which is why it drags. The previous
 * version moved one row at a time through a pair of arrows, and each
 * click was a full server round-trip and a re-render: putting a project
 * from the bottom of nineteen to the top was eighteen page loads.
 *
 * Dragging is disabled while a search or filter is active. A reorder is
 * persisted as a complete sequence, and a sequence derived from a
 * filtered view would be a claim about rows that aren't on screen.
 */
export function ProjectList({ projects }: { projects: ProjectRow[] }) {
  const [order, setOrder] = useState(projects);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [saving, startSaving] = useTransition();
  const { toast, confirm } = useFeedback();

  // Server data wins whenever it changes — after a publish toggle, a
  // delete, or another tab's edit.
  useEffect(() => setOrder(projects), [projects]);

  const categories = useMemo(
    () => [...new Set(projects.map((p) => p.category))].sort(),
    [projects],
  );

  const filtering = query.trim() !== "" || category !== "all" || status !== "all";

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return order.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (status !== "all" && p.status !== status) return false;
      if (!q) return true;
      return [p.title, p.category, p.location, p.slug]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(q));
    });
  }, [order, query, category, status]);

  function persist(next: ProjectRow[]) {
    setOrder(next);
    startSaving(async () => {
      try {
        await reorderProjects(next.map((p) => p.id));
        toast("Order saved, the site is already updated.");
      } catch {
        setOrder(projects);
        toast("Couldn't save the new order.", "error");
      }
    });
  }

  return (
    <div>
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-s-text-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
            aria-label="Search projects"
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
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>

        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="PUBLISHED">On site</option>
          <option value="DRAFT">Draft</option>
        </Select>

        {filtering && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery("");
              setCategory("all");
              setStatus("all");
            }}
          >
            Reset
          </Button>
        )}
      </div>

      <p className="mb-2 flex items-center gap-2 text-[0.75rem] text-s-text-3">
        {filtering ? (
          <>
            Showing {visible.length} of {order.length}, clear the filters to reorder.
          </>
        ) : (
          <>
            Drag to reorder. This is the order on the site; the first project is the homepage
            hero.
            {saving && <span className="text-s-accent">Saving…</span>}
          </>
        )}
      </p>

      {visible.length === 0 ? (
        <EmptyState
          icon={<ProjectsIcon className="size-5" />}
          title="Nothing matches those filters"
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setQuery("");
                setCategory("all");
                setStatus("all");
              }}
            >
              Reset filters
            </Button>
          }
        />
      ) : filtering ? (
        <ul className="flex flex-col">
          {visible.map((p) => (
            <li key={p.id}>
              <Row project={p} draggable={false} onDeleted={() => {}} confirm={confirm} toast={toast} />
            </li>
          ))}
        </ul>
      ) : (
        <Reorder.Group axis="y" values={order} onReorder={persist} className="flex flex-col">
          {order.map((p) => (
            <DraggableRow key={p.id} project={p} confirm={confirm} toast={toast} />
          ))}
        </Reorder.Group>
      )}
    </div>
  );
}

type Feedback = ReturnType<typeof useFeedback>;

function DraggableRow({
  project,
  confirm,
  toast,
}: {
  project: ProjectRow;
  confirm: Feedback["confirm"];
  toast: Feedback["toast"];
}) {
  // The whole row is not a drag handle — the row contains links, a
  // select and two buttons, and making it draggable everywhere means
  // every click starts a gesture. Only the grip listens.
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={project}
      dragListener={false}
      dragControls={controls}
      className="rounded-s-sm bg-s-surface"
      whileDrag={{
        scale: 1.005,
        boxShadow: "var(--s-shadow-md)",
        zIndex: 5,
        position: "relative",
      }}
    >
      <Row
        project={project}
        draggable
        onDragStart={(e) => controls.start(e)}
        confirm={confirm}
        toast={toast}
      />
    </Reorder.Item>
  );
}

function Row({
  project: p,
  draggable,
  onDragStart,
  confirm,
  toast,
}: {
  project: ProjectRow;
  draggable: boolean;
  onDragStart?: (e: React.PointerEvent) => void;
  confirm: Feedback["confirm"];
  toast: Feedback["toast"];
  onDeleted?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const live = p.status === "PUBLISHED";

  return (
    <div
      className={cn(
        "group flex items-center gap-3 border-b border-s-border px-2 py-2.5 transition-colors hover:bg-s-surface-2",
        pending && "opacity-55",
      )}
    >
      {draggable ? (
        <button
          type="button"
          onPointerDown={onDragStart}
          aria-label={`Reorder ${p.title}`}
          className="grid size-7 shrink-0 cursor-grab touch-none place-items-center rounded-s-xs text-s-text-3 transition-colors hover:bg-s-surface-3 hover:text-s-text-2 active:cursor-grabbing"
        >
          <GripIcon className="size-4" />
        </button>
      ) : (
        <span className="size-7 shrink-0" aria-hidden />
      )}

      <Link
        href={`/studio/projects/${p.id}`}
        className="relative size-11 shrink-0 overflow-hidden rounded-s-xs bg-s-surface-3"
      >
        {p.heroImage ? (
          <Image
            src={p.heroImage}
            alt=""
            fill
            sizes="44px"
            placeholder={p.heroBlur ? "blur" : "empty"}
            blurDataURL={p.heroBlur ?? undefined}
            className="object-cover"
          />
        ) : (
          <span className="grid size-full place-items-center text-s-text-3">
            <ProjectsIcon className="size-4" />
          </span>
        )}
      </Link>

      <Link href={`/studio/projects/${p.id}`} className="min-w-0 flex-1">
        <span className="block truncate text-[0.8125rem] font-medium text-s-text transition-colors group-hover:text-s-accent">
          {p.title}
        </span>
        <span className="mt-0.5 block truncate text-[0.75rem] text-s-text-3">
          {p.category}
          {!p.area && " · index only"}
          {p.location && ` · ${p.location}`}
          {` · ${p.images} ${p.images === 1 ? "image" : "images"}`}
        </span>
      </Link>

      {p.images === 0 && (
        <Badge tone="warn" className="hidden sm:inline-flex">
          No photos
        </Badge>
      )}

      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              await togglePublish(p.id);
              toast(live ? `${p.title} taken off the site.` : `${p.title} is live.`);
            } catch {
              toast("Couldn't change that.", "error");
            }
          })
        }
        className={cn(
          "shrink-0 rounded-full px-2 py-[3px] text-[0.75rem] font-medium leading-none transition-colors",
          live
            ? "bg-s-good-soft text-s-good hover:bg-s-muted-soft hover:text-s-muted"
            : "bg-s-muted-soft text-s-muted hover:bg-s-good-soft hover:text-s-good",
        )}
        title={live ? "Take off the site" : "Publish to the site"}
      >
        {live ? "On site" : "Draft"}
      </button>

      <div className="flex shrink-0 items-center gap-0.5">
        <Link
          href={`/studio/projects/${p.id}`}
          className="rounded-s-xs px-2 py-1 text-[0.8125rem] text-s-text-2 transition-colors hover:bg-s-surface-3 hover:text-s-text"
        >
          Edit
        </Link>
        <button
          type="button"
          disabled={pending}
          aria-label={`Delete ${p.title}`}
          onClick={async () => {
            const ok = await confirm({
              title: `Delete ${p.title}?`,
              body: "The project, its story and all of its photographs come off the site immediately. This can't be undone.",
              confirmLabel: "Delete project",
              tone: "danger",
            });
            if (!ok) return;
            startTransition(async () => {
              try {
                await deleteProject(p.id);
                toast(`${p.title} deleted.`);
              } catch {
                toast("Couldn't delete that project.", "error");
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
