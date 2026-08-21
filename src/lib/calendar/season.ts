import { toDays } from "./date";
import type { FeastDays } from "./feasts";
import { advent1, feastsForEasterYear } from "./feasts";
import type { CalendarDate, Color, Season } from "./types";

// the liturgical year containing `date` starts on the First Sunday of
// Advent on or before it.
export function liturgicalYearStart(date: CalendarDate): CalendarDate {
  const a1 = advent1(date.year);
  return toDays(date) >= toDays(a1) ? a1 : advent1(date.year - 1);
}

// the civil year in which Easter falls within the liturgical year of `date`.
export function easterYear(date: CalendarDate): number {
  return liturgicalYearStart(date).year + 1;
}

export function seasonFor(date: CalendarDate): Season {
  const f = feastsForEasterYear(easterYear(date));
  const d = toDays(date);
  if (d >= f.advent1 && d < f.christmas) return "advent";
  if (d >= f.christmas && d < f.epiphany) return "christmas";
  if (d >= f.epiphany && d < f.ashWednesday) return "epiphany";
  if (d >= f.ashWednesday && d < f.palmSunday) return "lent";
  if (d >= f.palmSunday && d < f.easter) return "holy-week";
  if (d >= f.easter && d < f.pentecost) return "easter";
  if (d === f.pentecost) return "pentecost";
  return "after-pentecost";
}

// customary Episcopal Church colors (not prescribed by the BCP itself).
export function colorFor(date: CalendarDate): Color {
  const f = feastsForEasterYear(easterYear(date));
  const d = toDays(date);
  switch (seasonFor(date)) {
    case "advent":
      return "blue";
    case "christmas":
      return "white";
    case "epiphany":
      // the Epiphany and the Baptism of our Lord are feasts of our Lord.
      if (d === f.epiphany || d === f.baptism) return "white";
      return "green";
    case "lent":
      return "purple";
    case "holy-week":
      if (d === f.maundyThursday) return "white";
      if (d === f.goodFriday || d === f.holySaturday) return "black";
      return "red";
    case "easter":
      return "white";
    case "pentecost":
      return "red";
    case "after-pentecost":
      return "green";
  }
}

const NEXT_SEASON: Record<
  Season,
  { label: string; boundary: (f: FeastDays) => number }
> = {
  advent: { label: "Christmas", boundary: (f) => f.christmas },
  christmas: { label: "Epiphany", boundary: (f) => f.epiphany },
  epiphany: { label: "Lent", boundary: (f) => f.ashWednesday },
  lent: { label: "Holy Week", boundary: (f) => f.palmSunday },
  "holy-week": { label: "Easter", boundary: (f) => f.easter },
  easter: { label: "Pentecost", boundary: (f) => f.pentecost },
  pentecost: { label: "Ordinary Time", boundary: (f) => f.pentecost + 1 },
  "after-pentecost": { label: "Advent", boundary: (f) => f.advent1Next },
};

export function daysUntilNextSeason(date: CalendarDate): {
  days: number;
  label: string;
} {
  const season = seasonFor(date);
  const f = feastsForEasterYear(easterYear(date));
  const info = NEXT_SEASON[season];
  const boundary = info.boundary(f);
  const remaining = boundary - toDays(date);
  return { days: remaining, label: info.label };
}
