import { describe, expect, it } from "bun:test";
import {
  composeBcp1962ForDate,
  DEFAULT_BCP1962_SCRIPTURE_SETTINGS,
  resolveBcp1962LessonPassages,
  resolveBcp1962OfficeForDate,
} from "../bcp1962";

const at = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
};

describe("bcp1962 date composition", () => {
  it("uses Year I and Year II Sunday lessons", () => {
    const year1 = composeBcp1962ForDate(at("2026-11-29"));
    expect(year1.observance.year).toBe(1);
    expect(year1.lessons?.morning.first).toBe("Isa. 1. 1–20");
    expect(year1.lessons?.morning.second).toBe("Matt. 24. 1–28");
    expect(year1.lessons?.evening.second).toBe("1 Thess. 5");

    const year2 = composeBcp1962ForDate(at("2027-11-28"));
    expect(year2.observance.year).toBe(2);
    expect(year2.lessons?.morning.second).toBe("Rev. 2. 1–17");
  });

  it("uses proper psalms for named feasts", () => {
    const christmas = composeBcp1962ForDate(at("2026-12-25"));
    expect(christmas.source).toBe("holy-day-proper");
    expect(christmas.psalmsSource).toBe("proper");
    expect(christmas.psalms?.mattins).toBe("45");
    expect(christmas.psalms?.evensong).toBe("85, 110");
  });

  it("applies the Trinity alternative first lessons", () => {
    const obs = composeBcp1962ForDate(at("2027-10-17"));
    expect(obs.observance.sectionId).toBe("trinity-21");
    expect(obs.lessons?.morning.first).toBe("Job 39. 31—40. 4");
    expect(obs.notes.some((n) => n.includes("alternative first lessons"))).toBe(
      true,
    );
  });
});

describe("bcp1962 scripture resolution", () => {
  it("resolves a simple lesson reference", async () => {
    const passages = await resolveBcp1962LessonPassages(
      "Isa. 1. 1–20",
      DEFAULT_BCP1962_SCRIPTURE_SETTINGS,
    );
    expect(passages.length).toBe(1);
    expect(passages[0]?.normalized).toBe("Isa. 1:1–20");
    expect(passages[0]?.passages.length).toBeGreaterThan(0);
  });

  it("expands the end keyword", async () => {
    const passages = await resolveBcp1962LessonPassages("Isa. 2. 10–end");
    expect(passages[0]?.normalized).toBe("Isa. 2:10–end");
    expect(passages[0]?.passages.length).toBeGreaterThan(0);
  });

  it("resolves psalm appointments into citations", async () => {
    const office = await resolveBcp1962OfficeForDate(
      at("2026-11-29"),
      "morning",
    );
    expect(office.psalms).toEqual(["9"]);
    expect(office.lessons.length).toBe(2);
  });
});
