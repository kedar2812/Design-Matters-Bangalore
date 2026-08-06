"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Every route opens at the top.
 *
 * Next already resets the scroll position on navigation — but Lenis
 * undoes it. If a link is clicked while the smooth scroll is still
 * gliding (`isScrolling === "smooth"`), Lenis ignores the native scroll
 * Next just performed and, on its next frame, writes its own stale
 * offset back — clamped to the new, usually shorter document. That is
 * why pages intermittently opened halfway down, or pinned to the very
 * bottom.
 *
 * So after every forward navigation we put Lenis itself at the top,
 * which also cancels the in-flight animation. Back/forward is left
 * alone apart from a resync, so the position the browser restores
 * survives — returning to a projects grid should land where you left
 * it, not at the top.
 *
 * Mounted in the root layout: the studio has no Lenis, but it wants the
 * same guarantee, and the Lenis half is opportunistic.
 */
export function ScrollToTop() {
  const pathname = usePathname();

  // Path the browser landed on via back/forward, so the effect below can
  // tell a restored entry from a fresh click. It is deliberately left set
  // when a pop does not change the route: a later click to a different
  // path simply won't match it.
  const popped = useRef<string | null>(null);
  // The first load is the browser's to place — reloading halfway down a
  // page should stay halfway down.
  const mounted = useRef(false);

  useEffect(() => {
    const onPop = () => {
      popped.current = window.location.pathname;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Clicking the link for the page you are already on is a navigation the
  // effect below never sees — the pathname doesn't change — but Lenis
  // momentum can still drag the page back down after Next scrolls it up.
  // Returning to the top is what that click means anyway, so do it here.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target;
      const a = target instanceof Element ? target.closest("a") : null;
      if (!(a instanceof HTMLAnchorElement)) return;
      if (a.target === "_blank" || a.hasAttribute("download")) return;

      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.hash) return;
      if (url.pathname !== window.location.pathname) return;

      window.__lenis?.scrollTo(0, { immediate: true, force: true });
      window.scrollTo(0, 0);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    const restored = popped.current === pathname;
    popped.current = null;

    if (!mounted.current) {
      mounted.current = true;
      return;
    }

    if (restored) {
      // Adopt whatever the browser restored, once it has settled, and drop
      // the momentum carried over from the page we came from. `force`
      // because an open lightbox leaves Lenis stopped.
      const id = requestAnimationFrame(() => {
        window.__lenis?.scrollTo(window.scrollY, {
          immediate: true,
          force: true,
        });
      });
      return () => cancelAnimationFrame(id);
    }

    // An anchored link is Next's to handle — it scrolls to the element.
    if (window.location.hash) return;

    window.__lenis?.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
