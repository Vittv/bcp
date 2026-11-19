import { describe, expect, it } from "bun:test";
import {
  bcp1962CycleLabel,
  bcp1962EcclesiasticalYear,
  bcp1962FirstAdvent,
  bcp1962MoveableDays,
  bcp1962ShortCycleLabel,
  bcp1962YearForDate,
  resolveBcp1962Observance,
} from "../bcp1962";

const at = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
};

describe("bcp1962 narrow status-bar cycle label", () => {
  it("shortens the year and numbered Sunday", () => {
    expect(bcp1962ShortCycleLabel(at("2026-11-29"))).toBe("Y1 Ad 1");
    expect(bcp1962ShortCycleLabel(at("2027-10-17"))).toBe("Y1 Tr 21");
  });
});

describe("bcp1962 status-bar cycle label", () => {
  it("names the year and the numbered Sunday", () => {
    expect(bcp1962CycleLabel(at("2026-11-29"))).toBe(
      "Year I • First Sunday in Advent",
    );
    expect(bcp1962CycleLabel(at("2027-10-17"))).toBe(
      "Year I • Twenty-first Sunday after Trinity",
    );
  });

  it("names named seasons and the Sunday next before Advent", () => {
    expect(bcp1962CycleLabel(at("2026-12-25"))).toContain("Christmastide");
    expect(bcp1962CycleLabel(at("2028-03-12"))).toBe(
      "Year II • Second Sunday in Lent",
    );
  });
});

describe("bcp1962 year rule", () => {
  it("uses the nearest Sunday to St Andrew for Advent", () => {
    expect(bcp1962FirstAdvent(2026)).toEqual({
      year: 2026,
      month: 11,
      day: 29,
    });
    expect(bcp1962FirstAdvent(2027)).toEqual({
      year: 2027,
      month: 11,
      day: 28,
    });
  });

  it("keys the year to the Advent that began it", () => {
    expect(bcp1962EcclesiasticalYear(at("2026-06-01"))).toBe(2025);
    expect(bcp1962EcclesiasticalYear(at("2026-12-01"))).toBe(2026);
    expect(bcp1962YearForDate(at("2026-11-29"))).toBe(1);
    expect(bcp1962YearForDate(at("2027-11-28"))).toBe(2);
  });

  it("uses Easter in the year after Advent", () => {
    const days = bcp1962MoveableDays(2026);
    expect(days.easter).toEqual({ year: 2027, month: 3, day: 28 });
    expect(days.septuagesima).toEqual({ year: 2027, month: 1, day: 24 });
  });
});

describe("bcp1962 observance resolution", () => {
  it("resolves Advent and Christmas", () => {
    const advent = resolveBcp1962Observance(at("2026-11-29"));
    expect(advent.sectionId).toBe("advent-1");
    expect(advent.dayKey).toBe("sunday");
    expect(advent.year).toBe(1);

    const christmas = resolveBcp1962Observance(at("2026-12-25"));
    expect(christmas.sectionId).toBe("christmastide");
    expect(christmas.dayKey).toBe("christmas-day");
  });

  it("marks the Advent Ember days", () => {
    for (const date of ["2026-12-16", "2026-12-18", "2026-12-19"]) {
      const obs = resolveBcp1962Observance(at(date));
      expect(obs.sectionId).toBe("advent-3");
      expect(obs.marks).toContain("Ember Day");
    }
  });

  it("resolves Epiphany and the Lent Ember days", () => {
    const epiphany = resolveBcp1962Observance(at("2027-01-06"));
    expect(epiphany.sectionId).toBe("epiphany");
    expect(epiphany.dayKey).toBe("epiphany");

    for (const date of ["2027-02-17", "2027-02-19", "2027-02-20"]) {
      const obs = resolveBcp1962Observance(at(date));
      expect(obs.sectionId).toBe("lent-1");
      expect(obs.marks).toContain("Ember Day");
    }
  });

  it("resolves Easter, Rogation and Ascension", () => {
    expect(resolveBcp1962Observance(at("2027-03-28")).dayKey).toBe(
      "easter-day",
    );
    expect(resolveBcp1962Observance(at("2027-04-04")).sectionId).toBe(
      "easter-1",
    );

    const rogation = resolveBcp1962Observance(at("2027-05-03"));
    expect(rogation.sectionId).toBe("easter-5");
    expect(rogation.dayKey).toBe("rogation-mon");
    expect(rogation.marks).toContain("Rogation Day");

    expect(resolveBcp1962Observance(at("2027-05-06")).dayKey).toBe(
      "ascension-day",
    );
  });

  it("resolves Trinity and the Sunday next before Advent", () => {
    const trinity = resolveBcp1962Observance(at("2027-05-23"));
    expect(trinity.sectionId).toBe("trinity");
    expect(trinity.dayKey).toBe("trinity-sunday");

    const first = resolveBcp1962Observance(at("2027-05-30"));
    expect(first.sectionId).toBe("trinity-1");
    expect(first.dayKey).toBe("sunday");

    const before = resolveBcp1962Observance(at("2027-11-21"));
    expect(before.sectionId).toBe("before-advent");
    expect(before.dayKey).toBe("sunday");
  });

  it("notes fixed commemorations without changing the lesson key", () => {
    const obs = resolveBcp1962Observance(at("2027-06-11"));
    expect(obs.sectionId).toBe("trinity-2");
    expect(obs.notes.some((n) => n.includes("St Barnabas"))).toBe(true);
  });
});
