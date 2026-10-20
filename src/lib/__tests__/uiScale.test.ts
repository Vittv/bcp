import { describe, expect, it } from "bun:test";
import {
  clampUiScale,
  DEFAULT_UI_SCALE,
  defaultUiScalePercent,
  MAX_UI_SCALE,
  MIN_UI_SCALE,
  MOBILE_DEFAULT_UI_SCALE_PERCENT,
  nearestUiScalePercent,
  percentToUiScale,
  snapUiScale,
  UI_SCALE_PERCENTAGES,
  uiScaleToPercent,
} from "../uiScale";

describe("UI scale ladder", () => {
  it("is ascending and centered on the 100% default", () => {
    const sorted = [...UI_SCALE_PERCENTAGES].sort((a, b) => a - b);
    expect(UI_SCALE_PERCENTAGES).toEqual(sorted);
    expect(UI_SCALE_PERCENTAGES).toContain(100);
    expect(UI_SCALE_PERCENTAGES).toContain(MOBILE_DEFAULT_UI_SCALE_PERCENT);
    expect(uiScaleToPercent(DEFAULT_UI_SCALE)).toBe(100);
  });

  it("brackets the default with min and max", () => {
    expect(MIN_UI_SCALE).toBe(percentToUiScale(UI_SCALE_PERCENTAGES[0]));
    expect(MAX_UI_SCALE).toBe(
      percentToUiScale(UI_SCALE_PERCENTAGES[UI_SCALE_PERCENTAGES.length - 1]),
    );
    expect(MIN_UI_SCALE).toBeLessThan(DEFAULT_UI_SCALE);
    expect(MAX_UI_SCALE).toBeGreaterThan(DEFAULT_UI_SCALE);
  });
});

describe("UI scale conversions", () => {
  it("round-trips every ladder entry through the stored multiplier", () => {
    for (const percent of UI_SCALE_PERCENTAGES) {
      expect(uiScaleToPercent(percentToUiScale(percent))).toBe(percent);
    }
  });

  it("maps 100% to the default multiplier", () => {
    expect(percentToUiScale(100)).toBe(DEFAULT_UI_SCALE);
  });

  it("offers the first-run default for each screen size", () => {
    expect(defaultUiScalePercent(false)).toBe(100);
    expect(defaultUiScalePercent(true)).toBe(MOBILE_DEFAULT_UI_SCALE_PERCENT);
  });
});

describe("nearestUiScalePercent", () => {
  it("returns an exact ladder entry unchanged", () => {
    for (const percent of UI_SCALE_PERCENTAGES) {
      expect(nearestUiScalePercent(percent)).toBe(percent);
    }
  });

  it("snaps a value between entries to the nearest one", () => {
    expect(nearestUiScalePercent(82)).toBe(75);
    expect(nearestUiScalePercent(94)).toBe(90);
    expect(nearestUiScalePercent(104)).toBe(100);
    expect(nearestUiScalePercent(117)).toBe(120);
    expect(nearestUiScalePercent(140)).toBe(135);
  });

  it("breaks an exact tie toward the lower entry", () => {
    expect(nearestUiScalePercent(95)).toBe(90);
    expect(nearestUiScalePercent(105)).toBe(100);
    expect(nearestUiScalePercent(127.5)).toBe(120);
  });
});

describe("snapUiScale", () => {
  it("lands an off-ladder multiplier on a breakpoint", () => {
    expect(uiScaleToPercent(snapUiScale(1.2))).toBe(120);
    expect(uiScaleToPercent(snapUiScale(0.83))).toBe(90);
  });
});

describe("clampUiScale", () => {
  it("keeps values inside the ladder's ends", () => {
    expect(clampUiScale(0.5)).toBe(MIN_UI_SCALE);
    expect(clampUiScale(5)).toBe(MAX_UI_SCALE);
    expect(clampUiScale(1.1)).toBe(1.1);
  });
});
