/**
 * Edition-scoped fixed feasts. The 1979 sanctorale and Lesser Feasts stay in
 * their own modules; this supplies the fixed-date observances for 1662 and
 * 1962 from their vendored calendars, with canonical slugs so a feast can be
 * recognised across editions even when its date or name differs.
 */
import { BCP1962_FIXED_CALENDAR } from "../content/vendor/bcp1962";
import { BCP1662_FIXED_HOLY_DAYS } from "./bcp1662";
import type { CalendarDate, CalendarEdition } from "./types";

export type EditionFeast = {
  slug: string;
  name: string;
  month: number;
  day: number;
  rank: "principal" | "holy-day" | "lesser";
  optional?: boolean;
  canonical?: string;
};

// ordered specific-first so a named saint is not swallowed by a generic rule
const canonicalRules: Array<[RegExp, string]> = [
  [/confession of st peter/i, "confession-of-peter"],
  [/conversion of st paul/i, "conversion-of-st-paul"],
  [/matthias/i, "st-matthias"],
  [/philip and st james|philip and james/i, "philip-and-james"],
  [/james the brother of the lord/i, "st-james-of-jerusalem"],
  [/st james|saint james/i, "st-james"],
  [/john (the )?baptist/i, "nativity-of-st-john-the-baptist"],
  [/john the evangelist|st john the apostle/i, "st-john"],
  [/innocent/i, "holy-innocents"],
  [/holy cross/i, "holy-cross"],
  [/purification|presentation/i, "presentation"],
  [/circumcision/i, "circumcision"],
  [/holy name|name of jesus/i, "holy-name"],
  [/epiphany/i, "epiphany"],
  [/annunciation/i, "annunciation"],
  [/visitation|visit:/i, "visitation"],
  [/joseph/i, "st-joseph"],
  [/mark the evangelist|st mark|saint mark/i, "st-mark"],
  [/barnabas/i, "st-barnabas"],
  [/peter and st paul|peter and paul/i, "peter-and-paul"],
  [/st\.? peter/i, "peter-and-paul"],
  [/magdalene/i, "st-mary-magdalene"],
  [/transfiguration/i, "transfiguration"],
  [/bartholomew/i, "st-bartholomew"],
  [/matthew/i, "st-matthew"],
  [/michael/i, "st-michael-and-all-angels"],
  [/luke/i, "st-luke"],
  [/simon|jude/i, "simon-and-jude"],
  [/all saints/i, "all-saints"],
  [/andrew/i, "st-andrew"],
  [/thomas/i, "st-thomas"],
  [/stephen(?! langton)/i, "st-stephen"],
  [/falling asleep|blessed virgin/i, "st-mary-the-virgin"],
  [/christmas|nativity of our lord/i, "christmas"],
];

export function canonicalFeastSlug(name: string): string | undefined {
  if (/octave day of christmas/i.test(name)) return undefined;
  for (const [pattern, slug] of canonicalRules) {
    if (pattern.test(name)) return slug;
  }
  return undefined;
}

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function makeFeast(
  month: number,
  day: number,
  name: string,
  rank: EditionFeast["rank"],
  optional = false,
): EditionFeast {
  return {
    slug: canonicalFeastSlug(name) ?? slugFromName(name),
    name,
    month,
    day,
    rank,
    optional,
    canonical: canonicalFeastSlug(name),
  };
}

// verified in vendor/bcp1662/lectionary-daily.json, names normalized for display
const BCP1662_EXTRA_FEASTS: Array<{
  month: number;
  day: number;
  name: string;
}> = [
  { month: 5, day: 3, name: "The Invention of the Holy Cross" },
  { month: 7, day: 2, name: "The Visitation of the Blessed Virgin Mary" },
  { month: 8, day: 7, name: "The Name of Jesus" },
  { month: 9, day: 8, name: "The Nativity of the Blessed Virgin Mary" },
  { month: 9, day: 14, name: "Holy Cross Day" },
  { month: 12, day: 8, name: "The Conception of the Blessed Virgin Mary" },
];

function feasts1662(date: CalendarDate): EditionFeast[] {
  const out: EditionFeast[] = [];
  for (const [key, name] of Object.entries(BCP1662_FIXED_HOLY_DAYS)) {
    const [month, day] = key.split("-").map(Number);
    if (month === date.month && day === date.day) {
      out.push(makeFeast(month, day, name, "holy-day"));
    }
  }
  for (const extra of BCP1662_EXTRA_FEASTS) {
    if (extra.month === date.month && extra.day === date.day) {
      out.push(makeFeast(extra.month, extra.day, extra.name, "holy-day"));
    }
  }
  return out;
}

function feasts1962(date: CalendarDate): EditionFeast[] {
  return BCP1962_FIXED_CALENDAR.filter(
    (entry) => entry.month === date.month && entry.day === date.day,
  ).map((entry) =>
    makeFeast(
      entry.month,
      entry.day,
      entry.name,
      entry.bracketed ? "lesser" : "holy-day",
      entry.bracketed === true,
    ),
  );
}

/** Fixed-date observances for an edition. Returns nothing for 1979, whose
 * sanctorale and Lesser Feasts are handled by their own modules. */
export function feastsForEditionDate(
  date: CalendarDate,
  edition: CalendarEdition,
): EditionFeast[] {
  if (edition === "1662") return feasts1662(date);
  if (edition === "1962") return feasts1962(date);
  return [];
}
