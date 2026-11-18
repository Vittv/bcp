import type { CalendarEdition } from "./types";

// the liturgical tradition a calendar speaks in. an edition is a revision of
// texts; a tradition outlives any one revision and carries the calendar.
export type CalendarTradition = "tec" | "coe" | "acc";

export const TRADITIONS: readonly CalendarTradition[] = ["tec", "coe", "acc"];

export const TRADITION_BY_EDITION: Record<CalendarEdition, CalendarTradition> =
  {
    "1979": "tec",
    "1662": "coe",
    "1962": "acc",
  };

export function traditionForEdition(
  edition: CalendarEdition,
): CalendarTradition {
  return TRADITION_BY_EDITION[edition];
}

export function isCalendarEdition(
  value: string | null,
): value is CalendarEdition {
  return value === "1979" || value === "1662" || value === "1962";
}
