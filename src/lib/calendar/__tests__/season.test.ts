import { describe, expect, test } from "bun:test";
import { toDays } from "../date";
import { advent1, feastsForEasterYear } from "../feasts";
import {
  colorFor,
  easterYear,
  liturgicalYearStart,
  seasonFor,
} from "../season";
import type { Color, Season } from "../types";

describe("advent1", () => {
  test("known Advent Sundays", () => {
    expect(advent1(2024)).toEqual({ year: 2024, month: 12, day: 1 });
    expect(advent1(2025)).toEqual({ year: 2025, month: 11, day: 30 });
    expect(advent1(2026)).toEqual({ year: 2026, month: 11, day: 29 });
  });
});

describe("feastsForEasterYear (2025)", () => {
  const f = feastsForEasterYear(2025);

  test("moveable feasts 2025", () => {
    expect(f.ashWednesday).toBe(toDays({ year: 2025, month: 3, day: 5 }));
    expect(f.lent[0]).toBe(toDays({ year: 2025, month: 3, day: 9 }));
    expect(f.lastEpiphany).toBe(toDays({ year: 2025, month: 3, day: 2 }));
    expect(f.palmSunday).toBe(toDays({ year: 2025, month: 4, day: 13 }));
    expect(f.maundyThursday).toBe(toDays({ year: 2025, month: 4, day: 17 }));
    expect(f.goodFriday).toBe(toDays({ year: 2025, month: 4, day: 18 }));
    expect(f.holySaturday).toBe(toDays({ year: 2025, month: 4, day: 19 }));
    expect(f.easter).toBe(toDays({ year: 2025, month: 4, day: 20 }));
    expect(f.ascension).toBe(toDays({ year: 2025, month: 5, day: 29 }));
    expect(f.pentecost).toBe(toDays({ year: 2025, month: 6, day: 8 }));
    expect(f.trinity).toBe(toDays({ year: 2025, month: 6, day: 15 }));
  });

  test("christmas-cycle feasts 2025", () => {
    expect(f.advent1).toBe(toDays({ year: 2024, month: 12, day: 1 }));
    expect(f.christmas).toBe(toDays({ year: 2024, month: 12, day: 25 }));
    expect(f.firstSundayAfterChristmas).toBe(
      toDays({ year: 2024, month: 12, day: 29 }),
    );
    expect(f.secondSundayAfterChristmas).toBe(
      toDays({ year: 2025, month: 1, day: 5 }),
    );
    expect(f.baptism).toBe(toDays({ year: 2025, month: 1, day: 12 }));
    expect(f.epiphany).toBe(toDays({ year: 2025, month: 1, day: 6 }));
    expect(f.advent1Next).toBe(toDays({ year: 2025, month: 11, day: 30 }));
  });

  test("no Second Sunday after Christmas when Jan 2-5 holds no Sunday", () => {
    const f2024 = feastsForEasterYear(2024);
    expect(f2024.secondSundayAfterChristmas).toBeNull();
  });
});

describe("seasonFor", () => {
  const cases: Array<[string, Season]> = [
    ["2026-11-29", "advent"], // Advent 1 2026
    ["2026-12-24", "advent"], // Christmas Eve (day)
    ["2026-12-25", "christmas"],
    ["2027-01-05", "christmas"], // last day of the Christmas season
    ["2027-01-06", "epiphany"], // Epiphany begins the Epiphany season
    ["2027-01-10", "epiphany"], // Baptism of our Lord
    ["2025-03-05", "lent"], // Ash Wednesday 2025
    ["2025-03-09", "lent"], // Lent 1 2025
    ["2025-04-13", "holy-week"], // Palm Sunday 2025
    ["2025-04-18", "holy-week"], // Good Friday
    ["2025-04-20", "easter"], // Easter Day 2025
    ["2025-05-29", "easter"], // Ascension
    ["2025-06-08", "pentecost"], // Pentecost 2025
    ["2025-06-15", "after-pentecost"], // Trinity 2025
    ["2025-11-27", "after-pentecost"], // 4th Thursday of November
  ];
  for (const [date, season] of cases) {
    test(`${date} -> ${season}`, () => {
      expect(seasonFor(parseIso(date))).toBe(season);
    });
  }
});

describe("colorFor", () => {
  const cases: Array<[string, Color]> = [
    ["2026-11-29", "blue"], // Advent
    ["2026-12-25", "white"], // Christmas
    ["2027-01-06", "white"], // Epiphany (feast of our Lord)
    ["2027-01-10", "white"], // Baptism of our Lord
    ["2027-01-11", "green"], // Epiphany season
    ["2025-03-05", "purple"], // Lent
    ["2025-04-13", "red"], // Palm Sunday
    ["2025-04-17", "white"], // Maundy Thursday
    ["2025-04-18", "black"], // Good Friday
    ["2025-04-19", "black"], // Holy Saturday
    ["2025-04-20", "white"], // Easter
    ["2025-06-08", "red"], // Pentecost
    ["2025-06-15", "green"], // Trinity / after Pentecost
  ];
  for (const [date, color] of cases) {
    test(`${date} -> ${color}`, () => {
      expect(colorFor(parseIso(date))).toBe(color);
    });
  }
});

describe("liturgical year", () => {
  test("liturgicalYearStart", () => {
    const jan = liturgicalYearStart(parseIso("2026-01-15"));
    const dec = liturgicalYearStart(parseIso("2026-12-01"));
    expect(jan).toEqual({ year: 2025, month: 11, day: 30 });
    expect(dec).toEqual({ year: 2026, month: 11, day: 29 });
  });

  test("easterYear", () => {
    expect(easterYear(parseIso("2026-01-15"))).toBe(2026);
    expect(easterYear(parseIso("2026-12-01"))).toBe(2027);
  });
});

function parseIso(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month, day };
}
