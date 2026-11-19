/**
 * 1962 Canadian BCP calendar helpers and appointment resolver.
 *
 * Resolves a civil date to a section id and day key used by the vendored
 * lectionary table in src/lib/content/vendor/bcp1962. The year is keyed to the
 * First Sunday of Advent, and moveable feasts are computed from Easter in the
 * following calendar year. Built on the shared Gregorian computus and date
 * helpers, following the shape of bcp1662.ts.
 */

import { BCP1962_FIXED_CALENDAR } from "../content/vendor/bcp1962";
import { addDays, fromDays, sundayOnOrAfter, toDays, weekday } from "./date";
import { gregorianEaster } from "./easter";
import type { CalendarDate } from "./types";

export type Bcp1962Year = 1 | 2;

export type Bcp1962Observance = {
  date: CalendarDate;
  sectionId: string;
  dayKey: string;
  year: Bcp1962Year;
  ecclesiasticalYear: number;
  season: string;
  marks: string[];
  transferred?: string;
  notes: string[];
};

const weekdayKeys = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

function sameDay(a: CalendarDate, b: CalendarDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

/** 1962 Advent Sunday: nearest Sunday to St Andrew, before or after. */
export function bcp1962FirstAdvent(year: number): CalendarDate {
  const stAndrew = { year, month: 11, day: 30 };
  const base = toDays(stAndrew);
  const w = weekday(stAndrew);
  const previous = base - w;
  const next = w === 0 ? base : base + (7 - w);
  return fromDays(base - previous <= next - base ? previous : next);
}

/** The civil year in which the ecclesiastical year containing date began. */
export function bcp1962EcclesiasticalYear(date: CalendarDate): number {
  const advent = bcp1962FirstAdvent(date.year);
  return toDays(date) >= toDays(advent) ? date.year : date.year - 1;
}

/** Advent falls in an even year for Year I, odd for Year II. */
export function bcp1962YearForDate(date: CalendarDate): Bcp1962Year {
  return bcp1962EcclesiasticalYear(date) % 2 === 0 ? 1 : 2;
}

export function bcp1962MoveableDays(ecclesiasticalYear: number) {
  const easterYear = ecclesiasticalYear + 1;
  const easter = gregorianEaster(easterYear);
  const ed = toDays(easter);
  const advent = bcp1962FirstAdvent(ecclesiasticalYear);
  const nextAdvent = bcp1962FirstAdvent(easterYear);
  const epiphany: CalendarDate = { year: easterYear, month: 1, day: 6 };
  return {
    easterYear,
    easter,
    advent,
    nextAdvent,
    christmasEve: { year: ecclesiasticalYear, month: 12, day: 24 },
    christmas: { year: ecclesiasticalYear, month: 12, day: 25 },
    epiphany,
    firstSundayAfterEpiphany: sundayOnOrAfter(addDays(epiphany, 1)),
    septuagesima: fromDays(ed - 63),
    sexagesima: fromDays(ed - 56),
    quinquagesima: fromDays(ed - 49),
    ashWednesday: fromDays(ed - 46),
    lent1: fromDays(ed - 42),
    lent2: fromDays(ed - 35),
    lent3: fromDays(ed - 28),
    lent4: fromDays(ed - 21),
    lent5: fromDays(ed - 14),
    palmSunday: fromDays(ed - 7),
    goodFriday: fromDays(ed - 2),
    easterEven: fromDays(ed - 1),
    easter1: fromDays(ed + 7),
    easter2: fromDays(ed + 14),
    easter3: fromDays(ed + 21),
    easter4: fromDays(ed + 28),
    easter5: fromDays(ed + 35),
    rogationMon: fromDays(ed + 36),
    rogationTue: fromDays(ed + 37),
    rogationWed: fromDays(ed + 38),
    ascension: fromDays(ed + 39),
    ascensionSunday: fromDays(ed + 42),
    whitsunday: fromDays(ed + 49),
    trinity: fromDays(ed + 56),
    sundayBeforeAdvent: fromDays(toDays(nextAdvent) - 7),
  };
}

function weekdayKey(date: CalendarDate): string {
  return weekdayKeys[weekday(date)];
}

function inNamedWindow(
  date: CalendarDate,
  start: CalendarDate,
  endExclusive: CalendarDate,
): boolean {
  const d = toDays(date);
  return d >= toDays(start) && d < toDays(endExclusive);
}

function fixedFeastKey(date: CalendarDate): string | undefined {
  const map: Record<string, string> = {
    "12-24": "christmas-eve",
    "12-25": "christmas-day",
    "12-26": "st-stephen",
    "12-27": "st-john",
    "12-28": "innocents",
    "1-1": "octave-day",
    "1-6": "epiphany",
  };
  return map[`${date.month}-${date.day}`];
}

function sundayAfterTrinityCount(date: CalendarDate): number {
  const m = bcp1962MoveableDays(bcp1962EcclesiasticalYear(date));
  return Math.floor((toDays(m.nextAdvent) - toDays(m.trinity)) / 7) - 1;
}

/**
 * Resolve an arbitrary date into the section/day keys of the 1962 daily table.
 * Named festivals take precedence over ordinary weekday rows. Unhandled
 * precedence cases are recorded in notes rather than silently mis-keyed.
 */
export function resolveBcp1962Observance(
  date: CalendarDate,
): Bcp1962Observance {
  const ecclesiasticalYear = bcp1962EcclesiasticalYear(date);
  const year = bcp1962YearForDate(date);
  const m = bcp1962MoveableDays(ecclesiasticalYear);
  const d = toDays(date);
  const notes: string[] = [];
  const marks: string[] = [];
  let sectionId = "";
  let dayKey = weekdayKey(date);
  let season = "";
  let transferred: string | undefined;

  const namedKey = fixedFeastKey(date);
  const isSunday = weekday(date) === 0;

  if (inNamedWindow(date, m.advent, m.christmasEve)) {
    const n = Math.min(4, Math.floor((d - toDays(m.advent)) / 7) + 1);
    sectionId = `advent-${n}`;
    season = "advent";
    dayKey = isSunday ? "sunday" : dayKey;
    if (n === 3 && [3, 5, 6].includes(weekday(date))) marks.push("Ember Day");
  } else if (
    sameDay(date, m.christmasEve) ||
    inNamedWindow(date, m.christmasEve, addDays(m.christmas, 1))
  ) {
    sectionId = "christmastide";
    season = "christmastide";
    if (namedKey && !isSunday) dayKey = namedKey;
    else if (isSunday) {
      dayKey = "sunday-after-christmas";
      notes.push(
        "Sunday after Christmas lessons are appointed only when 29, 30 or 31 December is a Sunday",
      );
    }
  } else if (
    inNamedWindow(date, addDays(m.christmas, 1), {
      year: m.easterYear,
      month: 1,
      day: 2,
    })
  ) {
    sectionId = "christmastide";
    season = "christmastide";
    if (namedKey) dayKey = namedKey;
    else if (isSunday) {
      dayKey = "sunday-after-christmas";
      notes.push(
        "Sunday after Christmas lessons are appointed only when 29, 30 or 31 December is a Sunday",
      );
    } else {
      dayKey = `december-${date.day}`;
    }
  } else if (
    inNamedWindow(date, { year: m.easterYear, month: 1, day: 2 }, m.epiphany)
  ) {
    sectionId = "after-christmas-2";
    season = "after-christmas";
    dayKey = isSunday ? "sunday" : `january-${date.day}`;
    if (isSunday && date.day === 5) {
      notes.push(
        "when the Second Sunday after Christmas falls on 5 January, the Morning Lessons only are read",
      );
    }
  } else if (sameDay(date, m.epiphany)) {
    sectionId = "epiphany";
    season = "epiphany";
    dayKey = "epiphany";
  } else if (
    inNamedWindow(date, addDays(m.epiphany, 1), m.firstSundayAfterEpiphany)
  ) {
    sectionId = "epiphany";
    season = "epiphany";
  } else if (inNamedWindow(date, m.firstSundayAfterEpiphany, m.septuagesima)) {
    const n = Math.min(
      6,
      Math.floor((d - toDays(m.firstSundayAfterEpiphany)) / 7) + 1,
    );
    sectionId = `epiphany-${n}`;
    season = "epiphany";
    dayKey = isSunday ? "sunday" : dayKey;
    if (Math.floor((d - toDays(m.firstSundayAfterEpiphany)) / 7) + 1 > 6) {
      notes.push(
        "more than six Sundays after Epiphany; extra Sundays use the Fifth and Sixth after Epiphany at the end of Trinity",
      );
    }
  } else if (inNamedWindow(date, m.septuagesima, m.sexagesima)) {
    sectionId = "septuagesima";
    season = "pre-lent";
    dayKey = isSunday ? "sunday" : dayKey;
  } else if (inNamedWindow(date, m.sexagesima, m.quinquagesima)) {
    sectionId = "sexagesima";
    season = "pre-lent";
    dayKey = isSunday ? "sunday" : dayKey;
  } else if (inNamedWindow(date, m.quinquagesima, m.lent1)) {
    sectionId = "quinquagesima";
    season = "pre-lent";
    if (sameDay(date, m.ashWednesday)) dayKey = "ash-wednesday";
    else dayKey = isSunday ? "sunday" : dayKey;
  } else if (inNamedWindow(date, m.lent1, m.palmSunday)) {
    const n = Math.min(5, Math.floor((d - toDays(m.lent1)) / 7) + 1);
    sectionId = `lent-${n}`;
    season = "lent";
    dayKey = isSunday ? "sunday" : dayKey;
    if (n === 1 && [3, 5, 6].includes(d - toDays(m.lent1))) {
      marks.push("Ember Day");
    }
  } else if (inNamedWindow(date, m.palmSunday, m.easter)) {
    sectionId = "holy-week";
    season = "holy-week";
    if (isSunday) dayKey = "palm-sunday";
    else if (sameDay(date, m.goodFriday)) dayKey = "good-friday";
    else if (sameDay(date, m.easterEven)) dayKey = "easter-even";
    else if (weekday(date) === 4) dayKey = "maundy-thursday";
  } else if (inNamedWindow(date, m.easter, m.easter1)) {
    sectionId = "easter-week";
    season = "easter-week";
    if (sameDay(date, m.easter)) dayKey = "easter-day";
    else dayKey = weekdayKey(date);
  } else if (inNamedWindow(date, m.easter1, m.ascensionSunday)) {
    const n = Math.min(5, Math.floor((d - toDays(m.easter1)) / 7) + 1);
    sectionId = `easter-${n}`;
    season = "easter";
    dayKey = isSunday ? "sunday" : dayKey;
    if (sameDay(date, m.rogationMon)) {
      dayKey = "rogation-mon";
      marks.push("Rogation Day");
    } else if (sameDay(date, m.rogationTue)) {
      dayKey = "rogation-tue";
      marks.push("Rogation Day");
    } else if (sameDay(date, m.rogationWed)) {
      dayKey = "rogation-wed";
      marks.push("Rogation Day");
    } else if (sameDay(date, m.ascension)) {
      dayKey = "ascension-day";
    }
  } else if (inNamedWindow(date, m.ascensionSunday, m.whitsunday)) {
    sectionId = "ascension-sunday";
    season = "ascension";
    dayKey = isSunday ? "sunday" : dayKey;
  } else if (inNamedWindow(date, m.whitsunday, m.trinity)) {
    sectionId = "whitsunday";
    season = "whitsunday";
    if (isSunday) dayKey = "whitsunday";
    else if ([3, 5, 6].includes(weekday(date))) marks.push("Ember Day");
  } else if (inNamedWindow(date, m.trinity, addDays(m.trinity, 7))) {
    sectionId = "trinity";
    season = "trinity";
    dayKey = isSunday ? "trinity-sunday" : dayKey;
  } else if (inNamedWindow(date, addDays(m.trinity, 7), m.sundayBeforeAdvent)) {
    const n = Math.floor((d - toDays(m.trinity)) / 7);
    const counted = sundayAfterTrinityCount(date);
    if (n > 26 || counted > 26) {
      const useSixth = n - 26 <= 1;
      sectionId = useSixth ? "epiphany-6" : "epiphany-5";
      season = "epiphany";
      transferred = useSixth
        ? "Sixth Sunday after Epiphany"
        : "Fifth Sunday after Epiphany";
      notes.push("additional Sunday before Advent uses an Epiphany service");
    } else {
      sectionId = `trinity-${Math.min(26, n)}`;
      season = "trinity";
    }
    dayKey = isSunday ? "sunday" : dayKey;
    if ([3, 5, 6].includes(weekday(date)) && counted === 18) {
      marks.push("Ember Day");
    }
  } else if (inNamedWindow(date, m.sundayBeforeAdvent, m.nextAdvent)) {
    sectionId = "before-advent";
    season = "before-advent";
    dayKey = isSunday ? "sunday" : dayKey;
  } else {
    sectionId = "after-christmas-2";
    season = "after-christmas";
    if (isSunday) dayKey = "sunday";
    else if (date.month === 1) dayKey = `january-${date.day}`;
  }

  const commemorations = BCP1962_FIXED_CALENDAR.filter(
    (c) => c.month === date.month && c.day === date.day && c.bracketed !== true,
  );
  if (commemorations.length > 0 && !marks.includes("Ember Day")) {
    notes.push(
      `fixed commemoration: ${commemorations.map((c) => c.name).join("; ")}`,
    );
  }

  return {
    date,
    sectionId,
    dayKey,
    year,
    ecclesiasticalYear,
    season,
    marks,
    transferred,
    notes,
  };
}

const ORDINALS = [
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

/**
 * Status-bar label for the 1962 cycle: its Year I/II count and the appointed
 * Sunday or week, following the book's own ecclesiastical-year sections.
 */
export function bcp1962CycleLabel(date: CalendarDate): string | null {
  const obs = resolveBcp1962Observance(date);
  const year = obs.year === 1 ? "Year I" : "Year II";
  const numbered = /^(advent|epiphany|lent|easter|trinity)-(\d+)$/.exec(
    obs.sectionId,
  );
  let count: string | null = null;
  if (numbered) {
    const season = numbered[1];
    const n = Number(numbered[2]);
    const ordinal = ORDINALS[n] ?? String(n);
    const after: Record<string, string> = {
      advent: "Sunday in Advent",
      epiphany: "Sunday after Epiphany",
      lent: "Sunday in Lent",
      easter: "Sunday after Easter",
      trinity: "Sunday after Trinity",
    };
    count = `${ordinal} ${after[season] ?? "Sunday"}`;
  } else {
    const named: Record<string, string> = {
      christmastide: "Christmastide",
      "after-christmas-2": "Second Sunday after Christmas",
      epiphany: "Epiphany",
      septuagesima: "Septuagesima",
      sexagesima: "Sexagesima",
      quinquagesima: "Quinquagesima",
      "holy-week": "Holy Week",
      "easter-week": "Easter Week",
      "ascension-sunday": "Sunday after Ascension",
      whitsunday: "Whitsunday",
      trinity: "Trinity Sunday",
      "before-advent": "Sunday next before Advent",
    };
    count = named[obs.sectionId] ?? null;
  }
  return count ? `${year} · ${count}` : year;
}
