"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * First-party, privacy-friendly page-view beacon. No cookies, no
 * fingerprinting, no third-party script — one POST per navigation
 * to our own /api/collect.
 */
export function Beacon() {
  const pathname = usePathname();

  useEffect(() => {
    const payload = JSON.stringify({
      path: pathname,
      referrer: document.referrer || null,
      source: new URLSearchParams(window.location.search).get("utm_source"),
    });
    try {
      navigator.sendBeacon(
        "/api/collect",
        new Blob([payload], { type: "application/json" }),
      );
    } catch {
      /* analytics must never break the page */
    }
  }, [pathname]);

  return null;
}
