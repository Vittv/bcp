import { toDays } from "./date";
import { feastsForEasterYear } from "./feasts";
import { sanctoraleForDate } from "./sanctorale";
import { easterYear, seasonFor } from "./season";
import type { CalendarDate, Season } from "./types";

// a single named observance on a calendar day: a principal feast, a major
// or holy day, a feast of our Lord, a fast, or a fixed-date saint.
export interface DayObservance {
  name: string;
  /** set when the observance is a saint with a page to link to. */
  slug?: string;
}

export interface DayInfo {
  season: Season;
  /** this day is the first day of its season. */
  seasonStart: boolean;
  /** this day is the last day of its season. */
  seasonEnd: boolean;
  observances: DayObservance[];
}

const SEASON_LABELS: Record<Season, string> = {
  advent: "Advent",
  christmas: "Christmas",
  epiphany: "Epiphany",
  lent: "Lent",
  "holy-week": "Holy Week",
  easter: "Easter",
  pentecost: "Pentecost",
  "after-pentecost": "After Pentecost",
};

// fixed feasts of our Lord not carried by the sanctorale data (which
// covers the saints and the tempore-tied holy days).
const FIXED_FEASTS: { month: number; day: number; name: string }[] = [
  { month: 1, day: 1, name: "The Holy Name of Our Lord Jesus Christ" },
];

// the moveable days that carry a named observance, keyed by the day offset
// from the liturgical year's start (the First Sunday of Advent). this
// builds on FeastDays, which already computes all the moveable dates.
function moveableDays(year: number): Map<string, DayObservance> {
  const f = feastsForEasterYear(year);
  const dates: [number, string][] = [
    [f.advent1, "First Sunday of Advent"],
    [f.christmasEve, "Christmas Eve"],
    [f.christmas, "Christmas Day"],
    [f.firstSundayAfterChristmas, "First Sunday after Christmas"],
    [f.epiphany, "The Epiphany"],
    [f.baptism, "The Baptism of our Lord"],
    [f.lastEpiphany, "Last Sunday after the Epiphany"],
    [f.ashWednesday, "Ash Wednesday"],
    [f.palmSunday, "Sunday of the Passion: Palm Sunday"],
    [f.maundyThursday, "Maundy Thursday"],
    [f.goodFriday, "Good Friday"],
    [f.holySaturday, "Holy Saturday"],
    [f.easter, "Easter Day"],
    [f.ascension, "Ascension Day"],
    [f.pentecost, "The Day of Pentecost"],
    [f.trinity, "Trinity Sunday"],
    [f.advent1Next, "First Sunday of Advent"],
  ];
  if (f.secondSundayAfterChristmas !== null) {
    dates.push([f.secondSundayAfterChristmas, "Second Sunday after Christmas"]);
  }
  const map = new Map<string, DayObservance>();
  for (const [day, name] of dates) {
    map.set(String(day), { name });
  }
  return map;
}

function seasonStartEnd(date: CalendarDate, year: number) {
  const f = feastsForEasterYear(year);
  const season = seasonFor(date);
  switch (season) {
    case "advent":
      return [f.advent1, f.christmas - 1] as const;
    case "christmas":
      return [f.christmas, f.epiphany - 1] as const;
    case "epiphany":
      return [f.epiphany, f.ashWednesday - 1] as const;
    case "lent":
      return [f.ashWednesday, f.palmSunday - 1] as const;
    case "holy-week":
      return [f.palmSunday, f.easter - 1] as const;
    case "easter":
      return [f.easter, f.pentecost - 1] as const;
    case "pentecost":
      return [f.pentecost, f.pentecost] as const;
    case "after-pentecost":
      return [f.pentecost + 1, f.advent1Next - 1] as const;
  }
}

/** the named observances and season boundaries for a calendar date. */
export function dayInfo(date: CalendarDate): DayInfo {
  const season = seasonFor(date);
  const ey = easterYear(date);
  const d = toDays(date);
  const [start, end] = seasonStartEnd(date, ey);

  const observances: DayObservance[] = [];

  // moveable feasts of the current liturgical year (whose Easter falls in
  // `ey`); this already covers the First Sunday of Advent that opens the
  // year as well as the one that closes it next year.
  for (const [day, obs] of moveableDays(ey)) {
    if (Number(day) === d) observances.push(obs);
  }

  // fixed feasts of our Lord (Holy Name) plus the fixed-date saints.
  for (const fx of FIXED_FEASTS) {
    if (fx.month === date.month && fx.day === date.day) {
      observances.push({ name: fx.name });
    }
  }
  const saint = sanctoraleForDate(date);
  if (saint) {
    observances.push({ name: saint.title, slug: saint.slug });
  }

  return {
    season,
    seasonStart: d === start,
    seasonEnd: d === end,
    observances,
  };
}

/** the display label for a season, e.g. "Advent" or "After Pentecost". */
export function seasonLabel(season: Season): string {
  return SEASON_LABELS[season];
}
