/**
 * church-calendar providers. an edition selects which texts to read; a
 * tradition selects the calendar. the registry is the single entry point for
 * callers that need to resolve a date or ask what a church observes.
 */

import { type FeastIdentity, feastsForDate } from "./feastsByTradition";
import {
  type DayInfo,
  dayInfoForTradition,
  seasonLabelForTradition,
} from "./observances";
import { type CalendarTradition, traditionForEdition } from "./tradition";
import type { CalendarDate, CalendarEdition, Season } from "./types";

export type CalendarProvider = {
  tradition: CalendarTradition;
  /** the season, week context, and ordered observances for a date. */
  resolve(date: CalendarDate): DayInfo;
  /** every fixed-date observance this church keeps on a date. */
  feastsFor(date: CalendarDate): FeastIdentity[];
  /** this church's name for a season. */
  seasonLabel(season: Season): string;
};

function provider(tradition: CalendarTradition): CalendarProvider {
  return {
    tradition,
    resolve: (date) => dayInfoForTradition(date, tradition),
    feastsFor: (date) => feastsForDate(date, tradition),
    seasonLabel: (season) => seasonLabelForTradition(season, tradition),
  };
}

const PROVIDERS: Record<CalendarTradition, CalendarProvider> = {
  tec: provider("tec"),
  coe: provider("coe"),
  acc: provider("acc"),
};

export function calendarFor(tradition: CalendarTradition): CalendarProvider {
  return PROVIDERS[tradition];
}

export function calendarForEdition(edition: CalendarEdition): CalendarProvider {
  return calendarFor(traditionForEdition(edition));
}
