/**
 * 1962 Canadian BCP vendored lectionary, calendar, psalm-appointment and rule
 * data. See README.md and PROVENANCE.md in this directory for sources and the
 * printed oddities retained verbatim in the tables.
 *
 * This is a typed data-access and normalization slice. The calendar resolver is
 * in src/lib/calendar/bcp1962.ts and the compose layer in
 * src/lib/content/bcp1962.ts, both modeled on their 1662 counterparts.
 */
import calendarRulesData from "./calendar-rules.min.json";
import citationMapData from "./citation-map.min.json";
import dailyData from "./lectionary-daily.min.json";
import collectsProperData from "./office-text/collects-proper.min.json";
import litanyData from "./office-text/litany.min.json";
import rulesData from "./lectionary-rules.min.json";
import properPsalmsData from "./proper-psalms.min.json";
import psalterCycleData from "./psalter-cycle.min.json";
import psalterData from "./psalter.min.json";
import specialOccasionsData from "./special-occasions.min.json";
import type { PsalmPassage } from "../../types";

export type Bcp1962Year = 1 | 2;
export type Bcp1962Office = "morning" | "evening";

export type Bcp1962LessonPair = {
  first: string | null;
  second: string | null;
};

export type Bcp1962LessonSet = {
  morning: Bcp1962LessonPair;
  evening: Bcp1962LessonPair;
};

export type Bcp1962DailyEntry = {
  label: string;
  common?: Bcp1962LessonSet;
  years?: Record<"1" | "2", Bcp1962LessonSet>;
  marks?: string[];
  note?: string;
};

export type Bcp1962Section = {
  id: string;
  label: string;
  season: string;
  week: number | null;
  days: Record<string, Bcp1962DailyEntry | undefined>;
};

export type Bcp1962ProperPsalmDay = {
  id: string;
  name: string;
  mattins: string | null;
  evensong: string | null;
  firstEvensong?: string;
  secondEvensong?: string;
  eucharist?: { introit: string | null; betweenLections: string | null };
  note?: string;
};

export type Bcp1962SpecialOccasion = {
  id: string;
  name: string;
  psalms: string;
  lessons: string[];
  note?: string;
};

export type Bcp1962WeekdayPsalms = { mattins: string; evensong: string };
export type Bcp1962Rule = { id: string; summary: string };
export type Bcp1962Selection = { id: number; psalms: string };

export type Bcp1962FixedCommemoration = {
  month: number;
  day: number;
  name: string;
  bracketed?: boolean;
};

export type Bcp1962TransferRule = {
  id: string;
  text: string;
  cases?: Array<{ when: string; to: string }>;
  namedTransfers?: string[];
};

type Bcp1962BookLike = {
  verses?: Record<string, Record<string, string>>;
};

export const BCP1962_DAILY =
  // SAFETY: vendored static JSON table matching the declared shape; validated by scripts/check-bcp1962-vendor.ts and documented in PROVENANCE.md.
  dailyData as {
    meta: { edition: string };
    sections: Bcp1962Section[];
    alternativeFirstLessons: {
      note: string;
      years: Record<"1" | "2", Record<string, { morning: string; evening: string }>>;
    };
  };

export const BCP1962_PROPER_PSALMS =
  // SAFETY: vendored static JSON table matching the declared shape; validated by scripts/check-bcp1962-vendor.ts.
  properPsalmsData as {
    meta: { edition: string };
    days: Bcp1962ProperPsalmDay[];
  };

export const BCP1962_SPECIAL_OCCASIONS =
  // SAFETY: vendored static JSON table matching the declared shape; validated by scripts/check-bcp1962-vendor.ts.
  specialOccasionsData as {
    meta: { edition: string };
    occasions: Bcp1962SpecialOccasion[];
  };

export const BCP1962_MONTH_SETS =
  // SAFETY: vendored static JSON table matching the declared shape; validated by scripts/check-bcp1962-vendor.ts.
  psalterCycleData.monthSets as Array<{
    id: string;
    months: number[];
    days: Record<string, Bcp1962WeekdayPsalms>;
  }>;

export const BCP1962_SELECTIONS =
  // SAFETY: vendored static JSON table matching the declared shape; validated by scripts/check-bcp1962-vendor.ts.
  psalterCycleData.selections as Bcp1962Selection[];

export const BCP1962_PSALTER_RUBRICS =
  // SAFETY: vendored static JSON table of rule strings; validated by scripts/check-bcp1962-vendor.ts.
  psalterCycleData.rubrics as Record<string, string | string[]>;

type Bcp1962PsalmPart = {
  title?: string | null;
  verses: Record<string, string>;
};

export const BCP1962_PSALTER =
  // SAFETY: vendored 1962 Coverdale psalter text extracted from the ACC PDF, validated by scripts/check-bcp1962-vendor.ts.
  psalterData as Record<string, { parts: Bcp1962PsalmPart[] }>;

export type Bcp1962LitanyLine =
  | { kind: "rubric"; text: string }
  | { kind: "heading"; text: string }
  | {
      kind: "text";
      text: string;
      speaker?: "minister" | "people" | "all";
    };

const BCP1962_LITANY =
  // SAFETY: vendored 1962 Litany text extracted from the ACC PDF.
  litanyData as { lines: Bcp1962LitanyLine[] };

export function getBcp1962Litany(): { lines: Bcp1962LitanyLine[] } {
  return BCP1962_LITANY;
}

export type Bcp1962ProperCollect = { name: string; text: string };

export const BCP1962_PROPER_COLLECTS =
  // SAFETY: vendored 1962 proper collects extracted from the ACC PDF.
  collectsProperData as {
    meta: { edition: string };
    collects: Bcp1962ProperCollect[];
  };

export function getBcp1962ProperCollect(
  name: string,
): Bcp1962ProperCollect | undefined {
  return BCP1962_PROPER_COLLECTS.collects.find((c) => c.name === name);
}

export const BCP1962_RULES =
  // SAFETY: vendored static JSON table matching the declared shape; validated by scripts/check-bcp1962-vendor.ts.
  rulesData.rules as Bcp1962Rule[];

export const BCP1962_FIXED_CALENDAR =
  // SAFETY: vendored static JSON table matching the declared shape; validated by scripts/check-bcp1962-vendor.ts.
  calendarRulesData.fixedCalendar as Bcp1962FixedCommemoration[];

export const BCP1962_TRANSFER_RULES =
  // SAFETY: vendored static JSON table matching the declared shape; validated by scripts/check-bcp1962-vendor.ts.
  calendarRulesData.transferRules as Bcp1962TransferRule[];

export const BCP1962_YEAR_RULE =
  // SAFETY: vendored static JSON table matching the declared shape; validated by scripts/check-bcp1962-vendor.ts.
  calendarRulesData.yearRule as {
    text: string;
    evenAdventYear: number;
    oddAdventYear: number;
  };

export const BCP1962_LESSON_NOTES =
  // SAFETY: vendored static JSON array of strings; validated by scripts/check-bcp1962-vendor.ts.
  calendarRulesData.lessonTableNotes as string[];

const citationMap =
  // SAFETY: vendored static JSON table matching the declared shape; validated by scripts/check-bcp1962-vendor.ts.
  citationMapData as {
    meta: { edition: string };
    bookAliases: string[][];
    psalmParts: {
      book: string;
      chapter: number;
      partCount: number;
      versesPerPart: number;
    };
    endKeyword: { token: string; strategy: string };
  };

export function getBcp1962Section(sectionId: string): Bcp1962Section | undefined {
  return BCP1962_DAILY.sections.find((s) => s.id === sectionId);
}

export function getBcp1962DailyEntry(
  sectionId: string,
  dayKey: string,
): Bcp1962DailyEntry | undefined {
  return getBcp1962Section(sectionId)?.days?.[dayKey];
}

function yearKey(year: Bcp1962Year): "1" | "2" {
  return year === 1 ? "1" : "2";
}

export function getBcp1962LessonSet(
  sectionId: string,
  dayKey: string,
  year: Bcp1962Year = 1,
): Bcp1962LessonSet | undefined {
  const entry = getBcp1962DailyEntry(sectionId, dayKey);
  if (!entry) return undefined;
  if (entry.years) return entry.years[yearKey(year)];
  return entry.common;
}

export function getBcp1962AlternativeFirstLesson(
  sectionId: string,
  year: Bcp1962Year,
): { morning: string; evening: string } | undefined {
  return BCP1962_DAILY.alternativeFirstLessons.years[yearKey(year)][sectionId];
}

export function normalizeBcp1962FeastName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[.'’]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function getBcp1962ProperPsalms(
  idOrName: string,
): Bcp1962ProperPsalmDay | undefined {
  const key = normalizeBcp1962FeastName(idOrName);
  return (
    BCP1962_PROPER_PSALMS.days.find((d) => d.id === key) ??
    BCP1962_PROPER_PSALMS.days.find(
      (d) => normalizeBcp1962FeastName(d.name) === key,
    )
  );
}

const occasionAliases: Record<string, string> = {
  dominionday: "dominion-day",
  remembranceday: "remembrance-day",
  missions: "missions",
};

export function getBcp1962SpecialOccasion(
  idOrName: string,
): Bcp1962SpecialOccasion | undefined {
  const key = normalizeBcp1962FeastName(idOrName).replace(/\s/g, "");
  const id = occasionAliases[key] ?? key;
  return (
    BCP1962_SPECIAL_OCCASIONS.occasions.find((o) => o.id === id) ??
    BCP1962_SPECIAL_OCCASIONS.occasions.find(
      (o) =>
        normalizeBcp1962FeastName(o.name).replace(/\s/g, "") === key,
    )
  );
}

export function getBcp1962WeekdayPsalms(
  month: number,
  day: number,
): Bcp1962WeekdayPsalms | undefined {
  const set = BCP1962_MONTH_SETS.find((s) => s.months.includes(month));
  if (!set) return undefined;
  return set.days[String(Math.min(31, Math.max(1, day)))];
}

export function getBcp1962Selection(id: number): Bcp1962Selection | undefined {
  return BCP1962_SELECTIONS.find((s) => s.id === id);
}

export function getBcp1962Rule(id: string): Bcp1962Rule | undefined {
  return BCP1962_RULES.find((r) => r.id === id);
}

export function getBcp1962FixedCommemorations(
  month: number,
  day: number,
): Bcp1962FixedCommemoration[] {
  return BCP1962_FIXED_CALENDAR.filter(
    (c) => c.month === month && c.day === day,
  );
}

const aliasPattern = new RegExp(
  citationMap.bookAliases
    .map(([from]) => from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .sort((a, b) => b.length - a.length)
    .join("|"),
  "gi",
);
const aliasLookup = new Map(
  citationMap.bookAliases.map(([from, to]) => [from.toLowerCase(), to]),
);

export function normalizeBcp1962Citation(ref: string): string {
  let out = ref.trim();
  out = out.replace(aliasPattern, (match) => {
    return aliasLookup.get(match.toLowerCase()) ?? match;
  });
  out = out.replace(/(\d{1,3})\.\s*(\d{1,3})/g, "$1:$2");
  out = out.replace(/\s+/g, " ");
  return out.trim();
}

/**
 * Replace the 1962 `end` keyword with the last verse of the loaded chapter.
 * The raw citation is returned unchanged when the chapter cannot be loaded,
 * so a missing text never silently becomes an empty reading.
 */
export async function expandBcp1962End(
  ref: string,
  loadBook: (name: string) => Promise<Bcp1962BookLike | null>,
): Promise<{ ref: string; note?: string }> {
  const bookMatch = ref.match(/^(.+?)\s+\d{1,3}:\d{1,3}\s*[–-]\s*end\b/i);
  const rangeMatch = ref.match(/(\d{1,3}):(\d{1,3})\s*[–-]\s*end\b/i);
  if (!bookMatch || !rangeMatch) return { ref };
  const bookName = bookMatch[1].trim();
  const chapterNumber = rangeMatch[1];
  const startVerse = rangeMatch[2];
  const book = await loadBook(bookName);
  const verses = book?.verses?.[chapterNumber];
  if (!verses) {
    return {
      ref,
      note: `could not expand end for ${bookName} ${chapterNumber}`,
    };
  }
  const numbers = Object.keys(verses)
    .map(Number)
    .filter((n) => Number.isFinite(n));
  if (numbers.length === 0) {
    return { ref, note: `no verses for ${bookName} ${chapterNumber}` };
  }
  const last = Math.max(...numbers);
  return {
    ref: ref.replace(rangeMatch[0], `${chapterNumber}:${startVerse}–${last}`),
  };
}

function partRange(chapter: string, part: number): string {
  const versesPerPart = citationMap.psalmParts.versesPerPart;
  const start = (part - 1) * versesPerPart + 1;
  const end = part * versesPerPart;
  return `${chapter}:${start}-${end}`;
}

function versesOf1962(psalm: { parts: Bcp1962PsalmPart[] }): PsalmPassage["verses"] {
  const out: PsalmPassage["verses"] = [];
  for (const part of psalm.parts) {
    for (const [number, text] of Object.entries(part.verses)) {
      out.push({ number: Number(number), text });
    }
  }
  return out;
}

/** resolve a 1962 psalm citation (e.g. "96", "119:81-88") to a psalm passage. */
export function getBcp1962PsalmPassage(ref: string): PsalmPassage | undefined {
  const m = /^(\d{1,3})(?::(\d+)(?:-(\d+))?)?$/.exec(ref.trim());
  if (!m) return undefined;
  const psalmNum = Number(m[1]);
  const psalm = BCP1962_PSALTER[String(psalmNum)];
  if (!psalm) return undefined;
  const all = versesOf1962(psalm);
  if (!m[2]) return { psalm: psalmNum, verses: all };
  const start = Number(m[2]);
  const end = m[3] ? Number(m[3]) : start;
  return {
    psalm: psalmNum,
    verses: all.filter((v) => v.number >= start && v.number <= end),
  };
}

/** resolve a list of 1962 psalm citations to passages, preserving order. */
export function getBcp1962PsalmPassages(
  refs: Array<string | number>,
): PsalmPassage[] {
  const out: PsalmPassage[] = [];
  for (const ref of refs) {
    const passage = getBcp1962PsalmPassage(String(ref));
    if (passage) out.push(passage);
  }
  return out;
}

/**
 * Turn a 1962 psalm appointment into app-format psalm citations. Handles
 * comma lists, `or` alternatives, and numbered Psalm 119 parts. The witness
 * writes parts as `119, Pts 7, 8` or `78, Pt 1`.
 */
export function parseBcp1962PsalmAppointment(input: string | null): string[] {
  if (!input) return [];
  const result: string[] = [];
  for (const alternative of input.split(/\s+or\s+/i)) {
    let rest = alternative.trim();
    const partList =
      /(\d{1,3})\s*,\s*Pts?\s+([\d,\s]+?)(?=\s*,?\s*$|,\s*(?:\d{1,3}\s*,|$))/gi;
    const parts: string[] = [];
    rest = rest.replace(partList, (whole, chapter: string, nums: string) => {
      parts.push(
        ...nums
          .split(/[,\s]+/)
          .map(Number)
          .filter((n) => Number.isFinite(n))
          .map((n) => partRange(chapter, n)),
      );
      return "";
    });
    result.push(...parts);
    for (const token of rest.split(",")) {
      const trimmed = token.trim();
      if (!trimmed || /^Pts?\b/i.test(trimmed)) continue;
      const single = trimmed.match(/^(\d{1,3})\s*,\s*Pt\s*(\d{1,3})$/i);
      if (single) {
        result.push(partRange(single[1], Number(single[2])));
        continue;
      }
      result.push(trimmed);
    }
  }
  return result;
}
