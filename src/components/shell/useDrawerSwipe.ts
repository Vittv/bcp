import { useEffect, useRef } from "react";

type DrawerSwipeOptions = {
  enabled: boolean;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
};

// Edge-swipe gestures for the mobile drawer, driven by DOM pointer events
// (web/PWA only; the native branch keeps button + backdrop close).
//
// With the drawer closed: a horizontal drag that starts near the left edge
// and moves right past a threshold opens it.
// With the drawer open: a horizontal drag to the left past the threshold
// closes it.
//
// The handler deliberately abandons a gesture as soon as vertical movement
// dominates, so normal page scrolling is never interfered with.
const EDGE = 24;
const THRESHOLD = 64;

export function useDrawerSwipe({
  enabled,
  open,
  onOpen,
  onClose,
}: DrawerSwipeOptions) {
  const state = useRef({ enabled, open, onOpen, onClose });
  state.current = { enabled, open, onOpen, onClose };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!state.current.enabled) return;

    let startX = 0;
    let startY = 0;
    let tracking = false;
    let horizontal = false;

    const down = (e: PointerEvent) => {
      const s = state.current;
      startX = e.clientX;
      startY = e.clientY;
      tracking = true;
      horizontal = false;
      // when closed we only care about swipes that start on the left edge
      if (!s.open && e.clientX > EDGE) tracking = false;
    };

    const move = (e: PointerEvent) => {
      if (!tracking) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!horizontal && Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dx) <= Math.abs(dy)) {
        tracking = false;
        return;
      }
      horizontal = true;
      // act eagerly once the threshold is crossed so the drawer feels
      // responsive instead of only reacting on pointer-up
      const s = state.current;
      if (Math.abs(dx) >= THRESHOLD) {
        tracking = false;
        if (s.open && dx < 0) s.onClose();
        else if (!s.open && dx > 0) s.onOpen();
      }
    };

    const up = (e: PointerEvent) => {
      if (!tracking) return;
      tracking = false;
      const dx = e.clientX - startX;
      if (!horizontal) return;
      const s = state.current;
      if (s.open && dx <= -THRESHOLD) s.onClose();
      else if (!s.open && dx >= THRESHOLD) s.onOpen();
    };

    window.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, []);
}
