import { describe, expect, test } from "bun:test";
import { LESSER_FEASTS, lesserFeastsForDate } from "../lesserFeasts";
import type { CalendarDate } from "../types";

const d = (month: number, day: number): CalendarDate => ({
  year: 2026,
  month,
  day,
});

describe("lesser feasts table", () => {
  test("carries the 2024 calendar without the dates the app already has", () => {
    expect(LESSER_FEASTS).toHaveLength(247);
    expect(lesserFeastsForDate(d(1, 18))).toHaveLength(0);
    expect(lesserFeastsForDate(d(8, 6))).toHaveLength(0);
    expect(lesserFeastsForDate(d(12, 25))).toHaveLength(0);
  });

  test("marks the five trial-use entries", () => {
    const trial = LESSER_FEASTS.filter((f) => f.trial).map((f) => f.name);
    expect(trial).toHaveLength(5);
    expect(trial).toContain("Lili‘uokalani of Hawai‘i");
  });

  test("keeps both commemorations on a shared day", () => {
    expect(lesserFeastsForDate(d(7, 29)).map((f) => f.name)).toEqual([
      "Mary and Martha of Bethany",
      "The Ordination of the Philadelphia Eleven",
    ]);
    expect(lesserFeastsForDate(d(9, 7)).map((f) => f.name)).toEqual([
      "Élie Naud",
      "Kassiani, Poet and Hymnographer, 865",
    ]);
  });

  test("every slug is unique", () => {
    expect(new Set(LESSER_FEASTS.map((f) => f.slug)).size).toBe(
      LESSER_FEASTS.length,
    );
  });
});
