import { describe, expect, it } from "bun:test";
import {
  createDragSession,
  DRAWER_DEAD_ZONE,
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

  it("abandons at the exact vertical tie", () => {
    const s = createDragSession(false, 360);
    const step = progressDrag(s, 30, 30);
    expect(step.live).toBe(false);
  });

  it("abandons a horizontal start that later goes vertical", () => {
    const s = createDragSession(false, 360);
    progressDrag(s, 40, 4);
    const step = progressDrag(s, 40, 90);
    expect(step).toEqual({ live: false, progress: 0 });
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

  it("exposes the dead zone used by the platform glue", () => {
    expect(DRAWER_DEAD_ZONE).toBeGreaterThan(0);
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

  it("opens past the half-way mark from closed", () => {
    const s = createDragSession(false, 360);
    progressDrag(s, 210, 4);
    expect(resolveDrag(s, 210, 4)).toBe("open");
  });

  it("stays closed short of the half-way mark", () => {
    const s = createDragSession(false, 360);
    progressDrag(s, 150, 4);
    expect(resolveDrag(s, 150, 4)).toBe("none");
  });

  it("closes an open drawer dragged past half way", () => {
    const s = createDragSession(true, 360);
    progressDrag(s, -220, 4);
    expect(resolveDrag(s, -220, 4)).toBe("close");
  });

  it("keeps an open drawer when dragged back short of half way", () => {
    const s = createDragSession(true, 360);
    progressDrag(s, -140, 4);
    expect(resolveDrag(s, -140, 4)).toBe("none");
  });

  it("lets a fast release fling by direction, not position", () => {
    const closed = createDragSession(false, 360);
    closed.horizontal = true;
    closed.lastX = 0;
    closed.lastT = Date.now() - 16;
    expect(resolveDrag(closed, 12, 2)).toBe("open");
    const open = createDragSession(true, 360);
    open.horizontal = true;
    open.lastX = 0;
    open.lastT = Date.now() - 16;
    expect(resolveDrag(open, -12, 2)).toBe("close");
  });

  it("does not fling on a slow release short of the mark", () => {
    const closed = createDragSession(false, 360);
    closed.horizontal = true;
    closed.lastX = 0;
    closed.lastT = Date.now() - 600;
    expect(resolveDrag(closed, 12, 2)).toBe("none");
  });

  it("ignores a vertical release even after a horizontal start", () => {
    const s = createDragSession(false, 360);
    s.horizontal = true;
    s.live = true;
    expect(resolveDrag(s, 20, 80)).toBe("none");
  });
});
