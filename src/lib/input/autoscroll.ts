// Middle-button ("scroll click") autoscroll helpers. Browsers and webviews
// disagree on native support (WebKit and WebKitGTK have none), so the
// desktop shell implements the standard gesture uniformly: hold the scroll
// button, an indicator parks where the button went down, and the scroller
// under the cursor moves at a speed proportional to how far the pointer
// travels from that anchor.

export const AUTOSCROLL_DEAD_ZONE = 8;
// px scrolled per frame per px of pointer travel past the dead zone, at a
// 60fps baseline; the loop scales it by the real frame delta
export const AUTOSCROLL_SPEED = 0.12;

// the minimal surface findScrollableAncestor needs from a DOM node, kept
// structural so tests pass plain objects and the hook passes real Elements
export type Scroller = {
  scrollTop: number;
  scrollLeft: number;
  scrollHeight: number;
  scrollWidth: number;
  clientHeight: number;
  clientWidth: number;
  parentElement: Scroller | null;
};

export type AutoscrollDelta = { top: number; left: number };

// walk from the pointer's hit element up to the deepest node that can
// actually scroll (content overflows its box), so nested scrollers like
// the SplitPane panes win over the page column
export function findScrollableAncestor(
  start: Scroller | null,
): Scroller | null {
  let el = start;
  while (el) {
    if (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth) {
      return el;
    }
    el = el.parentElement;
  }
  return null;
}

// the per-frame scroll deltas for a scroller given how far the pointer has
// moved from its anchor; zero within the dead zone and clamped to the box
// so the panes never over-scroll. speedScale is the frame-rate ratio
// (dt / 16.667ms) so fast displays don't scroll proportionally faster.
export function autoscrollDelta(
  target: Scroller,
  offsetX: number,
  offsetY: number,
  speedScale: number,
): AutoscrollDelta {
  return {
    top: axisDelta(
      offsetY,
      target.scrollTop,
      target.scrollHeight - target.clientHeight,
      speedScale,
    ),
    left: axisDelta(
      offsetX,
      target.scrollLeft,
      target.scrollWidth - target.clientWidth,
      speedScale,
    ),
  };
}

function axisDelta(
  offset: number,
  current: number,
  deltaMax: number,
  speedScale: number,
): number {
  const past = Math.abs(offset) - AUTOSCROLL_DEAD_ZONE;
  if (past <= 0 || deltaMax <= 0) return 0;
  const step = Math.sign(offset) * past * AUTOSCROLL_SPEED * speedScale;
  return Math.max(0, Math.min(deltaMax, current + step)) - current;
}
