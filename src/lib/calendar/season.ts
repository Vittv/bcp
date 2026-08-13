import { toDays } from "./date";
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
