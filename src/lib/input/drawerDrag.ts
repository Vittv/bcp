// drawer drag rules, shared by the web pointer glue and the native
// PanResponder in useDrawerSwipe so they stay testable. the axis is decided
// once at the dead-zone exit and locked, so a thumb sweep's arc never kills
// the gesture; vertical claims abandon so page scrolling is untouched.
//
// releasing commits on intent, not force: the drawer realizes the swipe's
// direction once the horizontal travel is convincingly a pull, and the
// spring finishes the rest. a release that has drifted back to vertical
// reads as a scroll instead, and a tap-sized movement never opens.

// movement under this in both axes is a tap, not a drag
export const DRAWER_DEAD_ZONE = 8;

// horizontal travel that counts as a pull; less than this is tap or jitter
export const DRAWER_INTENT = 40;

// minimum horizontal fraction a release keeps to still read as a swipe
// (0.5 tolerates a ~63 degree final arc); below it the drift says scroll
export const DRAWER_SLOPE = 0.5;

// releases at or above this average velocity fling on direction alone, so a
// barely-there flick still opens
export const DRAWER_FLING_VX = 250;

export type DragAction = "none" | "open" | "close";

// mutable gesture state; a session runs from touch-down to touch-up
export type DragSession = {
  // the drawer's rest state when the touch began, and its width in px
  startOpen: boolean;
  width: number;
  // locked to horizontal once the axis was decided at the dead-zone exit
  horizontal: boolean;
  // still being tracked (false once abandoned or resolved)
  live: boolean;
  // touch-down timestamp, for the gesture's average release velocity
  startT: number;
};

export type DragStep = {
  // false once the platform glue should stop feeding this drag deltas
  live: boolean;
  // the drawer position this delta maps to (0 closed, 1 open)
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
    startT: Date.now(),
  };
}

// map a horizontal delta to the drawer position; keeps a quarter of the
// travel past either end so the drawer rubber-bands instead of flying off
export function dragPosition(session: DragSession, dx: number): number {
  const raw = session.startOpen ? 1 + dx / session.width : dx / session.width;
  const bent = raw > 1 ? 1 + (raw - 1) / 4 : raw < 0 ? raw / 4 : raw;
  return Math.max(-0.2, Math.min(1.2, bent));
}

// progress a drag by its displacement from the touch anchor; live:false
// means the session is over and the glue should stop feeding deltas
export function progressDrag(
  session: DragSession,
  dx: number,
  dy: number,
): DragStep {
  if (session.live === false) {
    return { live: false, progress: session.startOpen ? 1 : 0 };
  }
  if (!session.horizontal) {
    if (Math.abs(dx) < DRAWER_DEAD_ZONE && Math.abs(dy) < DRAWER_DEAD_ZONE) {
      // still a tap; keep tracking anchored at the rest state
      return { live: true, progress: session.startOpen ? 1 : 0 };
    }
    if (Math.abs(dx) <= Math.abs(dy)) {
      // vertical won at the dead-zone exit: this is a scroll, bail
      session.live = false;
      return { live: false, progress: session.startOpen ? 1 : 0 };
    }
    // horizontal won: lock the axis so the sweep's arc never kills it
    session.horizontal = true;
  }
  return { live: true, progress: dragPosition(session, dx) };
}

// resolve a finished drag: a flick commits on direction alone, otherwise a
// release must still read as a horizontal pull, and the drawer settles to
// the side the pull intended (the spring does the rest)
export function resolveDrag(
  session: DragSession,
  dx: number,
  dy: number,
): DragAction {
  if (!session.horizontal || !session.live) return "none";
  const dt = Math.max(1, Date.now() - session.startT);
  const vx = dx / (dt / 1000);
  const fast = Math.abs(vx) >= DRAWER_FLING_VX;
  if (!fast) {
    if (Math.abs(dx) < DRAWER_INTENT) return "none";
    if (Math.abs(dx) < DRAWER_SLOPE * Math.abs(dy)) return "none";
  }
  const goal = fast ? vx > 0 : dx > 0;
  if (goal === session.startOpen) return "none";
  return goal ? "open" : "close";
}
