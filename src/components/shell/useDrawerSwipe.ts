import { useEffect, useRef, useState } from "react";
import {
  type GestureResponderHandlers,
  PanResponder,
  Platform,
} from "react-native";
import {
  createDragSession,
  DRAWER_DEAD_ZONE,
  type DragSession,
  progressDrag,
} from "../../lib/input/drawerDrag";

type DrawerSwipeOptions = {
  enabled: boolean;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
};

// drawer-swipe gestures for the mobile drawer. the web build attaches
// window-level pointer events so a swipe can start anywhere on screen;
// native drives a PanResponder on the shell root, which captures horizontal
// drags before the inner scrollers do. both paths feed the same shared
// progressDrag state machine, so the gesture rules live in one testable place.
const THRESHOLD = 64;

export function useDrawerSwipe({
  enabled,
  open,
  onOpen,
  onClose,
}: DrawerSwipeOptions): GestureResponderHandlers {
  const state = useRef({ enabled, open, onOpen, onClose });
  state.current = { enabled, open, onOpen, onClose };

  // all hooks run unconditionally: on web the created PanResponder is never
  // mounted (no panHandlers are spread), and the pointer listeners are
  // web-only behind the effect guard below
  const session = useRef<DragSession | null>(null);
  const [responder] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_evt, g) => {
        const s = state.current;
        if (!s.enabled) return false;
        // only claim a drag that has committed to horizontal motion, so
        // vertical touches always fall through to the scrollers
        if (Math.abs(g.dx) < DRAWER_DEAD_ZONE) return false;
        if (Math.abs(g.dx) <= Math.abs(g.dy)) return false;
        return true;
      },
      onPanResponderGrant: () => {
        session.current = createDragSession();
      },
      onPanResponderMove: (_evt, g) => {
        const s = state.current;
        if (!s.enabled || !session.current) return;
        const step = progressDrag(
          session.current,
          g.dx,
          g.dy,
          s.open,
          THRESHOLD,
        );
        if (step.action === "open") s.onOpen();
        else if (step.action === "close") s.onClose();
      },
      onPanResponderRelease: (_evt, g) => {
        const s = state.current;
        if (!s.enabled) return;
        const drag = session.current ?? createDragSession();
        session.current = null;
        const step = progressDrag(drag, g.dx, g.dy, s.open, THRESHOLD);
        if (step.action === "open") s.onOpen();
        else if (step.action === "close") s.onClose();
      },
      onPanResponderTerminate: () => {
        session.current = null;
      },
    }),
  );
  const web = Platform.OS === "web";

  useEffect(() => {
    if (!web || !enabled) return;
    let drag = createDragSession();
    let startX = 0;
    let startY = 0;
    let tracking = false;

    const down = (e: PointerEvent) => {
      startX = e.clientX;
      startY = e.clientY;
      tracking = true;
      drag = createDragSession();
    };

    const move = (e: PointerEvent) => {
      if (!tracking) return;
      const step = progressDrag(
        drag,
        e.clientX - startX,
        e.clientY - startY,
        state.current.open,
        THRESHOLD,
      );
      if (!step.live) tracking = false;
      if (step.action === "open") state.current.onOpen();
      else if (step.action === "close") state.current.onClose();
    };

    const up = (e: PointerEvent) => {
      if (!tracking) return;
      tracking = false;
      const step = progressDrag(
        drag,
        e.clientX - startX,
        e.clientY - startY,
        state.current.open,
        THRESHOLD,
      );
      if (step.action === "open") state.current.onOpen();
      else if (step.action === "close") state.current.onClose();
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
  }, [web, enabled]);

  if (web) return {};
  return responder.panHandlers;
}
