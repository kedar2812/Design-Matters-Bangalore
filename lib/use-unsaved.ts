"use client";

import { useEffect } from "react";

/**
 * Warn before leaving a form with unsaved edits.
 *
 * The project form is long — a dozen fields, three story blocks and a
 * gallery — and none of it was protected. Clicking a nav link threw the
 * lot away silently, which is the kind of thing that only gets noticed
 * after it has cost somebody an afternoon.
 *
 * `beforeunload` covers reloads, tab closes and links out of the app. It
 * cannot cover client-side navigation inside the App Router: React
 * intercepts those before any browser event fires, and Next exposes no
 * cancellable route-change hook. So this also captures clicks on internal
 * links during the capture phase, which is where a same-document
 * navigation can still be stopped.
 *
 * Deliberately not a router shim: intercepting `router.push` would catch
 * programmatic navigation too, including the redirect the form itself
 * performs on a successful save.
 */
export function useUnsavedChanges(dirty: boolean, message = "You have unsaved changes.") {
  useEffect(() => {
    if (!dirty) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Browsers ignore custom text now and show their own wording, but
      // returnValue still has to be set for the prompt to appear at all.
      e.returnValue = message;
    };

    const onClick = (e: MouseEvent) => {
      // Let modified clicks through — they open a new tab and leave this
      // document, and its unsaved state, exactly where it is.
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
        return;
      }
      const link = (e.target as HTMLElement | null)?.closest("a");
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (link.target && link.target !== "_self") return;

      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;

      if (!window.confirm(`${message}\n\nLeave this page and lose them?`)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty, message]);
}
