import { describe, expect, test } from "bun:test";
import { dolYear, holyDayFor, properIndex, resolve } from "../dol";

describe("dolYear", () => {
  test("Year One begins on Advent 1 preceding odd-numbered years", () => {
    expect(dolYear({ year: 1976, month: 12, day: 1 })).toBe(1); // Advent 1 1976
    expect(dolYear({ year: 2024, month: 12, day: 1 })).toBe(1); // Advent 2024 -> Year One
    expect(dolYear({ year: 2025, month: 6, day: 15 })).toBe(1); // before Advent 2025
    expect(dolYear({ year: 2025, month: 12, day: 1 })).toBe(2); // Advent 2025 -> Year Two
    expect(dolYear({ year: 2026, month: 1, day: 15 })).toBe(2);
    expect(dolYear({ year: 2026, month: 11, day: 29 })).toBe(1); // Advent 1 2026
  });
});

describe("resolve golden tests", () => {
  test("Advent 1 2026", () => {
    const slot = resolve({ year: 2026, month: 11, day: 29 });
    expect(slot.year).toBe(1);
    expect(slot.week).toEqual({ kind: "advent", week: 1 });
    expect(slot.day).toEqual({ kind: "weekday", weekday: 0 });
  });

  test("Lent 1 2025", () => {
    const slot = resolve({ year: 2025, month: 3, day: 9 });
    expect(slot.year).toBe(1);
    expect(slot.week).toEqual({ kind: "lent", week: 1 });
    expect(slot.day).toEqual({ kind: "weekday", weekday: 0 });
  });

  test("Christmas Eve combined (day = Advent 4 weekday, evening = Christmas)", () => {
    const slot = resolve({ year: 2024, month: 12, day: 24 });
    expect(slot.week).toEqual({ kind: "advent", week: 4 });
    expect(slot.day).toEqual({ kind: "special", name: "dec-24" });
    expect(slot.evening).toEqual({ kind: "special", name: "christmas-eve" });
  });

  test("Pentecost 2025", () => {
    const slot = resolve({ year: 2025, month: 6, day: 8 });
    expect(slot.week).toEqual({ kind: "pentecost" });
    expect(slot.day).toEqual({ kind: "special", name: "pentecost" });
  });

  test("Trinity 2025 (Proper closest to June 15)", () => {
    const slot = resolve({ year: 2025, month: 6, day: 15 });
    expect(slot.day).toEqual({ kind: "special", name: "trinity" });
  });
});

describe("DOL special-case days", () => {
  test("Ash Wednesday sits in the Week of Last Epiphany", () => {
    const slot = resolve({ year: 2025, month: 3, day: 5 });
    expect(slot.week).toEqual({ kind: "last-epiphany" });
    expect(slot.day).toEqual({ kind: "special", name: "ash-wednesday" });
  });

  test("Good Friday", () => {
    const slot = resolve({ year: 2025, month: 4, day: 18 });
    expect(slot.week).toEqual({ kind: "holy-week" });
    expect(slot.day).toEqual({ kind: "special", name: "good-friday" });
  });

  test("Maundy Thursday and Holy Saturday", () => {
    expect(resolve({ year: 2025, month: 4, day: 17 }).day).toEqual({
      kind: "special",
      name: "maundy-thursday",
    });
    expect(resolve({ year: 2025, month: 4, day: 19 }).day).toEqual({
      kind: "special",
      name: "holy-saturday",
    });
  });

  test("Ascension is in the Week of 6 Easter", () => {
    const slot = resolve({ year: 2025, month: 5, day: 29 });
    expect(slot.week).toEqual({ kind: "easter", week: 6 });
    expect(slot.day).toEqual({ kind: "special", name: "ascension" });
  });

  test("Christmas Day", () => {
    const slot = resolve({ year: 2025, month: 12, day: 25 });
    expect(slot.week).toEqual({ kind: "christmas-following" });
    expect(slot.day).toEqual({ kind: "special", name: "christmas-day" });
  });

  test("Holy Name and the Second Sunday after Christmas", () => {
    expect(resolve({ year: 2025, month: 1, day: 1 }).day).toEqual({
      kind: "special",
      name: "holy-name",
    });
    const jan5 = resolve({ year: 2025, month: 1, day: 5 });
    expect(jan5.day).toEqual({
      kind: "special",
      name: "second-sunday-after-christmas",
    });
    expect(jan5.evening).toEqual({ kind: "special", name: "eve-of-epiphany" });
  });

  test("Epiphany and dated days after it", () => {
    expect(resolve({ year: 2025, month: 1, day: 6 }).day).toEqual({
      kind: "special",
      name: "epiphany",
    });
    expect(resolve({ year: 2025, month: 1, day: 7 }).day).toEqual({
      kind: "special",
      name: "jan-7",
    });
  });

  test("St. Stephen / St. John / Holy Innocents fall inside the Christmas table", () => {
    // Christmas 2026 falls on a Friday, so Dec 26-28 are all weekdays.
    expect(resolve({ year: 2026, month: 12, day: 26 }).day).toEqual({
      kind: "special",
      name: "st-stephen",
    });
    expect(resolve({ year: 2026, month: 12, day: 28 }).day).toEqual({
      kind: "special",
      name: "holy-innocents",
    });
    // Christmas 2025 falls on a Thursday: Dec 28 is the 1st Sunday after Christmas.
    expect(resolve({ year: 2025, month: 12, day: 27 }).day).toEqual({
      kind: "special",
      name: "st-john",
    });
  });

  test("First Sunday after Christmas takes precedence over St. John", () => {
    // Dec 27 2026 is the First Sunday after Christmas.
    const slot = resolve({ year: 2026, month: 12, day: 27 });
    expect(slot.day).toEqual({
      kind: "special",
      name: "first-sunday-after-christmas",
    });
    expect(slot.holyDay).toBe("st-john");
  });

  test("Eve of Pentecost closes the Week of 7 Easter", () => {
    const slot = resolve({ year: 2025, month: 6, day: 7 });
    expect(slot.week).toEqual({ kind: "easter", week: 7 });
    expect(slot.day).toEqual({ kind: "special", name: "eve-of-pentecost" });
  });

  test("Eve of Ascension evening", () => {
    const slot = resolve({ year: 2025, month: 5, day: 28 });
    expect(slot.week).toEqual({ kind: "easter", week: 6 });
    expect(slot.evening).toEqual({ kind: "special", name: "eve-of-ascension" });
  });
});

describe("properIndex (Season after Pentecost)", () => {
  test("2025 dates", () => {
    // Pentecost June 8 -> weekdays after it use Proper 5 (closest to June 8)
    expect(properIndex({ year: 2025, month: 6, day: 10 })).toBe(5);
    // Trinity Sunday June 15 and its week -> Proper 6 (closest to June 15)
    expect(properIndex({ year: 2025, month: 6, day: 15 })).toBe(6);
    expect(properIndex({ year: 2025, month: 6, day: 16 })).toBe(6);
    expect(properIndex({ year: 2025, month: 6, day: 21 })).toBe(6);
    // Weekly cycle resumes: Sunday June 22 starts the week of Proper 7
    expect(properIndex({ year: 2025, month: 6, day: 22 })).toBe(7);
    expect(properIndex({ year: 2025, month: 6, day: 23 })).toBe(8);
    // Proper 25 (anchor October 26) week
    expect(properIndex({ year: 2025, month: 10, day: 20 })).toBe(25);
    // Proper 29 closes the season
    expect(properIndex({ year: 2025, month: 11, day: 17 })).toBe(29);
  });

  test("late Easter 2038", () => {
    // Easter 2038 (Apr 25): Pentecost June 13, Trinity June 20.
    expect(properIndex({ year: 2038, month: 6, day: 14 })).toBe(6);
  });

  test("holyDayFor fixed dates", () => {
    expect(holyDayFor({ year: 2025, month: 11, day: 30 })).toBe("st-andrew");
    expect(holyDayFor({ year: 2025, month: 11, day: 27 })).toBeUndefined();
    expect(holyDayFor({ year: 2025, month: 3, day: 25 })).toBe("annunciation");
    expect(holyDayFor({ year: 2025, month: 8, day: 6 })).toBe(
      "transfiguration",
    );
    expect(holyDayFor({ year: 2025, month: 2, day: 14 })).toBeUndefined();
  });
});
