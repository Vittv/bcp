import { describe, expect, it } from "bun:test";
import {
  BASE_FONT_PX,
  DEFAULT_FONT_PX,
  FONT_SIZES,
  fontPxToScale,
  MAX_FONT_PX,
  MIN_FONT_PX,
  nearestFontSize,
  scaleToFontPx,
  stepFontSize,
} from "../sizes";

describe("font size ladder", () => {
  it("is ascending and brackets the base", () => {
    const sorted = [...FONT_SIZES].sort((a, b) => a - b);
    expect(FONT_SIZES).toEqual(sorted);
    expect(FONT_SIZES).toContain(DEFAULT_FONT_PX);
    expect(MIN_FONT_PX).toBe(FONT_SIZES[0]);
    expect(MAX_FONT_PX).toBe(FONT_SIZES[FONT_SIZES.length - 1]);
  });
});

describe("nearestFontSize", () => {
  it("returns an exact ladder entry unchanged", () => {
    for (const size of FONT_SIZES) expect(nearestFontSize(size)).toBe(size);
  });

  it("snaps a value between entries to the nearest one", () => {
    expect(nearestFontSize(13.9)).toBe(14);
    expect(nearestFontSize(21.6)).toBe(20);
    expect(nearestFontSize(16.8)).toBe(16);
    expect(nearestFontSize(23.9)).toBe(24);
  });

  it("breaks an exact tie toward the lower entry", () => {
    expect(nearestFontSize(13)).toBe(12);
    expect(nearestFontSize(17)).toBe(16);
    expect(nearestFontSize(22)).toBe(20);
  });
});

describe("stepFontSize", () => {
  it("walks the ladder up and down", () => {
    expect(stepFontSize(16, 1)).toBe(18);
    expect(stepFontSize(16, -1)).toBe(15);
    expect(stepFontSize(15, 1)).toBe(16);
    expect(stepFontSize(20, 1)).toBe(24);
    expect(stepFontSize(20, -1)).toBe(18);
  });

  it("clamps at the ends instead of wrapping", () => {
    expect(stepFontSize(MIN_FONT_PX, -1)).toBe(MIN_FONT_PX);
    expect(stepFontSize(MAX_FONT_PX, 1)).toBe(MAX_FONT_PX);
  });

  it("steps from an off-ladder value to the next entry in that direction", () => {
    expect(stepFontSize(17.4, 1)).toBe(18);
    expect(stepFontSize(17.4, -1)).toBe(16);
  });
});

describe("scale conversion", () => {
  it("maps the base to 1 and the ends to the expected ratios", () => {
    expect(fontPxToScale(BASE_FONT_PX)).toBe(1);
    expect(fontPxToScale(MIN_FONT_PX)).toBe(0.75);
    expect(fontPxToScale(MAX_FONT_PX)).toBe(1.5);
  });

  it("snaps a scale to the nearest ladder px", () => {
    expect(scaleToFontPx(1)).toBe(16);
    expect(scaleToFontPx(1.35)).toBe(20);
    expect(scaleToFontPx(0.75)).toBe(12);
    expect(scaleToFontPx(1.5)).toBe(24);
  });

  it("round-trips every ladder entry through the scale", () => {
    for (const size of FONT_SIZES) {
      expect(scaleToFontPx(fontPxToScale(size))).toBe(size);
    }
  });
});
