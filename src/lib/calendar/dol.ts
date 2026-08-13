import {
  daysFromCivil,
  sundayOfWeek,
  sundayOnOrBefore,
  toDays,
  weekday,
} from "./date";
import { feastsForEasterYear } from "./feasts";
import { easterYear, liturgicalYearStart } from "./season";
import type { CalendarDate, DolDay, DolSlot, DolWeek } from "./types";

// the Daily Office Lectionary runs in a two-year cycle. Year One begins on
// the First Sunday of Advent preceding odd-numbered years; Year Two on the
// First Sunday of Advent preceding even-numbered years. (Advent 1 1976
// began Year One.)
export function dolYear(date: CalendarDate): 1 | 2 {
  return liturgicalYearStart(date).year % 2 === 0 ? 1 : 2;
}

export const HOLY_DAYS: Array<{ month: number; day: number; name: string }> = [
  { month: 11, day: 30, name: "st-andrew" },
  { month: 12, day: 21, name: "st-thomas" },
  { month: 12, day: 26, name: "st-stephen" },
  { month: 12, day: 27, name: "st-john" },
  { month: 12, day: 28, name: "holy-innocents" },
  { month: 1, day: 18, name: "confession-of-st-peter" },
  { month: 1, day: 25, name: "conversion-of-st-paul" },
  { month: 2, day: 2, name: "presentation" },
  { month: 2, day: 24, name: "st-matthias" },
  { month: 3, day: 19, name: "st-joseph" },
  { month: 3, day: 25, name: "annunciation" },
  { month: 4, day: 25, name: "st-mark" },
  { month: 5, day: 1, name: "philip-and-james" },
  { month: 5, day: 31, name: "visitation" },
  { month: 6, day: 11, name: "st-barnabas" },
  { month: 6, day: 24, name: "nativity-of-st-john-the-baptist" },
  { month: 6, day: 29, name: "peter-and-paul" },
  { month: 7, day: 4, name: "independence-day" },
  { month: 7, day: 22, name: "st-mary-magdalene" },
  { month: 7, day: 25, name: "st-james" },
  { month: 8, day: 6, name: "transfiguration" },
  { month: 8, day: 15, name: "st-mary-the-virgin" },
  { month: 8, day: 24, name: "st-bartholomew" },
  { month: 9, day: 14, name: "holy-cross" },
  { month: 9, day: 21, name: "st-matthew" },
  { month: 9, day: 29, name: "st-michael-and-all-angels" },
  { month: 10, day: 18, name: "st-luke" },
  { month: 10, day: 23, name: "st-james-of-jerusalem" },
  { month: 10, day: 28, name: "simon-and-jude" },
  { month: 11, day: 1, name: "all-saints" },
];

export function thanksgivingDay(year: number): number {
  const nov1 = daysFromCivil(year, 11, 1);
  const w = (((nov1 + 4) % 7) + 7) % 7;
  return nov1 + ((4 - w + 7) % 7) + 21;
}

export function holyDayFor(date: CalendarDate): string | undefined {
  for (const h of HOLY_DAYS) {
    if (h.month === date.month && h.day === date.day) return h.name;
  }
  if (date.month === 11 && toDays(date) === thanksgivingDay(date.year))
    return "thanksgiving-day";
  return undefined;
}

function wd(date: CalendarDate): DolDay {
  return { kind: "weekday", weekday: weekday(date) };
}

// resolve a calendar date to its place in the Daily Office Lectionary:
// which year, which week table, and which day (or named special day).
export function resolve(date: CalendarDate): DolSlot {
  const f = feastsForEasterYear(easterYear(date));
  const d = toDays(date);
  const year = dolYear(date);
  const holyDay = holyDayFor(date);

  // Advent: [Advent 1, Christmas Eve]. Week of 4 Advent contains the
  // special entries for Dec 24 and Christmas Eve.
  if (d >= f.advent1 && d < f.christmas) {
    const sunday = toDays(sundayOnOrBefore(date));
    const n = Math.min(4, (sunday - f.advent1) / 7 + 1);
    const week: DolWeek = { kind: "advent", week: n as 1 | 2 | 3 | 4 };
    if (d === f.christmasEve) {
      return {
        year,
        week,
        day: { kind: "special", name: "dec-24" },
        evening: { kind: "special", name: "christmas-eve" },
        holyDay,
      };
    }
    return { year, week, day: wd(date), holyDay };
  }

  // Christmas: [Christmas Day, the day before the Epiphany]. The table is
  // calendar-date based, running from Christmas Day through Jan 5.
  if (d >= f.christmas && d < f.epiphany) {
    const { day, evening } = christmasDay(date, f);
    return {
      year,
      week: { kind: "christmas-following" },
      day,
      evening,
      holyDay,
    };
  }

  // the Epiphany and following: [Jan 6, the Saturday before the Baptism].
  if (d >= f.epiphany && d < f.baptism) {
    const eve = f.baptism - 1;
    if (d === eve) {
      return {
        year,
        week: { kind: "epiphany-following" },
        day: { kind: "special", name: `jan-${date.day}` },
        evening: { kind: "special", name: "eve-of-1-epiphany" },
        holyDay,
      };
    }
    const name = d === f.epiphany ? "epiphany" : `jan-${date.day}`;
    return {
      year,
      week: { kind: "epiphany-following" },
      day: { kind: "special", name },
      holyDay,
    };
  }

  // weeks of the Epiphany: [Baptism, Ash Wednesday). The last week is the
  // Week of Last Epiphany, which also contains Ash Wednesday.
  if (d >= f.baptism && d < f.ashWednesday) {
    const sunday = toDays(sundayOnOrBefore(date));
    const week: DolWeek =
      sunday === f.lastEpiphany
        ? { kind: "last-epiphany" }
        : { kind: "epiphany", week: (sunday - f.baptism) / 7 + 1 };
    return { year, week, day: wd(date), holyDay };
  }

  // Lent: [Ash Wednesday, Palm Sunday). Ash Wednesday sits within the Week
  // of Last Epiphany; the weeks of Lent then run Lent 1-5.
  if (d >= f.ashWednesday && d < f.palmSunday) {
    if (d === f.ashWednesday) {
      return {
        year,
        week: { kind: "last-epiphany" },
        day: { kind: "special", name: "ash-wednesday" },
        holyDay,
      };
    }
    const sunday = toDays(sundayOnOrBefore(date));
    const week: DolWeek = { kind: "lent", week: (sunday - f.lent[0]) / 7 + 1 };
    return { year, week, day: wd(date), holyDay };
  }

  // Holy Week: [Palm Sunday, Easter Day).
  if (d >= f.palmSunday && d < f.easter) {
    const day: DolDay =
      d === f.palmSunday
        ? { kind: "special", name: "palm-sunday" }
        : d === f.maundyThursday
          ? { kind: "special", name: "maundy-thursday" }
          : d === f.goodFriday
            ? { kind: "special", name: "good-friday" }
            : d === f.holySaturday
              ? { kind: "special", name: "holy-saturday" }
              : wd(date);
    return { year, week: { kind: "holy-week" }, day, holyDay };
  }

  // Easter Week: [Easter Day, Easter Day + 7).
  if (d >= f.easter && d < f.easter + 7) {
    const day: DolDay =
      d === f.easter ? { kind: "special", name: "easter-day" } : wd(date);
    return { year, week: { kind: "easter-week" }, day, holyDay };
  }

  // weeks 2-7 of Easter. Ascension falls in week 6; the Eve of Pentecost
  // closes week 7.
  if (d >= f.easter + 7 && d < f.pentecost) {
    const sunday = toDays(sundayOnOrBefore(date));
    const n = (sunday - f.easter) / 7 + 1;
    const week: DolWeek = { kind: "easter", week: n };
    if (d === f.ascension) {
      return {
        year,
        week: { kind: "easter", week: 6 },
        day: { kind: "special", name: "ascension" },
        holyDay,
      };
    }
    if (d === f.eveOfPentecost) {
      return {
        year,
        week,
        day: { kind: "special", name: "eve-of-pentecost" },
        holyDay,
      };
    }
    const evening: DolDay | undefined =
      d === f.ascension - 1
        ? { kind: "special", name: "eve-of-ascension" }
        : undefined;
    return { year, week, day: wd(date), evening, holyDay };
  }

  // the Day of Pentecost.
  if (d === f.pentecost) {
    return {
      year,
      week: { kind: "pentecost" },
      day: { kind: "special", name: "pentecost" },
      holyDay,
    };
  }

  // season after Pentecost: the Eve of Trinity and Trinity Sunday are
  // special; everything else is a numbered Proper week.
  if (d > f.pentecost && d < f.advent1Next) {
    if (d === f.eveOfTrinity) {
      return {
        year,
        week: { kind: "pentecost" },
        day: { kind: "special", name: "eve-of-trinity" },
        holyDay,
      };
    }
    if (d === f.trinity) {
      return {
        year,
        week: { kind: "pentecost" },
        day: { kind: "special", name: "trinity" },
        holyDay,
      };
    }
    return {
      year,
      week: { kind: "after-pentecost", proper: properIndex(date) },
      day: wd(date),
      holyDay,
    };
  }

  throw new Error(
    `resolve: date ${date.year}-${date.month}-${date.day} is outside the liturgical year`,
  );
}

// the numbered Proper whose date is closest. the DOL notes govern the
// transition weeks: weekdays after Pentecost use the Proper closest to
// Pentecost, and the Trinity week (Trinity Sunday through the following
// Saturday) uses the Proper closest to Trinity. From the next Monday the
// regular weekly cycle resumes, keyed on the Sunday of the current
// Monday-to-Sunday week.
export function properIndex(date: CalendarDate): number {
  const y = easterYear(date);
  const f = feastsForEasterYear(y);
  const d = toDays(date);
  const may11 = daysFromCivil(y, 5, 11);
  let ref: number;
  if (d <= f.trinity + 6) {
    ref = d < f.trinity ? f.pentecost : f.trinity;
  } else {
    ref = toDays(sundayOfWeek(date));
  }
  const n = 1 + Math.round((ref - may11) / 7);
  return Math.min(29, Math.max(1, n));
}

type Feasts = ReturnType<typeof feastsForEasterYear>;

function christmasDay(
  date: CalendarDate,
  f: Feasts,
): { day: DolDay; evening?: DolDay } {
  const d = toDays(date);
  if (d === f.christmas)
    return { day: { kind: "special", name: "christmas-day" } };
  if (d === f.firstSundayAfterChristmas)
    return {
      day: { kind: "special", name: "first-sunday-after-christmas" },
    };
  const eveOfEpiphany: DolDay | undefined =
    d === f.epiphany - 1
      ? { kind: "special", name: "eve-of-epiphany" }
      : undefined;
  if (
    f.secondSundayAfterChristmas !== null &&
    d === f.secondSundayAfterChristmas
  ) {
    return {
      day: { kind: "special", name: "second-sunday-after-christmas" },
      evening: eveOfEpiphany,
    };
  }
  if (eveOfEpiphany) {
    return { day: { kind: "special", name: "jan-5" }, evening: eveOfEpiphany };
  }
  if (date.month === 12) {
    if (date.day === 31) {
      return {
        day: { kind: "special", name: "dec-31" },
        evening: { kind: "special", name: "eve-of-holy-name" },
      };
    }
    const specials: Record<number, string> = {
      26: "st-stephen",
      27: "st-john",
      28: "holy-innocents",
    };
    return {
      day: { kind: "special", name: specials[date.day] ?? `dec-${date.day}` },
    };
  }
  if (date.day === 1) return { day: { kind: "special", name: "holy-name" } };
  return { day: { kind: "special", name: `jan-${date.day}` } };
}
