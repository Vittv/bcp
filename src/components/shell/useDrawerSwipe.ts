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
  // live position while the drag tracks the finger (0..1), null once the
  // gesture ends and the spring takes over; the web build consumes it
  onProgress?: (progress: number | null) => void;
};

// drawer-drag gestures for the mobile drawer: window pointer events on web, a
// PanResponder on the shell root natively, both feeding the shared
// progressDrag state machine. any horizontal-leading swipe anywhere on the
// screen carries the drawer's intent; the axis lock keeps vertical scrolls
// untouched.
export function useDrawerSwipe({
  enabled,
  open,
  onOpen,
  onClose,
  onProgress,
}: DrawerSwipeOptions): GestureResponderHandlers {
  const state = useRef({ enabled, open, onOpen, onClose, onProgress });
  state.current = { enabled, open, onOpen, onClose, onProgress };

  // all hooks run unconditionally, even though web never mounts the responder
  const session = useRef<DragSession | null>(null);
  const [responder] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_evt, g) => {
        const s = state.current;
        if (!s.enabled) return false;
        // claim the draw when horizontal motion leads at the dead-zone exit
        return (
          Math.abs(g.dx) >= DRAWER_DEAD_ZONE && Math.abs(g.dx) > Math.abs(g.dy)
        );
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
        const drag = session.current;
        if (!s.enabled || !drag) return;
        const step = progressDrag(drag, g.dx, g.dy);
        if (!step.live) {
          session.current = null;
          s.onProgress?.(null);
          return;
        }
        // taps stay anchored until the axis locks; reporting the rest value
        // would flag the drawer as dragging and eat the row's press
        if (!drag.horizontal) return;
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

    // the drawer spans the viewport; innerWidth covers the pre-layout frame
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
      // clear on the next tick so the click after pointerup still reads as
      // a gesture rather than a tap on the row
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
      // taps stay anchored until the axis locks; reporting the rest value
      // would flag the drawer as dragging and eat the row's press
      if (!drag.horizontal) return;
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
