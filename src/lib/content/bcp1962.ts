/**
 * 1962 Canadian BCP composition helpers: resolve a civil date to the vendored
 * lectionary and psalm appointments, then optionally resolve lesson references
 * to scripture passages using the app loaders. Modeled on bcp1662.ts.
 *
 * psalm appointments are returned as citation strings; the vendored 1962
 * psalter text resolves them to passages in the Lectionary and Psalter screens.
 * office text is still not vendored.
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
import { parseLessonRef } from "./lessons";
import { getBookMeta, getPassageFromDolRef, parseDolRef } from "./scripture";
import type { Half, KjvPassage, LessonRef, PsalmPassage } from "./types";
import { normalizeFeastKey } from "./vendor/bcp1662";
import {
  BCP1962_OFFICE_TEXT,
  BCP1962_PROPER_COLLECTS,
  type Bcp1962LessonPair,
  type Bcp1962LessonSet,
  type Bcp1962Office,
  expandBcp1962End,
  getBcp1962AlternativeFirstLesson,
  getBcp1962Canticle,
  getBcp1962Compline,
  getBcp1962FamilyPrayer,
  getBcp1962FixedCollects,
  getBcp1962Litany,
  getBcp1962MidDayOffice,
  getBcp1962OfficeText,
  getBcp1962ProperCollect,
  getBcp1962ProperPsalms,
  getBcp1962PsalmPassage,
  getBcp1962PsalmPassages,
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

export type Bcp1962LessonPassage = {
  ref: string;
  passage: KjvPassage;
  optional: boolean;
  half?: Half;
};

export type Bcp1962ResolvedPassage = {
  ref: string;
  normalized: string;
  /** Structured parse of the citation, keeping optional ranges and verse halves. */
  parsed?: LessonRef;
  /** Each appointed range with its alternative/half markers intact. */
  ranges?: Bcp1962LessonPassage[];
  passage: KjvPassage | null;
  passages: KjvPassage[];
  psalmCitations?: string[];
  error?: string;
};

// app corpus ids used by the 1962 table -> ids understood by parseLessonRef
const LESSON_BOOK_IDS: Record<string, string> = {
  Sirach: "Sir",
  Ecclesiasticus: "Sir",
  Ecclus: "Sir",
  Wisdom: "Wis",
  "Wisdom of Solomon": "Wis",
  "Song of Songs": "Song",
  Canticles: "Song",
  "S. of Sol.": "Song",
  Song: "Song",
  S3Y: "S3Y",
  "Pr Man": "Pr Man",
  "2 Esd": "2 Esd",
  Rev: "Rev",
};

/**
 * Parse a normalized 1962 lesson citation into the structured LessonRef form.
 * Parenthetical alternatives and a/b verse halves survive this parse; refs that
 * fall outside its grammar return ok:false so the caller can keep the raw text.
 */
export function parseBcp1962LessonRef(ref: string) {
  let text = ref.trim();
  // canonicalize the book id and the witness's dotted chapter.verse notation
  text = text.replace(/^((?:[123]\s+)?)(?:St\.?|Saint)\s+/i, "$1");
  text = text.replace(/^([A-Za-z][A-Za-z .]*?)\s+(?=\d)/, (whole) => {
    const key = whole.trim().replace(/\.$/, "");
    return `${LESSON_BOOK_IDS[key] ?? key} `;
  });
  text = text
    .replace(/&/g, ",")
    .replace(/\u2014/g, "–")
    .replace(/([A-Za-z])\.(?=\s|$)/g, "$1")
    .replace(/(\d{1,3})\.\s*(\d{1,3})/g, "$1:$2")
    .replace(/\s+/g, " ")
    .trim();
  return parseLessonRef(text);
}

async function loadLessonRefPassages(
  ref: LessonRef,
  settings: ScriptureSettings,
): Promise<Bcp1962LessonPassage[]> {
  const out: Bcp1962LessonPassage[] = [];
  for (const range of ref.ranges) {
    const from = `${ref.book} ${range.from.chapter}:${range.from.verse}`;
    const to = range.to ? `–${range.to.chapter}:${range.to.verse}` : "";
    const refString = `${from}${to}`;
    const passage = await getPassageFromDolRef(
      ALL_SCRIPTURE_BOOKS,
      (b) => loadScriptureBook(settings, b),
      refString,
    );
    if (passage) {
      out.push({
        ref: refString,
        passage,
        optional: Boolean(range.optional),
        half: range.from.half ?? range.to?.half,
      });
    }
  }
  return out;
}

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

const COLLECT_ORDINALS = [
  "",
  "First",
  "Second",
  "Third",
  "Fourth",
  "Fifth",
  "Sixth",
  "Seventh",
  "Eighth",
  "Ninth",
  "Tenth",
  "Eleventh",
  "Twelfth",
  "Thirteenth",
  "Fourteenth",
  "Fifteenth",
  "Sixteenth",
  "Seventeenth",
  "Eighteenth",
  "Nineteenth",
  "Twentieth",
  "Twenty-first",
  "Twenty-second",
  "Twenty-third",
  "Twenty-fourth",
  "Twenty-fifth",
  "Twenty-sixth",
];

// the lectionary calls a Sunday "Trinity 24", while the collect table prints
// "THE TWENTY-FOURTH SUNDAY AFTER TRINITY"; bridge the two naming schemes
function bcp1962SundayCollectName(
  observance: Bcp1962Observance,
): string | null {
  const numbered = /^(advent|epiphany|lent|easter|trinity)-(\d+)$/.exec(
    observance.sectionId,
  );
  if (!numbered || observance.dayKey !== "sunday") return null;
  const ordinal = COLLECT_ORDINALS[Number(numbered[2])] ?? numbered[2];
  const seasons: Record<string, string> = {
    advent: "IN ADVENT",
    epiphany: "AFTER THE EPIPHANY",
    lent: "IN LENT",
    easter: "AFTER EASTER",
    trinity: "AFTER TRINITY",
  };
  return `${ordinal.toUpperCase()} SUNDAY ${seasons[numbered[1]]}`;
}

function findBcp1962Collect(names: Array<string | null | undefined>) {
  for (const name of names) {
    if (!name) continue;
    const direct = getBcp1962ProperCollect(name);
    if (direct) return direct;
    const key = normalizeFeastKey(name);
    const match = BCP1962_PROPER_COLLECTS.collects.find((c) =>
      normalizeFeastKey(c.name).includes(key),
    );
    if (match) return match;
  }
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
): Promise<{
  passages: KjvPassage[];
  ranges: Bcp1962LessonPassage[];
  parsed?: LessonRef;
}> {
  const normalized = normalizeBcp1962Citation(segment);
  const expanded = await expandBcp1962End(normalized, async (name) => {
    const meta = getBookMeta(ALL_SCRIPTURE_BOOKS, name);
    return meta ? await loadScriptureBook(settings, meta.abbrev) : null;
  });
  const ref = expanded.ref;
  const lesson = parseBcp1962LessonRef(ref);
  if (lesson.ok) {
    const ranges = await loadLessonRefPassages(lesson.ref, settings);
    if (ranges.length > 0) {
      return {
        passages: ranges.map((r) => r.passage),
        ranges,
        parsed: lesson.ref,
      };
    }
  }
  const fallbackRange = (passage: KjvPassage): Bcp1962LessonPassage => ({
    ref,
    passage,
    optional: false,
  });
  const parsed = parseDolRef(ALL_SCRIPTURE_BOOKS, ref);
  if (!parsed) {
    const meta = getBookMeta(ALL_SCRIPTURE_BOOKS, ref);
    if (meta && meta.chapters === 1) {
      const book = await loadScriptureBook(settings, meta.abbrev);
      if (!book) return { passages: [], ranges: [] };
      const chapterKey = Object.keys(book.verses)[0] ?? "1";
      const verses = book.verses[chapterKey];
      if (!verses) return { passages: [], ranges: [] };
      const nums = Object.keys(verses)
        .map((k) => Number.parseInt(k, 10))
        .sort((a, b) => a - b);
      const passage: KjvPassage = {
        book: book.book,
        abbrev: book.abbrev,
        testament: book.testament,
        chapter: Number.parseInt(chapterKey, 10) || 1,
        verses: nums.map((n) => ({ number: n, text: verses[String(n)] })),
      };
      return {
        passages: [passage],
        ranges: [fallbackRange(passage)],
        parsed: lesson.ok ? lesson.ref : undefined,
      };
    }
    return {
      passages: [],
      ranges: [],
      parsed: lesson.ok ? lesson.ref : undefined,
    };
  }
  const passages = await getScripturePassagesFromDolRef(settings, ref);
  if (passages.length > 0) {
    return {
      passages,
      ranges: passages.map(fallbackRange),
      parsed: lesson.ok ? lesson.ref : undefined,
    };
  }
  const passage = await getPassageFromDolRef(
    ALL_SCRIPTURE_BOOKS,
    (b) => loadScriptureBook(settings, b),
    ref,
  );
  return {
    passages: passage ? [passage] : [],
    ranges: passage ? [fallbackRange(passage)] : [],
    parsed: lesson.ok ? lesson.ref : undefined,
  };
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
      const ranges: Bcp1962LessonPassage[] = [];
      let parsed: LessonRef | undefined;
      for (const segment of segments) {
        const resolved = await resolveSegmentPassages(segment, settings);
        passages.push(...resolved.passages);
        ranges.push(...resolved.ranges);
        parsed ??= resolved.parsed;
      }
      results.push({
        ref,
        normalized,
        parsed,
        ranges,
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

export type Bcp1962LitanyNode =
  | { kind: "rubric"; text: string }
  | { kind: "heading"; text: string }
  | {
      kind: "text";
      text: string;
      speaker?: "minister" | "people" | "all";
      lordsPrayer?: boolean;
      lordsPrayerFirst?: boolean;
      lordsPrayerLast?: boolean;
    };

export type Bcp1962LitanyDoc = {
  edition: "1962";
  officeName: "The Litany";
  date: CalendarDate;
  nodes: Bcp1962LitanyNode[];
};

// 1979 prints the Lord's Prayer one petition per line, with the doxology on
// its own line where the edition includes it
function lordsPrayerNodes(text: string): Array<{
  kind: "text";
  text: string;
  lordsPrayer: true;
  lordsPrayerFirst?: boolean;
  lordsPrayerLast?: boolean;
}> {
  const lines = text
    .split(
      /(?<=\.)\s+(?=Give us this day)|(?<=[.;])\s+(?=And lead us not)|(?<=[.;])\s+(?=For thine is the kingdom)/,
    )
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.map((line, i) => ({
    kind: "text",
    text: line,
    lordsPrayer: true,
    lordsPrayerFirst: i === 0,
    lordsPrayerLast: i === lines.length - 1,
  }));
}

/** compose the 1962 Litany as a standalone office of rubrics and spoken lines. */
export function composeBcp1962Litany(date: CalendarDate): Bcp1962LitanyDoc {
  const lines = getBcp1962Litany().lines;
  const supplicationStart = lines.findIndex(
    (l) => l.kind === "heading" && l.text === "A Supplication",
  );
  const chrysostomStart = lines.findIndex(
    (l) => l.kind === "heading" && l.text === "A Prayer of Saint Chrysostom",
  );
  // the book prints the optional supplication after the Grace, but its rubric
  // directs it before the Prayer of Saint Chrysostom
  const ordered =
    supplicationStart > chrysostomStart && chrysostomStart >= 0
      ? [
          ...lines.slice(0, chrysostomStart),
          ...lines.slice(supplicationStart),
          ...lines.slice(chrysostomStart, supplicationStart),
        ]
      : lines;
  return {
    edition: "1962",
    officeName: "The Litany",
    date,
    nodes: ordered.flatMap((line): Bcp1962LitanyNode[] =>
      line.kind === "text" &&
      line.text.startsWith("Our Father who art in heaven")
        ? lordsPrayerNodes(line.text).map((node) => ({
            ...node,
            speaker: undefined,
          }))
        : [{ ...line }],
    ),
  };
}

export type Bcp1962OfficeSectionKey =
  | "opening"
  | "psalms"
  | "lessons"
  | "creed"
  | "prayers"
  | "collects"
  | "closing";

export type Bcp1962OfficeNode =
  | {
      kind: "heading";
      text: string;
      rule?: boolean;
      scripture?: boolean;
      citation?: string;
    }
  | { kind: "rubric"; text: string }
  | {
      kind: "text";
      text: string;
      speaker?: string;
      group?: string;
      suggested?: boolean;
      citation?: string;
      seasonLabel?: string;
      collect?: boolean;
      anthem?: boolean;
      choiceGroup?: string;
      choiceId?: string;
      choiceLabel?: string;
      lordsPrayer?: boolean;
      lordsPrayerFirst?: boolean;
      lordsPrayerLast?: boolean;
    }
  | {
      kind: "psalm";
      refs: string[];
      passages: Array<{ ref: string; passage: PsalmPassage }>;
    }
  | {
      kind: "lesson";
      slot: "first" | "second";
      label: string;
      ref?: string;
      normalized?: string;
      passages: KjvPassage[];
      error?: string;
    }
  | {
      kind: "canticle";
      slot: "first" | "second";
      id: string;
      title: string;
      rubric?: string;
      text: string;
      suggested: boolean;
    }
  | {
      kind: "creed";
      id: "apostles" | "athanasian";
      title: string;
      rubric?: string;
      text: string;
      suggested: boolean;
    }
  | {
      kind: "occasional";
      id: string;
      title: string;
      text: string;
    };

export type Bcp1962ComposedSection = {
  key: Bcp1962OfficeSectionKey;
  heading?: string;
  nodes: Bcp1962OfficeNode[];
};

export type Bcp1962OfficeId = Bcp1962Office | "noonday" | "compline";

export type Bcp1962ComposedOffice = {
  edition: "1962";
  office: Bcp1962OfficeId;
  officeName: string;
  date: CalendarDate;
  title?: string;
  sections: Bcp1962ComposedSection[];
  notes: string[];
};

function bcp1962OfficeName(office: Bcp1962Office): string {
  return office === "morning" ? "Morning Prayer" : "Evening Prayer";
}

// the printed citation trails the sentence, so the two can be styled apart
const OPENING_CITATION_RE =
  /\s((?:[123]\s+)?(?:St\s+[A-Z][a-z]+|[A-Z][a-z]+)\s+\d+\.\s*\d+(?:,\s*\d+)*\.?)$/;

// the book's opening sentences are grouped by season; the first sentence of
// the current season is suggested, falling back to the book's first sentence
function bcp1962OpeningLabel(
  observance: Bcp1962Observance,
): string | undefined {
  const bySeason: Record<string, string> = {
    advent: "Advent",
    christmastide: "Christmas",
    "after-christmas": "Christmas",
    epiphany: "Epiphany",
    "pre-lent": "Lent",
    lent: "Lent",
    "holy-week": "Good Friday",
    "easter-week": "Easter",
    easter: "Easter",
    ascension: "Ascension",
    whitsunday: "Whitsunday and Embertide",
    trinity: "Trinity",
    "before-advent": "Trinity",
  };
  return bySeason[observance.season];
}

/**
 * Compose a full 1962 Morning or Evening Prayer from the vendored fixed texts,
 * canticles and collects together with the date's lessons and psalms.
 */
export function composeBcp1962Office(
  date: CalendarDate,
  office: Bcp1962Office,
  resolved: Bcp1962ResolvedOffice,
  composed?: Bcp1962ComposedDate,
): Bcp1962ComposedOffice {
  const source = composed ?? composeBcp1962ForDate(date);
  const officeDef = getBcp1962OfficeText(office);
  const common = BCP1962_OFFICE_TEXT.common;
  const officeName = officeDef?.name ?? bcp1962OfficeName(office);
  const title = resolved.name ?? source.name;

  const openingNodes: Bcp1962OfficeNode[] = [];
  if (officeDef?.openingRubric) {
    openingNodes.push({ kind: "rubric", text: officeDef.openingRubric });
  }
  const sentences = common.openingSentences ?? [];
  const suggestedLabel = bcp1962OpeningLabel(source.observance);
  const suggestedIndex = sentences.findIndex((s) => s.label === suggestedLabel);
  const normalizeLabel = (s: string) => s.replace(/[’']/g, "'").toLowerCase();
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const label = sentence.label;
    const prefix = `${label}. `;
    const printed = normalizeLabel(sentence.text).startsWith(
      normalizeLabel(prefix),
    );
    const body = printed ? sentence.text.slice(prefix.length) : sentence.text;
    const citation = body.match(OPENING_CITATION_RE);
    openingNodes.push({
      kind: "text",
      text: citation ? body.slice(0, citation.index).trimEnd() : body,
      citation: citation?.[1],
      seasonLabel: printed ? `${label}.` : undefined,
      group: label,
      suggested: i === (suggestedIndex >= 0 ? suggestedIndex : 0),
    });
  }
  openingNodes.push({ kind: "heading", text: "Confession of Sin" });
  if (common.exhortation) {
    openingNodes.push({ kind: "text", text: common.exhortation });
  }
  if (common.confession_rubric) {
    openingNodes.push({ kind: "rubric", text: common.confession_rubric });
  }
  openingNodes.push({ kind: "text", text: common.confession });
  if (common.absolution_rubric) {
    openingNodes.push({ kind: "rubric", text: common.absolution_rubric });
  }
  openingNodes.push({ kind: "text", text: common.absolution_priest });
  if (common.amen_rubric) {
    // the rubric directs the people's response; the response gets its own line
    openingNodes.push({
      kind: "rubric",
      text: common.amen_rubric.replace(/[\s,]*Amen\.?\s*$/, ""),
    });
    openingNodes.push({ kind: "text", text: "Amen.", speaker: "people" });
  }
  if (officeDef?.lordsPrayerOpeningRubric) {
    openingNodes.push({
      kind: "rubric",
      text: officeDef.lordsPrayerOpeningRubric,
    });
  }
  openingNodes.push({ kind: "heading", text: "The Lord's Prayer" });
  openingNodes.push(
    ...lordsPrayerNodes(common.lords_prayer_opening ?? common.lords_prayer),
  );
  if (officeDef?.openingVersiclesRubric) {
    openingNodes.push({
      kind: "rubric",
      text: officeDef.openingVersiclesRubric,
    });
  }
  for (let i = 0; i < (officeDef?.openingVersicles?.length ?? 0); i++) {
    const v = officeDef?.openingVersicles?.[i];
    if (v && i === 4 && officeDef?.gloriaStandingRubric) {
      openingNodes.push({
        kind: "rubric",
        text: officeDef.gloriaStandingRubric,
      });
    }
    if (v)
      openingNodes.push({ kind: "text", text: v.text, speaker: v.speaker });
  }
  if (office === "morning") {
    if (officeDef?.invitatory?.rubric) {
      openingNodes.push({ kind: "rubric", text: officeDef.invitatory.rubric });
    }
    if (common.venite) {
      openingNodes.push({ kind: "heading", text: common.venite.title });
      const passage = getBcp1962PsalmPassage("95");
      if (passage) {
        openingNodes.push({
          kind: "psalm",
          refs: ["95"],
          passages: [{ ref: "95", passage }],
        });
        const lines = common.venite.text.split("\n");
        const doxology = lines[lines.length - 1];
        if (doxology?.startsWith("Glory be to the Father")) {
          openingNodes.push({ kind: "text", text: doxology });
        }
      } else {
        openingNodes.push({ kind: "text", text: common.venite.text });
      }
    }
  }
  if (officeDef?.psalmsRubric) {
    openingNodes.push({ kind: "rubric", text: officeDef.psalmsRubric });
  }
  if (common.psalms_gloria_rubric) {
    openingNodes.push({ kind: "rubric", text: common.psalms_gloria_rubric });
  }
  if (common.gloria_patri) {
    openingNodes.push({ kind: "text", text: common.gloria_patri });
  }

  const psalmRefs = resolved.psalms ?? [];
  const passages = psalmRefs.flatMap((ref) => {
    const passage = getBcp1962PsalmPassages([ref])?.[0];
    return passage ? [{ ref, passage }] : [];
  });
  const psalmNodes: Bcp1962OfficeNode[] =
    psalmRefs.length > 0
      ? [
          {
            kind: "psalm",
            refs: psalmRefs,
            passages,
          },
        ]
      : [
          {
            kind: "rubric",
            text: "No psalms appointed for this date.",
          },
        ];

  const lessonsAndCanticles: Bcp1962OfficeNode[] = [];
  if (common.lesson_note) {
    lessonsAndCanticles.push({ kind: "rubric", text: common.lesson_note });
  }
  const slots: Array<
    ["first" | "second", string, "afterFirst" | "afterSecond"]
  > = [
    ["first", "First Lesson", "afterFirst"],
    ["second", "Second Lesson", "afterSecond"],
  ];
  for (let i = 0; i < slots.length; i++) {
    const [slot, label, canticleKey] = slots[i];
    const rubric =
      slot === "first"
        ? officeDef?.firstLessonRubric
        : officeDef?.secondLessonRubric;
    if (rubric) lessonsAndCanticles.push({ kind: "rubric", text: rubric });
    const lesson = resolved.lessons[i];
    if (lesson) {
      lessonsAndCanticles.push({
        kind: "lesson",
        slot,
        label,
        ref: lesson.ref,
        normalized: lesson.normalized,
        passages: lesson.passages,
        error: lesson.error,
      });
    }
    const canticleIds =
      canticleKey === "afterFirst"
        ? (officeDef?.canticles?.afterFirst ?? [])
        : (officeDef?.canticles?.afterSecond ?? []);
    const canticles = canticleIds.flatMap((id) => {
      const canticle = getBcp1962Canticle(id);
      return canticle ? [canticle] : [];
    });
    for (let i = 0; i < canticles.length; i++) {
      const canticle = canticles[i];
      lessonsAndCanticles.push({
        kind: "canticle",
        slot,
        id: canticle.id,
        title: canticle.title,
        rubric: canticle.rubric,
        text: canticle.text,
        suggested: i === 0,
      });
    }
  }

  // the book appoints the Apostles' Creed; Athanasian is an any-day alternative
  const creedNodes: Bcp1962OfficeNode[] = [
    {
      kind: "creed",
      id: "apostles",
      title: "The Apostles' Creed",
      rubric: officeDef?.creedRubric ?? common.creed_rubric,
      text: common.apostles_creed,
      suggested: true,
    },
  ];
  if (common.athanasian_creed) {
    creedNodes.push({
      kind: "creed",
      id: "athanasian",
      title: "The Creed of Saint Athanasius",
      rubric: common.athanasian_creed_rubric,
      text: common.athanasian_creed,
      suggested: false,
    });
  }

  const prayersNodes: Bcp1962OfficeNode[] = [];
  if (officeDef?.prayersRubric) {
    prayersNodes.push({ kind: "rubric", text: officeDef.prayersRubric });
  }
  for (const v of officeDef?.preces ?? []) {
    prayersNodes.push({ kind: "text", text: v.text, speaker: v.speaker });
  }
  prayersNodes.push({ kind: "heading", text: "The Lord's Prayer" });
  prayersNodes.push(...lordsPrayerNodes(common.lords_prayer));
  if (officeDef?.suffragesRubric) {
    prayersNodes.push({ kind: "rubric", text: officeDef.suffragesRubric });
  }
  if (common.suffrages?.length) {
    prayersNodes.push({ kind: "heading", text: "Suffrages" });
    for (const v of common.suffrages) {
      prayersNodes.push({ kind: "text", text: v.text, speaker: v.speaker });
    }
  }

  const collectNodes: Bcp1962OfficeNode[] = [];
  if (officeDef?.collectsRubric) {
    collectNodes.push({ kind: "rubric", text: officeDef.collectsRubric });
  }
  const collectOfDay = findBcp1962Collect([
    resolved.name,
    source.name,
    bcp1962SundayCollectName(source.observance),
    title,
  ]);
  if (collectOfDay) {
    collectNodes.push({ kind: "heading", text: "The Collect of the Day" });
    collectNodes.push({ kind: "rubric", text: collectOfDay.name });
    collectNodes.push({ kind: "text", text: collectOfDay.text });
  }
  for (const c of getBcp1962FixedCollects(office)) {
    collectNodes.push({ kind: "heading", text: c.title });
    collectNodes.push({ kind: "text", text: c.text });
  }

  const closingNodes: Bcp1962OfficeNode[] = [];
  const stateRubric =
    office === "morning"
      ? common.state_prayers_rubric_morning
      : common.state_prayers_rubric_evening;
  if (stateRubric) closingNodes.push({ kind: "rubric", text: stateRubric });
  if (common.anthem_rubric) {
    closingNodes.push({ kind: "rubric", text: common.anthem_rubric });
  }
  for (const p of common.prayers ?? []) {
    closingNodes.push({
      kind: "occasional",
      id: p.id,
      title: p.title,
      text: p.text,
    });
  }
  closingNodes.push({ kind: "heading", text: "The Grace" });
  closingNodes.push({ kind: "text", text: common.grace });
  if (officeDef?.endRubric) {
    closingNodes.push({ kind: "rubric", text: officeDef.endRubric });
  }

  return {
    edition: "1962",
    office,
    officeName,
    date,
    title,
    sections: [
      { key: "opening", nodes: openingNodes },
      { key: "psalms", heading: "The Psalms", nodes: psalmNodes },
      { key: "lessons", heading: "The Lessons", nodes: lessonsAndCanticles },
      { key: "creed", heading: "The Creed", nodes: creedNodes },
      { key: "prayers", heading: "The Prayers", nodes: prayersNodes },
      { key: "collects", nodes: collectNodes },
      { key: "closing", nodes: closingNodes },
    ],
    notes: [...new Set([...source.notes, ...resolved.notes])],
  };
}

/** Resolve and compose a sectioned 1962 office for a date. */
export async function composeBcp1962OfficeForDate(
  date: CalendarDate,
  office: Bcp1962Office,
  settings: ScriptureSettings = DEFAULT_BCP1962_SCRIPTURE_SETTINGS,
): Promise<Bcp1962ComposedOffice> {
  const composed = composeBcp1962ForDate(date);
  const resolved = await resolveBcp1962OfficeForDate(date, office, settings);
  return composeBcp1962Office(date, office, resolved, composed);
}

export const BCP1962_OFFICE_SECTION_ORDER: Bcp1962OfficeSectionKey[] = [
  "opening",
  "psalms",
  "lessons",
  "creed",
  "prayers",
  "collects",
  "closing",
];

/** Compose one of the 1962 book's fixed short offices from vendored lines. */
// the Compline alternatives are printed as "Or" headings
const COMPLINE_READINGS: Record<number, { id: string; label: string }> = {
  11: { id: "jeremiah", label: "Jeremiah 14. 9" },
  13: { id: "matthew", label: "St Matthew 11. 28-30" },
  15: { id: "hebrews", label: "Hebrews 13. 20, 21" },
};
const COMPLINE_COLLECTS: Record<number, { id: string; label: string }> = {
  67: { id: "protection", label: "The Collect for Protection" },
  69: { id: "lighten", label: "Lighten our darkness" },
};
const COMPLINE_ADDED_PRAYERS = new Set([71, 72, 73]);

// the printed sentences carry no references; these are the book's texts
const MIDDAY_SCRIPTURE_CITATIONS: Record<number, string> = {
  2: "St John 12. 32",
  4: "Acts 26. 13",
  6: "Acts 10. 9",
};

export function composeBcp1962FixedOffice(
  office: "noonday" | "compline",
  date: CalendarDate,
): Bcp1962ComposedOffice {
  const source =
    office === "noonday" ? getBcp1962MidDayOffice() : getBcp1962Compline();
  const officeName =
    office === "noonday" ? "Prayers at Mid-day" : "The Order for Compline";
  const nodes: Bcp1962OfficeNode[] = source.lines.flatMap(
    (entry, i): Bcp1962OfficeNode[] => {
      if (office === "compline") {
        if (
          entry.kind === "heading" &&
          entry.text === "Nunc Dimittis" &&
          source.lines[i + 1]?.kind === "text"
        ) {
          return [
            {
              kind: "canticle",
              slot: "first",
              id: "nunc-dimittis",
              title: "Nunc Dimittis",
              text: source.lines[i + 1].text,
              suggested: true,
            },
          ];
        }
        if (
          entry.kind === "text" &&
          source.lines[i - 1]?.kind === "heading" &&
          source.lines[i - 1].text === "Nunc Dimittis"
        ) {
          return [];
        }
        if (i === 36 && entry.kind === "rubric") {
          return [
            { kind: "heading", text: "The Creed", rule: true },
            { kind: "rubric", text: entry.text },
          ];
        }
        if (i === 8 && entry.kind === "rubric") {
          const psalms = ["4", "31:1-6", "91", "134"].flatMap((ref) => {
            const passage = getBcp1962PsalmPassage(ref);
            return passage ? [{ ref, passage }] : [];
          });
          return [
            { kind: "rubric", text: entry.text },
            { kind: "psalm", refs: psalms.map((p) => p.ref), passages: psalms },
          ];
        }
        if ([10, 12, 14, 66, 68].includes(i) && entry.kind === "heading") {
          return [];
        }
        if (entry.kind === "heading" && entry.text === "Anthem") {
          return [];
        }
        if (
          entry.kind === "text" &&
          entry.text.startsWith("Our Father who art in heaven")
        ) {
          return [
            { kind: "heading", text: "The Lord's Prayer" },
            ...lordsPrayerNodes(entry.text),
          ];
        }
        if (entry.kind === "text" && entry.text.startsWith("Anthem. ")) {
          return [{ kind: "text", text: entry.text, anthem: true }];
        }
        if (entry.kind === "text" && COMPLINE_READINGS[i]) {
          return [
            {
              kind: "text",
              text: entry.text,
              choiceGroup: "compline-reading",
              choiceId: COMPLINE_READINGS[i].id,
              choiceLabel: COMPLINE_READINGS[i].label,
            },
          ];
        }
        if (entry.kind === "text" && COMPLINE_COLLECTS[i]) {
          return [
            {
              kind: "text",
              text: entry.text,
              collect: true,
              choiceGroup: "compline-collect",
              choiceId: COMPLINE_COLLECTS[i].id,
              choiceLabel: COMPLINE_COLLECTS[i].label,
            },
          ];
        }
        if (entry.kind === "text" && COMPLINE_ADDED_PRAYERS.has(i)) {
          return [{ kind: "text", text: entry.text, collect: true }];
        }
      }
      if (office === "noonday") {
        if (i === 0 && entry.kind === "rubric") {
          return [];
        }
        if (i === 1 && entry.kind === "text") {
          return [
            { kind: "heading", text: "The Lord's Prayer" },
            ...lordsPrayerNodes(entry.text),
          ];
        }
        if (i === source.lines.length - 1 && entry.kind === "text") {
          return [{ kind: "rubric", text: entry.text }];
        }
        if (entry.kind === "heading") {
          return [
            {
              kind: "heading",
              text: entry.text,
              scripture: true,
              citation: MIDDAY_SCRIPTURE_CITATIONS[i],
            },
          ];
        }
        if (entry.kind === "text") {
          return [{ kind: "text", text: entry.text, collect: true }];
        }
      }
      if (entry.kind === "rubric" || entry.kind === "heading") {
        return [{ kind: entry.kind, text: entry.text }];
      }
      if (
        entry.kind === "text" &&
        entry.text.startsWith("Our Father who art in heaven")
      ) {
        return lordsPrayerNodes(entry.text);
      }
      return [
        {
          kind: "text",
          text: entry.text,
          speaker: entry.speaker === "answer" ? "people" : entry.speaker,
        },
      ];
    },
  );
  return {
    edition: "1962",
    office,
    officeName,
    date,
    title: office === "noonday" ? "For Missions" : undefined,
    sections: [{ key: "closing", nodes }],
    notes: [],
  };
}

export function composeBcp1962Noonday(
  date: CalendarDate,
): Bcp1962ComposedOffice {
  return composeBcp1962FixedOffice("noonday", date);
}

export function composeBcp1962Compline(
  date: CalendarDate,
): Bcp1962ComposedOffice {
  return composeBcp1962FixedOffice("compline", date);
}

/**
 * Family Prayer is the 1962 book's equivalent of the 1979 daily devotions.
 * The book prints a Morning and an Evening form; the noonday and compline
 * tabs use the nearer of the two.
 */
export function composeBcp1962FamilyPrayer(
  tab: Bcp1962OfficeId,
  date: CalendarDate,
): Bcp1962ComposedOffice {
  const form = tab === "morning" || tab === "noonday" ? "morning" : "evening";
  const nodes: Bcp1962OfficeNode[] = getBcp1962FamilyPrayer(form).flatMap(
    (entry): Bcp1962OfficeNode[] => {
      if (entry.kind === "rubric" || entry.kind === "heading") {
        return [{ kind: entry.kind, text: entry.text }];
      }
      if (entry.text.startsWith("Our Father who art in heaven")) {
        return lordsPrayerNodes(entry.text);
      }
      return [
        {
          kind: "text",
          text: entry.text,
          speaker: entry.speaker === "answer" ? "people" : entry.speaker,
        },
      ];
    },
  );
  return {
    edition: "1962",
    office: tab,
    officeName: `Family Prayers, ${form === "morning" ? "Morning" : "Evening"}`,
    date,
    sections: [{ key: "closing", nodes }],
    notes: [],
  };
}
