import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The studio's mark, in the two artworks the client approved.
 *
 * Two shapes, because the approved file is a square lockup — a ruled frame
 * around "DMA" with "Architecture + Design" beneath — and that is the
 * wrong object for a navigation bar, where it would stand about thirty
 * pixels tall and the tagline would resolve to grey mush.
 *
 * - `wordmark` is the DMA band cropped out of that lockup. ~2.7:1, so it
 *   reads at nav height. Used in the nav and the email header.
 * - `lockup` is the whole approved artwork. Used in the footer, where
 *   there is room for the tagline to be legible.
 *
 * Both are crops of the approved files rather than redrawings, so a
 * reissued logo only means re-running `scripts/make-brand-assets.ts`.
 *
 * **Theme handling is CSS, not JavaScript.** Both artworks are rendered
 * and cross-faded by opacity under the `.dark` variant. Doing it in JS —
 * reading the resolved theme and picking a `src` — would mean the first
 * paint has no theme yet, so the wrong logo would flash on every load, and
 * the swap would be a hard cut rather than a fade. This costs one extra
 * image request and buys a logo that is correct in the very first frame
 * and cross-fades with the view-transition theme reveal.
 *
 * `onDark` is for grounds that are dark whatever the theme: the footer is
 * `bg-dusk`, and the nav sits over photography until it scrolls. It flips
 * which artwork is shown without changing what is mounted, because the
 * nav toggles it at runtime — swapping the markup instead would remount
 * the image and blink on every scroll past a hero.
 */

const ART = {
  wordmark: {
    light: { src: "/brand/wordmark-light.png", width: 1200, height: 439 },
    dark: { src: "/brand/wordmark-dark.png", width: 1200, height: 438 },
  },
  lockup: {
    light: { src: "/brand/logo-light.png", width: 900, height: 899 },
    dark: { src: "/brand/logo-dark.png", width: 900, height: 893 },
  },
} as const;

type Props = {
  variant?: keyof typeof ART;
  /** Force the white artwork — for dusk, ink or photographic grounds. */
  onDark?: boolean;
  /** Set the height here, e.g. `h-8`; the width follows the aspect ratio. */
  className?: string;
  /**
   * The largest height, in CSS px, the mark is shown at — match it to the
   * `h-*` in className. It is what next/image sizes the download from.
   *
   * Without it the image was declared at the artwork's native 1200px, so
   * srcset offered 1200w/2560w files for an ~90px-wide mark, and with
   * `priority` both theme variants were preloaded at high priority ahead
   * of the hero photograph — the page's LCP element — on every page.
   */
  height?: number;
  /** Only where the mark IS the largest thing above the fold (login). */
  priority?: boolean;
  alt?: string;
};

export function Logo({
  variant = "wordmark",
  onDark = false,
  className,
  height = 32,
  priority = false,
  alt = "Design Matters Architects",
}: Props) {
  const source = ART[variant];
  const scale = height / source.light.height;
  const size = (a: { src: string; width: number; height: number }) => ({
    src: a.src,
    width: Math.round(a.width * scale),
    height: Math.round(a.height * scale),
  });
  const art = { light: size(source.light), dark: size(source.dark) };

  /* `rounded-none` is not decoration: globals.css rounds every <img> by
     `--radius-frame` so dashboard uploads inherit the site's frame without
     component code. A logo is the one image that must not be clipped. */
  const base = "h-full w-auto rounded-none object-contain transition-opacity duration-300";

  return (
    <span className={cn("relative inline-block", className)}>
      <Image
        {...art.light}
        alt={alt}
        priority={priority}
        className={cn(base, onDark ? "opacity-0" : "opacity-100 dark:opacity-0")}
      />
      <Image
        {...art.dark}
        alt=""
        aria-hidden
        priority={priority}
        className={cn(
          base,
          "absolute inset-0",
          onDark ? "opacity-100" : "opacity-0 dark:opacity-100",
        )}
      />
    </span>
  );
}
