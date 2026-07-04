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
