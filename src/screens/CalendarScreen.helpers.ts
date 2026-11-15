import { type DayInfo, seasonLabel } from "../lib/calendar/observances";
import type { CalendarDate } from "../lib/calendar/types";

export const noSelect = {
  userSelect: "none" as const,
  WebkitUserSelect: "none" as const,
};

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function isSameDay(a: CalendarDate, b: CalendarDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

export function formatDate(date: CalendarDate): string {
  return `${MONTH_NAMES[date.month - 1]} ${date.day}, ${date.year}`;
}

// a short label for a feast name, sized to fit a calendar cell
export function cellName(name: string): string {
  const compact: Record<string, string> = {
    "The Holy Name of Our Lord Jesus Christ": "Holy Name",
    "First Sunday of Advent": "Advent 1",
    "Sunday of the Passion: Palm Sunday": "Palm Sunday",
    "The Day of Pentecost": "Pentecost",
    "The Baptism of our Lord": "Baptism of our Lord",
    "Last Sunday after the Epiphany": "Last Epiphany",
  };
  return compact[name] ?? name.replace(/^The /, "");
}

// the labels shown stacked inside a calendar cell. the season boundary name
// always comes first (so periods like "After Pentecost" read only on their
// first and last days), then any named observances of the day. the Sunday
// name and lesser feasts stay quiet so an actual feast leads the cell.
export function cellLabels(
  info: DayInfo,
): { season: boolean; quiet: boolean; text: string }[] {
  const labels: { season: boolean; quiet: boolean; text: string }[] = [];
  if (info.seasonStart || info.seasonEnd) {
    labels.push({
      season: true,
      quiet: false,
      text: seasonLabel(info.season),
    });
  }
  for (const obs of info.observances) {
    labels.push({
      season: false,
      quiet: obs.rank === "sunday" || obs.rank === "lesser",
      text: cellName(obs.name),
    });
  }
  return labels;
}
