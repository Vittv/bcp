/**
 * 1962 Canadian BCP composition helpers: resolve a civil date to the vendored
 * lectionary and psalm appointments, then optionally resolve lesson references
 * to scripture passages using the app loaders. Modeled on bcp1662.ts.
 *
 * The 1962 psalter text and office text are not vendored, so psalm appointments
 * are returned as raw strings rather than rendered psalm passages.
 */
import {
  type Bcp1962Observance,
  bcp1962YearForDate,
  resolveBcp1962Observance,
} from "../calendar/bcp1962";
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
  type Bcp1962LessonPair,
  type Bcp1962LessonSet,
  type Bcp1962Office,
  expandBcp1962End,
  getBcp1962AlternativeFirstLesson,
  getBcp1962ProperPsalms,
  getBcp1962Section,
  getBcp1962WeekdayPsalms,
  normalizeBcp1962Citation,
  parseBcp1962PsalmAppointment,
} from "./vendor/bcp1962";

export type { Bcp1962Observance };

export type Bcp1962LessonSource =
  | "sunday"
  | "holy-day-proper"
  | "feria"
  | "unknown";

export type Bcp1962ComposedDate = {
  date: CalendarDate;
  observance: Bcp1962Observance;
  lessons?: Bcp1962LessonSet;
  source: Bcp1962LessonSource;
  name?: string;
  psalms?: { mattins?: string; evensong?: string };
  weekdayPsalms?: { mattins: string; evensong: string };
  psalmsSource: "proper" | "weekday" | "none";
  notes: string[];
};

export type Bcp1962ResolvedPassage = {
  ref: string;
  normalized: string;
  passage: KjvPassage | null;
  passages: KjvPassage[];
  psalmCitations?: string[];
  error?: string;
};

export type Bcp1962ResolvedOffice = {
  date: CalendarDate;
  office: Bcp1962Office;
  source: Bcp1962LessonSource;
  name?: string;
  lessons: Bcp1962ResolvedPassage[];
  psalms?: string[];
  psalmsSource: "proper" | "weekday" | "none";
  notes: string[];
};

export const DEFAULT_BCP1962_SCRIPTURE_SETTINGS: ScriptureSettings = {
  translation: "kjv",
  apocrypha: "kjva",
};

const trinityAlternativeSections = new Set([
  "trinity-21",
  "trinity-22",
  "trinity-23",
  "trinity-24",
  "trinity-25",
  "trinity-26",
]);

function properPsalmId(observance: Bcp1962Observance): string | undefined {
  const { sectionId, dayKey, marks } = observance;
  if (marks.includes("Ember Day")) {
    if (sectionId.startsWith("advent-")) return "advent-ember-days";
    if (sectionId.startsWith("lent-")) return "lent-ember-days";
    if (sectionId.startsWith("trinity-")) return "trinity-ember-days";
    if (sectionId === "whitsunday") {
      if (dayKey === "wednesday") return "whitsunday-ember-wednesday";
      if (dayKey === "friday") return "whitsunday-ember-friday";
      if (dayKey === "saturday") return "whitsunday-ember-saturday";
    }
  }
  if (sectionId === "whitsunday")
    return dayKey === "whitsunday" ? "pentecost" : undefined;
  if (sectionId === "ascension-sunday") return "ascension-1";
  if (sectionId === "christmastide") {
    if (dayKey === "sunday-after-christmas") return "sundays-after-christmas";
    if (dayKey === "christmas-eve") return "christmas-first-evensong";
    if (getBcp1962ProperPsalms(dayKey)) return dayKey;
  }
  if (sectionId === "after-christmas-2" && dayKey === "sunday") {
    return "sundays-after-christmas";
  }
  if (sectionId === "easter-week") return `easter-week-${dayKey}`;
  if (sectionId === "holy-week") {
    if (dayKey === "easter-even") return "holy-saturday";
    if (dayKey === "monday" || dayKey === "tuesday" || dayKey === "wednesday") {
      return `holy-week-${dayKey}`;
    }
  }
  if (sectionId === "lent-5" && dayKey === "sunday") return "passion-sunday";
  if (getBcp1962ProperPsalms(sectionId)) return sectionId;
  return undefined;
}

/**
 * Compose a dated 1962 observance: lessons from the daily table with Sunday
 * year and alternative-lesson rules, psalms from the proper table or the
 * alternating weekday table.
 */
export function composeBcp1962ForDate(date: CalendarDate): Bcp1962ComposedDate {
  const observance = resolveBcp1962Observance(date);
  const notes = [...observance.notes];
  if (observance.marks.length > 0) {
    notes.push(`appointed marks: ${observance.marks.join(", ")}`);
  }
  if (observance.transferred) {
    notes.push(`transferred to ${observance.transferred}`);
  }

  let lessons = getLessonSet(observance);
  const ordinaryKeys = new Set([
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ]);
  let source: Bcp1962LessonSource = "feria";
  if (observance.dayKey === "sunday" || observance.dayKey.endsWith("sunday")) {
    source = "sunday";
  } else if (!ordinaryKeys.has(observance.dayKey)) {
    source = "holy-day-proper";
  }

  const alternative = trinityAlternativeSections.has(observance.sectionId)
    ? getBcp1962AlternativeFirstLesson(
        observance.sectionId,
        bcp1962YearForDate(date),
      )
    : undefined;
  if (alternative && lessons) {
    lessons = {
      ...lessons,
      morning: { ...lessons.morning, first: alternative.morning },
      evening: { ...lessons.evening, first: alternative.evening },
    };
    notes.push(
      "canonical alternative first lessons appointed at the minister's discretion",
    );
  }

  if (!lessons) {
    source = "unknown";
    notes.push(
      `no lesson row for ${observance.sectionId}/${observance.dayKey}`,
    );
  }

  const properId = properPsalmId(observance);
  const proper = properId ? getBcp1962ProperPsalms(properId) : undefined;
  const weekday = getBcp1962WeekdayPsalms(date.month, date.day);
  const psalms = proper
    ? {
        mattins: proper.mattins ?? undefined,
        evensong: proper.evensong ?? undefined,
      }
    : undefined;

  if (date.day === 31 && !proper) {
    notes.push(
      "on the thirty-first day use the thirtieth day's psalms or one of the twenty-four selections",
    );
  }

  return {
    date,
    observance,
    lessons,
    source,
    name: proper?.name,
    psalms,
    weekdayPsalms: weekday,
    psalmsSource: proper ? "proper" : weekday ? "weekday" : "none",
    notes,
  };
}

function getLessonSet(
  observance: Bcp1962Observance,
): Bcp1962LessonSet | undefined {
  const section = getBcp1962Section(observance.sectionId);
  const entry = section?.days?.[observance.dayKey];
  if (!entry) return undefined;
  if (entry.years) return entry.years[observance.year === 1 ? "1" : "2"];
  return entry.common;
}

export function getBcp1962LessonsForDate(
  date: CalendarDate,
  office: Bcp1962Office,
): { lessons?: Bcp1962LessonPair; source: Bcp1962LessonSource; name?: string } {
  const composed = composeBcp1962ForDate(date);
  const set = composed.lessons?.[office];
  const pair = set ? { first: set.first, second: set.second } : undefined;
  return { lessons: pair, source: composed.source, name: composed.name };
}

async function resolveSegmentPassages(
  segment: string,
  settings: ScriptureSettings,
): Promise<KjvPassage[]> {
  const normalized = normalizeBcp1962Citation(segment);
  const expanded = await expandBcp1962End(normalized, async (name) => {
    const meta = getBookMeta(ALL_SCRIPTURE_BOOKS, name);
    return meta ? await loadScriptureBook(settings, meta.abbrev) : null;
  });
  const ref = expanded.ref;
  const parsed = parseDolRef(ALL_SCRIPTURE_BOOKS, ref);
  if (!parsed) {
    const meta = getBookMeta(ALL_SCRIPTURE_BOOKS, ref);
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
  const passages = await getScripturePassagesFromDolRef(settings, ref);
  if (passages.length > 0) return passages;
  const passage = await getPassageFromDolRef(
    ALL_SCRIPTURE_BOOKS,
    (b) => loadScriptureBook(settings, b),
    ref,
  );
  return passage ? [passage] : [];
}

export async function resolveBcp1962LessonPassages(
  lesson: string | Bcp1962LessonPair | null | undefined,
  settings: ScriptureSettings = DEFAULT_BCP1962_SCRIPTURE_SETTINGS,
): Promise<Bcp1962ResolvedPassage[]> {
  const refs: string[] = [];
  if (typeof lesson === "string") refs.push(lesson);
  else if (lesson) {
    for (const r of [lesson.first, lesson.second]) {
      if (typeof r === "string" && r.length > 0) refs.push(r);
    }
  }
  const results: Bcp1962ResolvedPassage[] = [];
  for (const ref of refs) {
    const normalized = normalizeBcp1962Citation(ref);
    try {
      const segments = ref
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean);
      const passages: KjvPassage[] = [];
      for (const segment of segments) {
        passages.push(...(await resolveSegmentPassages(segment, settings)));
      }
      results.push({
        ref,
        normalized,
        passage: passages[0] ?? null,
        passages,
        error: passages.length === 0 ? "unresolved reference" : undefined,
      });
    } catch (error) {
      results.push({
        ref,
        normalized,
        passage: null,
        passages: [],
        error: error instanceof Error ? error.message : "failed to resolve",
      });
    }
  }
  return results;
}

export async function resolveBcp1962OfficeForDate(
  date: CalendarDate,
  office: Bcp1962Office,
  settings: ScriptureSettings = DEFAULT_BCP1962_SCRIPTURE_SETTINGS,
): Promise<Bcp1962ResolvedOffice> {
  const composed = composeBcp1962ForDate(date);
  const ref = composed.lessons?.[office] ?? null;
  const lessonRefs: string[] = [];
  if (ref?.first) lessonRefs.push(ref.first);
  if (ref?.second) lessonRefs.push(ref.second);
  const lessons: Bcp1962ResolvedPassage[] = [];
  for (const lessonRef of lessonRefs) {
    lessons.push(...(await resolveBcp1962LessonPassages(lessonRef, settings)));
  }
  const raw =
    office === "morning" ? composed.psalms?.mattins : composed.psalms?.evensong;
  const weekday =
    office === "morning"
      ? composed.weekdayPsalms?.mattins
      : composed.weekdayPsalms?.evensong;
  const psalms = raw ? parseBcp1962PsalmAppointment(raw) : undefined;
  return {
    date,
    office,
    source: composed.source,
    name: composed.name,
    lessons,
    psalms:
      psalms ?? (weekday ? parseBcp1962PsalmAppointment(weekday) : undefined),
    psalmsSource: composed.psalmsSource,
    notes: composed.notes,
  };
}

export function composeBcp1962OfficeForDate(
  date: CalendarDate,
  office: Bcp1962Office,
  settings: ScriptureSettings = DEFAULT_BCP1962_SCRIPTURE_SETTINGS,
): Promise<Bcp1962ResolvedOffice> {
  return resolveBcp1962OfficeForDate(date, office, settings);
}
