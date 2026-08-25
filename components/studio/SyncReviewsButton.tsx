"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { syncGoogleReviews, type SyncResult } from "@/actions/studio-testimonials";
import { Button } from "@/components/studio/ui";
import { useFeedback } from "@/components/studio/Feedback";
import { cn } from "@/lib/utils";

/**
 * One-click Google refresh. Pulls the live rating and review count into
 * the site's badge, and lands any new Google reviews as hidden drafts to
 * curate.
 *
 * The outcome goes to a toast *and* stays on the panel. A toast alone is
 * wrong here: the interesting failure is "no API key configured", which
 * is a sentence the studio needs to be able to read twice and forward to
 * whoever manages the Google account.
 */
export function SyncReviewsButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SyncResult | null>(null);
  const { toast } = useFeedback();

  function sync() {
    startTransition(async () => {
      try {
        const r = await syncGoogleReviews();
        setResult(r);
        if (r.ok) {
          router.refresh();
          toast(
            r.added > 0
              ? `${r.added} new ${r.added === 1 ? "review" : "reviews"} added as hidden drafts.`
              : "Up to date, no new reviews.",
          );
        } else {
          toast("Sync didn't run. See the note on the card.", "error");
        }
      } catch {
        setResult({ ok: false, error: "Couldn't reach Google. Check the connection and try again." });
        toast("Couldn't reach Google.", "error");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" onClick={sync} disabled={pending} variant="secondary">
        <span
          aria-hidden
          className={cn(
            "inline-block size-3.5 rounded-full border-[1.5px] border-s-text-3 border-t-transparent",
            pending && "animate-spin",
          )}
        />
        {pending ? "Checking Google…" : "Sync from Google"}
      </Button>
      {result && (
        <p
          role="status"
          className={cn(
            "text-[0.75rem] leading-relaxed",
            result.ok ? "text-s-text-3" : "text-s-bad",
          )}
        >
          {result.ok
            ? `Google says ${result.rating.toFixed(1)} across ${result.count} reviews, badge updated.${
                result.added > 0
                  ? ` ${result.added} new ${result.added === 1 ? "review" : "reviews"} added below as hidden drafts.`
                  : " No new reviews."
              }`
            : result.error}
        </p>
      )}
    </div>
  );
}
