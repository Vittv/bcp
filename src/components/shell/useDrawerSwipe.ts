import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  type GestureResponderHandlers,
  PanResponder,
  Platform,
} from "react-native";
import {
  createDragSession,
  DRAWER_DEAD_ZONE,
  type DragSession,
  progressDrag,
  resolveDrag,
} from "../../lib/input/drawerDrag";

type DrawerSwipeOptions = {
  enabled: boolean;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  // live drawer position while a drag tracks the finger (0 closed to 1
  // open), null once the gesture ends and the spring takes over. the web
  // build consumes it; native keeps the gesture but has no drag render yet.
  onProgress?: (progress: number | null) => void;
};

// drawer-drag gestures for the mobile drawer. the web build attaches
// window-level pointer events so a swipe can start anywhere on screen and
// reports the live drawer position while it drags; native drives a
// PanResponder on the shell root, which captures horizontal drags before
// the inner scrollers do. both paths feed the same shared progressDrag
// state machine, so the gesture rules live in one testable place.
export function useDrawerSwipe({
  enabled,
  open,
  onOpen,
  onClose,
  onProgress,
}: DrawerSwipeOptions): GestureResponderHandlers {
  const state = useRef({ enabled, open, onOpen, onClose, onProgress });
  state.current = { enabled, open, onOpen, onClose, onProgress };

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
        const s = state.current;
        session.current = createDragSession(
          s.open,
          Dimensions.get("window").width,
        );
      },
      onPanResponderMove: (_evt, g) => {
        const s = state.current;
        if (!s.enabled || !session.current) return;
        const step = progressDrag(session.current, g.dx, g.dy);
        if (!step.live) {
          session.current = null;
          s.onProgress?.(null);
          return;
        }
        s.onProgress?.(step.progress);
      },
      onPanResponderRelease: (_evt, g) => {
        const s = state.current;
        if (!s.enabled) return;
        const drag = session.current;
        session.current = null;
        if (!drag) return;
        const action = resolveDrag(drag, g.dx, g.dy);
        s.onProgress?.(null);
        if (action === "open") s.onOpen();
        else if (action === "close") s.onClose();
      },
      onPanResponderTerminate: () => {
        session.current = null;
      },
    }),
  );
  const web = Platform.OS === "web";

  useEffect(() => {
    if (!web || !enabled) return;
    let drag: DragSession | null = null;
    let startX = 0;
    let startY = 0;
    let tracking = false;

    // the drawer is the whole viewport on mobile; falling back to innerWidth
    // keeps the transform working even before the overlay has laid out
    const drawerWidth = () => {
      const el = document.querySelector<HTMLElement>("[data-bcp-drawer]");
      return el ? el.getBoundingClientRect().width : window.innerWidth;
    };

    const finish = (dx: number, dy: number) => {
      if (!tracking || !drag) return;
      tracking = false;
      const dragSession = drag;
      drag = null;
      const action = resolveDrag(dragSession, dx, dy);
      // clear the drag flag on the next tick: web Pressables press from the
      // click that fires right after pointerup, and releasing a drag over a
      // row must read as a gesture, not a tap
      setTimeout(() => state.current.onProgress?.(null), 0);
      if (action === "open") state.current.onOpen();
      else if (action === "close") state.current.onClose();
    };

    const down = (e: PointerEvent) => {
      startX = e.clientX;
      startY = e.clientY;
      tracking = true;
      drag = createDragSession(state.current.open, drawerWidth());
    };

    const move = (e: PointerEvent) => {
      if (!tracking || !drag) return;
      const step = progressDrag(drag, e.clientX - startX, e.clientY - startY);
      if (!step.live) {
        tracking = false;
        drag = null;
        state.current.onProgress?.(null);
        return;
      }
      state.current.onProgress?.(step.progress);
    };

    const up = (e: PointerEvent) =>
      finish(e.clientX - startX, e.clientY - startY);

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
