import { parsePsalmCitation } from "./psalms";
import { PSALTER_DAY_COUNT } from "./psalterCycle";
import { psalterDaysSchema } from "./schemas";
import type { PsalterDay } from "./types";
import psalterDaysData from "./vendor/bcp/psalter-days.min.json";

// the 1979 psalter's own 30-day cycle, generated from the headings printed in
// the psalter text (see scripts/gen-psalter-days.ts). the Daily Office keeps
// the lectionary's seven-week psalms; this is the alternative month cycle.
export const PSALTER_DAYS = psalterDaysSchema.parse(psalterDaysData);

export { PSALTER_DAY_COUNT };

export function psalterDay(day: number): PsalterDay | undefined {
  return PSALTER_DAYS.find((d) => d.day === day);
}

// the day of the month is the cycle day; the 31st repeats day 30, and
// February ends at 28 or 29 without special handling
export function psalterDayForDate(date: { day: number }): number {
  return Math.min(date.day, PSALTER_DAY_COUNT);
}

// the days whose portions include a psalm, so a search for 119 finds the
// three days that carry it
export function psalterDaysForPsalm(psalm: number): PsalterDay[] {
  return PSALTER_DAYS.filter((d) =>
    [...d.morning, ...d.evening].some(
      (c) => parsePsalmCitation(c)?.psalm === psalm,
    ),
  );
}

// consecutive bare psalm numbers fold into a range the way the printed table
// reads ("1-5"), while a verse portion keeps its citation ("119:33-72")
function compress(citations: string[]): string {
  const out: string[] = [];
  let start: number | null = null;
  let end = 0;
  const flush = () => {
    if (start === null) return;
    out.push(start === end ? `${start}` : `${start}-${end}`);
    start = null;
  };
  for (const citation of citations) {
    const n = /^\d+$/.test(citation) ? Number(citation) : null;
    if (n === null) {
      flush();
      out.push(citation);
      continue;
    }
    if (start !== null && n === end + 1) {
      end = n;
    } else {
      flush();
      start = n;
      end = n;
    }
  }
  flush();
  return out.join(", ");
}

// the day's two portions on one line: "1-5 · 6-8"
export function psalterDaySummary(day: PsalterDay): string {
  return `${compress(day.morning)} · ${compress(day.evening)}`;
}
