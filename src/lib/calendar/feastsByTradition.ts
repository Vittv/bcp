/**
 * fixed-date feast tables for each church tradition. the same canonical feast
 * can fall on different dates in different churches; each table carries the
 * dates and names that its own calendar prints. the identity layer here is
 * shared so callers can ask one question across all three traditions.
 */
import bcp1662Daily from "../content/vendor/bcp1662/lectionary-daily.min.json";
import { BCP1962_FIXED_CALENDAR } from "../content/vendor/bcp1962";
import { BCP1662_FIXED_HOLY_DAYS } from "./bcp1662";
import { LESSER_FEASTS } from "./lesserFeasts";
import { SANCTORALE_SLUGS, sanctoraleTitle } from "./sanctorale";
import type { CalendarTradition } from "./tradition";
import type { CalendarDate, CalendarEdition } from "./types";

export type FeastRank = "principal" | "holy-day" | "lesser";

export const CHURCH_CALENDARS: Record<CalendarTradition, string> = {
  tec: "The Episcopal Church",
  coe: "Church of England",
  acc: "Anglican Church of Canada",
};

export const CHURCH_CALENDAR_BOOKS: Record<CalendarTradition, string> = {
  tec: "1979 Book of Common Prayer",
  coe: "1662 Book of Common Prayer",
  acc: "1962 Canadian Book of Common Prayer",
};

const ALL_TRADITIONS: readonly CalendarTradition[] = ["tec", "coe", "acc"];

export function calendarLabel(tradition: CalendarTradition): string {
  return `${CHURCH_CALENDARS[tradition]} · ${CHURCH_CALENDAR_BOOKS[tradition]}`;
}

export type FeastIdentity = {
  /** canonical cross-tradition identity, when one is known. */
  canonical?: string;
  /** stable slug for this entry; shared feasts use their canonical slug. */
  slug: string;
  /** the name printed by this church's calendar. */
  name: string;
  month: number;
  day: number;
  rank: FeastRank;
  optional?: boolean;
  /** trial-use marker carried by the 2024 LFF calendar. */
  trial?: boolean;
  tradition: CalendarTradition;
  /** every church that keeps this feast on this date. */
  calendars: CalendarTradition[];
  /** the full church and book this entry comes from. */
  calendar: string;
  /** the source table this entry came from. */
  source: string;
  /** one record per church, holding that book's own name and date. */
  observations: FeastObservation[];
};

export type FeastObservation = {
  tradition: CalendarTradition;
  name: string;
  month: number;
  day: number;
  source: string;
  optional?: boolean;
  trial?: boolean;
};

// ordered specific-first so a named saint is not swallowed by a generic rule
const canonicalRules: Array<[RegExp, string]> = [
  [/confession of st peter/i, "confession-of-peter"],
  [
    /conversion of (st|saint) paul|convers: of s\. paul/i,
    "conversion-of-st-paul",
  ],
  [/matthias/i, "st-matthias"],
  [
    /philip and st james|philip and james|s\. philip and s\. james|saint philip and saint james/i,
    "philip-and-james",
  ],
  [
    /james the brother of the lord|james of jerusalem/i,
    "st-james-of-jerusalem",
  ],
  [/st james|saint james|s\. james/i, "st-james"],
  [
    /nativit.*john.*baptist|^st\.? john baptist$/i,
    "nativity-of-st-john-the-baptist",
  ],
  [
    /john.*apostle and evangelist|john the evangelist|st john the apostle/i,
    "st-john",
  ],
  [/innocent/i, "holy-innocents"],
  [/holy cross|invention of the holy cross/i, "holy-cross"],
  [/purification|presentation|purif\. of marie/i, "presentation"],
  [/circumcision|circumc\. of our ld/i, "circumcision"],
  [/holy name|name of jesus/i, "holy-name"],
  [/epiphany|epiphanie/i, "epiphany"],
  [/annunciation|annunc\. of mary/i, "annunciation"],
  [/visitation|visit:/i, "visitation"],
  [/st\.? joseph\b|saint joseph\b/i, "st-joseph"],
  [/mark the evangelist|st mark|saint mark|s\. mark/i, "st-mark"],
  [/barnabas/i, "st-barnabas"],
  [/peter and (st|saint) paul|peter and paul|st\.? peter$/i, "peter-and-paul"],
  [/magdalene/i, "st-mary-magdalene"],
  [/transfiguration/i, "transfiguration"],
  [/bartholomew/i, "st-bartholomew"],
  [/matthew/i, "st-matthew"],
  [/michael/i, "st-michael-and-all-angels"],
  [/luke/i, "st-luke"],
  [/simon|jude/i, "simon-and-jude"],
  [/all saints/i, "all-saints"],
  [/st\.? andrew\b|saint andrew\b/i, "st-andrew"],
  [/st\.? thomas the apostle|saint thomas the apostle/i, "st-thomas"],
  [/st\.? stephen\b|saint stephen\b/i, "st-stephen"],
  // Edmund of East Anglia is printed three ways; "Edmund James Peck" is a
  // different commemoration and must not fold into this identity.
  [/edmund.*(king|k\.?\s*&|east anglia)/i, "edmund-king-870"],
  [
    /falling asleep|assumption of the blessed virgin|st\.? mary the virgin/i,
    "st-mary-the-virgin",
  ],
  [/nativity of the blessed virgin/i, "nativity-of-mary"],
  [/conception of the blessed virgin/i, "conception-of-mary"],
  [/parents of the blessed virgin/i, "parents-of-mary"],
  [/christmas|nativity of our lord|nativity of christ/i, "christmas"],
];

export function canonicalFeastSlug(name: string): string | undefined {
  if (/octave day of christmas/i.test(name)) return undefined;
  for (const [pattern, slug] of canonicalRules) {
    if (pattern.test(name)) return slug;
  }
  return undefined;
}

export function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function identity(
  month: number,
  day: number,
  name: string,
  rank: FeastRank,
  tradition: CalendarTradition,
  source: string,
  optional = false,
  trial?: boolean,
  slugOverride?: string,
): FeastIdentity {
  return {
    canonical: canonicalFeastSlug(name),
    // the slug addresses one printed entry; canonical identities are shared
    // across churches and can repeat within a church (All Saints and its
    // octave, for example), so they must never double as navigation keys.
    slug: slugOverride ?? slugFromName(name),
    name,
    month,
    day,
    rank,
    optional,
    trial,
    tradition,
    calendars: [tradition],
    calendar: calendarLabel(tradition),
    source,
    observations: [{ tradition, name, month, day, source, optional, trial }],
  };
}

const tecFeasts: FeastIdentity[] = [
  identity(
    1,
    1,
    "The Holy Name of Our Lord Jesus Christ",
    "principal",
    "tec",
    "1979 fixed feast",
    false,
    undefined,
    "holy-name",
  ),
  ...SANCTORALE_SLUGS.map((s) =>
    identity(
      s.month,
      s.day,
      sanctoraleTitle(s.slug) ?? s.slug,
      "holy-day",
      "tec",
      "sanctorale",
      false,
      undefined,
      s.slug,
    ),
  ),
  ...LESSER_FEASTS.map((f) =>
    identity(
      f.month,
      f.day,
      f.name,
      "lesser",
      "tec",
      "lesser feasts and fasts",
      true,
      f.trial,
      f.slug,
    ),
  ),
];

const coeFixedDays = new Set(
  Object.keys(BCP1662_FIXED_HOLY_DAYS).map((key) => {
    const [month, day] = key.split("-");
    return `${Number(month)}-${Number(day)}`;
  }),
);
const coeExtras: Array<{ month: number; day: number; name: string }> = [
  { month: 5, day: 3, name: "The Invention of the Holy Cross" },
  { month: 7, day: 2, name: "The Visitation of the Blessed Virgin Mary" },
  { month: 8, day: 7, name: "The Name of Jesus" },
  { month: 9, day: 8, name: "The Nativity of the Blessed Virgin Mary" },
  { month: 9, day: 14, name: "Holy Cross Day" },
  { month: 12, day: 8, name: "The Conception of the Blessed Virgin Mary" },
];

// the printed 1662 daily calendar carries the saint labels for the year; its
// abbreviated forms are kept where they are not already a fixed holy day.
const monthlyNames: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};
// SAFETY: the vendored 1662 daily table is month-keyed with per-day feast
// labels; the cast only narrows the JSON import's literal shape.
const coeDaily = bcp1662Daily.months as Record<
  string,
  Record<string, { feast?: string }>
>;
const coeDailyLabels: FeastIdentity[] = [];
for (const [monthName, days] of Object.entries(coeDaily)) {
  const month = monthlyNames[monthName];
  if (!month) continue;
  for (const [day, entry] of Object.entries(days)) {
    const name = entry?.feast?.trim();
    if (!name || /^fast$/i.test(name)) continue;
    const d = Number(day);
    if (coeFixedDays.has(`${month}-${d}`)) continue;
    coeDailyLabels.push(
      identity(month, d, name, "lesser", "coe", "1662 daily calendar"),
    );
  }
}

const coePrincipal: FeastIdentity[] = [
  ...Object.entries(BCP1662_FIXED_HOLY_DAYS).map(([key, name]) => {
    const [month, day] = key.split("-").map(Number);
    return identity(
      month,
      day,
      name,
      "holy-day",
      "coe",
      "1662 fixed holy days",
    );
  }),
  ...coeExtras.map((e) =>
    identity(e.month, e.day, e.name, "holy-day", "coe", "1662 daily calendar"),
  ),
];
const coeCanonical = new Set(
  coePrincipal.map((f) => f.canonical).filter((c): c is string => Boolean(c)),
);
// the daily calendar prints abbreviated forms of the principal feasts too.
const coeFeasts: FeastIdentity[] = [
  ...coePrincipal,
  ...coeDailyLabels.filter(
    (f) => !f.canonical || !coeCanonical.has(f.canonical),
  ),
];

// the 1962 fixed calendar prints holy days and saints' commemorations in the
// same table. canonical identity marks a holy day here, but some shared
// identities are printed as lesser commemorations, so they are held back.
const accLesserCanonical = new Set(["edmund-king-870"]);

const accFeasts: FeastIdentity[] = BCP1962_FIXED_CALENDAR.map((entry) => {
  const canonical = canonicalFeastSlug(entry.name);
  const major =
    (Boolean(canonical) && !accLesserCanonical.has(canonical ?? "")) ||
    /octave day of christmas/i.test(entry.name);
  return identity(
    entry.month,
    entry.day,
    entry.name,
    major ? "holy-day" : "lesser",
    "acc",
    "1962 calendar rules",
    !major || entry.bracketed === true,
  );
});

// the same canonical feast often falls on the same date in more than one
// church. carry it once with every observing church in its metadata rather
// than repeating an identical entry in each calendar.
const rawByTradition: Record<CalendarTradition, FeastIdentity[]> = {
  tec: tecFeasts,
  coe: coeFeasts,
  acc: accFeasts,
};

const sharedGroups = new Map<string, FeastIdentity[]>();
for (const tradition of ALL_TRADITIONS) {
  for (const feast of rawByTradition[tradition]) {
    const key = `${feast.canonical ?? feast.slug}|${feast.month}|${feast.day}`;
    sharedGroups.set(key, [...(sharedGroups.get(key) ?? []), feast]);
  }
}

const merged: FeastIdentity[] = [];
for (const group of sharedGroups.values()) {
  const traditions = new Set(group.map((f) => f.tradition));
  if (traditions.size < 2) {
    merged.push(group[0]);
    continue;
  }
  const first = group[0];
  const rankOrder: FeastRank[] = ["lesser", "holy-day", "principal"];
  const rank = group.reduce(
    (best, f) =>
      rankOrder.indexOf(f.rank) > rankOrder.indexOf(best) ? f.rank : best,
    first.rank,
  );
  merged.push({
    ...first,
    rank,
    optional: rank === "lesser" ? first.optional : false,
    slug: first.canonical ?? first.slug,
    calendars: ALL_TRADITIONS.filter((t) => traditions.has(t)),
    calendar: [...traditions].map((t) => calendarLabel(t)).join(" · "),
    observations: group.flatMap((f) => f.observations),
  });
}

/** the one authoritative feast list: shared feasts appear once, with every
 * church kept as an observation on the same entry. */
export const FEAST_REGISTRY: readonly FeastIdentity[] = merged;

const BY_TRADITION: Record<CalendarTradition, FeastIdentity[]> = {
  tec: merged.filter((f) => f.calendars.includes("tec")),
  coe: merged.filter((f) => f.calendars.includes("coe")),
  acc: merged.filter((f) => f.calendars.includes("acc")),
};

const byDate = new Map<CalendarTradition, Map<string, FeastIdentity[]>>();
const byCanonical = new Map<CalendarTradition, Map<string, FeastIdentity[]>>();
for (const tradition of ["tec", "coe", "acc"] as const) {
  const dateMap = new Map<string, FeastIdentity[]>();
  const canonicalMap = new Map<string, FeastIdentity[]>();
  for (const feast of BY_TRADITION[tradition]) {
    const dateKey = `${feast.month}-${feast.day}`;
    dateMap.set(dateKey, [...(dateMap.get(dateKey) ?? []), feast]);
    const canonicalKey = feast.canonical ?? feast.slug;
    canonicalMap.set(canonicalKey, [
      ...(canonicalMap.get(canonicalKey) ?? []),
      feast,
    ]);
  }
  byDate.set(tradition, dateMap);
  byCanonical.set(tradition, canonicalMap);
}

export function allFeasts(tradition: CalendarTradition): FeastIdentity[] {
  return BY_TRADITION[tradition];
}

/** find a registry entry by its navigation slug, regardless of church. */
export function feastBySlug(slug: string): FeastIdentity | undefined {
  return FEAST_REGISTRY.find((f) => f.slug === slug);
}

/** the selected church's own printed record for a shared feast. */
export function observationForTradition(
  feast: FeastIdentity,
  tradition: CalendarTradition,
): FeastObservation {
  return (
    feast.observations.find((o) => o.tradition === tradition) ??
    feast.observations[0]
  );
}

/** the name the selected church prints for a shared feast. */
export function feastNameForTradition(
  feast: FeastIdentity,
  tradition: CalendarTradition,
): string {
  return observationForTradition(feast, tradition).name;
}

/** every fixed-date observance in a tradition on a given date. */
export function feastsForDate(
  date: CalendarDate,
  tradition: CalendarTradition,
): FeastIdentity[] {
  return byDate.get(tradition)?.get(`${date.month}-${date.day}`) ?? [];
}

/** look up a canonical feast in a tradition, wherever its calendar places it. */
export function feastsByCanonical(
  canonical: string,
  tradition: CalendarTradition,
): FeastIdentity[] {
  return byCanonical.get(tradition)?.get(canonical) ?? [];
}

const EDITION_TRADITION: Record<CalendarEdition, CalendarTradition> = {
  "1979": "tec",
  "1662": "coe",
  "1962": "acc",
};

/** compatibility wrapper for callers that still speak in editions. */
export function feastsForEditionDate(
  date: CalendarDate,
  edition: CalendarEdition,
): FeastIdentity[] {
  return feastsForDate(date, EDITION_TRADITION[edition]);
}

// reference surfaces that used to read the TEC LFF table directly now read
// their church's own lesser feasts from the consolidated identity layer.
const LITURGICAL_MONTHS = [
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

export function feastMonthDayLabel(month: number, day: number): string {
  return `${LITURGICAL_MONTHS[month - 1] ?? "Unknown"} ${day}`;
}

export function feastMonthDayShortLabel(month: number, day: number): string {
  return `${LITURGICAL_MONTHS[month - 1]?.slice(0, 3) ?? "???"} ${day}`;
}

// the Holy Days page navigates by the unique slug of one printed entry, so it
// reads the same per-church tables the calendar uses rather than the TEC
// sanctorale alone.
export function holyDaysForTradition(
  tradition: CalendarTradition,
): FeastIdentity[] {
  return BY_TRADITION[tradition]
    .filter((f) => f.rank === "holy-day" || f.rank === "principal")
    .sort(
      (a, b) =>
        a.month - b.month || a.day - b.day || a.slug.localeCompare(b.slug),
    );
}

export function holyDayBySlugForTradition(
  slug: string,
  tradition: CalendarTradition,
): FeastIdentity | undefined {
  return BY_TRADITION[tradition].find(
    (f) => f.slug === slug && (f.rank === "holy-day" || f.rank === "principal"),
  );
}

export function holyDayForTraditionDate(
  date: CalendarDate,
  tradition: CalendarTradition,
): FeastIdentity | undefined {
  return holyDaysForTradition(tradition).find(
    (f) => f.month === date.month && f.day === date.day,
  );
}

export function upcomingHolyDayForTradition(
  date: CalendarDate,
  tradition: CalendarTradition,
): FeastIdentity {
  const feasts = holyDaysForTradition(tradition);
  return (
    feasts.find(
      (f) =>
        f.month > date.month || (f.month === date.month && f.day >= date.day),
    ) ?? feasts[0]
  );
}

function matchesFeastQuery(
  feast: FeastIdentity,
  tradition: CalendarTradition,
  q: string,
): boolean {
  return (
    [feast.name, feastNameForTradition(feast, tradition)].some((name) =>
      name.toLowerCase().includes(q),
    ) ||
    feastMonthDayLabel(feast.month, feast.day).toLowerCase().includes(q) ||
    feastMonthDayShortLabel(feast.month, feast.day).toLowerCase().includes(q)
  );
}

export function searchHolyDaysForTradition(
  query: string,
  tradition: CalendarTradition,
): FeastIdentity[] {
  const q = query.trim().toLowerCase();
  const all = holyDaysForTradition(tradition);
  if (!q) return all;
  return all.filter((f) => matchesFeastQuery(f, tradition, q));
}

export function lesserFeastsForTradition(
  tradition: CalendarTradition,
): FeastIdentity[] {
  return BY_TRADITION[tradition]
    .filter((f) => f.rank === "lesser")
    .sort(
      (a, b) =>
        a.month - b.month || a.day - b.day || a.slug.localeCompare(b.slug),
    );
}

export function lesserFeastBySlugForTradition(
  slug: string,
  tradition: CalendarTradition,
): FeastIdentity | undefined {
  return BY_TRADITION[tradition].find(
    (f) => f.rank === "lesser" && f.slug === slug,
  );
}

export function firstLesserFeastForTradition(
  tradition: CalendarTradition,
): FeastIdentity {
  return lesserFeastsForTradition(tradition)[0];
}

export function lesserFeastForTraditionDate(
  date: CalendarDate,
  tradition: CalendarTradition,
): FeastIdentity | undefined {
  return lesserFeastsForTradition(tradition).find(
    (f) => f.month === date.month && f.day === date.day,
  );
}

/** the next lesser feast at or after a date, wrapping to the start of the year. */
export function upcomingLesserFeastForTradition(
  date: CalendarDate,
  tradition: CalendarTradition,
): FeastIdentity {
  const feasts = lesserFeastsForTradition(tradition);
  return (
    feasts.find(
      (f) =>
        f.month > date.month || (f.month === date.month && f.day >= date.day),
    ) ?? feasts[0]
  );
}

export function searchLesserFeastsForTradition(
  query: string,
  tradition: CalendarTradition,
): FeastIdentity[] {
  const q = query.trim().toLowerCase();
  const all = lesserFeastsForTradition(tradition);
  if (!q) return all;
  return all.filter((f) => matchesFeastQuery(f, tradition, q));
}
