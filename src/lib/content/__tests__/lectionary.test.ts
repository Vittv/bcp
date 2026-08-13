import { describe, expect, test } from "bun:test";
import { resolve } from "../../calendar/dol";
import {
  entryForDate,
  entryForDay,
  entryForEvening,
  validateLectionary,
} from "../lectionary";

describe("validateLectionary", () => {
  test("every psalm and lesson parses", () => {
    expect(validateLectionary()).toEqual([]);
  });
});

describe("entryForDay", () => {
  test("Advent 1 2026 (Year One)", () => {
    const slot = resolve({ year: 2026, month: 11, day: 29 });
    const entry = entryForDay(slot);
    expect(entry?.title).toBe("The First Sunday of Advent");
  });

  test("First Sunday in Lent 2025", () => {
    const slot = resolve({ year: 2025, month: 3, day: 9 });
    const entry = entryForDay(slot);
    expect(entry?.title).toBe("The First Sunday in Lent");
  });

  test("Week of Lent days after Ash Wednesday", () => {
    const slot = resolve({ year: 2025, month: 3, day: 6 }); // Thursday
    const entry = entryForDay(slot);
    expect(entry?.day).toBe("Thursday");
    expect(entry?.season).toBe("Lent");
  });

  test("Ash Wednesday special day", () => {
    const slot = resolve({ year: 2025, month: 3, day: 5 });
    const entry = entryForDay(slot);
    expect(entry?.title).toBe("The First Day of Lent, or Ash Wednesday");
  });

  test("Pentecost", () => {
    const slot = resolve({ year: 2025, month: 6, day: 8 });
    const entry = entryForDay(slot);
    expect(entry?.title).toBe("The Day of Pentecost: Whitsunday");
  });

  test("Trinity Sunday", () => {
    const slot = resolve({ year: 2025, month: 6, day: 15 });
    const entry = entryForDay(slot);
    expect(entry?.title).toBe(
      "The First Sunday after Pentecost: Trinity Sunday",
    );
  });

  test("Christmas Day", () => {
    const slot = resolve({ year: 2025, month: 12, day: 25 });
    const entry = entryForDay(slot);
    expect(entry?.title).toBe(
      "The Nativity of Our Lord Jesus Christ: Christmas Day",
    );
  });

  test("First Sunday after Christmas beats St John when they coincide", () => {
    // 2026-12-27 is both the First Sunday after Christmas and St John.
    const slot = resolve({ year: 2026, month: 12, day: 27 });
    const entry = entryForDay(slot);
    expect(entry?.title).toBe("The First Sunday after Christmas");
  });

  test("St John on an ordinary day", () => {
    const slot = resolve({ year: 2025, month: 12, day: 27 });
    const entry = entryForDay(slot);
    expect(entry?.title).toBe("Saint John, Apostle and Evangelist");
  });

  test("fixed-date holy day from the holy-days table", () => {
    const slot = resolve({ year: 2025, month: 11, day: 30 });
    const entry = entryForDay(slot);
    expect(entry?.title).toBe("Saint Andrew the Apostle");
  });

  test("Independence Day keeps only ordinary Proper readings", () => {
    const slot = resolve({ year: 2025, month: 7, day: 4 });
    const entry = entryForDay(slot);
    expect(entry?.title).toBeUndefined();
    expect(entry?.day).toBe("Friday");
    expect(slot.holyDay).toBeUndefined();
  });
});

describe("entryForEvening", () => {
  test("Christmas Eve evening uses the Christmas Eve readings", () => {
    const slot = resolve({ year: 2024, month: 12, day: 24 });
    const evening = entryForEvening(slot);
    expect(evening?.title).toBe("Christmas Eve");
  });

  test("Eve of the Ascension", () => {
    // 2025-05-29 is Ascension Day; its eve is the day before.
    const slot = resolve({ year: 2025, month: 5, day: 28 });
    const evening = entryForEvening(slot);
    expect(evening?.title).toBe("Eve of Ascension");
  });

  test("no evening special on ordinary days", () => {
    const slot = resolve({ year: 2025, month: 3, day: 9 });
    expect(entryForEvening(slot)).toBeUndefined();
  });
});

describe("entryForDate", () => {
  test("resolves from a civil date", () => {
    const entry = entryForDate({ year: 2025, month: 6, day: 15 });
    expect(entry?.title).toBe(
      "The First Sunday after Pentecost: Trinity Sunday",
    );
  });
});
