"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { navLinks, site } from "@/lib/site";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";

const EASE = [0.76, 0, 0.24, 1] as const;

/** Routes that open on a full-bleed photographic hero — the nav sits
 *  over the image there and needs light text until the page scrolls. */
function hasImageHero(pathname: string) {
  return (
    pathname === "/" ||
    (pathname.startsWith("/projects/") && pathname !== "/projects")
  );
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
 * Site nav. Over photographic heroes it lies transparent across the
 * image; everywhere else it condenses into a floating glass pill that
 * follows the theme. Mobile gets the same pill with a drop-down panel.
 */
export function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the menu on route change.
  useEffect(() => setOpen(false), [pathname]);

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
              {site.shortName}
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
              return (
                <li key={href}>
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
                  >
                    {label}
                    <Underline active={active} />
                  </Link>
                </li>
              );
            })}
            <li>
              <ThemeToggle
                className={cn(
                  overHero
                    ? "border-cream/40 text-cream hover:border-cream"
                    : "border-hairline text-stone hover:border-brass hover:text-brass",
                )}
              />
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
            <ThemeToggle
              className={cn(
                overHero
                  ? "border-cream/40 text-cream"
                  : "border-hairline text-stone",
              )}
            />
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
