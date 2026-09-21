import { describe, expect, it } from "bun:test";
import {
  createDragSession,
  DRAWER_DEAD_ZONE,
  DRAWER_FLING_VX,
  DRAWER_INTENT,
  DRAWER_SLOPE,
  dragPosition,
  progressDrag,
  resolveDrag,
} from "../drawerDrag";

describe("progressDrag", () => {
  it("anchors a tap at the rest state while it stays in the dead zone", () => {
    const closed = createDragSession(false, 360);
    expect(progressDrag(closed, 5, 5)).toEqual({ live: true, progress: 0 });
    expect(closed.horizontal).toBe(false);
    expect(closed.live).toBe(true);
    const open = createDragSession(true, 360);
    expect(progressDrag(open, -5, 5)).toEqual({ live: true, progress: 1 });
  });

  it("stays alive while the delta stays inside the dead zone", () => {
    const s = createDragSession(false, 360);
    for (let i = 1; i <= 3; i += 1) {
      const step = progressDrag(s, i, -i);
      expect(step.live).toBe(true);
      expect(step.progress).toBe(0);
    }
  });

  it("abandons a vertical-dominant drag so page scrolling is untouched", () => {
    const s = createDragSession(false, 360);
    const step = progressDrag(s, 10, 80);
    expect(step).toEqual({ live: false, progress: 0 });
    expect(s.live).toBe(false);
  });

  it("abandons at the exact axis tie", () => {
    const s = createDragSession(false, 360);
    const step = progressDrag(s, 30, 30);
    expect(step.live).toBe(false);
  });

  it("locks to horizontal at the slop exit and rides out a later arc", () => {
    const s = createDragSession(false, 360);
    expect(progressDrag(s, 40, 4)).toEqual({
      live: true,
      progress: 40 / 360,
    });
    // the thumb arc now tips vertical, but the axis is already locked
    expect(progressDrag(s, 60, 140)).toEqual({
      live: true,
      progress: 60 / 360,
    });
    expect(s.horizontal).toBe(true);
  });

  it("maps the delta to a drawer position while tracking", () => {
    const s = createDragSession(false, 360);
    expect(progressDrag(s, 180, 4)).toEqual({ live: true, progress: 0.5 });
    const open = createDragSession(true, 360);
    expect(progressDrag(open, -180, 4)).toEqual({ live: true, progress: 0.5 });
  });

  it("keeps delta accumulations through the clamp", () => {
    const s = createDragSession(false, 360);
    expect(progressDrag(s, 360, 4).progress).toBe(1);
    // retarded beyond the full travel, never past the 1.2 cap
    expect(progressDrag(s, 720, 4).progress).toBe(1.2);
  });

  it("treats a dead session as inert from the start", () => {
    const s = createDragSession(false, 360);
    s.live = false;
    const step = progressDrag(s, 90, 4);
    expect(step).toEqual({ live: false, progress: 0 });
  });

  it("exposes the constants used by the platform glue", () => {
    expect(DRAWER_DEAD_ZONE).toBeGreaterThan(0);
    expect(DRAWER_INTENT).toBeGreaterThan(0);
    expect(DRAWER_SLOPE).toBeGreaterThan(0);
    expect(DRAWER_FLING_VX).toBeGreaterThan(0);
  });
});

describe("dragPosition", () => {
  it("walks 0 to 1 with the delta", () => {
    const s = createDragSession(false, 100);
    expect(dragPosition(s, 0)).toBe(0);
    expect(dragPosition(s, 100)).toBe(1);
  });

  it("walks 1 to 0 for an open drawer pulled left", () => {
    const s = createDragSession(true, 100);
    expect(dragPosition(s, 0)).toBe(1);
    expect(dragPosition(s, -100)).toBe(0);
  });

  it("retards overshoot past either end", () => {
    const closed = createDragSession(false, 100);
    expect(dragPosition(closed, 200)).toBe(1.2);
    expect(dragPosition(closed, -80)).toBe(-0.2);
    const open = createDragSession(true, 100);
    expect(dragPosition(open, 200)).toBe(1.2);
    expect(dragPosition(open, -200)).toBe(-0.2);
  });
});

describe("resolveDrag", () => {
  it("ignores taps and abandoned sessions", () => {
    const tap = createDragSession(false, 360);
    expect(resolveDrag(tap, 4, -4)).toBe("none");
    const abandoned = createDragSession(false, 360);
    progressDrag(abandoned, 40, 90);
    expect(resolveDrag(abandoned, 40, 90)).toBe("none");
  });

  it("opens from a short, gentle pull", () => {
    const s = createDragSession(false, 360);
    progressDrag(s, 60, 6);
    s.startT = Date.now() - 800;
    expect(resolveDrag(s, 60, 6)).toBe("open");
  });

  it("stays closed for a tap-sized drag", () => {
    const s = createDragSession(false, 360);
    s.horizontal = true;
    s.live = true;
    s.startT = Date.now() - 800;
    expect(resolveDrag(s, 15, 4)).toBe("none");
  });

  it("stays closed when pulled further closed", () => {
    const s = createDragSession(false, 360);
    progressDrag(s, -60, 6);
    s.startT = Date.now() - 800;
    expect(resolveDrag(s, -60, 6)).toBe("none");
  });

  it("closes an open drawer with a short pull to the left", () => {
    const s = createDragSession(true, 360);
    progressDrag(s, -60, 6);
    s.startT = Date.now() - 800;
    expect(resolveDrag(s, -60, 6)).toBe("close");
  });

  it("keeps open when pulled further open", () => {
    const s = createDragSession(true, 360);
    progressDrag(s, 60, 6);
    s.startT = Date.now() - 800;
    expect(resolveDrag(s, 60, 6)).toBe("none");
  });

  it("flings open on a barely-there flick", () => {
    const s = createDragSession(false, 360);
    progressDrag(s, 30, 4);
    s.startT = Date.now() - 50;
    expect(resolveDrag(s, 30, 4)).toBe("open");
  });

  it("flings closed from an open drawer", () => {
    const s = createDragSession(true, 360);
    progressDrag(s, -30, 4);
    s.startT = Date.now() - 50;
    expect(resolveDrag(s, -30, 4)).toBe("close");
  });

  it("does not fling on an extremely slow, short release", () => {
    const s = createDragSession(false, 360);
    s.horizontal = true;
    s.live = true;
    s.startT = Date.now() - 3000;
    expect(resolveDrag(s, 12, 2)).toBe("none");
  });

  it("drops a release that drifted back to vertical", () => {
    const s = createDragSession(false, 360);
    s.horizontal = true;
    s.live = true;
    s.startT = Date.now() - 600;
    expect(resolveDrag(s, 60, 400)).toBe("none");
  });

  it("commits a sloped release by its horizontal travel", () => {
    const s = createDragSession(false, 360);
    s.horizontal = true;
    s.live = true;
    s.startT = Date.now() - 2000;
    expect(resolveDrag(s, 150, 120)).toBe("open");
  });
});
