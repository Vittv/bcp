// drawer drag (swipe) gesture logic, shared by the web pointer-event glue and
// the native PanResponder glue in useDrawerSwipe. keeping the state machine
// here means the swipe rules are testable without a browser or a device.
//
// with the drawer closed a horizontal drag to the right past the threshold
// opens it, wherever it starts on the screen (Discord-style full-width
// swipe). with the drawer open a horizontal drag to the left past the
// threshold closes it. a gesture is abandoned as soon as vertical motion
// dominates, so normal page scrolling is never interfered with.

// motion below this many pixels in both axes is a tap, not a drag
export const DRAWER_DEAD_ZONE = 8;

export type DragAction = "none" | "open" | "close";

// mutable gesture state; a session runs from touch-down to touch-up
export type DragSession = {
  // did this drag commit to horizontal travel
  horizontal: boolean;
  // is the drag still being tracked (false once abandoned or resolved)
  live: boolean;
};

export type DragStep = {
  // false once the platform glue should stop feeding this drag deltas
  live: boolean;
  // the drawer transition this delta resolves to (if any)
  action: DragAction;
};

export function createDragSession(): DragSession {
  return { horizontal: false, live: true };
}

// progress a drag by its total displacement from the touch anchor (dx on the
// x axis, dy on the y) and resolve whatever transition, if any, it committed
// to. callers feed every pointer move and the pointer-up; the returned
// live:false means the session is over (fire the action once, ignore rest).
export function progressDrag(
  session: DragSession,
  dx: number,
  dy: number,
  open: boolean,
  threshold: number,
): DragStep {
  if (session.live === false) return { live: false, action: "none" };
  if (
    session.horizontal === false &&
    Math.abs(dx) < DRAWER_DEAD_ZONE &&
    Math.abs(dy) < DRAWER_DEAD_ZONE
  ) {
    // still inside the tap dead-zone; keep tracking (a scroll or a real drag
    // could still begin)
    return { live: true, action: "none" };
  }
  if (Math.abs(dx) <= Math.abs(dy)) {
    // vertical motion dominates: this is a scroll, not a drawer swipe
    session.live = false;
    return { live: false, action: "none" };
  }
  session.horizontal = true;
  if (Math.abs(dx) < threshold) return { live: true, action: "none" };
  session.live = false;
  const action: DragAction =
    open && dx < 0 ? "close" : !open && dx > 0 ? "open" : "none";
  return { live: false, action };
}
