/**
 * 1662 BCP composition helpers: resolve a civil date to 1662 appointments
 * (daily calendar, Sunday/holy-day propers, proper psalms) and optionally
 * resolve lesson references to scripture passages using existing loaders.
 *
 * This composes 1662 Daily Offices (Matins/Evensong) from vendored texts,
 * lectionary/psalm appointments, canticles, collects, and resolved scripture.
 */
import {
  athanasianCreedDay,
  type Bcp1662Observance,
  bcp1662MoveableDays,
  resolveBcp1662Observance,
} from "../calendar/bcp1662";
import { sundayOnOrBefore } from "../calendar/date";
import type { CalendarDate } from "../calendar/types";
import {
  ALL_SCRIPTURE_BOOKS,
  getScripturePassagesFromDolRef,
  loadScriptureBook,
  type ScriptureSettings,
} from "./bible";
import { getBookMeta, getPassageFromDolRef, parseDolRef } from "./scripture";
import type { KjvPassage, PsalmPassage } from "./types";
import {
  BCP1662_OFFICE_TEXT,
  BCP1662_PROPER_LESSONS,
  type Bcp1662DayComposition,
  type Bcp1662LessonPair,
  type Bcp1662Office,
  bcp1662MonthFromNumber,
  composeBcp1662Day,
  getBcp1662Canticle,
  getBcp1662FixedCollects,
  getBcp1662HolyDayProperLessons,
  getBcp1662OccasionalPrayers,
  getBcp1662OfficeText,
  getBcp1662ProperCollect,
  getBcp1662ProperPsalms,
  getBcp1662PsalmPassages,
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

export type Bcp1662OfficeSectionKey =
  | "opening"
  | "psalms"
  | "lessons"
  | "creed"
  | "prayers"
  | "collects"
  | "closing";

export type Bcp1662OfficeNode =
  | { kind: "heading"; text: string }
  | { kind: "rubric"; text: string }
  | { kind: "text"; text: string; speaker?: string }
  | {
      kind: "psalm";
      refs: string[];
      passages: Array<{ ref: string; passage: PsalmPassage }>;
      source: "proper" | "monthly";
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
      group: "Prayers" | "Thanksgivings";
    }
  | { kind: "placeholder"; key: string; text: string };

export type Bcp1662ComposedSection = {
  key: Bcp1662OfficeSectionKey;
  heading?: string;
  nodes: Bcp1662OfficeNode[];
};

export type Bcp1662ComposedOffice = {
  edition: "1662";
  office: Bcp1662Office;
  officeName: string;
  date: CalendarDate;
  observance: Bcp1662Observance;
  title?: string;
  sections: Bcp1662ComposedSection[];
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
    !/[:,\-\u2013]/.test(seg.replace(/^\d?\s?[A-Za-z.]+\s+\d*$/, (m) => m));

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

function bcp1662OfficeName(office: Bcp1662Office): string {
  return office === "morning" ? "Matins" : "Evensong";
}

function psalmRefsForResolved(resolved: Bcp1662ResolvedOffice): string[] {
  if (resolved.psalms && resolved.psalms.length > 0) {
    return resolved.psalms.map((n) => `Psalm ${n}`);
  }
  return (resolved.monthlyPsalms ?? []).map((r) =>
    /^\d/.test(r) ? `Psalm ${r}` : r,
  );
}

/** Build a sectioned 1662 office composition from resolved appointments/text-ready data. */
export function composeBcp1662Office(
  date: CalendarDate,
  office: Bcp1662Office,
  resolved: Bcp1662ResolvedOffice,
  composed?: Bcp1662ComposedDate,
): Bcp1662ComposedOffice {
  const source = composed ?? composeBcp1662ForDate(date);
  const officeDef = getBcp1662OfficeText(office);
  const officeName = officeDef?.name ?? bcp1662OfficeName(office);
  const title =
    resolved.name ??
    source.observance.holyDay ??
    source.observance.properSundayName;
  const psalmRefs = psalmRefsForResolved(resolved);

  const openingNodes: Bcp1662OfficeNode[] = [];
  const sentences = BCP1662_OFFICE_TEXT.common.openingSentences ?? [];
  openingNodes.push({
    kind: "rubric",
    text:
      officeDef?.openingRubric ??
      "At the beginning of Morning Prayer the Minister shall read with a loud voice some one or more of these Sentences of the Scriptures that follow. And then he shall say that which is written after the said Sentences.",
  });
  if (sentences.length > 0) {
    for (const sentence of sentences) {
      openingNodes.push({ kind: "text", text: sentence.text });
    }
  }

  // the penitential opening carries one section rule over exhortation,
  // confession, and absolution; the absolution keeps its own rubric
  openingNodes.push({
    kind: "heading",
    text: "Confession of Sin",
  });

  if (BCP1662_OFFICE_TEXT.common.exhortation) {
    openingNodes.push({
      kind: "text",
      text: BCP1662_OFFICE_TEXT.common.exhortation,
    });
  }

  openingNodes.push({
    kind: "rubric",
    text:
      BCP1662_OFFICE_TEXT.common.confession_rubric ??
      "A general Confession to be said of the whole Congregation after the Minister, all kneeling.",
  });
  openingNodes.push({
    kind: "text",
    text: BCP1662_OFFICE_TEXT.common.confession,
  });

  openingNodes.push({
    kind: "rubric",
    text:
      BCP1662_OFFICE_TEXT.common.absolution_rubric ??
      "The Absolution, or Remission of sins, to be pronounced by the Priest alone, standing: the people still kneeling.",
  });
  openingNodes.push({
    kind: "text",
    text: BCP1662_OFFICE_TEXT.common.absolution_priest,
  });
  if (BCP1662_OFFICE_TEXT.common.amen_rubric) {
    openingNodes.push({
      kind: "rubric",
      text: BCP1662_OFFICE_TEXT.common.amen_rubric,
    });
  }
  if (BCP1662_OFFICE_TEXT.common.absolution_note) {
    openingNodes.push({
      kind: "rubric",
      text: BCP1662_OFFICE_TEXT.common.absolution_note,
    });
  }

  openingNodes.push({
    kind: "rubric",
    text:
      officeDef?.lordsPrayerOpeningRubric ??
      "Then the Minister shall kneel, and say the Lord's Prayer with an audible voice; the people also kneeling, and repeating it with him.",
  });
  openingNodes.push({ kind: "heading", text: "The Lord's Prayer" });
  openingNodes.push({
    kind: "text",
    text:
      BCP1662_OFFICE_TEXT.common.lords_prayer_opening ??
      BCP1662_OFFICE_TEXT.common.lords_prayer,
  });

  if (officeDef?.openingVersicles?.length) {
    if (officeDef.openingVersiclesRubric) {
      openingNodes.push({
        kind: "rubric",
        text: officeDef.openingVersiclesRubric,
      });
    }
    for (let i = 0; i < officeDef.openingVersicles.length; i++) {
      if (i === 4 && officeDef.gloriaStandingRubric) {
        openingNodes.push({
          kind: "rubric",
          text: officeDef.gloriaStandingRubric,
        });
      }
      const v = officeDef.openingVersicles[i];
      openingNodes.push({ kind: "text", text: v.text, speaker: v.speaker });
    }
  }

  const isEasterAnthemsDay =
    source.observance.holyDay === "Easter Day" ||
    source.observance.holyDay === "Monday in Easter Week" ||
    source.observance.holyDay === "Tuesday in Easter Week" ||
    resolved.name === "Easter Day" ||
    resolved.name === "Monday in Easter Week" ||
    resolved.name === "Tuesday in Easter Week";

  if (office === "morning") {
    if (officeDef?.invitatory?.rubric) {
      openingNodes.push({ kind: "rubric", text: officeDef.invitatory.rubric });
    }
    if (isEasterAnthemsDay && BCP1662_OFFICE_TEXT.common.easterAnthems) {
      const ea = BCP1662_OFFICE_TEXT.common.easterAnthems;
      if (ea.rubric) openingNodes.push({ kind: "rubric", text: ea.rubric });
      openingNodes.push({ kind: "heading", text: ea.title });
      openingNodes.push({ kind: "text", text: ea.text });
    } else if (BCP1662_OFFICE_TEXT.common.venite) {
      openingNodes.push({
        kind: "heading",
        text: BCP1662_OFFICE_TEXT.common.venite.title,
      });
      if (BCP1662_OFFICE_TEXT.common.venite.rubric) {
        openingNodes.push({
          kind: "rubric",
          text: BCP1662_OFFICE_TEXT.common.venite.rubric,
        });
      }
      openingNodes.push({
        kind: "text",
        text: BCP1662_OFFICE_TEXT.common.venite.text,
      });
    } else {
      openingNodes.push({
        kind: "placeholder",
        key: "invitatory",
        text: "Venite, exultemus Domino (Psalm 95) / appointed invitatory text to be vendored.",
      });
    }
  }

  openingNodes.push({
    kind: "rubric",
    text: officeDef?.psalmsRubric ?? "Then shall follow the Psalms.",
  });
  if (BCP1662_OFFICE_TEXT.common.psalms_gloria_rubric) {
    openingNodes.push({
      kind: "rubric",
      text: `${BCP1662_OFFICE_TEXT.common.psalms_gloria_rubric}\n${BCP1662_OFFICE_TEXT.common.gloria_patri ?? "Glory be to the Father, and to the Son : and to the Holy Ghost;\nAs it was in the beginning, is now, and ever shall be : world without end. Amen."}`,
    });
  }

  const psalmInputRefs =
    resolved.psalms && resolved.psalms.length > 0
      ? resolved.psalms.map(String)
      : (resolved.monthlyPsalms ?? []);
  const psalmPassages = psalmInputRefs.flatMap((ref) => {
    const passage = getBcp1662PsalmPassages([ref])[0];
    return passage ? [{ ref, passage }] : [];
  });

  const psalmNodes: Bcp1662OfficeNode[] =
    psalmRefs.length > 0
      ? [
          {
            kind: "psalm",
            refs: psalmRefs,
            passages: psalmPassages,
            source: resolved.psalmsSource,
          },
          ...(psalmPassages.length === 0
            ? [
                {
                  kind: "placeholder" as const,
                  key: "psalm-text",
                  text: "Psalm text (Coverdale, 1662) not available for appointed psalms.",
                },
              ]
            : []),
        ]
      : [
          {
            kind: "placeholder",
            key: "psalm-text",
            text: "No psalms resolved; vendored psalter text/appointments required.",
          },
        ];

  const lessonsAndCanticles: Bcp1662OfficeNode[] = [];
  const lessonSlots: Array<["first" | "second", string, string]> = [
    ["first", "First Lesson", "afterFirst"],
    ["second", "Second Lesson", "afterSecond"],
  ];
  if (BCP1662_OFFICE_TEXT.common.lesson_note) {
    lessonsAndCanticles.push({
      kind: "rubric",
      text: BCP1662_OFFICE_TEXT.common.lesson_note,
    });
  }
  for (let i = 0; i < lessonSlots.length; i++) {
    const [slot, label, canticleKey] = lessonSlots[i];
    if (slot === "first" && officeDef?.firstLessonRubric) {
      lessonsAndCanticles.push({
        kind: "rubric",
        text: officeDef.firstLessonRubric,
      });
    }
    if (slot === "second" && officeDef?.secondLessonRubric) {
      lessonsAndCanticles.push({
        kind: "rubric",
        text: officeDef.secondLessonRubric,
      });
    }
    const l = resolved.lessons[i];
    if (l) {
      lessonsAndCanticles.push({
        kind: "lesson",
        slot,
        label,
        ref: l.ref ?? undefined,
        normalized: l.normalized,
        passages: l.passages,
        error: l.error,
      });
    } else {
      lessonsAndCanticles.push({
        kind: "rubric",
        text: `${label}: no lesson appointed or resolved.`,
      });
    }
    const canticleIds =
      canticleKey === "afterFirst"
        ? (officeDef?.canticles?.afterFirst ?? [])
        : (officeDef?.canticles?.afterSecond ?? []);
    const canticles = canticleIds.flatMap((id) => {
      const canticle = getBcp1662Canticle(id);
      return canticle ? [canticle] : [];
    });
    if (canticles.length === 0) {
      lessonsAndCanticles.push({
        kind: "placeholder",
        key: `canticle-${slot}`,
        text: "Canticle text to be vendored/selected.",
      });
    }
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

  const useAthanasian =
    office === "morning" && athanasianCreedDay(source.observance);
  const creedNodes: Bcp1662OfficeNode[] = [
    {
      kind: "creed",
      id: "apostles",
      title: "The Apostles' Creed",
      rubric: officeDef?.creedRubric ?? BCP1662_OFFICE_TEXT.common.creed_rubric,
      text: BCP1662_OFFICE_TEXT.common.apostles_creed,
      suggested: !useAthanasian,
    },
  ];
  if (BCP1662_OFFICE_TEXT.common.athanasian_creed) {
    creedNodes.push({
      kind: "creed",
      id: "athanasian",
      title: "The Creed of Saint Athanasius",
      rubric: BCP1662_OFFICE_TEXT.common.athanasian_creed_rubric,
      text: BCP1662_OFFICE_TEXT.common.athanasian_creed,
      suggested: useAthanasian,
    });
  }

  const prayersNodes: Bcp1662OfficeNode[] = [];
  if (officeDef?.prayersRubric) {
    prayersNodes.push({ kind: "rubric", text: officeDef.prayersRubric });
  }
  if (officeDef?.preces?.length) {
    for (const v of officeDef.preces) {
      prayersNodes.push({ kind: "text", text: v.text, speaker: v.speaker });
    }
  }
  prayersNodes.push({
    kind: "rubric",
    text:
      officeDef?.lordsPrayerRubric ??
      "Then the Minister, Clerks, and people shall say the Lord's Prayer with a loud voice.",
  });
  prayersNodes.push({ kind: "heading", text: "The Lord's Prayer" });
  prayersNodes.push({
    kind: "text",
    text: BCP1662_OFFICE_TEXT.common.lords_prayer,
  });
  if (BCP1662_OFFICE_TEXT.common.suffrages?.length) {
    prayersNodes.push({ kind: "heading", text: "Suffrages" });
    prayersNodes.push({
      kind: "rubric",
      text:
        officeDef?.suffragesRubric ?? "Then the Priest standing up shall say,",
    });
    for (const v of BCP1662_OFFICE_TEXT.common.suffrages) {
      prayersNodes.push({ kind: "text", text: v.text, speaker: v.speaker });
    }
  } else {
    prayersNodes.push({
      kind: "placeholder",
      key: "suffrages",
      text: "Versicles and responses to be vendored/expanded.",
    });
  }

  const collectCandidates = [
    resolved.name,
    source.observance.holyDay,
    source.observance.properSundayName,
    title,
  ].filter((n): n is string => typeof n === "string" && n.length > 0);
  let collectOfDay = collectCandidates
    .map((name) => {
      const c = getBcp1662ProperCollect(name);
      return c ? { name, text: c.text } : undefined;
    })
    .find((c) => c !== undefined);
  if (!collectOfDay) {
    const prevSunday = sundayOnOrBefore(date);
    const sundayObs = resolveBcp1662Observance(prevSunday);
    const sundayCandidates = [
      sundayObs.holyDay,
      sundayObs.properSundayName,
    ].filter((n): n is string => typeof n === "string" && n.length > 0);
    collectOfDay = sundayCandidates
      .map((name) => {
        const c = getBcp1662ProperCollect(name);
        return c ? { name, text: c.text } : undefined;
      })
      .find((c) => c !== undefined);
  }

  const collectNodes: Bcp1662OfficeNode[] = [];
  if (officeDef?.collectsRubric) {
    collectNodes.push({ kind: "rubric", text: officeDef.collectsRubric });
  }
  if (collectOfDay) {
    collectNodes.push({ kind: "heading", text: "The Collect of the Day" });
    collectNodes.push({ kind: "rubric", text: collectOfDay.name });
    collectNodes.push({ kind: "text", text: collectOfDay.text });
  } else {
    collectNodes.push({
      kind: "placeholder",
      key: "collect-day",
      text: "Collect of the day (Sunday/holy-day proper) to be resolved from vendored propers.",
    });
  }
  for (const c of getBcp1662FixedCollects(office)) {
    collectNodes.push({ kind: "heading", text: c.title });
    collectNodes.push({ kind: "text", text: c.text });
  }

  const closingNodes: Bcp1662OfficeNode[] = [];
  if (BCP1662_OFFICE_TEXT.common.anthem_rubric) {
    closingNodes.push({
      kind: "rubric",
      text: BCP1662_OFFICE_TEXT.common.anthem_rubric,
    });
  }
  const statePrayersRubric =
    office === "morning"
      ? BCP1662_OFFICE_TEXT.common.state_prayers_rubric_morning
      : BCP1662_OFFICE_TEXT.common.state_prayers_rubric_evening;
  if (statePrayersRubric) {
    closingNodes.push({ kind: "rubric", text: statePrayersRubric });
  }
  if (BCP1662_OFFICE_TEXT.common.prayers?.length) {
    for (const p of BCP1662_OFFICE_TEXT.common.prayers) {
      // the occasional prayers belong before the two final prayers, so they
      // land ahead of Chrysostom and the Grace
      if (p.id === "chrysostom") {
        for (const occ of getBcp1662OccasionalPrayers()) {
          closingNodes.push({
            kind: "occasional",
            id: occ.id,
            title: occ.title,
            text: occ.text,
            group: occ.group,
          });
        }
      }
      closingNodes.push({ kind: "heading", text: p.title });
      closingNodes.push({ kind: "text", text: p.text });
    }
  } else {
    closingNodes.push({
      kind: "placeholder",
      key: "closing-prayers",
      text: "Additional prayers/anthem as appointed (to be vendored).",
    });
  }
  closingNodes.push({ kind: "heading", text: "The Grace" });
  closingNodes.push({ kind: "text", text: BCP1662_OFFICE_TEXT.common.grace });
  if (officeDef?.endRubric) {
    closingNodes.push({ kind: "rubric", text: officeDef.endRubric });
  }

  const sections: Bcp1662ComposedSection[] = [
    { key: "opening", nodes: openingNodes },
    { key: "psalms", heading: "Psalms", nodes: psalmNodes },
    {
      key: "lessons",
      heading: "The Lessons",
      nodes: lessonsAndCanticles,
    },
    {
      key: "creed",
      heading: useAthanasian
        ? "The Creed of Saint Athanasius"
        : "The Apostles' Creed",
      nodes: creedNodes,
    },
    { key: "prayers", heading: "The Prayers", nodes: prayersNodes },
    { key: "collects", nodes: collectNodes },
    { key: "closing", nodes: closingNodes },
  ];

  return {
    edition: "1662",
    office,
    officeName,
    date,
    observance: source.observance,
    title,
    sections,
    notes: [...new Set([...source.notes, ...resolved.notes])],
  };
}

/** Resolve and compose a sectioned 1662 office for a date. */
export async function composeBcp1662OfficeForDate(
  date: CalendarDate,
  office: Bcp1662Office,
  settings: ScriptureSettings = DEFAULT_BCP1662_SCRIPTURE_SETTINGS,
): Promise<Bcp1662ComposedOffice> {
  const composed = composeBcp1662ForDate(date);
  const resolved = await resolveBcp1662OfficeForDate(date, office, settings);
  return composeBcp1662Office(date, office, resolved, composed);
}

export const BCP1662_OFFICE_SECTION_ORDER: Bcp1662OfficeSectionKey[] = [
  "opening",
  "psalms",
  "lessons",
  "creed",
  "prayers",
  "collects",
  "closing",
];

export function getBcp1662OfficeSection(
  doc: Bcp1662ComposedOffice,
  key: Bcp1662OfficeSectionKey,
): Bcp1662ComposedSection | undefined {
  return doc.sections.find((s) => s.key === key);
}

export { bcp1662MoveableDays, normalizeBcp1662LessonRef };
