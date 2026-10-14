// the one font-size ladder. Both the Settings "Font Size" slider and the
// top-bar A−/A+ step through exactly these sizes, so the two controls can never
// disagree about what the current size is. sizes are the reader body's pixel
// size at fontScale 1; the stored scale is derived as px / BASE_FONT_PX.
//
// kept as plain numbers, no asset imports, so it stays importable under bun test.

export const BASE_FONT_PX = 16;

export const FONT_SIZES: readonly number[] = [12, 14, 15, 16, 18, 20, 24];

export const MIN_FONT_PX = FONT_SIZES[0];
export const MAX_FONT_PX = FONT_SIZES[FONT_SIZES.length - 1];
export const DEFAULT_FONT_PX = BASE_FONT_PX;

// the ladder entry nearest `px`, so any value (a stale stored scale, a slider
// drag) snaps onto the ladder instead of sitting between two entries.
export function nearestFontSize(px: number): number {
  let best = MIN_FONT_PX;
  let bestDistance = Infinity;
  for (const size of FONT_SIZES) {
    const distance = Math.abs(size - px);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = size;
    }
  }
  return best;
}

// the next ladder entry strictly above (dir > 0) or below (dir < 0) `px`, so a
// button lands on the neighbouring size; clamped at the ends rather than wrap.
export function stepFontSize(px: number, dir: number): number {
  if (dir > 0) {
    for (const size of FONT_SIZES) {
      if (size > px) return size;
    }
    return MAX_FONT_PX;
  }
  for (let i = FONT_SIZES.length - 1; i >= 0; i -= 1) {
    if (FONT_SIZES[i] < px) return FONT_SIZES[i];
  }
  return MIN_FONT_PX;
}

// the ladder px -> the stored scale (a ladder entry / BASE_FONT_PX).
export function fontPxToScale(px: number): number {
  return nearestFontSize(px) / BASE_FONT_PX;
}

// the stored scale -> a ladder px.
export function scaleToFontPx(scale: number): number {
  return nearestFontSize(scale * BASE_FONT_PX);
}
