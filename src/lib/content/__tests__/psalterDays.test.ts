import { describe, expect, test } from "bun:test";
import { parsePsalmCitation } from "../psalms";
import { psalmVerseCount } from "../psalter";
import { derivePsalterDays, PSALTER_DAY_COUNT } from "../psalterCycle";
import {
  PSALTER_DAYS,
  psalterDay,
  psalterDayForDate,
  psalterDaySummary,
  psalterDaysForPsalm,
} from "../psalterDays";
import { psalterSchema } from "../schemas";
import psalter from "../vendor/bcp/psalter.min.json";

const raw = psalterSchema.parse(psalter);

// every citation of the table in reading order, with the portion it belongs to
function citations() {
  const out: { day: number; office: "morning" | "evening"; c: string }[] = [];
  for (const day of PSALTER_DAYS) {
    for (const c of day.morning)
      out.push({ day: day.day, office: "morning", c });
    for (const c of day.evening)
      out.push({ day: day.day, office: "evening", c });
  }
  return out;
}

describe("30-day psalter", () => {
  test("vendor table matches the headings in the psalter", () => {
    expect(derivePsalterDays(raw)).toEqual(PSALTER_DAYS);
  });

  test("30 days, each with a morning and an evening portion", () => {
    expect(PSALTER_DAYS).toHaveLength(PSALTER_DAY_COUNT);
    for (const day of PSALTER_DAYS) {
      expect(day.morning.length).toBeGreaterThan(0);
      expect(day.evening.length).toBeGreaterThan(0);
    }
  });

  test("citations parse and stay in canonical order", () => {
    let last = 0;
    for (const { c } of citations()) {
      const parsed = parsePsalmCitation(c);
      expect(parsed).not.toBeNull();
      expect(parsed?.psalm).toBeGreaterThanOrEqual(last);
      last = parsed?.psalm ?? last;
    }
  });

  test("every psalm is covered exactly once, with no gaps or overlaps", () => {
    const ranges = new Map<number, { start: number; end: number }[]>();
    for (const { c } of citations()) {
      const parsed = parsePsalmCitation(c);
      if (!parsed) throw new Error(`unparsed citation ${c}`);
      const list = ranges.get(parsed.psalm) ?? [];
      list.push(
        parsed.verses ?? { start: 1, end: psalmVerseCount(parsed.psalm) },
      );
      ranges.set(parsed.psalm, list);
    }
    expect(ranges.size).toBe(150);
    for (let psalm = 1; psalm <= 150; psalm++) {
      const list = ranges.get(psalm);
      if (!list) throw new Error(`psalm ${psalm} is not appointed`);
      expect(list[0].start).toBe(1);
      expect(list[list.length - 1].end).toBe(psalmVerseCount(psalm));
      for (let i = 1; i < list.length; i++) {
        expect(list[i].start).toBe(list[i - 1].end + 1);
      }
    }
  });

  test("Psalm 119 is split across days 24-26 at its sections", () => {
    expect(psalterDaysForPsalm(119).map((d) => d.day)).toEqual([24, 25, 26]);
    const splits = citations()
      .filter(({ c }) => parsePsalmCitation(c)?.psalm === 119)
      .map(({ c }) => c);
    expect(splits).toEqual([
      "119:1-32",
      "119:33-72",
      "119:73-104",
      "119:105-144",
      "119:145-176",
    ]);
  });

  test("the cycle starts at Psalm 1 and ends at Psalm 150", () => {
    expect(PSALTER_DAYS[0].morning[0]).toBe("1");
    const lastDay = PSALTER_DAYS[PSALTER_DAYS.length - 1];
    expect(lastDay.evening[lastDay.evening.length - 1]).toBe("150");
  });

  test("the day of the month picks the cycle day", () => {
    expect(psalterDayForDate({ day: 1 })).toBe(1);
    expect(psalterDayForDate({ day: 28 })).toBe(28);
    expect(psalterDayForDate({ day: 29 })).toBe(29);
    expect(psalterDayForDate({ day: 31 })).toBe(30);
  });

  test("lookup by day and the one-line summary", () => {
    expect(psalterDay(1)?.evening).toEqual(["6", "7", "8"]);
    expect(psalterDay(31)).toBeUndefined();
    const first = psalterDay(1);
    if (!first) throw new Error("day 1 is missing");
    expect(psalterDaySummary(first)).toBe("1-5 · 6-8");
  });
});
