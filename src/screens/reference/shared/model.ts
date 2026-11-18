import {
  holyDayForTraditionDate,
  upcomingHolyDayForTradition,
  upcomingLesserFeastForTradition,
} from "../../../lib/calendar/feastsByTradition";
import { SANCTORALE_ENTRIES } from "../../../lib/calendar/sanctorale";
import type { CalendarTradition } from "../../../lib/calendar/tradition";
import type { CalendarDate } from "../../../lib/calendar/types";
import type { CollectSection, OfficeId } from "../../../lib/content/types";
import type { OfficeRite } from "../../../lib/office/types";
import { searchCollects } from "../../../lib/reference/search";

export type { OfficeRite };

// the collect the desktop pane shows before anything is picked: the
// first hit of the full list, i.e. traditional · church-year
export const FIRST_COLLECT = searchCollects("")[0];

// the saint the desktop pane shows before anything is picked: the first
// entry of the calendar, i.e. the Confession of Saint Peter the Apostle, Jan 18
export const FIRST_SAINT = SANCTORALE_ENTRIES[0].slug;

export function today(): CalendarDate {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
}

// the holy days page opens on today's feast when the day has one, so a
// reader arriving on Saint Luke finds Saint Luke, not the top of the list
export function defaultSaint(tradition: CalendarTradition = "tec"): string {
  return (
    holyDayForTraditionDate(today(), tradition)?.slug ??
    upcomingHolyDayForTradition(today(), tradition).slug
  );
}

// the lesser feasts page opens on the next commemoration at or after today,
// wrapping to the start of the year, so every church opens on a date-relevant
// entry even when today itself has none.
export function defaultLesserFeast(
  tradition: CalendarTradition = "tec",
): string {
  return upcomingLesserFeastForTradition(today(), tradition).slug;
}

export const noSelect = {
  userSelect: "none" as const,
  WebkitUserSelect: "none" as const,
};

// the offices reference page browses the seven printed offices;
// devotions are reachable from the Today view instead.
export type RefOfficeId = Exclude<OfficeId, `devotions-${string}`> | "litany";

// morning and evening exist in both rites; the rite is a toggle in the
// bar rather than separate tabs, so selection tracks the base office
export type RefOfficeBase =
  | "morning"
  | "evening"
  | "noonday"
  | "owe"
  | "compline"
  | "litany";

export const BASE_OFFICES: {
  id: RefOfficeBase;
  label: string;
  name: string;
}[] = [
  { id: "morning", label: "Morning", name: "Morning Prayer" },
  { id: "noonday", label: "Noonday", name: "Noonday Prayer" },
  {
    id: "owe",
    label: "Order",
    name: "Order of Worship for the Evening",
  },
  { id: "evening", label: "Evening", name: "Evening Prayer" },
  { id: "compline", label: "Compline", name: "Compline" },
];

export const BCP1662_BASE_OFFICES: {
  id: RefOfficeBase;
  label: string;
  name: string;
}[] = [
  { id: "morning", label: "Matins", name: "Matins" },
  { id: "litany", label: "The Litany", name: "The Litany" },
  { id: "evening", label: "Evensong", name: "Evensong" },
];

export const BCP1962_BASE_OFFICES: typeof BCP1662_BASE_OFFICES = [
  { id: "morning", label: "Matins", name: "Matins" },
  { id: "litany", label: "The Litany", name: "The Litany" },
  { id: "evening", label: "Evensong", name: "Evensong" },
];

export function refOfficeId(
  base: RefOfficeBase,
  rite: OfficeRite,
): RefOfficeId {
  switch (base) {
    case "morning":
      return `morning-rite-${rite === "One" ? "one" : "two"}`;
    case "evening":
      return `evening-rite-${rite === "One" ? "one" : "two"}`;
    default:
      return base;
  }
}

export const OFFICE_NAMES: Record<RefOfficeId, string> = {
  "morning-rite-one": "Morning Prayer, Rite One",
  "morning-rite-two": "Morning Prayer, Rite Two",
  "evening-rite-one": "Evening Prayer, Rite One",
  "evening-rite-two": "Evening Prayer, Rite Two",
  noonday: "Noonday Prayer",
  owe: "Order of Worship for the Evening",
  compline: "Compline",
  litany: "The Litany",
};

// a collect picked in the index; both rites render together in the
// detail pane, so a selection needs no rite of its own
export type CollectSel = {
  section: CollectSection;
  title: string;
};
