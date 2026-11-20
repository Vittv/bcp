import { describe, expect, it } from "bun:test";
import {
  BCP1962_CANTICLES,
  BCP1962_DAILY,
  BCP1962_FIXED_CALENDAR,
  BCP1962_PROPER_COLLECTS,
  BCP1962_PROPER_PSALMS,
  BCP1962_PSALTER,
  BCP1962_RULES,
  BCP1962_SELECTIONS,
  expandBcp1962End,
  getBcp1962LessonSet,
  getBcp1962ProperCollect,
  getBcp1962ProperPsalms,
  getBcp1962PsalmPassage,
  getBcp1962PsalmPassages,
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

  it("keeps the Te Deum lines intact", () => {
    const teDeum = BCP1962_CANTICLES.canticles.find(
      (canticle) => canticle.id === "te-deum",
    );
    expect(teDeum?.text).toContain("Thou art the King of Glory, O Christ.");
    expect(teDeum?.text).toContain(
      "When thou tookest upon thee to deliver man",
    );
    expect(teDeum?.text).toContain(
      "O LORD, save thy people, and bless thine heritage; Govern them, and lift them up for ever.",
    );
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
      name === "Isa" || name === "Isa."
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

  it("expands an end inside a parenthetical alternative", async () => {
    const load = async () => ({
      verses: { "2": { "1": "a", "42": "b", "47": "c" } },
    });
    const expanded = await expandBcp1962End("Acts. 2:22–42 (43–end)", load);
    expect(expanded.ref).toBe("Acts. 2:22–42 (2:43–47)");
    expect(expanded.note).toBeUndefined();
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

describe("bcp1962 proper collects", () => {
  it("vendors the curated proper collect set", () => {
    expect(BCP1962_PROPER_COLLECTS.collects.length).toBe(107);
    const names = BCP1962_PROPER_COLLECTS.collects.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("resolves a proper collect and keeps Canadian propers", () => {
    const advent = getBcp1962ProperCollect(
      "THE FIRST SUNDAY IN ADVENT BEING THE FOURTH SUNDAY BEFORE CHRISTMAS DAY",
    );
    expect(advent?.text).toContain("armour of light");
    expect(getBcp1962ProperCollect("For a National Occasion")?.text).toContain(
      "thy people by thy power",
    );
  });
});

describe("bcp1962 psalter text", () => {
  it("vendors 149 psalms with Psalm 58 omitted", () => {
    expect(Object.keys(BCP1962_PSALTER).length).toBe(149);
    expect(BCP1962_PSALTER["58"]).toBeUndefined();
    expect(Object.keys(BCP1962_PSALTER["119"].parts[0].verses).length).toBe(
      176,
    );
  });

  it("resolves a whole psalm with the printed mediant and renumbered verses", () => {
    const psalm1 = getBcp1962PsalmPassage("1");
    expect(psalm1?.verses.length).toBe(7);
    expect(psalm1?.verses[0].text).toBe(
      "Blessed is the man that hath not walked in the counsel of the ungodly, nor stood in the way of sinners, / and hath not sat in the seat of the scornful.",
    );
    const psalm14 = getBcp1962PsalmPassage("14");
    expect(psalm14?.verses.length).toBe(9);
    expect(psalm14?.verses[4].text).toContain("Have they no knowledge");
  });

  it("resolves a Psalm 119 part range produced by the appointment parser", () => {
    const refs = parseBcp1962PsalmAppointment("119, Pts 11, 12");
    const passages = getBcp1962PsalmPassages(refs);
    expect(passages.length).toBe(2);
    expect(passages[0].verses[0].number).toBe(81);
    expect(passages[1].verses[0].number).toBe(89);
  });

  it("returns no passage for an omitted or malformed citation", () => {
    expect(getBcp1962PsalmPassage("58")).toBeUndefined();
    expect(getBcp1962PsalmPassage("not a psalm")).toBeUndefined();
  });
});
