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

/** Routes that open on a full-bleed photographic hero — the nav sits
 *  over the image there and needs light text until the page scrolls.
 *
 *  Project *detail* pages qualify; the practice-area pages do not —
 *  they open on the bone canvas, where cream nav text would vanish. */
function hasImageHero(pathname: string) {
  if (pathname === "/") return true;
  if (!pathname.startsWith("/projects/")) return false;
  const slug = pathname.slice("/projects/".length);
  return slug.length > 0 && !CATEGORY_SLUGS.includes(slug as CategorySlug);
}

const linkBase =
  "group/link relative font-mono text-[0.8125rem] uppercase tracking-[0.08em] transition-colors duration-300";

/** Animated underline that sweeps in on hover and stays for the active link. */
function Underline({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute -bottom-1 left-0 h-px w-full origin-left bg-current transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        active ? "scale-x-100" : "scale-x-0 group-hover/link:scale-x-100",
      )}
    />
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
 * Site nav. Over photographic heroes it lies transparent across the
 * image; everywhere else it condenses into a floating glass pill that
 * follows the theme. Mobile gets the same pill with a drop-down panel.
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

  // Close both menus on route change.
  useEffect(() => {
    setOpen(false);
    setMenu(false);
  }, [pathname]);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  const overHero = hasImageHero(pathname) && !scrolled && !open;
  const links = navLinks.filter(({ href }) => href !== "/contact");

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={cn(
          "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          overHero
            ? "mx-0 mt-0 border-b border-transparent px-gutter py-4"
            : "glass-light mx-3 mt-3 rounded-2xl border border-hairline px-5 py-3 shadow-lg shadow-noir/5 sm:mx-4",
        )}
      >
        <nav aria-label="Main" className="flex items-center justify-between">
          <Link href="/" className="group flex items-baseline gap-3">
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
                "font-mono text-[0.6875rem] uppercase tracking-[0.08em] hidden transition-colors duration-300 sm:inline",
                overHero
                  ? "text-cream/80 group-hover:text-cream"
                  : "text-stone group-hover:text-brass",
              )}
            >
              Architects — BLR
            </span>
          </Link>

          {/* Desktop links */}
          <ul className="hidden items-center gap-7 md:flex">
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
                        ? "text-cream/90 hover:text-cream"
                        : "text-stone hover:text-ink",
                      active && (overHero ? "text-cream" : "text-brass"),
                    )}
                    aria-current={active ? "page" : undefined}
                    aria-expanded={hasMenu ? menu : undefined}
                    onFocus={hasMenu ? openMenu : undefined}
                  >
                    {label}
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
                  "font-mono text-[0.8125rem] uppercase tracking-[0.08em] rounded-full px-5 py-2.5 transition-all duration-300",
                  overHero
                    ? "border border-cream/50 text-cream hover:border-cream hover:bg-cream/10"
                    : "bg-ink text-bone hover:bg-brass",
                )}
              >
                Start a project
              </Link>
            </li>
          </ul>

          {/* Mobile: toggle + menu button */}
          <div className="flex items-center gap-3 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              className={cn(
                "font-mono text-[0.8125rem] uppercase tracking-[0.08em] transition-colors duration-300",
                overHero ? "text-cream" : "text-ink",
              )}
            >
              {open ? "Close" : "Menu"}
            </button>
          </div>
        </nav>

        {/* Mobile menu — folds out of the pill */}
        <AnimatePresence>
          {open && (
            <motion.div
              id="mobile-menu"
              initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="overflow-hidden md:hidden"
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

                    {/* Practice areas ride along under Projects — no
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
