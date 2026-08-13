import { describe, expect, test } from "bun:test";
import {
  addDays,
  civilFromDays,
  daysFromCivil,
  daysInMonth,
  diffDays,
  isLeapYear,
  sundayOfWeek,
  sundayOnOrAfter,
  sundayOnOrBefore,
  toDays,
  weekday,
} from "../date";

describe("civil date math", () => {
  test("daysFromCivil round-trips with civilFromDays", () => {
    const dates = [
      "2025-01-01",
      "2024-02-29",
      "1970-01-01",
      "2000-12-31",
      "2099-07-04",
      "2026-11-29",
    ];
    for (const iso of dates) {
      const [year, month, day] = iso.split("-").map(Number);
      expect(civilFromDays(daysFromCivil(year, month, day))).toEqual({
        year,
        month,
        day,
      });
    }
  });

  test("known epoch offset", () => {
    expect(daysFromCivil(1970, 1, 1)).toBe(0);
  });

  test("leap years", () => {
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2025)).toBe(false);
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2025, 2)).toBe(28);
    expect(daysInMonth(2025, 4)).toBe(30);
  });

  test("weekday Sunday = 0", () => {
    expect(weekday({ year: 2025, month: 6, day: 15 })).toBe(0);
    expect(weekday({ year: 2025, month: 6, day: 16 })).toBe(1);
    expect(weekday({ year: 2025, month: 6, day: 21 })).toBe(6);
  });

  test("sundayOnOrBefore", () => {
    const a = sundayOnOrBefore({ year: 2025, month: 6, day: 19 });
    const b = sundayOnOrBefore({ year: 2025, month: 6, day: 15 });
    expect(a).toEqual({ year: 2025, month: 6, day: 15 });
    expect(b).toEqual({ year: 2025, month: 6, day: 15 });
  });

  test("sundayOnOrAfter", () => {
    const a = sundayOnOrAfter({ year: 2025, month: 1, day: 6 });
    const b = sundayOnOrAfter({ year: 2025, month: 12, day: 25 });
    expect(a).toEqual({ year: 2025, month: 1, day: 12 });
    expect(b).toEqual({ year: 2025, month: 12, day: 28 });
  });

  test("sundayOfWeek (Mon-Sun week)", () => {
    const a = sundayOfWeek({ year: 2025, month: 6, day: 16 });
    const b = sundayOfWeek({ year: 2025, month: 6, day: 22 });
    expect(a).toEqual({ year: 2025, month: 6, day: 22 });
    expect(b).toEqual({ year: 2025, month: 6, day: 22 });
  });

  test("addDays and diffDays", () => {
    const easter = { year: 2025, month: 4, day: 20 };
    expect(addDays(easter, 39)).toEqual({ year: 2025, month: 5, day: 29 });
    expect(diffDays(addDays(easter, 49), easter)).toBe(49);
    expect(toDays(addDays(easter, -46))).toBe(
      toDays({ year: 2025, month: 3, day: 5 }),
    );
  });
});
