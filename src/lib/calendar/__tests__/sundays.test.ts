import { describe, expect, test } from "bun:test";
import { addDays, weekday } from "../date";
import { sundayName } from "../sundays";
import type { CalendarDate } from "../types";

const d = (year: number, month: number, day: number): CalendarDate => ({
  year,
  month,
  day,
});

describe("sundayName", () => {
  test("names the sundays of advent", () => {
    expect(sundayName(d(2024, 12, 8))).toBe("The Second Sunday of Advent");
    expect(sundayName(d(2024, 12, 15))).toBe("The Third Sunday of Advent");
    expect(sundayName(d(2024, 12, 22))).toBe("The Fourth Sunday of Advent");
    expect(sundayName(d(2024, 12, 1))).toBeNull();
  });

  test("leaves the named christmas sundays to the calendar", () => {
    expect(sundayName(d(2024, 12, 29))).toBeNull();
    expect(sundayName(d(2025, 1, 5))).toBeNull();
  });

  test("names the sundays after the epiphany", () => {
    expect(sundayName(d(2025, 1, 19))).toBe(
      "The Second Sunday after the Epiphany",
    );
    expect(sundayName(d(2025, 2, 23))).toBe(
      "The Seventh Sunday after the Epiphany",
    );
    expect(sundayName(d(2025, 1, 12))).toBeNull();
    expect(sundayName(d(2025, 3, 2))).toBeNull();
  });

  test("names the sundays in lent", () => {
    expect(sundayName(d(2025, 3, 9))).toBe("The First Sunday in Lent");
    expect(sundayName(d(2025, 4, 6))).toBe("The Fifth Sunday in Lent");
    expect(sundayName(d(2025, 4, 13))).toBeNull();
  });

  test("names the sundays of easter", () => {
    expect(sundayName(d(2025, 4, 20))).toBeNull();
    expect(sundayName(d(2025, 4, 27))).toBe("The Second Sunday of Easter");
    expect(sundayName(d(2025, 5, 25))).toBe("The Sixth Sunday of Easter");
    expect(sundayName(d(2025, 6, 1))).toBe(
      "The Seventh Sunday of Easter: The Sunday after Ascension Day",
    );
    expect(sundayName(d(2025, 6, 8))).toBeNull();
  });

  test("names the sundays after pentecost and the last sunday", () => {
    expect(sundayName(d(2025, 6, 15))).toBeNull();
    expect(sundayName(d(2025, 6, 22))).toBe(
      "The Second Sunday after Pentecost",
    );
    expect(sundayName(d(2025, 7, 27))).toBe(
      "The Seventh Sunday after Pentecost",
    );
    expect(sundayName(d(2025, 11, 16))).toBe(
      "The Twenty-Third Sunday after Pentecost",
    );
    expect(sundayName(d(2025, 11, 23))).toBe("The Last Sunday after Pentecost");
  });

  test("reaches the twenty-sixth sunday after pentecost", () => {
    expect(sundayName(d(2027, 11, 14))).toBe(
      "The Twenty-Sixth Sunday after Pentecost",
    );
    expect(sundayName(d(2027, 11, 21))).toBe("The Last Sunday after Pentecost");
  });

  test("returns null on every weekday", () => {
    for (let day = d(2025, 1, 1); day.year === 2025; day = addDays(day, 1)) {
      if (weekday(day) !== 0) expect(sundayName(day)).toBeNull();
    }
  });
});
