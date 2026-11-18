import { describe, expect, it } from "bun:test";
import {
  BCP1962_DAILY,
  BCP1962_FIXED_CALENDAR,
  BCP1962_PROPER_PSALMS,
  BCP1962_RULES,
  BCP1962_SELECTIONS,
  expandBcp1962End,
  getBcp1962LessonSet,
  getBcp1962ProperPsalms,
  getBcp1962Selection,
  getBcp1962WeekdayPsalms,
  normalizeBcp1962Citation,
  parseBcp1962PsalmAppointment,
} from "../vendor/bcp1962";

describe("bcp1962 vendor tables", () => {
  it("loads the full curated lectionary", () => {
    expect(BCP1962_DAILY.sections.length).toBe(58);
    const dayRows = BCP1962_DAILY.sections.reduce(
      (sum, section) => sum + Object.keys(section.days).length,
      0,
    );
    expect(dayRows).toBe(407);
  });

  it("loads the other tables", () => {
    expect(BCP1962_PROPER_PSALMS.days.length).toBe(110);
    expect(BCP1962_SELECTIONS.length).toBe(24);
    expect(BCP1962_RULES.length).toBe(17);
    expect(BCP1962_FIXED_CALENDAR.length).toBe(155);
  });
});

describe("bcp1962 lesson lookup", () => {
  it("returns the Year I and Year II Sunday lessons for Advent I", () => {
    const year1 = getBcp1962LessonSet("advent-1", "sunday", 1);
    const year2 = getBcp1962LessonSet("advent-1", "sunday", 2);
    expect(year1?.morning.first).toBe("Isa. 1. 1–20");
    expect(year1?.morning.second).toBe("Matt. 24. 1–28");
    expect(year2?.morning.second).toBe("Rev. 2. 1–17");
    expect(year2?.evening.second).toBe("John 3. 1–21");
  });

  it("returns year-independent feria lessons", () => {
    const monday = getBcp1962LessonSet("advent-1", "monday", 2);
    expect(monday?.morning.first).toBe("Isa. 3. 1–15");
    expect(monday?.evening.second).toBe("Rev. 6");
  });

  it("keeps the printed null slots", () => {
    const eve = getBcp1962LessonSet("christmastide", "christmas-eve");
    expect(eve?.morning.first).toBeNull();
    expect(eve?.evening.first).toBe("Zech. 2. 10–end");
  });
});

describe("bcp1962 citation normalization", () => {
  it("maps edition book names to corpus ids", () => {
    expect(normalizeBcp1962Citation("Ecclus. 24. 23–end")).toBe(
      "Sirach 24:23–end",
    );
    expect(normalizeBcp1962Citation("Wisd. 2")).toBe("Wisdom 2");
    expect(normalizeBcp1962Citation("Prayer of Manasses")).toBe("Pr Man");
  });

  it("converts chapter-dot-verse notation", () => {
    expect(normalizeBcp1962Citation("Isa. 2. 10–end")).toBe("Isa. 2:10–end");
    expect(normalizeBcp1962Citation("Gen. 11. 1—2. 3")).toBe("Gen. 11:1—2:3");
  });

  it("expands end using a loaded chapter", async () => {
    const load = async (name: string) =>
      name.trim() === "Isa."
        ? {
            verses: {
              "2": { "1": "a", "8": "b", "22": "c" },
            },
          }
        : null;
    const expanded = await expandBcp1962End("Isa. 2:10–end", load);
    expect(expanded.ref).toBe("Isa. 2:10–22");
    expect(expanded.note).toBeUndefined();
  });

  it("keeps the raw citation when a book cannot be loaded", async () => {
    const expanded = await expandBcp1962End("Isa. 2:10–end", async () => null);
    expect(expanded.ref).toBe("Isa. 2:10–end");
    expect(expanded.note).toContain("could not expand end");
  });
});

describe("bcp1962 psalm appointments", () => {
  it("resolves numbered Psalm 119 parts", () => {
    expect(parseBcp1962PsalmAppointment("119, Pts 7, 8")).toEqual([
      "119:49-56",
      "119:57-64",
    ]);
    expect(parseBcp1962PsalmAppointment("78, Pt 1")).toEqual(["78:1-8"]);
  });

  it("splits alternatives and comma lists", () => {
    expect(parseBcp1962PsalmAppointment("96, 97, or 119, Pts 11, 12")).toEqual([
      "96",
      "97",
      "119:81-88",
      "119:89-96",
    ]);
  });

  it("returns app-format citations for proper psalms", () => {
    const advent2 = getBcp1962ProperPsalms("advent-2");
    expect(advent2?.mattins).toBe("96, 97, or 119, Pts 11, 12");
    expect(parseBcp1962PsalmAppointment(advent2?.mattins ?? null)).toEqual([
      "96",
      "97",
      "119:81-88",
      "119:89-96",
    ]);
  });

  it("uses the alternating month sets and the 31st day", () => {
    expect(getBcp1962WeekdayPsalms(1, 1)?.mattins).toBe("1, 2, 3");
    expect(getBcp1962WeekdayPsalms(2, 1)?.mattins).toBe("6, 8");
    expect(getBcp1962WeekdayPsalms(1, 31)?.evensong).toBe("148, 149, 150");
    expect(getBcp1962Selection(24)?.psalms).toBe("148, 150");
  });
});
