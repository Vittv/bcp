import { civilFromDays, daysFromCivil, sundayOnOrAfter, toDays } from "./date";
import { easterDays } from "./easter";
import type { CalendarDate } from "./types";

export interface FeastDays {
  /** first Sunday of Advent: start of the liturgical year. */
  advent1: number;
  christmasEve: number;
  christmas: number;
  firstSundayAfterChristmas: number;
  /** second Sunday after Christmas (Jan 2-5), if the year has one. */
  secondSundayAfterChristmas: number | null;
  epiphany: number;
  /** first Sunday after the Epiphany: the Baptism of our Lord. */
  baptism: number;
  /** Sunday before Ash Wednesday. */
  lastEpiphany: number;
  ashWednesday: number;
  /** Sundays of Lent 1-5. */
  lent: number[];
  palmSunday: number;
  maundyThursday: number;
  goodFriday: number;
  holySaturday: number;
  easter: number;
  ascension: number;
  eveOfPentecost: number;
  pentecost: number;
  eveOfTrinity: number;
  trinity: number;
  /** first Sunday of Advent of the following year: end of this liturgical year. */
  advent1Next: number;
}

// the Sunday nearest November 30, i.e. the Sunday in the range Nov 27 - Dec 3.
export function advent1(year: number): CalendarDate {
  const nov30 = daysFromCivil(year, 11, 30);
  const w = (((nov30 + 4) % 7) + 7) % 7;
  const offset = w <= 3 ? -w : 7 - w;
  return civilFromDays(nov30 + offset);
}

function secondSundayAfterChristmas(year: number): number | null {
  const jan2 = daysFromCivil(year, 1, 2);
  const w = (((jan2 + 4) % 7) + 7) % 7;
  const sunday = jan2 + ((7 - w) % 7);
  return sunday <= daysFromCivil(year, 1, 5) ? sunday : null;
}

// all moveable feasts of the liturgical year whose Easter falls in `year`
// (i.e. the year beginning on the First Sunday of Advent of `year - 1`).
export function feastsForEasterYear(year: number): FeastDays {
  const e = easterDays(year);
  const ash = e - 46;
  const lent1 = e - 42;
  const palm = e - 7;
  const pent = e + 49;
  const tri = e + 56;
  const prev = year - 1;
  const christmas = daysFromCivil(prev, 12, 25);
  const epiphany = daysFromCivil(year, 1, 6);

  return {
    advent1: toDays(advent1(prev)),
    christmasEve: christmas - 1,
    christmas,
    firstSundayAfterChristmas: toDays(
      sundayOnOrAfter({ year: prev, month: 12, day: 26 }),
    ),
    secondSundayAfterChristmas: secondSundayAfterChristmas(year),
    epiphany,
    baptism: toDays(sundayOnOrAfter({ year, month: 1, day: 7 })),
    lastEpiphany: ash - 3,
    ashWednesday: ash,
    lent: [lent1, lent1 + 7, lent1 + 14, lent1 + 21, lent1 + 28],
    palmSunday: palm,
    maundyThursday: e - 3,
    goodFriday: e - 2,
    holySaturday: e - 1,
    easter: e,
    ascension: e + 39,
    eveOfPentecost: pent - 1,
    pentecost: pent,
    eveOfTrinity: tri - 1,
    trinity: tri,
    advent1Next: toDays(advent1(year)),
  };
}
