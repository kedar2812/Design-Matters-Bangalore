"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { navLinks } from "@/lib/site";
import { CATEGORY_SLUGS, type CategorySlug } from "@/lib/categories";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";

const EASE = [0.76, 0, 0.24, 1] as const;

/** Routes that open on a full-bleed photographic hero — the nav needs
 *  light text there until the page scrolls and the pill arrives.
 *
 *  This only decides the *colour* of the resting state; every route gets
 *  the resting state itself. Project *detail* pages qualify; the
 *  practice-area pages do not — they open on the bone canvas, where
 *  cream nav text would vanish. */
function hasImageHero(pathname: string) {
  if (pathname === "/") return true;
  if (!pathname.startsWith("/projects/")) return false;
  const slug = pathname.slice("/projects/".length);
  return slug.length > 0 && !CATEGORY_SLUGS.includes(slug as CategorySlug);
}

const linkBase =
  "group/link relative block font-mono text-[0.8125rem] font-medium uppercase tracking-[0.08em] transition-colors duration-300";

/** Animated underline that sweeps in on hover and stays for the active link. */
function Underline({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute -bottom-1.5 left-0 h-px w-full origin-left bg-current transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        active ? "scale-x-100" : "scale-x-0 group-hover/link:scale-x-100",
      )}
    />
  );
}

/**
 * The label itself, which rolls on hover: the word lifts out of the top
 * of its own box while a copy rises into the space it left.
 *
 * This is the same idea as the page headlines, which mask up out of a
 * clipped line on entry — so the nav is speaking the site's existing
 * language rather than wearing a new effect. The duplicate is hidden
 * from assistive tech; under reduced motion it is not rendered at all
 * and the label simply changes colour.
 */
function NavLabel({ children }: { children: string }) {
  // The box is clamped to exactly one line so the stacked copy sits
  // below the fold of its own container; both then travel up together.
  const line =
    "motion-safe:group-hover/link:-translate-y-full block leading-[1.35] transition-transform duration-[450ms] ease-[cubic-bezier(0.76,0,0.24,1)]";
  return (
    <span className="block h-[1.35em] overflow-hidden">
      <span className={line}>{children}</span>
      <span aria-hidden className={cn(line, "motion-reduce:hidden")}>
        {children}
      </span>
    </span>
  );
}

/**
 * The Projects quick-links panel — the three practice areas, each with
 * the studio's own one-line description. Opens on hover and on keyboard
 * focus; closes on Escape, on route change, and when focus leaves.
 */
function CategoryMenu({
  open,
  links,
  pathname,
  reduce,
  onBlurOut,
}: {
  open: boolean;
  links: CategoryLink[];
  pathname: string;
  reduce: boolean;
  onBlurOut: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: EASE }}
          // Sits just under the pill; the padded top keeps a hoverable
          // bridge so the pointer can travel without closing it.
          className="absolute left-1/2 top-full z-50 w-[21rem] -translate-x-1/2 pt-4"
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) onBlurOut();
          }}
        >
          {/* Near-opaque rather than the nav's glass: this panel often
              opens over full-bleed photography, where 60% translucency
              left the type unreadable. */}
          <div className="overflow-hidden rounded-2xl border border-hairline bg-paper/[0.97] p-2 shadow-xl shadow-noir/15 backdrop-blur-xl">
            <ul>
              {links.map(({ href, label, tagline, numeral }) => {
                const active = pathname === href;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group/item flex items-start gap-3 rounded-xl px-3 py-3 transition-colors",
                        active ? "bg-ink/[0.06]" : "hover:bg-ink/[0.04]",
                      )}
                    >
                      <span className="mono-label mt-0.5 shrink-0 text-brass">
                        {numeral}
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "font-display text-base leading-none transition-colors",
                              active ? "text-brass" : "text-ink group-hover/item:text-brass",
                            )}
                          >
                            {label}
                          </span>
                          <span
                            aria-hidden
                            className="text-xs text-brass opacity-0 transition-all duration-300 group-hover/item:translate-x-0.5 group-hover/item:opacity-100"
                          >
                            &rarr;
                          </span>
                        </span>
                        <span className="mt-1 block text-xs leading-snug text-stone">
                          {tagline}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <Link
              href="/projects"
              className="mono-label mt-1 block border-t border-hairline px-3 pb-1 pt-3 transition-colors hover:text-brass"
            >
              All projects &rarr;
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Site nav, in two states on every route: at rest it lies transparent
 * across the top of the page, and the moment the visitor starts
 * scrolling it condenses into a floating glass pill that follows the
 * theme. Mobile gets the same pill with a drop-down panel.
 */
export type CategoryLink = {
  href: string;
  label: string;
  tagline: string;
  numeral: string;
};

export function Nav({
  shortName,
  categoryLinks = [],
}: {
  shortName: string;
  categoryLinks?: CategoryLink[];
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false); // Projects quick-links panel
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduce = useReducedMotion();

  // Pointer leaves fire between the trigger and the panel; a short grace
  // period keeps the menu from flickering shut in the gap.
  const openMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMenu(true);
  };
  const closeMenu = (delay = 120) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMenu(false), delay);
  };
  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close both menus on route change — and re-read the scroll position.
  // ScrollToTop (root layout, so its effect has already run) has put the
  // new page back at the top; without this the pill would linger from
  // the page we left until the visitor scrolled again.
  useEffect(() => {
    setOpen(false);
    setMenu(false);
    setScrolled(window.scrollY > 24);
  }, [pathname]);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  // The resting state: at the top of any page, with nothing open. Opening
  // the mobile panel summons the pill early — the links need a surface.
  const atRest = !scrolled && !open;
  const overHero = atRest && hasImageHero(pathname);
  /**
   * Contact appears twice on purpose.
   *
   * The "Start a project" pill already goes to /contact and is the one
   * action the client wants visitors to take — but it is phrased as an
   * invitation, not as a label, and somebody scanning a nav bar for the
   * word "Contact" does not find it. The two serve different readers: the
   * pill catches the person who has decided, the link catches the person
   * looking for a phone number.
   */
  const links = navLinks;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={cn(
          "relative transition-[margin,padding] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          atRest ? "mx-0 mt-0 px-gutter py-4" : "mx-3 mt-3 px-5 py-3 sm:mx-4",
        )}
      >
        {/* The pill is a layer of its own rather than a background on the
            bar, so it can fade and settle into presence on first scroll
            instead of snapping on with the padding. */}
        <div
          aria-hidden
          className={cn(
            "glass-light pointer-events-none absolute inset-0 rounded-2xl border border-hairline shadow-lg shadow-noir/5 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
            atRest
              ? "-translate-y-2 scale-[0.98] opacity-0"
              : "translate-y-0 scale-100 opacity-100",
          )}
        />

        <nav
          aria-label="Main"
          className="relative flex items-center justify-between"
        >
          <Link href="/" className="group flex shrink-0 items-baseline gap-3 whitespace-nowrap">
            <span
              className={cn(
                "font-display text-xl tracking-tight transition-colors duration-300",
                overHero && "text-cream",
              )}
            >
              {shortName}
            </span>
            <span
              className={cn(
                // Six links, a toggle and a CTA fill the row at the 1024px end of
                // `lg`. The tagline is the one thing here that carries no
                // navigation, so it is what steps aside until there is room.
                "font-mono text-[0.6875rem] uppercase tracking-[0.08em] hidden transition-colors duration-300 sm:inline lg:hidden xl:inline",
                overHero
                  ? "text-cream/80 group-hover:text-cream"
                  : "text-stone group-hover:text-brass",
              )}
            >
              Architects · BLR
            </span>
          </Link>

          {/* Desktop links */}
          <ul className="hidden items-center gap-4 lg:flex xl:gap-6">
            {links.map(({ href, label }) => {
              const active = pathname.startsWith(href);
              const hasMenu = href === "/projects" && categoryLinks.length > 0;

              return (
                <li
                  key={href}
                  className={hasMenu ? "relative" : undefined}
                  onPointerEnter={hasMenu ? openMenu : undefined}
                  onPointerLeave={hasMenu ? () => closeMenu() : undefined}
                >
                  <Link
                    href={href}
                    className={cn(
                      linkBase,
                      overHero
                        ? "text-cream/85 hover:text-cream"
                        : "text-ink/70 hover:text-brass",
                      active && (overHero ? "text-cream" : "text-brass"),
                    )}
                    aria-current={active ? "page" : undefined}
                    aria-expanded={hasMenu ? menu : undefined}
                    onFocus={hasMenu ? openMenu : undefined}
                  >
                    <NavLabel>{label}</NavLabel>
                    <Underline active={active} />
                  </Link>

                  {hasMenu && (
                    <CategoryMenu
                      open={menu}
                      links={categoryLinks}
                      pathname={pathname}
                      reduce={Boolean(reduce)}
                      onBlurOut={() => closeMenu(0)}
                    />
                  )}
                </li>
              );
            })}
            <li>
              <ThemeToggle />
            </li>
            {/* The one thing the client wants visitors to do: enquire. */}
            <li>
              <Link
                href="/contact"
                className={cn(
                  "font-mono text-[0.8125rem] font-medium uppercase tracking-[0.08em] whitespace-nowrap rounded-full px-4 py-2.5 transition-all duration-300 hover:-translate-y-px xl:px-5",
                  overHero
                    ? "border border-cream/50 text-cream hover:border-cream hover:bg-cream/10"
                    : "bg-ink text-bone shadow-sm shadow-noir/10 hover:bg-brass hover:shadow-md hover:shadow-brass/25",
                )}
              >
                Start a project
              </Link>
            </li>
          </ul>

          {/* Mobile: toggle + menu button */}
          <div className="flex items-center gap-3 lg:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              className={cn(
                "font-mono text-[0.8125rem] font-medium uppercase tracking-[0.08em] transition-colors duration-300",
                overHero ? "text-cream" : "text-ink",
              )}
            >
              {open ? "Close" : "Menu"}
            </button>
          </div>
        </nav>

        {/* Mobile menu, folds out of the pill */}
        <AnimatePresence>
          {open && (
            <motion.div
              id="mobile-menu"
              initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="relative overflow-hidden lg:hidden"
            >
              <ul className="flex flex-col pt-4">
                {links.map(({ href, label }, i) => (
                  <motion.li
                    key={href}
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.3, ease: EASE }}
                    className="border-b border-hairline"
                  >
                    <Link href={href} className="font-display block py-4 text-h3">
                      {label}
                    </Link>

                    {/* Practice areas ride along under Projects, no
                        disclosure to tap, since the whole panel is
                        already a deliberate open. */}
                    {href === "/projects" && categoryLinks.length > 0 && (
                      <ul className="-mt-1 pb-4 pl-4">
                        {categoryLinks.map(({ href: h, label: l, numeral }) => (
                          <li key={h}>
                            <Link
                              href={h}
                              aria-current={pathname === h ? "page" : undefined}
                              className={cn(
                                "flex items-center gap-3 py-2 text-sm transition-colors",
                                pathname === h ? "text-brass" : "text-stone hover:text-ink",
                              )}
                            >
                              <span className="mono-label text-brass">{numeral}</span>
                              {l}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.li>
                ))}
                <motion.li
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * links.length, duration: 0.3, ease: EASE }}
                >
                  <Link
                    href="/contact"
                    className="font-display block py-4 text-h3 text-brass"
                  >
                    Start a project
                  </Link>
                </motion.li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
