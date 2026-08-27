/**
 * Enquiry pipeline stages, in order. Plain module (no "use client")
 * so both server pages and client components can import real values —
 * non-component exports from a client module become client-reference
 * proxies when imported by a server component.
 */
export const STAGES = [
  ["NEW", "New enquiry"],
  ["CONTACTED", "Contacted"],
  ["DISCUSSION", "In discussion"],
  ["WON", "Won"],
  ["LOST", "Lost"],
] as const;

/**
 * Timeline dot colours for enquiry history, on the studio's tone tokens.
 *
 * Here rather than beside `record()` in `lib/lead-events` for the reason
 * this module exists at all: that file imports the database, and the
 * timeline is rendered by a client component. Importing the two together
 * pulled the Prisma runtime into the browser bundle and failed the build
 * outright — `node:module` has nowhere to resolve to on the client.
 */
export const EVENT_TONE: Record<string, "accent" | "info" | "good" | "bad" | "neutral"> = {
  RECEIVED: "accent",
  NOTIFIED: "good",
  NOTIFY_FAILED: "bad",
  NOTIFY_SKIPPED: "neutral",
  ACKNOWLEDGED: "info",
  STATUS_CHANGED: "info",
  NOTED: "neutral",
  EMAIL_ACTION: "info",
};
