import { useEffect, useRef, useState } from "react";
import {
  autoscrollDelta,
  findScrollableAncestor,
  type Scroller,
} from "../../lib/input/autoscroll";

// where the indicator parks: the viewport coords of the middle-button down,
// clamped so the glyph never clips off screen
export type AutoscrollIndicator = { x: number; y: number };

// middle-button ("scroll click") autoscroll for the Linux and macOS desktop
// shells, whose webviews (WebKit and WebKitGTK) have no native gesture.
// Matches the browser interaction: one middle-click engages and releases
// immediately, the indicator parks where the click landed, and the scroller
// under the cursor moves at a speed proportional to pointer travel past a
// dead zone. Any subsequent click (or Escape) disengages.
//
// state only changes when the mode toggles; pointer movement and the scroll
// loop run against refs so scrolling never re-renders the shell
type AutoscrollState = {
  target: Scroller | null;
  active: boolean;
  raf: number;
  lastTs: number;
  pointerX: number;
  pointerY: number;
  anchorX: number;
  anchorY: number;
};

export function useAutoscroll(enabled: boolean): AutoscrollIndicator | null {
  const [indicator, setIndicator] = useState<AutoscrollIndicator | null>(null);
  const state = useRef<AutoscrollState>({
    target: null,
    active: false,
    raf: 0,
    lastTs: 0,
    pointerX: 0,
    pointerY: 0,
    anchorX: 0,
    anchorY: 0,
  });

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const s = state.current;

    const stop = () => {
      if (!s.active) return;
      s.active = false;
      s.target = null;
      if (s.raf) cancelAnimationFrame(s.raf);
      s.raf = 0;
      setIndicator(null);
    };

    const tick = (ts: number) => {
      s.raf = requestAnimationFrame(tick);
      if (!s.active || !s.target) return;
      const dt = s.lastTs > 0 ? ts - s.lastTs : 16.667;
      s.lastTs = ts;
      // scale by the real frame delta so fast displays don't scroll faster
      const { top, left } = autoscrollDelta(
        s.target,
        s.pointerX - s.anchorX,
        s.pointerY - s.anchorY,
        Math.min(2, dt / 16.667),
      );
      if (top !== 0) s.target.scrollTop = s.target.scrollTop + top;
      if (left !== 0) s.target.scrollLeft = s.target.scrollLeft + left;
    };

    const down = (e: PointerEvent) => {
      // any click ends the mode (browser behavior); only the middle
      // button can start it
      if (s.active) {
        if (e.button === 1) e.preventDefault();
        stop();
        return;
      }
      if (e.button !== 1) return;
      const hit = document.elementFromPoint(e.clientX, e.clientY);
      // form controls keep their middle-button behaviors (paste, open),
      // only the reading surfaces autoscroll
      if (
        !hit ||
        hit.closest("input, textarea, select, button, a, [contenteditable]")
      ) {
        return;
      }
      const target = findScrollableAncestor(hit);
      if (!target) return;
      // block the webview's own middle-click behavior from fighting the
      // custom gesture (and Linux middle-click paste)
      e.preventDefault();
      s.target = target;
      s.active = true;
      s.lastTs = 0;
      s.anchorX = e.clientX;
      s.anchorY = e.clientY;
      s.pointerX = e.clientX;
      s.pointerY = e.clientY;
      if (!s.raf) s.raf = requestAnimationFrame(tick);
      setIndicator({
        x: Math.min(window.innerWidth - 20, Math.max(20, e.clientX)),
        y: Math.min(window.innerHeight - 20, Math.max(20, e.clientY)),
      });
    };

    const move = (e: PointerEvent) => {
      if (!s.active) return;
      s.pointerX = e.clientX;
      s.pointerY = e.clientY;
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") stop();
    };

    const onAux = (e: MouseEvent) => {
      if (s.active) e.preventDefault();
    };

    window.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointercancel", stop);
    window.addEventListener("blur", stop);
    window.addEventListener("keydown", onKey);
    window.addEventListener("auxclick", onAux);
    return () => {
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
      window.removeEventListener("blur", stop);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("auxclick", onAux);
      if (s.raf) cancelAnimationFrame(s.raf);
      s.raf = 0;
    };
  }, [enabled]);

  return indicator;
}
