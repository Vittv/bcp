import { describe, expect, it } from "bun:test";
import {
  createDragSession,
  DRAWER_DEAD_ZONE,
  progressDrag,
} from "../drawerDrag";

const THRESHOLD = 64;

describe("progressDrag", () => {
  it("treats a tap as a drag only once it leaves the dead zone", () => {
    const s = createDragSession();
    const step = progressDrag(s, 5, 5, false, THRESHOLD);
    expect(step).toEqual({ live: true, action: "none" });
    expect(s.horizontal).toBe(false);
    expect(s.live).toBe(true);
  });

  it("stays alive while the delta stays inside the dead zone", () => {
    const s = createDragSession();
    for (let i = 1; i <= 3; i += 1) {
      const step = progressDrag(s, i, -i, false, THRESHOLD);
      expect(step.live).toBe(true);
      expect(step.action).toBe("none");
    }
  });

  it("abandons a vertical-dominant drag so page scrolling is untouched", () => {
    const s = createDragSession();
    const step = progressDrag(s, 10, 80, false, THRESHOLD);
    expect(step).toEqual({ live: false, action: "none" });
    expect(s.live).toBe(false);
  });

  it("abandons at the exact vertical tie", () => {
    const s = createDragSession();
    const step = progressDrag(s, 30, 30, false, THRESHOLD);
    expect(step).toEqual({ live: false, action: "none" });
  });

  it("abandons a horizontal start that later goes vertical", () => {
    const s = createDragSession();
    progressDrag(s, 40, 4, false, THRESHOLD);
    const step = progressDrag(s, 40, 90, false, THRESHOLD);
    expect(step).toEqual({ live: false, action: "none" });
  });

  it("opens a closed drawer on a right swipe past the threshold", () => {
    const s = createDragSession();
    const step = progressDrag(s, 90, 4, false, THRESHOLD);
    expect(step).toEqual({ live: false, action: "open" });
  });

  it("closes an open drawer on a left swipe past the threshold", () => {
    const s = createDragSession();
    const step = progressDrag(s, -90, 4, true, THRESHOLD);
    expect(step).toEqual({ live: false, action: "close" });
  });

  it("does nothing when the swipe direction matches the drawer state", () => {
    const closed = createDragSession();
    expect(progressDrag(closed, -90, 4, false, THRESHOLD).action).toBe("none");
    expect(closed.live).toBe(false);
    const open = createDragSession();
    expect(progressDrag(open, 90, 4, true, THRESHOLD).action).toBe("none");
    expect(open.live).toBe(false);
  });

  it("does nothing below the threshold and keeps tracking", () => {
    const s = createDragSession();
    const step = progressDrag(s, 40, 4, false, THRESHOLD);
    expect(step).toEqual({ live: true, action: "none" });
    expect(s.horizontal).toBe(true);
  });

  it("resolves at exactly the threshold", () => {
    const open = createDragSession();
    expect(progressDrag(open, THRESHOLD, 4, false, THRESHOLD).action).toBe(
      "open",
    );
    const close = createDragSession();
    expect(progressDrag(close, -THRESHOLD, 4, true, THRESHOLD).action).toBe(
      "close",
    );
  });

  it("accumulates deltas across moves before resolving", () => {
    const s = createDragSession();
    progressDrag(s, 30, 4, false, THRESHOLD);
    progressDrag(s, 50, 4, false, THRESHOLD);
    const step = progressDrag(s, 70, 4, false, THRESHOLD);
    expect(step).toEqual({ live: false, action: "open" });
  });

  it("fires once and ignores further deltas", () => {
    const s = createDragSession();
    expect(progressDrag(s, 90, 4, false, THRESHOLD).action).toBe("open");
    const again = progressDrag(s, 120, 4, false, THRESHOLD);
    expect(again).toEqual({ live: false, action: "none" });
  });

  it("treats a dead session as inert from the start", () => {
    const s = createDragSession();
    s.live = false;
    const step = progressDrag(s, 90, 4, false, THRESHOLD);
    expect(step).toEqual({ live: false, action: "none" });
  });

  it("exposes the dead zone used by the platform glue", () => {
    expect(DRAWER_DEAD_ZONE).toBeGreaterThan(0);
  });
});
