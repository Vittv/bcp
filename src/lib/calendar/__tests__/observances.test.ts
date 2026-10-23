import { describe, expect, test } from "bun:test";
import { dayInfo, seasonLabel } from "../observances";
import type { CalendarDate } from "../types";

const d = (year: number, month: number, day: number): CalendarDate => ({
  year,
  month,
  day,
});

const names = (date: CalendarDate): string[] =>
  dayInfo(date).observances.map((o) => o.name);

describe("dayInfo: moveable feasts (2025 liturgical year)", () => {
  test("christmas cycle", () => {
    expect(names(d(2024, 12, 25))).toContain("Christmas Day");
    expect(names(d(2024, 12, 24))).toContain("Christmas Eve");
    expect(names(d(2025, 1, 6))).toContain("The Epiphany");
  });

  test("lent and holy week", () => {
    expect(names(d(2025, 3, 5))).toContain("Ash Wednesday");
    expect(names(d(2025, 4, 13))).toContain(
      "Sunday of the Passion: Palm Sunday",
    );
    expect(names(d(2025, 4, 18))).toContain("Good Friday");
    expect(names(d(2025, 4, 20))).toContain("Easter Day");
  });

  test("easter-to-pentecost", () => {
    expect(names(d(2025, 5, 29))).toContain("Ascension Day");
    expect(names(d(2025, 6, 8))).toContain("The Day of Pentecost");
    expect(names(d(2025, 6, 15))).toContain("Trinity Sunday");
  });
});

describe("dayInfo: fixed feasts and saints", () => {
  test("holy name", () => {
    expect(names(d(2025, 1, 1))).toContain(
      "The Holy Name of Our Lord Jesus Christ",
    );
  });

  test("saint days carry a slug", () => {
    const info = dayInfo(d(2025, 12, 21));
    expect(info.observances.some((o) => o.name.includes("Andrew"))).toBe(false);
    expect(
      info.observances.some((o) => o.name === "Saint Thomas the Apostle"),
    ).toBe(true);
    const st = info.observances.find((o) => o.slug);
    expect(st?.slug).toBe("st-thomas");
  });

  test("all saints is present on nov 1", () => {
    expect(names(d(2025, 11, 1))).toContain("All Saints' Day");
  });

  test("lesser feasts follow a principal feast and stay optional", () => {
    const info = dayInfo(d(2025, 1, 12));
    expect(info.observances[0].name).toBe("The Baptism of our Lord");
    const lesser = info.observances.filter((o) => o.rank === "lesser");
    expect(lesser.map((o) => o.name)).toContain(
      "Aelred of Rievaulx, Monastic and Theologian, 1167",
    );
    expect(lesser[0].optional).toBe(true);
    expect(info.observances.at(-1)?.rank).toBe("lesser");
  });

  test("a lesser feast stands alone on a weekday", () => {
    const info = dayInfo(d(2025, 2, 13));
    expect(info.observances.map((o) => o.name)).toContain(
      "Absalom Jones, Priest, 1818",
    );
    expect(info.observances[0].rank).toBe("lesser");
  });

  test("every sunday closes the list with its own name", () => {
    const info = dayInfo(d(2025, 7, 27));
    expect(info.observances.map((o) => o.name)).toEqual([
      "William Reed Huntington, Priest, 1909",
      "The Seventh Sunday after Pentecost",
    ]);
    expect(info.observances.at(-1)?.rank).toBe("sunday");
    expect(info.observances[0].rank).toBe("lesser");
  });

  test("a holy day outranks the sunday name", () => {
    const info = dayInfo(d(2026, 11, 1));
    expect(info.observances.map((o) => o.name)).toEqual([
      "All Saints' Day",
      "The Twenty-Third Sunday after Pentecost",
    ]);
    expect(info.observances[0].rank).toBe("holy-day");
    expect(info.observances.at(-1)?.rank).toBe("sunday");
  });

  test("a named sunday is not duplicated", () => {
    const info = dayInfo(d(2025, 4, 20));
    expect(info.observances.filter((o) => o.rank === "sunday")).toHaveLength(0);
  });
});

describe("dayInfo: season boundaries", () => {
  test("advent starts the year", () => {
    const start = dayInfo(d(2024, 12, 1));
    expect(start.season).toBe("advent");
    expect(start.seasonStart).toBe(true);
    expect(start.seasonEnd).toBe(false);
  });

  test("advent ends on christmas eve, christmas begins on christmas day", () => {
    const eve = dayInfo(d(2024, 12, 24));
    expect(eve.season).toBe("advent");
    expect(eve.seasonEnd).toBe(true);
    expect(eve.seasonStart).toBe(false);

    const day = dayInfo(d(2024, 12, 25));
    expect(day.season).toBe("christmas");
    expect(day.seasonStart).toBe(true);
    expect(day.seasonEnd).toBe(false);
  });

  test("lent starts on ash wednesday and ends before palm sunday", () => {
    const start = dayInfo(d(2025, 3, 5));
    expect(start.season).toBe("lent");
    expect(start.seasonStart).toBe(true);
    const end = dayInfo(d(2025, 4, 12));
    expect(end.season).toBe("lent");
    expect(end.seasonEnd).toBe(true);
  });

  test("easter begins on easter day", () => {
    const start = dayInfo(d(2025, 4, 20));
    expect(start.season).toBe("easter");
    expect(start.seasonStart).toBe(true);
  });

  test("after-pentecost starts the monday after pentecost", () => {
    const start = dayInfo(d(2025, 6, 9));
    expect(start.season).toBe("after-pentecost");
    expect(start.seasonStart).toBe(true);
  });

  test("after-pentecost ends the day before advent", () => {
    const end = dayInfo(d(2025, 11, 29));
    expect(end.season).toBe("after-pentecost");
    expect(end.seasonEnd).toBe(true);
  });
});

describe("seasonLabel", () => {
  test("labels seasons", () => {
    expect(seasonLabel("advent")).toBe("Advent");
    expect(seasonLabel("after-pentecost")).toBe("After Pentecost");
    expect(seasonLabel("pentecost")).toBe("Pentecost");
  });
});
