import { weekday } from "../../calendar";
import type { CalendarDate, DolSlot, Season } from "../../calendar/types";
import type { DolEntry, Office, OfficeItem } from "../../content/types";
import type { ComposedNode, OfficePrefs } from "../types";

export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

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

export const ORDINALS = [
  "First",
  "Second",
  "Third",
  "Fourth",
  "Fifth",
  "Sixth",
  "Seventh",
  "Eighth",
];

export const EVENING_OFFICES = new Set([
  "evening-rite-one",
  "evening-rite-two",
]);
export const MORNING_OFFICES = new Set([
  "morning-rite-one",
  "morning-rite-two",
]);

export const SPECIAL_COLLECTS: Record<string, string> = {
  "dec-24": "Fourth Sunday of Advent",
  "christmas-day": "The Nativity of Our Lord:  Christmas Day",
  "first-sunday-after-christmas": "First Sunday after Christmas Day",
  "second-sunday-after-christmas": "Second Sunday after Christmas Day",
  "holy-name": "The Holy Name",
  epiphany: "The Epiphany",
  "ash-wednesday": "Ash Wednesday",
  "palm-sunday": "Sunday of the Passion:  Palm Sunday",
  "maundy-thursday": "Maundy Thursday",
  "good-friday": "Good Friday",
  "holy-saturday": "Holy Saturday",
  "easter-day": "Easter Day",
  ascension: "Ascension Day",
  "eve-of-pentecost": "The Day of Pentecost:  Whitsunday",
  pentecost: "The Day of Pentecost:  Whitsunday",
  "eve-of-trinity": "The Day of Pentecost:  Whitsunday",
  trinity: "First Sunday after Pentecost:  Trinity Sunday",
};

export const HOLY_DAY_COLLECTS: Record<string, string> = {
  "st-andrew": "Saint Andrew",
  "st-thomas": "Saint Thomas",
  "st-stephen": "Saint Stephen",
  "st-john": "Saint John",
  "holy-innocents": "The Holy Innocents",
  "confession-of-st-peter": "Confession of Saint Peter",
  "conversion-of-st-paul": "Conversion of Saint Paul",
  presentation: "The Presentation",
  "st-matthias": "Saint Matthias",
  "st-joseph": "Saint Joseph",
  annunciation: "The Annunciation",
  "st-mark": "Saint Mark",
  "philip-and-james": "Saint Philip and Saint James",
  visitation: "The Visitation",
  "st-barnabas": "Saint Barnabas",
  "nativity-of-st-john-the-baptist": "The Nativity of Saint John the Baptist",
  "peter-and-paul": "Saint Peter and Saint Paul",
  "st-mary-magdalene": "Saint Mary Magdalene",
  "st-james": "Saint James",
  transfiguration: "The Transfiguration",
  "st-mary-the-virgin": "Saint Mary the Virgin",
  "st-bartholomew": "Saint Bartholomew",
  "holy-cross": "Holy Cross Day",
  "st-matthew": "Saint Matthew",
  "st-michael-and-all-angels": "Saint Michael and All Angels",
  "st-luke": "Saint Luke",
  "st-james-of-jerusalem": "Saint James of Jerusalem",
  "simon-and-jude": "Saint Simon and Saint Jude",
  "all-saints": "All Saint's Day",
};

export const SUNDAY_FEASTS = new Set([
  "holy-name",
  "presentation",
  "transfiguration",
  "all-saints",
]);

export const MENU_OFFICES = new Set<string>(["noonday", "compline"]);

export type ComposeContext = {
  officeId: Office["id"];
  rite: "One" | "Two";
  date: CalendarDate;
  litDate: CalendarDate;
  litSlot: DolSlot;
  slot: DolSlot;
  entry: DolEntry | undefined;
  season: Season;
  holyDay: string | undefined;
  isTrinity: boolean;
  ascensionOrAfter: boolean;
  psalmCitations: string[] | undefined;
  lessonGroup: DolEntry["lessons"] | undefined;
  prefs: OfficePrefs;
  menuRegions?: MenuRegions;
  // the printed collect and mission alternatives of morning and evening,
  // parsed once from the suffrages tail so pickers and composer share a source
  collectBlocks?: MenuBlock[];
  missionBlocks?: MenuBlock[];
};

export type PsalmBlock = {
  heading: number;
  from: number;
  to: number;
  psalm: number;
  id: string;
  incipit?: string;
};

export type MenuBlock = {
  from: number;
  to: number;
  id: string;
  label: string;
  menuLabel: string;
  group: string;
  title?: string;
};

export type MenuRegions = {
  psalmRubric?: number;
  psalms: PsalmBlock[];
  gloriaRubric?: number;
  readingRubric?: number;
  readings: MenuBlock[];
  readingEnd?: number;
  collectRubric?: number;
  collects: MenuBlock[];
  collectEnd?: number;
};

export function isMorningOffice(id: string): boolean {
  return MORNING_OFFICES.has(id);
}

export function isEveningOffice(id: string): boolean {
  return EVENING_OFFICES.has(id);
}

export function showRubrics(prefs: OfficePrefs): boolean {
  return prefs.showRubrics && !prefs.personalMode;
}

export function convert(
  item: OfficeItem,
  prefs: OfficePrefs,
): ComposedNode | undefined {
  switch (item.kind) {
    case "heading":
      return { kind: "heading", text: item.text, citation: item.citation };
    case "rubric":
      return showRubrics(prefs)
        ? { kind: "rubric", text: item.text }
        : undefined;
    case "text":
      return {
        kind: "text",
        text: item.text,
        speaker: prefs.personalMode ? undefined : item.speaker,
      };
    case "option":
      return undefined;
    case "season":
      return { kind: "heading", text: item.text };
  }
}

export function dayLabel(date: CalendarDate): string {
  return `${WEEKDAY_NAMES[weekday(date)]}, ${MONTH_NAMES[date.month - 1]} ${date.day}, ${date.year}`;
}
