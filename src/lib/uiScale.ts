// the UI scale axis: one multiplier drives a whole-app zoom. the scale is
// stored as the actual multiplier (1 = the original app size), while the
// settings UI talks in percentages of that size. desktops open at 100%,
// small screens open a step larger (see MOBILE_DEFAULT_UI_SCALE_PERCENT)
// because they benefit from more legible chrome.
//
// kept as plain numbers, no asset imports, so it stays importable under bun test.

export const DEFAULT_UI_SCALE = 1;

// small screens default to a larger step than desktops, for readability;
// the settings slider lets anyone tune it from there
export const MOBILE_DEFAULT_UI_SCALE_PERCENT = 120;

// the one UI-scale ladder, mirrored on the settings slider: a short set of
// breakpoints rather than a continuous drag, the way the font-size ladder
// works. 100% is the original app size, and the ends give room to shrink below
// it or grow well past it.
export const UI_SCALE_PERCENTAGES: readonly number[] = [
  75, 90, 100, 110, 120, 135, 150,
];

export const MIN_UI_SCALE = percentToUiScale(UI_SCALE_PERCENTAGES[0]);
export const MAX_UI_SCALE = percentToUiScale(
  UI_SCALE_PERCENTAGES[UI_SCALE_PERCENTAGES.length - 1],
);

// actual multiplier -> the percentage the setting shows (1 -> 100)
export function uiScaleToPercent(scale: number): number {
  return Math.round((scale / DEFAULT_UI_SCALE) * 100);
}

// the out-of-box percentage for a device: small screens open a step larger,
// desktops at the original size. used both for the first run and for Reset.
export function defaultUiScalePercent(isSmallScreen: boolean): number {
  return isSmallScreen
    ? MOBILE_DEFAULT_UI_SCALE_PERCENT
    : uiScaleToPercent(DEFAULT_UI_SCALE);
}

// the percentage the setting shows -> the actual multiplier (100 -> 1)
export function percentToUiScale(percent: number): number {
  return (percent / 100) * DEFAULT_UI_SCALE;
}

// the ladder entry nearest `percent`, so a stale stored value or a drag always
// lands on a real breakpoint
export function nearestUiScalePercent(percent: number): number {
  let best = UI_SCALE_PERCENTAGES[0];
  let bestDistance = Infinity;
  for (const entry of UI_SCALE_PERCENTAGES) {
    const distance = Math.abs(entry - percent);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = entry;
    }
  }
  return best;
}

// snap an actual multiplier onto the ladder
export function snapUiScale(scale: number): number {
  return percentToUiScale(nearestUiScalePercent(uiScaleToPercent(scale)));
}

// keep a stored or dragged value inside the slider's range
export function clampUiScale(scale: number): number {
  return Math.min(MAX_UI_SCALE, Math.max(MIN_UI_SCALE, scale));
}
