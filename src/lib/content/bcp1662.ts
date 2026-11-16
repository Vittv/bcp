/**
 * 1662 BCP composition helpers: resolve a civil date to 1662 appointments
 * (daily calendar, Sunday/holy-day propers, proper psalms) and optionally
 * resolve lesson references to scripture passages using existing loaders.
 *
 * This is an incremental step toward full 1662 Daily Office composition
 * (Matins/Evensong texts/rubrics/canticles/collects remain separate work).
 */
import {
  type Bcp1662Observance,
  bcp1662MoveableDays,
  resolveBcp1662Observance,
} from "../calendar/bcp1662";
import type { CalendarDate } from "../calendar/types";
import {
  ALL_SCRIPTURE_BOOKS,
  getScripturePassagesFromDolRef,
  loadScriptureBook,
  type ScriptureSettings,
} from "./bible";
import { getBookMeta, getPassageFromDolRef, parseDolRef } from "./scripture";
import type { KjvPassage } from "./types";
import {
  BCP1662_PROPER_LESSONS,
  type Bcp1662DayComposition,
  type Bcp1662LessonPair,
  type Bcp1662Office,
  bcp1662MonthFromNumber,
  composeBcp1662Day,
  getBcp1662HolyDayProperLessons,
  getBcp1662ProperPsalms,
  normalizeBcp1662LessonRef,
} from "./vendor/bcp1662";

export type { Bcp1662Observance };

export type Bcp1662ResolvedLessons = {
  morning:
    | Bcp1662LessonPair
    | { first: string; second?: string | null }
    | string;
  evening:
    | Bcp1662LessonPair
    | { first: string; second?: string | null }
    | string;
  source: "daily" | "holy-day-proper" | "sunday-proper";
  name?: string;
};

export type Bcp1662ComposedDate = {
  date: CalendarDate;
  observance: Bcp1662Observance;
  daily?: Bcp1662DayComposition;
  sundayProper?: {
    name: string;
    mattins: string | Bcp1662LessonPair;
    evensong: string | Bcp1662LessonPair;
  };
  holyDayProper?: ReturnType<typeof getBcp1662HolyDayProperLessons>;
  properPsalms?: { name: string; mattins: number[]; evensong: number[] };
  monthlyPsalms?: { morning: string[]; evening: string[] };
  notes: string[];
};

function findSundayProper(name: string) {
  for (const season of BCP1662_PROPER_LESSONS.sundays) {
    const entry = season.entries.find((e) => e.name === name);
    if (entry) return entry;
  }
  return undefined;
}

function sundayProperForObservance(obs: Bcp1662ComposedDate["observance"]) {
  if (!obs.properSundayName) return undefined;
  const direct = findSundayProper(obs.properSundayName);
  if (direct) return { entry: direct, note: undefined };
  // 1662: when there are more Sundays after Trinity, lessons from Sundays after
  // Epiphany may be used for later Sundays (e.g. Sunday next before Advent) per
  // tables/rules. This is a placeholder note until fully modeled.
  if (
    obs.sunday?.kind === "trinity-after" &&
    typeof obs.sundaysAfterTrinityInYear === "number"
  ) {
    return {
      entry: undefined,
      note: `No direct proper-lessons entry for ${obs.properSundayName}; 1662 overflow/adjustment rules may apply (Sundays after Trinity in year: ${obs.sundaysAfterTrinityInYear}).`,
    };
  }
  return { entry: undefined, note: undefined };
}

/** Resolve 1662 appointments for a civil date (daily + calendar/propers). */
export function composeBcp1662ForDate(date: CalendarDate): Bcp1662ComposedDate {
  const month = bcp1662MonthFromNumber(date.month);
  const daily = month ? composeBcp1662Day(month, date.day) : undefined;
  const observance = resolveBcp1662Observance(date);
  const notes: string[] = [...(daily?.notes ?? [])];

  const sundayResolved = sundayProperForObservance(observance);
  const sundayProper = sundayResolved?.entry;

  const holyDayName = observance.properHolyDayName ?? observance.holyDay;
  const holyDayProper =
    daily?.properLessons ??
    (holyDayName ? getBcp1662HolyDayProperLessons(holyDayName) : undefined);

  const psalmName =
    observance.properPsalmName ??
    (holyDayProper ? holyDayName : undefined) ??
    daily?.resolvedFeastName;
  const properPsalms = psalmName
    ? getBcp1662ProperPsalms(psalmName)
    : undefined;

  if (sundayProper) {
    notes.push(`Sunday proper lessons are appointed: ${sundayProper.name}.`);
  } else if (sundayResolved?.note) {
    notes.push(sundayResolved.note);
  }
  if (holyDayProper && !daily?.properLessons) {
    notes.push(`Proper lessons are appointed for ${holyDayProper.name}.`);
  }
  if (properPsalms) {
    notes.push(`Proper psalms are appointed for ${properPsalms.name}.`);
  }
  // 1662 rule (simplified): on 1st Advent/Easter/Whitsun/Trinity Sundays the
  // Sunday lessons take precedence over a coinciding holy day with proper
  // lessons; on other Sundays the minister may choose Sunday or holy-day lessons.
  if (observance.sunday && holyDayProper) {
    const dominant =
      (observance.sunday.kind === "advent" && observance.sunday.n === 1) ||
      observance.sunday.kind === "easter" ||
      observance.sunday.kind === "whitsunday" ||
      observance.sunday.kind === "trinity";
    notes.push(
      dominant
        ? "A holy day with proper lessons coincides with a principal Sunday; 1662 appoints the Sunday lessons in this case."
        : "A holy day with proper lessons falls on this Sunday; 1662 allows the minister to choose Sunday or holy-day lessons.",
    );
  }

  return {
    date,
    observance,
    daily,
    sundayProper,
    holyDayProper,
    properPsalms,
    monthlyPsalms: daily?.monthlyPsalms,
    notes,
  };
}

/** Pick effective lesson appointments for an office on a date (best-effort precedence). */
export function getBcp1662LessonsForDate(
  date: CalendarDate,
  office: Bcp1662Office,
):
  | {
      lessons: Bcp1662LessonPair | string;
      source: Bcp1662ResolvedLessons["source"];
      name?: string;
    }
  | undefined {
  const composed = composeBcp1662ForDate(date);
  const officeKey = office === "morning" ? "mattins" : "evensong";

  // Precedence (simplified, 1662-informed): on 1st Advent/Easter/Whitsun/Trinity
  // Sundays the Sunday lessons take precedence over a coinciding holy day with
  // proper lessons; otherwise a coinciding holy day proper is preferred here,
  // noting that 1662 allows ministerial choice on other Sundays.
  const obs = composed.observance;
  const sundayDominant =
    obs.sunday?.kind === "advent" && obs.sunday.n === 1
      ? true
      : obs.sunday?.kind === "easter" ||
        obs.sunday?.kind === "whitsunday" ||
        obs.sunday?.kind === "trinity";
  if (composed.sundayProper && sundayDominant) {
    return {
      lessons: composed.sundayProper[officeKey],
      source: "sunday-proper",
      name: composed.sundayProper.name,
    };
  }
  if (composed.holyDayProper) {
    return {
      lessons: composed.holyDayProper[officeKey],
      source: "holy-day-proper",
      name: composed.holyDayProper.name,
    };
  }
  if (composed.sundayProper) {
    return {
      lessons: composed.sundayProper[officeKey],
      source: "sunday-proper",
      name: composed.sundayProper.name,
    };
  }
  if (composed.daily) {
    return { lessons: composed.daily.entry[office], source: "daily" };
  }
  return undefined;
}

export type Bcp1662ResolvedPassage = {
  ref: string;
  normalized: string;
  /** First resolved passage (for convenience/backward compatibility). */
  passage: KjvPassage | null;
  /** All resolved passages/ranges for the lesson ref. */
  passages: KjvPassage[];
  error?: string;
};

export type Bcp1662ResolvedOffice = {
  date: CalendarDate;
  office: Bcp1662Office;
  source: Bcp1662ResolvedLessons["source"] | "unknown";
  name?: string;
  lessons: Bcp1662ResolvedPassage[];
  /** Proper psalms (psalm numbers) when appointed. */
  psalms?: number[];
  /** Monthly 30-day cycle psalms (psalm refs/segments) for the office. */
  monthlyPsalms?: string[];
  psalmsSource: "proper" | "monthly";
  notes: string[];
};

/**
 * Resolve lesson strings to scripture passages (best-effort).
 * `parse` should parse a (possibly normalized) reference into lookup params and
 * `load` should return the passage (or null). This keeps 1662 composition
 * decoupled from a specific scripture translation while reusing existing loaders.
 */
export async function resolveBcp1662LessonToPassages(
  lesson: string | Bcp1662LessonPair | null | undefined,
  parseAndLoad: (ref: string) => Promise<{
    passage: KjvPassage | null;
    passages?: KjvPassage[];
    error?: string;
  }>,
): Promise<Bcp1662ResolvedPassage[]> {
  if (lesson == null) return [];
  if (typeof lesson === "string") {
    const normalized = normalizeBcp1662LessonRef(lesson);
    const out = await parseAndLoad(normalized);
    const passages = out.passages ?? (out.passage ? [out.passage] : []);
    return [
      {
        ref: lesson,
        normalized,
        passage: out.passage ?? passages[0] ?? null,
        passages,
        error: out.error,
      },
    ];
  }
  const refs = [lesson.first, lesson.second].filter(
    (r): r is string => typeof r === "string" && r.length > 0,
  );
  const results: Bcp1662ResolvedPassage[] = [];
  for (const r of refs) {
    const normalized = normalizeBcp1662LessonRef(r);
    const out = await parseAndLoad(normalized);
    const passages = out.passages ?? (out.passage ? [out.passage] : []);
    results.push({
      ref: r,
      normalized,
      passage: out.passage ?? passages[0] ?? null,
      passages,
      error: out.error,
    });
  }
  return results;
}

export const DEFAULT_BCP1662_SCRIPTURE_SETTINGS: ScriptureSettings = {
  translation: "kjv",
  apocrypha: "kjva",
};

/**
 * Resolve 1662 lesson strings to scripture passages using the app's scripture
 * loaders (normalized refs). Best-effort: unparseable/unavailable refs return
 * empty passages with an error note.
 */
function splitLessonSegments(ref: string): string[] {
  // Split on semicolons (1662 tables use ";" to separate readings/ranges).
  return ref
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function resolveSegmentPassages(
  segment: string,
  settings: ScriptureSettings,
): Promise<KjvPassage[]> {
  const seg = segment.trim();
  const parsed = parseDolRef(ALL_SCRIPTURE_BOOKS, seg);

  // Single-chapter books may be referenced by book name only (e.g. "2 John", "Jude").
  if (!parsed) {
    const meta = getBookMeta(ALL_SCRIPTURE_BOOKS, seg);
    if (meta && meta.chapters === 1) {
      const book = await loadScriptureBook(settings, meta.abbrev);
      if (!book) return [];
      const chapterKey = Object.keys(book.verses)[0] ?? "1";
      const verses = book.verses[chapterKey];
      if (!verses) return [];
      const nums = Object.keys(verses)
        .map((k) => Number.parseInt(k, 10))
        .sort((a, b) => a - b);
      return [
        {
          book: book.book,
          abbrev: book.abbrev,
          testament: book.testament,
          chapter: Number.parseInt(chapterKey, 10) || 1,
          verses: nums.map((n) => ({ number: n, text: verses[String(n)] })),
        },
      ];
    }
    return [];
  }

  // Whole-chapter (or whole-book chapter) refs: "Genesis 1", "Ps 119"
  const chapterOnly =
    parsed.verseStart === undefined &&
    parsed.verseEnd === undefined &&
    parsed.endChapter === undefined &&
    !/[:,–-]/.test(seg.replace(/^\d?\s?[A-Za-z.]+\s+\d*$/, (m) => m));

  if (chapterOnly) {
    const passage = await getPassageFromDolRef(
      ALL_SCRIPTURE_BOOKS,
      (b) => loadScriptureBook(settings, b),
      seg,
    );
    return passage ? [passage] : [];
  }

  const passages = await getScripturePassagesFromDolRef(settings, seg);
  if (passages.length > 0) return passages;

  // Fallback: try direct single-range resolution.
  const passage = await getPassageFromDolRef(
    ALL_SCRIPTURE_BOOKS,
    (b) => loadScriptureBook(settings, b),
    seg,
  );
  return passage ? [passage] : [];
}

export async function resolveBcp1662LessonPassages(
  lesson: string | Bcp1662LessonPair | null | undefined,
  settings: ScriptureSettings = DEFAULT_BCP1662_SCRIPTURE_SETTINGS,
): Promise<Bcp1662ResolvedPassage[]> {
  return resolveBcp1662LessonToPassages(lesson, async (ref) => {
    try {
      const segments = splitLessonSegments(ref);
      const all: KjvPassage[] = [];
      for (const seg of segments) {
        const ps = await resolveSegmentPassages(seg, settings);
        all.push(...ps);
      }
      if (all.length === 0) {
        return { passage: null, passages: [], error: "unresolved reference" };
      }
      return { passage: all[0] ?? null, passages: all };
    } catch (e) {
      return {
        passage: null,
        passages: [],
        error: e instanceof Error ? e.message : "failed to resolve",
      };
    }
  });
}

/** Compose and resolve a 1662 office for a date (lessons to passages, psalms from propers or monthly cycle). */
export async function resolveBcp1662OfficeForDate(
  date: CalendarDate,
  office: Bcp1662Office,
  settings: ScriptureSettings = DEFAULT_BCP1662_SCRIPTURE_SETTINGS,
): Promise<Bcp1662ResolvedOffice> {
  const composed = composeBcp1662ForDate(date);
  const picked = getBcp1662LessonsForDate(date, office);
  const lessons = await resolveBcp1662LessonPassages(picked?.lessons, settings);
  const proper =
    composed.properPsalms?.[office === "morning" ? "mattins" : "evensong"];
  const monthly =
    composed.monthlyPsalms?.[office === "morning" ? "morning" : "evening"];
  return {
    date,
    office,
    source: picked?.source ?? "unknown",
    name: picked?.name,
    lessons,
    psalms: proper,
    monthlyPsalms: proper ? undefined : monthly,
    psalmsSource: proper ? "proper" : "monthly",
    notes: composed.notes,
  };
}

export { bcp1662MoveableDays, normalizeBcp1662LessonRef };
