"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { LinkProgress } from "@/components/studio/NavProgress";
import {
  AnalyticsIcon,
  ContentIcon,
  EnquiriesIcon,
  ExternalIcon,
  MailIcon,
  MenuIcon,
  MoonIcon,
  OverviewIcon,
  ProjectsIcon,
  StudioIcon,
  SunIcon,
  TestimonialsIcon,
  XIcon,
} from "@/components/studio/icons";

/**
 * The studio rail.
 *
 * Journal stays routable for the studio's own use, but the client's
 * discovery form said no to managing a blog from here — so no nav slot.
 */
const GROUPS = [
  {
    label: null,
    links: [{ href: "/studio/dashboard", label: "Overview", Icon: OverviewIcon }],
  },
  {
    label: "The site",
    links: [
      { href: "/studio/projects", label: "Projects", Icon: ProjectsIcon },
      { href: "/studio/testimonials", label: "Testimonials", Icon: TestimonialsIcon },
      { href: "/studio/content", label: "Content", Icon: ContentIcon },
      { href: "/studio/content/identity", label: "Studio details", Icon: StudioIcon },
    ],
  },
  {
    label: "Business",
    links: [
      { href: "/studio/leads", label: "Enquiries", Icon: EnquiriesIcon },
      { href: "/studio/alerts", label: "Email alerts", Icon: MailIcon },
      { href: "/studio/analytics", label: "Analytics", Icon: AnalyticsIcon },
    ],
  },
] as const;

/** Flattened for the topbar's page title. Longest match wins. */
const TITLES: [string, string][] = [
  ["/studio/dashboard", "Overview"],
  ["/studio/projects/new", "New project"],
  ["/studio/projects", "Projects"],
  ["/studio/testimonials/new", "New testimonial"],
  ["/studio/testimonials", "Testimonials"],
  ["/studio/content/identity", "Studio details"],
  ["/studio/content", "Content"],
  ["/studio/leads", "Enquiries"],
  ["/studio/alerts", "Email alerts"],
  ["/studio/analytics", "Analytics"],
  ["/studio/journal", "Journal"],
];

export function titleFor(pathname: string) {
  const hit = [...TITLES]
    .sort((a, b) => b[0].length - a[0].length)
    .find(([href]) => pathname.startsWith(href));
  return hit?.[1] ?? "Studio";
}

/**
 * Two rows share the /studio/content prefix — the hub and the studio
 * details form that lives under it — so a plain `startsWith` lights both.
 * Anything with children of its own is matched exactly.
 */
function useIsActive() {
  const pathname = usePathname();
  return (href: string) => {
    if (href === "/studio/content" || href === "/studio/content/identity") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };
}

function NavRow({
  href,
  label,
  Icon,
  active,
  badge,
  onNavigate,
}: {
  href: string;
  label: string;
  Icon: (p: { className?: string }) => React.ReactElement;
  active: boolean;
  badge?: number;
  onNavigate?: () => void;
}) {
  const reduce = useReducedMotion();

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-s-sm px-2.5 py-[7px] text-[0.8125rem] transition-colors duration-150",
        active ? "font-medium text-s-text" : "text-s-text-2 hover:text-s-text",
      )}
    >
      {/* One shared element slides between rows, so changing screen reads
          as a single movement rather than two unrelated fades. */}
      {active && (
        <motion.span
          layoutId="studio-nav-active"
          className="absolute inset-0 rounded-s-sm bg-s-accent-soft"
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 460, damping: 40 }}
        />
      )}
      {!active && (
        <span className="absolute inset-0 rounded-s-sm bg-transparent transition-colors group-hover:bg-s-surface-3" />
      )}

      <Icon
        className={cn(
          "relative size-[17px] shrink-0 transition-colors",
          active ? "text-s-accent" : "text-s-text-3 group-hover:text-s-text-2",
        )}
      />
      <span className="relative truncate">{label}</span>

      {badge ? (
        <span className="relative ml-auto min-w-[18px] rounded-full bg-s-accent px-1.5 py-[2px] text-center text-[0.6875rem] font-semibold leading-none text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}

      <LinkProgress />
    </Link>
  );
}

function ThemeButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const dark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="flex w-full items-center gap-2.5 rounded-s-sm px-2.5 py-[7px] text-[0.8125rem] text-s-text-2 transition-colors hover:bg-s-surface-3 hover:text-s-text"
      // Until the stored theme is known the label would be a guess, and a
      // control that renames itself on hydration is worse than one that
      // waits a frame.
      aria-label={mounted ? (dark ? "Switch to light" : "Switch to dark") : "Toggle theme"}
    >
      <span className="grid size-[17px] shrink-0 place-items-center text-s-text-3">
        {mounted && dark ? <MoonIcon className="size-[17px]" /> : <SunIcon className="size-[17px]" />}
      </span>
      {mounted ? (dark ? "Dark" : "Light") : "Theme"}
    </button>
  );
}

function RailContent({
  newLeads,
  email,
  onNavigate,
  logout,
}: {
  newLeads: number;
  email: string;
  onNavigate?: () => void;
  logout: React.ReactNode;
}) {
  const isActive = useIsActive();

  return (
    <>
      <Link
        href="/studio/dashboard"
        onClick={onNavigate}
        className="group mb-6 flex items-center gap-2.5 px-2.5"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-s-sm bg-s-solid text-[0.6875rem] font-semibold tracking-wide text-s-on-solid transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-rotate-6">
          DM
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-[0.8125rem] font-semibold tracking-[-0.01em] text-s-text">
            Design Matters
          </span>
          <span className="block truncate text-[0.6875rem] text-s-text-3">Studio</span>
        </span>
      </Link>

      <nav aria-label="Studio" className="flex flex-col gap-5">
        {GROUPS.map((group, gi) => (
          <div key={gi} className="flex flex-col gap-0.5">
            {group.label && <p className="s-label mb-1.5 px-2.5">{group.label}</p>}
            {group.links.map((link) => (
              <NavRow
                key={link.href}
                {...link}
                active={isActive(link.href)}
                badge={link.href === "/studio/leads" ? newLeads : undefined}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-0.5 border-t border-s-border pt-3">
        <p className="truncate px-2.5 pb-1.5 text-[0.75rem] text-s-text-3" title={email}>
          {email}
        </p>
        <ThemeButton />
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 rounded-s-sm px-2.5 py-[7px] text-[0.8125rem] text-s-text-2 transition-colors hover:bg-s-surface-3 hover:text-s-text"
        >
          <ExternalIcon className="size-[17px] shrink-0 text-s-text-3" />
          View site
        </a>
        {logout}
      </div>
    </>
  );
}

/**
 * Desktop rail plus the mobile drawer.
 *
 * The client works on desktop — that is what the discovery form said — so
 * the rail is the real design and the drawer is a courtesy. It is a
 * courtesy that has to work, though: an architect checking an enquiry on
 * a phone between site visits is the single most likely mobile session.
 */
export function StudioNav({
  newLeads = 0,
  email,
  logout,
}: {
  newLeads?: number;
  email: string;
  logout: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const reduce = useReducedMotion();

  // Any route change closes the drawer. Covers the back button too, which
  // an onClick on each link would miss.
  useEffect(() => setOpen(false), [pathname]);

  // While the drawer is open the page behind it must not scroll, and
  // Escape must close it.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-s-border bg-s-surface px-3 py-5 lg:flex lg:w-[236px]">
        <RailContent newLeads={newLeads} email={email} logout={logout} />
      </aside>

      {/* Mobile trigger, lives in the topbar's left slot */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="grid size-9 place-items-center rounded-s-sm text-s-text-2 transition-colors hover:bg-s-surface-3 hover:text-s-text lg:hidden"
      >
        <MenuIcon className="size-5" />
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[75] lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-black/40"
            />
            <motion.aside
              role="dialog"
              aria-label="Studio menu"
              initial={reduce ? { opacity: 0 } : { x: "-100%" }}
              animate={reduce ? { opacity: 1 } : { x: 0 }}
              exit={reduce ? { opacity: 0 } : { x: "-100%" }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
              className="absolute inset-y-0 left-0 flex w-[268px] max-w-[85vw] flex-col overflow-y-auto border-r border-s-border bg-s-surface px-3 py-5 shadow-s-lg"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="absolute right-3 top-4 grid size-8 place-items-center rounded-s-sm text-s-text-3 transition-colors hover:bg-s-surface-3 hover:text-s-text"
              >
                <XIcon className="size-4" />
              </button>
              <RailContent
                newLeads={newLeads}
                email={email}
                logout={logout}
                onNavigate={() => setOpen(false)}
              />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

/** The topbar's page title, derived from the route. */
export function StudioTitle() {
  const pathname = usePathname();
  return (
    <span className="truncate text-[0.9375rem] font-semibold tracking-[-0.01em] text-s-text">
      {titleFor(pathname)}
    </span>
  );
}
