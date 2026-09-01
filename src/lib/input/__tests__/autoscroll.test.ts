import { describe, expect, it } from "bun:test";
import {
  AUTOSCROLL_DEAD_ZONE,
  autoscrollDelta,
  findScrollableAncestor,
  type Scroller,
} from "../autoscroll";

// fake node chain: each node knows the next parent up and overflows when
// its content box grows past the client box
function scroller(
  over: { top?: number; left?: number },
  parent: Scroller | null = null,
): Scroller {
  return {
    scrollTop: 0,
    scrollLeft: 0,
    scrollHeight: 100 + (over.top ?? 0),
    scrollWidth: 100 + (over.left ?? 0),
    clientHeight: 100,
    clientWidth: 100,
    parentElement: parent,
  };
}

function chain(...over: ({ top?: number; left?: number } | null)[]): Scroller {
  let node: Scroller | null = null;
  for (let i = over.length - 1; i >= 0; i--) {
    const box = over[i];
    if (box === null) continue;
    node = scroller(box, node);
  }
  // SAFETY: at least one non-null box is required by the tests
  return node as Scroller;
}

describe("findScrollableAncestor", () => {
  it("returns null when the pointer is not over anything", () => {
    expect(findScrollableAncestor(null)).toBeNull();
  });

  it("returns null when no ancestor overflows its box", () => {
    const hit = chain(null, null, null);
    expect(findScrollableAncestor(hit)).toBeNull();
  });

  it("returns the deepest box that overflows", () => {
    const hit = chain({ top: 40 }, { left: 30 });
    const found = findScrollableAncestor(hit);
    expect(found).not.toBeNull();
    expect(found?.scrollHeight).toBe(140);
  });

  it("ignores non-overflowing nodes between the hit and the scroller", () => {
    const hit = chain(null, { top: 40 }, null);
    const found = findScrollableAncestor(hit);
    expect(found?.scrollHeight).toBe(140);
  });
});

describe("autoscrollDelta", () => {
  it("is zero within the dead zone", () => {
    const target = scroller({ top: 40, left: 30 });
    const d = autoscrollDelta(
      target,
      AUTOSCROLL_DEAD_ZONE - 1,
      AUTOSCROLL_DEAD_ZONE - 1,
      1,
    );
    expect(d).toEqual({ top: 0, left: 0 });
  });

  it("scrolls the guarded axis only", () => {
    const target = scroller({ top: 40 });
    const d = autoscrollDelta(target, 50, 100, 1);
    expect(d.left).toBe(0);
    expect(d.top).toBeGreaterThan(0);
  });

  it("tracks the pointer direction", () => {
    const target = scroller({ top: 80, left: 30 });
    target.scrollTop = 40;
    const down = autoscrollDelta(target, 0, 100, 1);
    const up = autoscrollDelta(target, 0, -100, 1);
    expect(down.top).toBeGreaterThan(0);
    expect(up.top).toBeLessThan(0);
  });

  it("scales with the frame-rate ratio", () => {
    const half = scroller({ top: 40 });
    const full = scroller({ top: 40 });
    const dHalf = autoscrollDelta(half, 0, 100, 0.5);
    const dFull = autoscrollDelta(full, 0, 100, 1);
    expect(dFull.top).toBeGreaterThan(dHalf.top);
  });

  it("clamps at the box bounds", () => {
    const target = scroller({ top: 40 });
    target.scrollTop = 40;
    const d = autoscrollDelta(target, 0, 1000, 10);
    expect(d.top).toBe(0);
  });
});
