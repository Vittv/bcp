import { describe, expect, test } from "bun:test";
import {
  firstLesserFeastForDate,
  LESSER_FEASTS,
  lesserFeastBySlug,
  lesserFeastsForDate,
  upcomingLesserFeast,
} from "../lesserFeasts";
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

  test("every slug resolves to its row", () => {
    for (const feast of LESSER_FEASTS) {
      expect(lesserFeastBySlug(feast.slug)).toEqual(feast);
    }
    expect(lesserFeastBySlug("not-a-feast")).toBeUndefined();
  });

  test("defaults to the day's first feast, else the first entry", () => {
    expect(firstLesserFeastForDate(d(7, 29)).name).toBe(
      "Mary and Martha of Bethany",
    );
    // Jan 18 is the Confession of Saint Peter, so no lesser feast remains
    expect(firstLesserFeastForDate(d(1, 18))).toEqual(LESSER_FEASTS[0]);
  });

  test("finds the next feast at or after a date", () => {
    expect(upcomingLesserFeast(d(1, 1)).slug).toBe(LESSER_FEASTS[0].slug);
    expect(upcomingLesserFeast(d(1, 4)).name).toContain("Elizabeth Ann Seton");
    expect(upcomingLesserFeast(d(12, 30)).name).toContain(
      "Frances Joseph Gaudet",
    );
  });
});
