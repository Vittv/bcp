import { toDays, weekday } from "./date";
import { feastsForEasterYear } from "./feasts";
import { easterYear, seasonFor } from "./season";
import type { CalendarDate } from "./types";

// the ordinal words the Prayer Book uses for Sunday names. the season after
// Pentecost can reach the twenty-seventh Sunday.
const ORDINALS = [
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
  "Twenty-First",
  "Twenty-Second",
  "Twenty-Third",
  "Twenty-Fourth",
  "Twenty-Fifth",
  "Twenty-Sixth",
  "Twenty-Seventh",
] as const;

function ordinal(n: number): string | null {
  return ORDINALS[n - 1] ?? null;
}

// the Prayer Book's name for a Sunday, following the 1979 calendar: Sundays
// count from the feast that opens their season, and the last Sunday of a
// season keeps that title instead of a number. returns null on weekdays and
// on Sundays that already carry a principal name, such as Easter Day or the
// First Sunday of Advent.
export function sundayName(date: CalendarDate): string | null {
  if (weekday(date) !== 0) return null;
  const f = feastsForEasterYear(easterYear(date));
  const d = toDays(date);

  switch (seasonFor(date)) {
    case "advent": {
      if (d === f.advent1) return null;
      const n = (d - f.advent1) / 7 + 1;
      const word = ordinal(n);
      return word && n >= 2 && n <= 4 ? `The ${word} Sunday of Advent` : null;
    }
    case "christmas":
      // the first and second Sundays after Christmas already carry names.
      return null;
    case "epiphany": {
      if (d === f.epiphany || d === f.baptism || d === f.lastEpiphany) {
        return null;
      }
      const n = (d - f.baptism) / 7 + 1;
      const word = ordinal(n);
      return word && n >= 2 && n <= 8
        ? `The ${word} Sunday after the Epiphany`
        : null;
    }
    case "lent": {
      const i = f.lent.indexOf(d);
      const word = ordinal(i + 1);
      return i >= 0 && word ? `The ${word} Sunday in Lent` : null;
    }
    case "holy-week":
      // Palm Sunday has its own name and is the only Sunday in the week.
      return null;
    case "easter": {
      if (d === f.easter) return null;
      const n = (d - f.easter) / 7 + 1;
      if (n === 7) {
        return "The Seventh Sunday of Easter: The Sunday after Ascension Day";
      }
      const word = ordinal(n);
      return word && n >= 2 && n <= 6 ? `The ${word} Sunday of Easter` : null;
    }
    case "pentecost":
      return null;
    case "after-pentecost": {
      // Trinity Sunday is the first Sunday after Pentecost.
      if (d === f.trinity) return null;
      if (d === f.advent1Next - 7) return "The Last Sunday after Pentecost";
      const n = (d - f.pentecost) / 7;
      const word = ordinal(n);
      return word && n >= 2 ? `The ${word} Sunday after Pentecost` : null;
    }
  }
}
