/**
 * 1662 BCP calendar helpers and appointment resolver (civil-date based).
 *
 * Focused on resolving Sundays/major holy days to names used in the 1662
 * proper-lessons and proper-psalms tables, plus basic moveable-date computus.
 * This is an incremental foundation for 1662 office composition, not a complete
 * historical/precedence engine.
 */
import {
  addDays,
  fromDays,
  sundayOnOrAfter,
  sundayOnOrBefore,
  toDays,
  weekday,
} from "./date";
import type { CalendarDate } from "./types";

export type Bcp1662Sunday =
  | { kind: "advent"; n: 1 | 2 | 3 | 4 }
  | { kind: "christmas"; n: 1 | 2 }
  | { kind: "epiphany"; n: 1 | 2 | 3 | 4 | 5 | 6 }
  | { kind: "septuagesima" }
  | { kind: "sexagesima" }
  | { kind: "quinquagesima" }
  | { kind: "lent"; n: 1 | 2 | 3 | 4 | 5 }
  | { kind: "palm" }
  | { kind: "easter" }
  | { kind: "easter-after"; n: 1 | 2 | 3 | 4 | 5 }
  | { kind: "ascension-sunday" }
  | { kind: "whitsunday" }
  | { kind: "trinity" }
  | { kind: "trinity-after"; n: number };

export type Bcp1662HolyDay =
  | "Christmas Day"
  | "Circumcision of our Lord"
  | "Epiphany"
  | "Ash Wednesday"
  | "Wednesday before Easter"
  | "Thursday before Easter"
  | "Good Friday"
  | "Easter Even"
  | "Monday in Easter Week"
  | "Tuesday in Easter Week"
  | "Ascension Day"
  | "Monday in Whitsun Week"
  | "Tuesday in Whitsun Week"
  | string;

export type Bcp1662Observance = {
  date: CalendarDate;
  sunday?: Bcp1662Sunday;
  holyDay?: Bcp1662HolyDay;
  properSundayName?: string;
  properHolyDayName?: string;
  properPsalmName?: string;
  /** Number of Sundays between Trinity Sunday and Advent Sunday (exclusive of Advent). */
  sundaysAfterTrinityInYear?: number;
};

/** Gregorian/Western Easter Sunday. */
export function easterSunday(year: number): CalendarDate {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { year, month, day };
}

/** 1662 Advent Sunday: nearest Sunday to St Andrew (Nov 30), before or after. */
export function adventSunday(year: number): CalendarDate {
  const stAndrew = { year, month: 11, day: 30 };
  const d = toDays(stAndrew);
  const w = weekday(stAndrew); // 0 Sun..6 Sat
  // distance to previous/next Sunday
  const prev = d - w;
  const next = w === 0 ? d : d + (7 - w);
  const prevDist = d - prev;
  const nextDist = next - d;
  const chosen = nextDist < prevDist ? next : prev; // tie -> before (equidistant means Wed? nearest before or after -> before on tie not specified, but St Andrew Wed means 3 days either side? 30 Nov: depends year)
  return fromDays(chosen);
}

export function christmasDay(year: number): CalendarDate {
  return { year, month: 12, day: 25 };
}

export function epiphany(year: number): CalendarDate {
  return { year, month: 1, day: 6 };
}

function sundayName(s: Bcp1662Sunday): string {
  switch (s.kind) {
    case "advent":
      return `${["", "First", "Second", "Third", "Fourth"][s.n]} Sunday in Advent`;
    case "christmas":
      return s.n === 1
        ? "First Sunday after Christmas"
        : "Second Sunday after Christmas";
    case "epiphany":
      return (
        ["", "First", "Second", "Third", "Fourth", "Fifth", "Sixth"][s.n] +
        " Sunday after the Epiphany"
      );
    case "septuagesima":
      return "Septuagesima";
    case "sexagesima":
      return "Sexagesima";
    case "quinquagesima":
      return "Quinquagesima";
    case "lent":
      return (
        ["", "First", "Second", "Third", "Fourth", "Fifth"][s.n] +
        " Sunday in Lent"
      );
    case "palm":
      return "Sixth Sunday in Lent (Palm Sunday)";
    case "easter":
      return "Easter Day";
    case "easter-after":
      return (
        ["", "First", "Second", "Third", "Fourth", "Fifth"][s.n] +
        " Sunday after Easter"
      );
    case "ascension-sunday":
      return "Sunday after Ascension Day";
    case "whitsunday":
      return "Whitsunday (Pentecost)";
    case "trinity":
      return "Trinity Sunday";
    case "trinity-after":
      return `${numberToOrdinal(s.n)} Sunday after Trinity`;
  }
}

function numberToOrdinal(n: number): string {
  const names = [
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
    "Twenty-seventh",
  ];
  return names[n] ?? `${n}th`;
}

function fixedHolyDay(date: CalendarDate): string | undefined {
  const k = `${date.month}-${date.day}`;
  const map: Record<string, string> = {
    "12-25": "Nativity of Christ (Christmas Day)",
    "1-1": "Circumcision of our Lord",
    "1-6": "Epiphany",
    "11-30": "St. Andrew",
    "12-21": "St. Thomas the Apostle",
    "12-26": "St. Stephen",
    "12-27": "St. John the Evangelist",
    "12-28": "Innocents' Day",
    "1-25": "Conversion of St. Paul",
    "2-2": "Purification of the Virgin Mary",
    "2-24": "St. Matthias",
    "3-25": "Annunciation of our Lady",
    "4-25": "St. Mark",
    "5-1": "St. Philip and St. James",
    "6-11": "St. Barnabas",
    "6-24": "St. John Baptist",
    "6-29": "St. Peter",
    "7-25": "St. James",
    "8-24": "St. Bartholomew",
    "9-21": "St. Matthew",
    "9-29": "St. Michael and All Angels",
    "10-18": "St. Luke",
    "10-28": "St. Simon and St. Jude",
    "11-1": "All Saints",
  };
  return map[k];
}

/** Compute 1662 moveable holy days for the ecclesiastical/civil year context of a date. */
export function bcp1662MoveableDays(year: number) {
  const easter = easterSunday(year);
  const ed = toDays(easter);
  return {
    easter,
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
    wednesdayBeforeEaster: fromDays(ed - 4),
    thursdayBeforeEaster: fromDays(ed - 3),
    goodFriday: fromDays(ed - 2),
    easterEven: fromDays(ed - 1),
    mondayEasterWeek: fromDays(ed + 1),
    tuesdayEasterWeek: fromDays(ed + 2),
    easter1: fromDays(ed + 7),
    easter2: fromDays(ed + 14),
    easter3: fromDays(ed + 21),
    easter4: fromDays(ed + 28),
    easter5: fromDays(ed + 35),
    ascension: fromDays(ed + 39),
    ascensionSunday: fromDays(ed + 42),
    whitsunday: fromDays(ed + 49),
    mondayWhitsunWeek: fromDays(ed + 50),
    tuesdayWhitsunWeek: fromDays(ed + 51),
    trinity: fromDays(ed + 56),
    advent: adventSunday(year),
  };
}

function sameDay(a: CalendarDate, b: CalendarDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

/** Resolve 1662 Sunday/proper and major holy-day observances for a civil date. */
export function resolveBcp1662Observance(
  date: CalendarDate,
): Bcp1662Observance {
  const m = bcp1662MoveableDays(date.year);
  const obs: Bcp1662Observance = { date };

  // Moveable holy days (fixed precedence as major days in this simplified resolver).
  if (sameDay(date, m.ashWednesday)) obs.holyDay = "Ash Wednesday";
  else if (sameDay(date, m.wednesdayBeforeEaster))
    obs.holyDay = "Wednesday before Easter";
  else if (sameDay(date, m.thursdayBeforeEaster))
    obs.holyDay = "Thursday before Easter";
  else if (sameDay(date, m.goodFriday)) obs.holyDay = "Good Friday";
  else if (sameDay(date, m.easterEven)) obs.holyDay = "Easter Even";
  else if (sameDay(date, m.mondayEasterWeek))
    obs.holyDay = "Monday in Easter Week";
  else if (sameDay(date, m.tuesdayEasterWeek))
    obs.holyDay = "Tuesday in Easter Week";
  else if (sameDay(date, m.ascension)) obs.holyDay = "Ascension Day";
  else if (sameDay(date, m.mondayWhitsunWeek))
    obs.holyDay = "Monday in Whitsun Week";
  else if (sameDay(date, m.tuesdayWhitsunWeek))
    obs.holyDay = "Tuesday in Whitsun Week";

  // Fixed holy days (attach if present; moveable may take precedence in notes/rules not fully modeled).
  const fixed = fixedHolyDay(date);
  if (fixed && !obs.holyDay) obs.holyDay = fixed;
  else if (fixed && obs.holyDay) obs.properHolyDayName = obs.holyDay; // keep moveable as primary

  obs.sundaysAfterTrinityInYear = Math.floor(
    (toDays(m.advent) - toDays(m.trinity)) / 7,
  );

  // Sundays
  if (weekday(date) === 0) {
    if (sameDay(date, m.advent)) obs.sunday = { kind: "advent", n: 1 };
    else if (sameDay(date, addDays(m.advent, 7)))
      obs.sunday = { kind: "advent", n: 2 };
    else if (sameDay(date, addDays(m.advent, 14)))
      obs.sunday = { kind: "advent", n: 3 };
    else if (sameDay(date, addDays(m.advent, 21)))
      obs.sunday = { kind: "advent", n: 4 };
    else if (sameDay(date, m.septuagesima))
      obs.sunday = { kind: "septuagesima" };
    else if (sameDay(date, m.sexagesima)) obs.sunday = { kind: "sexagesima" };
    else if (sameDay(date, m.quinquagesima))
      obs.sunday = { kind: "quinquagesima" };
    else if (sameDay(date, m.lent1)) obs.sunday = { kind: "lent", n: 1 };
    else if (sameDay(date, m.lent2)) obs.sunday = { kind: "lent", n: 2 };
    else if (sameDay(date, m.lent3)) obs.sunday = { kind: "lent", n: 3 };
    else if (sameDay(date, m.lent4)) obs.sunday = { kind: "lent", n: 4 };
    else if (sameDay(date, m.lent5)) obs.sunday = { kind: "lent", n: 5 };
    else if (sameDay(date, m.palmSunday)) obs.sunday = { kind: "palm" };
    else if (sameDay(date, m.easter)) obs.sunday = { kind: "easter" };
    else if (sameDay(date, m.easter1))
      obs.sunday = { kind: "easter-after", n: 1 };
    else if (sameDay(date, m.easter2))
      obs.sunday = { kind: "easter-after", n: 2 };
    else if (sameDay(date, m.easter3))
      obs.sunday = { kind: "easter-after", n: 3 };
    else if (sameDay(date, m.easter4))
      obs.sunday = { kind: "easter-after", n: 4 };
    else if (sameDay(date, m.easter5))
      obs.sunday = { kind: "easter-after", n: 5 };
    else if (sameDay(date, m.ascensionSunday))
      obs.sunday = { kind: "ascension-sunday" };
    else if (sameDay(date, m.whitsunday)) obs.sunday = { kind: "whitsunday" };
    else if (sameDay(date, m.trinity)) obs.sunday = { kind: "trinity" };
    else {
      // Sundays after Epiphany (between Epiphany and Septuagesima) or after Christmas
      const d = toDays(date);
      const ep = toDays(epiphany(date.year));
      const sep = toDays(m.septuagesima);
      if (d > ep && d < sep) {
        const first = toDays(sundayOnOrAfter(fromDays(ep + 1)));
        const sunAfter = Math.floor((d - first) / 7) + 1;
        if (sunAfter >= 1 && sunAfter <= 6) {
          // SAFETY: sunAfter is bounded to 1..6 by the condition above.
          obs.sunday = {
            kind: "epiphany",
            n: sunAfter as 1 | 2 | 3 | 4 | 5 | 6,
          };
        }
      }
      // Sundays after Christmas (1662: 1st/2nd Sunday after Christmas, when they occur)
      if (date.month === 12 && date.day > 25) {
        const daysSinceXmas = d - toDays(christmasDay(date.year));
        if (daysSinceXmas > 0 && daysSinceXmas < 12) {
          const n = daysSinceXmas <= 7 ? 1 : 2;
          // SAFETY: n is 1 or 2 by construction.
          obs.sunday = { kind: "christmas", n: n as 1 | 2 };
        }
      } else if (date.month === 1 && date.day < 6) {
        // 1st/2nd Sunday after Christmas can fall in early January depending on year.
        const daysSinceXmas = d - toDays(christmasDay(date.year - 1));
        if (daysSinceXmas > 0 && daysSinceXmas < 12) {
          const n = daysSinceXmas <= 7 ? 1 : 2;
          // SAFETY: n is 1 or 2 by construction.
          obs.sunday = { kind: "christmas", n: n as 1 | 2 };
        }
      }
      // Sundays after Trinity
      const tr = toDays(m.trinity);
      const adv = toDays(m.advent);
      if (d > tr && d < adv) {
        const n = Math.floor((d - tr) / 7);
        if (n >= 1) obs.sunday = { kind: "trinity-after", n };
      }
    }
  }

  if (obs.sunday) {
    obs.properSundayName = sundayName(obs.sunday);
  }
  if (obs.holyDay) {
    obs.properHolyDayName = obs.holyDay;
    // map some holy days to proper psalms names
    if (obs.holyDay === "Nativity of Christ (Christmas Day)")
      obs.properPsalmName = "Christmas Day";
    else if (obs.holyDay === "Ash Wednesday")
      obs.properPsalmName = "Ash Wednesday";
    else if (obs.holyDay === "Good Friday") obs.properPsalmName = "Good Friday";
    else if (obs.holyDay === "Easter Day" || obs.sunday?.kind === "easter")
      obs.properPsalmName = "Easter Day";
    else if (obs.holyDay === "Ascension Day")
      obs.properPsalmName = "Ascension Day";
    else if (obs.sunday?.kind === "whitsunday")
      obs.properPsalmName = "Whitsunday";
  }
  if (obs.sunday?.kind === "easter") {
    obs.holyDay = obs.holyDay ?? "Easter Day";
    obs.properHolyDayName = "Easter Day";
    obs.properPsalmName = "Easter Day";
  }
  if (obs.sunday?.kind === "whitsunday") {
    obs.properHolyDayName = "Whitsunday (Pentecost)";
    obs.properPsalmName = "Whitsunday";
  }
  if (obs.sunday?.kind === "trinity") {
    obs.properHolyDayName = "Trinity Sunday";
  }

  return obs;
}

// the 1662 rubric appoints the Creed of Saint Athanasius at Morning Prayer on
// these feasts, instead of the Apostles' Creed. holy-day names come from the
// fixed table above; Easter, Whitsunday and Trinity are Sunday kinds.
const ATHANASIAN_FEASTS = new Set([
  "Nativity of Christ (Christmas Day)",
  "Epiphany",
  "St. Matthias",
  "Ascension Day",
  "St. John Baptist",
  "St. James",
  "St. Bartholomew",
  "St. Matthew",
  "St. Simon and St. Jude",
  "St. Andrew",
]);

// the 1662 lectionary has no Year 1/2 cycle or numbered Propers; Sundays in
// the long green season are counted from Trinity instead. returns the label
// for that count on a given date, or null outside the Trinity season.
export function bcp1662CycleLabel(date: CalendarDate): string | null {
  const m = bcp1662MoveableDays(date.year);
  const sunday = toDays(sundayOnOrBefore(date));
  if (sunday < toDays(m.trinity) || sunday >= toDays(m.advent)) return null;
  const n = (sunday - toDays(m.trinity)) / 7;
  if (n <= 0) return "Trinity Sunday";
  return `${numberToOrdinal(n)} Sunday after Trinity`;
}

export function athanasianCreedDay(obs: Bcp1662Observance): boolean {
  if (
    obs.sunday?.kind === "easter" ||
    obs.sunday?.kind === "whitsunday" ||
    obs.sunday?.kind === "trinity"
  ) {
    return true;
  }
  if (obs.holyDay && ATHANASIAN_FEASTS.has(obs.holyDay)) return true;
  if (obs.properHolyDayName && ATHANASIAN_FEASTS.has(obs.properHolyDayName)) {
    return true;
  }
  return false;
}
