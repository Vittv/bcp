/**
 * per-church propers for a feast. one identity can be observed by several
 * churches, but each book appoints its own psalms, readings and collect. the
 * card asks this module what the selected church actually supplies and renders
 * only those sections.
 */

import type { FeastIdentity } from "../calendar/feastsByTradition";
import { sanctoraleBySlug } from "../calendar/sanctorale";
import type { CalendarTradition } from "../calendar/tradition";
import { holyDayCollectTitle } from "../office/compose";
import { collectPassage } from "./collects";
import type { CollectPassage } from "./types";
import {
  type Bcp1662DailyMonth,
  getBcp1662DailyLessons,
  getBcp1662HolyDayProperLessons,
  getBcp1662MonthlyPsalms,
  getBcp1662ProperCollect,
  getBcp1662ProperPsalms,
  normalizeFeastKey,
} from "./vendor/bcp1662";

// the shared identity keeps the 1662 proper-lessons name; the proper-psalms
// table uses a shorter printed title for the same day.
const PSALM_NAME_ALIASES: Record<string, string> = {
  christmas: "Christmas Day",
};

const MONTH_NAMES: Bcp1662DailyMonth[] = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

import {
  getBcp1962ProperCollect,
  getBcp1962ProperPsalms,
  getBcp1962ScriptureProper,
} from "./vendor/bcp1962";

export type FeastPropers = {
  psalms: string[];
  // saints' days in the older books use the ordinary course, not proper psalms
  psalmSource?: "proper" | "course";
  readings: string[];
  collect?: CollectPassage;
};

import bcp1962Collects from "./vendor/bcp1962/office-text/collects-proper.min.json";

// SAFETY: the vendored table is an array of {name, text}; this narrows the
// JSON import to the fields the search needs.
const BCP1962_COLLECTS = bcp1962Collects.collects as Array<{
  name: string;
  text: string;
}>;

// the 1962 collect table uses verbose printed headings, so the printed feast
// name has to be found inside the collect title before an exact lookup works.
function collect1962(name: string) {
  const direct = getBcp1962ProperCollect(name);
  if (direct) return direct;
  const key = normalizeFeastKey(name).replace(/\bst\b/g, "saint");
  const match = BCP1962_COLLECTS.find((c) =>
    normalizeFeastKey(c.name).includes(key),
  );
  return match ? getBcp1962ProperCollect(match.name) : undefined;
}

export function propersForFeast(
  feast: FeastIdentity,
  tradition: CalendarTradition,
): FeastPropers {
  if (feast.rank === "lesser") return { psalms: [], readings: [] };

  if (tradition === "tec") {
    const entry = sanctoraleBySlug(feast.slug);
    const collectTitle = holyDayCollectTitle(feast.slug);
    const collect = collectTitle
      ? (collectPassage("traditional", "holy-days", collectTitle) ?? undefined)
      : undefined;
    return {
      psalms: entry
        ? [...(entry.psalms.morning ?? []), ...(entry.psalms.evening ?? [])]
        : [],
      readings: entry
        ? [
            ...Object.values(entry.lessons.morning ?? {}),
            ...Object.values(entry.lessons.evening ?? {}),
          ].filter((r): r is string => typeof r === "string")
        : [],
      collect,
    };
  }

  const observation =
    feast.observations.find((o) => o.tradition === tradition) ??
    feast.observations[0];
  const printedName = observation?.name ?? feast.name;

  if (tradition === "coe") {
    const lessons = getBcp1662HolyDayProperLessons(printedName);
    const psalms = getBcp1662ProperPsalms(
      PSALM_NAME_ALIASES[feast.canonical ?? ""] ?? printedName,
    );
    const collect = getBcp1662ProperCollect(printedName);
    // the proper table supplies the first lesson at each office; the second
    // lessons come from the daily calendar for the feast's printed date.
    const daily = getBcp1662DailyLessons(
      MONTH_NAMES[(observation?.month ?? feast.month) - 1],
      observation?.day ?? feast.day,
    );
    const secondLessons = daily
      ? [daily.morning.second, daily.evening.second]
      : [];
    const course = psalms
      ? undefined
      : getBcp1662MonthlyPsalms(observation?.day ?? feast.day);
    return {
      psalms: psalms
        ? [...psalms.mattins, ...psalms.evensong].map(String)
        : [...(course?.morning ?? []), ...(course?.evening ?? [])],
      psalmSource: psalms ? "proper" : "course",
      readings: [
        ...(lessons
          ? [
              ...((lessons.mattins && typeof lessons.mattins === "object"
                ? Object.values(lessons.mattins)
                : [lessons.mattins]) ?? []),
              ...((lessons.evensong && typeof lessons.evensong === "object"
                ? Object.values(lessons.evensong)
                : [lessons.evensong]) ?? []),
            ]
          : []),
        ...secondLessons,
      ].filter((r): r is string => typeof r === "string"),
      collect: collect
        ? {
            rite: "traditional",
            section: "holy-days",
            title: collect.name,
            text: collect.text,
          }
        : undefined,
    };
  }

  const psalms = getBcp1962ProperPsalms(feast.canonical ?? printedName);
  const collect = collect1962(printedName);
  const proper = getBcp1962ScriptureProper(printedName);
  return {
    psalms: psalms
      ? [psalms.mattins, psalms.evensong].filter(
          (p): p is string => typeof p === "string",
        )
      : [],
    readings: [proper?.epistle, proper?.gospel].filter(
      (r): r is string => typeof r === "string",
    ),
    collect: collect
      ? {
          rite: "traditional",
          section: "holy-days",
          title: collect.name,
          text: collect.text,
        }
      : undefined,
  };
}
