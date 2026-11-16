import { describe, expect, it } from "bun:test";
import { resolveBcp1662Observance } from "../../calendar/bcp1662";
import {
  composeBcp1662ForDate,
  getBcp1662LessonsForDate,
  normalizeBcp1662LessonRef,
  resolveBcp1662LessonPassages,
} from "../bcp1662";
import { composeBcp1662Day } from "../vendor/bcp1662";

describe("bcp1662 composition", () => {
  it("normalizes common 1662 lesson ref forms", () => {
    expect(normalizeBcp1662LessonRef("Prov. 3. to v. 28")).toBe("Prov. 3:1-28");
    expect(normalizeBcp1662LessonRef("Ecclesiasticus 4")).toBe("Sirach 4");
    expect(
      normalizeBcp1662LessonRef("Ecclesiasticus 21; Ecclesiasticus 24"),
    ).toBe("Sirach 21; Sirach 24");
  });

  it("attaches proper lessons/psalms for fixed feasts by daily label", () => {
    const christmas = composeBcp1662Day("december", 25);
    expect(christmas?.resolvedFeastName).toBe(
      "Nativity of Christ (Christmas Day)",
    );
    expect(christmas?.properLessons?.name).toBe(
      "Nativity of Christ (Christmas Day)",
    );
    expect(christmas?.morning.psalms?.name).toBe("Christmas Day");
  });

  it("resolves Advent Sunday observance and proper lessons", () => {
    const date = { year: 2026, month: 11, day: 29 };
    const obs = resolveBcp1662Observance(date);
    expect(obs.properSundayName).toBe("First Sunday in Advent");
    const morning = getBcp1662LessonsForDate(date, "morning");
    expect(morning).toEqual({
      lessons: "Isaiah 1",
      source: "sunday-proper",
      name: "First Sunday in Advent",
    });
  });

  it("resolves and composes a Sunday proper office with scripture passages", async () => {
    const composed = composeBcp1662ForDate({ year: 2026, month: 11, day: 15 });
    expect(composed.observance.properSundayName).toBe(
      "Twenty-fourth Sunday after Trinity",
    );
    const lessons = await resolveBcp1662LessonPassages({
      first: "Proverbs 13",
      second: null,
    });
    expect(lessons[0]?.passages[0]?.verses.length).toBe(25);
  });

  it("resolves multi-segment and single-chapter lesson refs", async () => {
    const multi = await resolveBcp1662LessonPassages("Numbers 23; Numbers 24");
    expect(multi[0]?.passages.map((p) => p.verses.length)).toEqual([30, 25]);
    const short = await resolveBcp1662LessonPassages("2 John; 3 John");
    expect(short[0]?.passages.map((p) => p.book)).toEqual(["2 John", "3 John"]);
    expect(short[0]?.passages.map((p) => p.verses.length)).toEqual([13, 14]);
  });

  it("uses monthly psalter cycle when no proper psalms are appointed", async () => {
    const { resolveBcp1662OfficeForDate } = await import("../bcp1662");
    const office = await resolveBcp1662OfficeForDate(
      { year: 2026, month: 1, day: 2 },
      "morning",
    );
    expect(office.psalmsSource).toBe("monthly");
    expect(office.monthlyPsalms).toEqual(["9", "10", "11"]);
    expect(office.psalms).toBeUndefined();
  });
});
