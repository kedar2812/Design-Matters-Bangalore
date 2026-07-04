/**
 * Client-bundle module state: false during SSR and the very first
 * mount of a page load, true after the first route completes.
 * Lets motion components choose a pre-hydration-safe variant on
 * first paint and full choreography on client-side navigations.
 */
export const nav = { visited: false };
