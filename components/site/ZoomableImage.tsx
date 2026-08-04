"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { animate, motion, useMotionValue } from "framer-motion";

/**
 * The zoom surface inside the lightbox.
 *
 * Everything here is driven by pointer events rather than separate mouse
 * and touch paths, so a trackpad, a mouse, a stylus and two fingers all
 * run the same code. The gestures:
 *
 *   pinch            two pointers, anchored on the midpoint between them
 *   double tap/click toggles between fit and 2.5x, anchored on the tap
 *   wheel            zooms about the cursor (trackpad pinch arrives here
 *                    as ctrl+wheel, which is handled identically)
 *   drag             pans once zoomed in; swipes between photos when not
 *
 * Scale and offset are framer motion values, not React state. They write
 * straight to the compositor without re-rendering, which is the whole
 * reason a pinch can track your fingers instead of lagging a frame or
 * three behind them. React only hears about zoom crossing 1x, because
 * that is the one thing the surrounding chrome cares about.
 *
 * Panning is clamped to the *painted* image, not to the container. With
 * `object-contain` those differ by the letterboxing, and clamping to the
 * container lets a wide photo be dragged into its own empty margin —
 * which feels broken in a way that is hard to name but easy to notice.
 */

const MIN = 1;
const MAX = 5;
const DOUBLE_TAP = 2.5;
/** Feels like weight without feeling slow. */
const SPRING = { type: "spring" as const, stiffness: 320, damping: 34, mass: 0.7 };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** What the lightbox chrome can drive from its own buttons. */
export type ZoomControls = {
  zoomBy: (factor: number) => void;
  reset: () => void;
};

type Props = {
  src: string;
  alt: string;
  blur?: string | null;
  reduce: boolean;
  /** Fired when zoom crosses in or out of 1x. */
  onZoomChange?: (zoomed: boolean) => void;
  /** Horizontal flick while at 1x — only wired when there is more than one photo. */
  onSwipe?: (dir: 1 | -1) => void;
};

export const ZoomableImage = forwardRef<ZoomControls, Props>(function ZoomableImage(
  { src, alt, blur, reduce, onZoomChange, onSwipe },
  ref,
) {
  const scale = useMotionValue(1);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const surface = useRef<HTMLDivElement>(null);
  /** The painted image box and the container it sits in. */
  const box = useRef({ w: 0, h: 0, cw: 0, ch: 0 });
  /** Live pointers, keyed by pointerId. */
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  /** Snapshot taken when a pinch begins. */
  const pinch = useRef({ dist: 0, scale: 1, x: 0, y: 0, px: 0, py: 0 });
  const pan = useRef({ x: 0, y: 0, moved: 0 });
  const lastTap = useRef({ t: 0, x: 0, y: 0 });
  const zoomed = useRef(false);
  /**
   * Opening the viewer fetches a photo sized for the viewport, which is
   * right until somebody zooms — then they are magnifying a file with no
   * more detail in it than the screen already showed. The first zoom
   * asks for a much larger candidate; the browser keeps painting the one
   * it has until the new file lands, so nothing blinks. One-way: there is
   * no reason to go back down once it has been paid for.
   */
  const [hiRes, setHiRes] = useState(false);

  const measure = useCallback((el: HTMLImageElement) => {
    const host = surface.current;
    if (!host || !el.naturalWidth) return;
    const cw = host.clientWidth;
    const ch = host.clientHeight;
    const ar = el.naturalWidth / el.naturalHeight;
    let w = cw;
    let h = cw / ar;
    if (h > ch) {
      h = ch;
      w = ch * ar;
    }
    box.current = { w, h, cw, ch };
  }, []);

  /** How far the image may travel before its edge crosses the frame. */
  const limits = useCallback((s: number) => {
    const { w, h, cw, ch } = box.current;
    return {
      mx: Math.max(0, (w * s - cw) / 2),
      my: Math.max(0, (h * s - ch) / 2),
    };
  }, []);

  const report = useCallback(
    (s: number) => {
      const next = s > 1.01;
      if (next && !hiRes) setHiRes(true);
      if (next !== zoomed.current) {
        zoomed.current = next;
        onZoomChange?.(next);
      }
    },
    [onZoomChange, hiRes],
  );

  /**
   * Scale to `next` while pinning the content under (px, py) in place.
   * Coordinates are relative to the container's centre, which is where
   * the CSS transform origin sits.
   */
  const zoomAbout = useCallback(
    (next: number, px: number, py: number, animated: boolean) => {
      const s = scale.get();
      const ns = clamp(next, MIN, MAX);
      const cx = x.get();
      const cy = y.get();
      // The content-space point currently under the pointer.
      const contentX = (px - cx) / s;
      const contentY = (py - cy) / s;
      const { mx, my } = limits(ns);
      const nx = clamp(px - contentX * ns, -mx, mx);
      const ny = clamp(py - contentY * ns, -my, my);

      if (animated && !reduce) {
        animate(scale, ns, SPRING);
        animate(x, nx, SPRING);
        animate(y, ny, SPRING);
      } else {
        scale.set(ns);
        x.set(nx);
        y.set(ny);
      }
      report(ns);
    },
    [scale, x, y, limits, report, reduce],
  );

  const reset = useCallback(
    (animated = true) => {
      if (animated && !reduce) {
        animate(scale, 1, SPRING);
        animate(x, 0, SPRING);
        animate(y, 0, SPRING);
      } else {
        scale.set(1);
        x.set(0);
        y.set(0);
      }
      report(1);
    },
    [scale, x, y, report, reduce],
  );

  /** Centre of the container, in client coordinates. */
  const origin = () => {
    const r = surface.current!.getBoundingClientRect();
    return { ox: r.left + r.width / 2, oy: r.top + r.height / 2 };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const { ox, oy } = origin();
      pinch.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        scale: scale.get(),
        x: x.get(),
        y: y.get(),
        px: (a.x + b.x) / 2 - ox,
        py: (a.y + b.y) / 2 - oy,
      };
    } else if (pointers.current.size === 1) {
      pan.current = { x: e.clientX, y: e.clientY, moved: 0 };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const p = pinch.current;
      const ns = clamp((dist / p.dist) * p.scale, MIN, MAX);
      // Anchor on the midpoint recorded when the pinch started, so the
      // photo grows out of the gap between the fingers.
      const contentX = (p.px - p.x) / p.scale;
      const contentY = (p.py - p.y) / p.scale;
      const { mx, my } = limits(ns);
      scale.set(ns);
      x.set(clamp(p.px - contentX * ns, -mx, mx));
      y.set(clamp(p.py - contentY * ns, -my, my));
      report(ns);
      return;
    }

    const dx = e.clientX - pan.current.x;
    const dy = e.clientY - pan.current.y;
    pan.current.moved += Math.abs(dx) + Math.abs(dy);

    if (scale.get() > 1.01) {
      const { mx, my } = limits(scale.get());
      x.set(clamp(x.get() + dx, -mx, mx));
      y.set(clamp(y.get() + dy, -my, my));
      pan.current.x = e.clientX;
      pan.current.y = e.clientY;
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const had = pointers.current.size;
    pointers.current.delete(e.pointerId);

    // A flick sideways at rest moves to the neighbouring photo.
    if (had === 1 && onSwipe && scale.get() <= 1.01) {
      const dx = e.clientX - pan.current.x;
      if (Math.abs(dx) > 60) {
        onSwipe(dx < 0 ? 1 : -1);
        return;
      }
    }

    // Two taps in the same spot toggle zoom. Checked here rather than via
    // dblclick so that touch gets it too.
    if (had === 1 && pan.current.moved < 12) {
      const now = performance.now();
      const near =
        Math.abs(e.clientX - lastTap.current.x) < 32 &&
        Math.abs(e.clientY - lastTap.current.y) < 32;
      if (now - lastTap.current.t < 320 && near) {
        const { ox, oy } = origin();
        if (scale.get() > 1.01) reset();
        else zoomAbout(DOUBLE_TAP, e.clientX - ox, e.clientY - oy, true);
        lastTap.current = { t: 0, x: 0, y: 0 };
        return;
      }
      lastTap.current = { t: now, x: e.clientX, y: e.clientY };
    }

    // Pinching out below the fit size springs back rather than sticking.
    if (pointers.current.size === 0 && scale.get() < 1.02) reset();
  };

  // Non-passive so the page underneath cannot claim the gesture. React's
  // onWheel is passive in this position, hence the manual listener.
  useEffect(() => {
    const el = surface.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      // Trackpad pinch arrives as ctrl+wheel with small deltas, a mouse
      // wheel as ~120 a notch. The gentler coefficient on the latter is
      // what keeps six clicks from slamming straight into the ceiling.
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0013));
      zoomAbout(
        scale.get() * factor,
        e.clientX - (r.left + r.width / 2),
        e.clientY - (r.top + r.height / 2),
        false,
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAbout, scale]);

  // Re-fit if the viewport changes underneath a zoomed photo.
  useEffect(() => {
    const onResize = () => reset(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [reset]);

  // The +/- buttons zoom about the centre, which is the only anchor that
  // makes sense when the gesture has no pointer behind it.
  useImperativeHandle(
    ref,
    () => ({
      zoomBy: (factor: number) => zoomAbout(scale.get() * factor, 0, 0, true),
      reset: () => reset(true),
    }),
    [zoomAbout, reset, scale],
  );

  return (
    <div
      ref={surface}
      className="absolute inset-0 touch-none select-none overflow-hidden"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <motion.div className="absolute inset-0" style={{ scale, x, y }}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={hiRes ? "(min-width: 768px) 2560px, 1600px" : "100vw"}
          quality={88}
          loading="eager"
          draggable={false}
          placeholder={blur ? "blur" : "empty"}
          blurDataURL={blur ?? undefined}
          onLoad={(e) => measure(e.currentTarget)}
          className="pointer-events-none object-contain"
        />
      </motion.div>
    </div>
  );
});
