// drawer drag (swipe) gesture logic, shared by the web pointer-event glue and
// the native PanResponder glue in useDrawerSwipe. keeping the state machine
// here means the gesture rules are testable without a browser or a device.
//
// a drag session starts at touch-down with the drawer's rest state (open or
// closed) and its width. a horizontal delta maps to a 0..1 drawer position
// the UI renders in real time (the drawer follows the finger); past either
// end the extra travel is retarded so it rubber-bands instead of flying off.
// vertical motion abandons the session entirely, so normal page scrolling is
// never interfered with. releasing commits to a transition: a fast fling
// decides by direction, otherwise the drawer settles to the side of the
// half-way mark it crossed.

// motion below this many pixels in both axes is a tap, not a drag
export const DRAWER_DEAD_ZONE = 8;

export type DragAction = "none" | "open" | "close";

// mutable gesture state; a session runs from touch-down to touch-up
export type DragSession = {
  // the drawer's rest state when the touch began, and its width in px:
  // together they map a horizontal delta to a 0..1 drawer position
  startOpen: boolean;
  width: number;
  // did this drag commit to horizontal travel
  horizontal: boolean;
  // is the drag still being tracked (false once abandoned or resolved)
  live: boolean;
  // last committed delta and timestamp, for the release fling velocity
  lastX: number;
  lastT: number;
};

export type DragStep = {
  // false once the platform glue should stop feeding this drag deltas
  live: boolean;
  // the drawer position this delta maps to (0 closed, 1 open); exceedable
  // past the ends while the rubber-band pulls it back
  progress: number;
};

export function createDragSession(
  startOpen: boolean,
  width: number,
): DragSession {
  return {
    startOpen,
    width,
    horizontal: false,
    live: true,
    lastX: 0,
    lastT: 0,
  };
}

// map a horizontal delta to the drawer position (0 closed, 1 open), keeping
// a quarter of the travel past either end so the drawer resists being pulled
// beyond its bounds and snaps back
export function dragPosition(session: DragSession, dx: number): number {
  const raw = session.startOpen ? 1 + dx / session.width : dx / session.width;
  const bent = raw > 1 ? 1 + (raw - 1) / 4 : raw < 0 ? raw / 4 : raw;
  return Math.max(-0.2, Math.min(1.2, bent));
}

// progress a drag by its total displacement from the touch anchor (dx on the
// x axis, dy on the y). callers feed every pointer move; live:false means the
// session is over (abandoned as vertical motion or already resolved) and the
// glue should stop feeding deltas.
export function progressDrag(
  session: DragSession,
  dx: number,
  dy: number,
): DragStep {
  if (session.live === false) {
    return { live: false, progress: session.startOpen ? 1 : 0 };
  }
  if (
    session.horizontal === false &&
    Math.abs(dx) < DRAWER_DEAD_ZONE &&
    Math.abs(dy) < DRAWER_DEAD_ZONE
  ) {
    // still inside the tap dead-zone; keep tracking (a scroll or a real drag
    // could still begin), anchored at the rest state
    return { live: true, progress: session.startOpen ? 1 : 0 };
  }
  if (Math.abs(dx) <= Math.abs(dy)) {
    // vertical motion dominates: this is a scroll, not a drawer swipe
    session.live = false;
    return { live: false, progress: session.startOpen ? 1 : 0 };
  }
  session.horizontal = true;
  session.lastX = dx;
  session.lastT = Date.now();
  return { live: true, progress: dragPosition(session, dx) };
}

// resolve a finished horizontal drag into the transition it commits to: a
// fast release flings by its direction, otherwise the drawer settles onto
// whichever side of the half-way mark it crossed
export function resolveDrag(
  session: DragSession,
  dx: number,
  dy: number,
): DragAction {
  if (!session.horizontal || !session.live) return "none";
  if (Math.abs(dx) <= Math.abs(dy)) return "none";
  const dt = Math.max(1, Date.now() - session.lastT);
  const vx = (dx - session.lastX) / (dt / 1000);
  const goal = Math.abs(vx) >= 600 ? vx > 0 : dragPosition(session, dx) >= 0.5;
  if (goal === session.startOpen) return "none";
  return goal ? "open" : "close";
}
