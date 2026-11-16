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
import { getPassageFromDolRef, parseDolRef } from "./scripture";
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
  notes: string[];
};

function findSundayProper(name: string) {
  for (const season of BCP1662_PROPER_LESSONS.sundays) {
    const entry = season.entries.find((e) => e.name === name);
    if (entry) return entry;
  }
  return undefined;
}

/** Resolve 1662 appointments for a civil date (daily + calendar/propers). */
export function composeBcp1662ForDate(date: CalendarDate): Bcp1662ComposedDate {
  const month = bcp1662MonthFromNumber(date.month);
  const daily = month ? composeBcp1662Day(month, date.day) : undefined;
  const observance = resolveBcp1662Observance(date);
  const notes: string[] = [...(daily?.notes ?? [])];

  const sundayName = observance.properSundayName;
  const sundayProper = sundayName ? findSundayProper(sundayName) : undefined;

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
  }
  if (holyDayProper && !daily?.properLessons) {
    notes.push(`Proper lessons are appointed for ${holyDayProper.name}.`);
  }
  if (properPsalms) {
    notes.push(`Proper psalms are appointed for ${properPsalms.name}.`);
  }

  return {
    date,
    observance,
    daily,
    sundayProper,
    holyDayProper,
    properPsalms,
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

  // Simplified precedence: holy-day proper > Sunday proper > daily. Real 1662 precedence is more nuanced.
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
  passage: KjvPassage | null;
  error?: string;
};

export type Bcp1662ResolvedOffice = {
  date: CalendarDate;
  office: Bcp1662Office;
  source: Bcp1662ResolvedLessons["source"] | "unknown";
  name?: string;
  lessons: Bcp1662ResolvedPassage[];
  psalms?: number[];
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
  parseAndLoad: (
    ref: string,
  ) => Promise<{ passage: KjvPassage | null; error?: string }>,
): Promise<Bcp1662ResolvedPassage[]> {
  if (lesson == null) return [];
  if (typeof lesson === "string") {
    const normalized = normalizeBcp1662LessonRef(lesson);
    const out = await parseAndLoad(normalized);
    return [
      { ref: lesson, normalized, passage: out.passage, error: out.error },
    ];
  }
  const refs = [lesson.first, lesson.second].filter(
    (r): r is string => typeof r === "string" && r.length > 0,
  );
  const results: Bcp1662ResolvedPassage[] = [];
  for (const r of refs) {
    const normalized = normalizeBcp1662LessonRef(r);
    const out = await parseAndLoad(normalized);
    results.push({
      ref: r,
      normalized,
      passage: out.passage,
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
export async function resolveBcp1662LessonPassages(
  lesson: string | Bcp1662LessonPair | null | undefined,
  settings: ScriptureSettings = DEFAULT_BCP1662_SCRIPTURE_SETTINGS,
): Promise<Bcp1662ResolvedPassage[]> {
  return resolveBcp1662LessonToPassages(lesson, async (ref) => {
    try {
      // Chapter-only refs (e.g. "Genesis 1") must resolve to the whole chapter;
      // getScripturePassagesFromDolRef treats bare numbers as verse selectors.
      const parsed = parseDolRef(ALL_SCRIPTURE_BOOKS, ref);
      const chapterOnly =
        parsed &&
        parsed.verseStart === undefined &&
        parsed.verseEnd === undefined &&
        parsed.endChapter === undefined &&
        !/[:;,–-]/.test(ref.replace(/^\d?\s?[A-Za-z.]+\s+\d+/, ""));
      if (chapterOnly) {
        const passage = await getPassageFromDolRef(
          ALL_SCRIPTURE_BOOKS,
          (b) => loadScriptureBook(settings, b),
          ref,
        );
        return passage
          ? { passage }
          : { passage: null, error: "unresolved reference" };
      }
      const passages = await getScripturePassagesFromDolRef(settings, ref);
      if (passages.length === 0) {
        return { passage: null, error: "unresolved reference" };
      }
      // A single 1662 lesson ref may span ranges; return the first passage and
      // let callers that need all ranges use the lower-level helper.
      return { passage: passages[0] ?? null };
    } catch (e) {
      return {
        passage: null,
        error: e instanceof Error ? e.message : "failed to resolve",
      };
    }
  });
}

/** Compose and resolve a 1662 office for a date (lessons to passages, psalms from propers when appointed). */
export async function resolveBcp1662OfficeForDate(
  date: CalendarDate,
  office: Bcp1662Office,
  settings: ScriptureSettings = DEFAULT_BCP1662_SCRIPTURE_SETTINGS,
): Promise<Bcp1662ResolvedOffice> {
  const composed = composeBcp1662ForDate(date);
  const picked = getBcp1662LessonsForDate(date, office);
  const lessons = await resolveBcp1662LessonPassages(picked?.lessons, settings);
  const psalms =
    composed.properPsalms?.[office === "morning" ? "mattins" : "evensong"];
  return {
    date,
    office,
    source: picked?.source ?? "unknown",
    name: picked?.name,
    lessons,
    psalms,
    notes: composed.notes,
  };
}

export { bcp1662MoveableDays, normalizeBcp1662LessonRef };
