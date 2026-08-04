/**
 * Re-encode quality per image role.
 *
 * next/image defaults to 75. That is fine for a thumbnail, but this site
 * is almost entirely full-bleed architectural photography — large flat
 * fields of sky, plaster and concrete — and 75 bands and smears them
 * visibly on a wide desktop screen. The source files are already
 * compressed once (0.05–0.15 bpp on disk), so the optimiser's pass is a
 * second generation of loss on top.
 *
 * These are the tiers, biggest surface gets the most bits:
 */
export const IMG_Q = {
  /** Full-bleed heroes — the first thing anyone judges the site by. */
  hero: 90,
  /** Gallery frames and story images shown at half-width or larger. */
  feature: 85,
  /** Cards, grids and thumbnails. */
  card: 82,
  /**
   * Documentary photography — team outings, office parties, candids.
   *
   * These are phone snapshots of groups of people, not the portfolio, and
   * nobody inspects the render of a leaf behind somebody's head. That is
   * worth separating out, because the numbers above buy nothing here: at
   * the width these are shown, AVIF q70 and q85 are indistinguishable at
   * 1:1, and q85 costs 29% more bytes across the six on the About page.
   *
   * Do not reach for this tier for anything the studio designed.
   */
  candid: 70,
} as const;

/**
 * `sizes` values for slots whose image is scaled up by a CSS transform.
 *
 * A `scale-110` frame paints 110% of its layout box, so the browser must
 * be asked for 10% more pixels than the slot implies — otherwise it picks
 * a candidate a notch too small and the result looks soft for a reason
 * that never shows up in the markup.
 */
export const SIZES = {
  /** Home hero: full bleed, drifting to scale(1.07). */
  heroCarousel: "107vw",
  /** Project hero: full bleed, no transform. */
  hero: "100vw",
  /** Project story image: 60vw slot inside a scale-110 parallax frame. */
  storyScaled: "(min-width: 768px) 66vw, 110vw",
  /** Project gallery, half-width cell inside a scale-110 parallax frame. */
  galleryScaled: "(min-width: 768px) 55vw, 110vw",
  /** Project gallery, full-width cell inside a scale-110 parallax frame. */
  galleryWideScaled: "110vw",
} as const;
