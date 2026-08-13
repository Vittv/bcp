import { HOLY_DAYS, resolve } from "../calendar/dol";
import type { CalendarDate, DolSlot } from "../calendar/types";
import { parseLessonRef } from "./lessons";
import { parsePsalmCitation } from "./psalms";
import { dolYearSchema } from "./schemas";
import type { DolEntry } from "./types";
import holyDaysData from "./vendor/dol/dol-holy-days.min.json";
import specialOccasionsData from "./vendor/dol/dol-special-occasions.min.json";
import yearOneData from "./vendor/dol/dol-year-1.min.json";
import yearTwoData from "./vendor/dol/dol-year-2.min.json";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type YearKey = { season: string; week: string | undefined; day: string };

// how the calendar's special day names key into the year tables.
const SPECIAL_DAY_KEYS: Record<string, YearKey> = {
  "dec-24": { season: "Advent", week: "Week of 4 Advent", day: "Dec 24" },
  "christmas-day": {
    season: "Christmas",
    week: "Christmas Day and Following",
    day: "Dec 25",
  },
  "first-sunday-after-christmas": {
    season: "Christmas",
    week: "Christmas Day and Following",
    day: "Sunday",
  },
  "second-sunday-after-christmas": {
    season: "Christmas",
    week: "Christmas Day and Following",
    day: "Sunday",
  },
  "holy-name": {
    season: "Christmas",
    week: "Christmas Day and Following",
    day: "Jan 1",
  },
  "dec-29": {
    season: "Christmas",
    week: "Christmas Day and Following",
    day: "Dec 29",
  },
  "dec-30": {
    season: "Christmas",
    week: "Christmas Day and Following",
    day: "Dec 30",
  },
  "dec-31": {
    season: "Christmas",
    week: "Christmas Day and Following",
    day: "Dec 31",
  },
  "jan-2": {
    season: "Christmas",
    week: "Christmas Day and Following",
    day: "Jan 2",
  },
  "jan-3": {
    season: "Christmas",
    week: "Christmas Day and Following",
    day: "Jan 3",
  },
  "jan-4": {
    season: "Christmas",
    week: "Christmas Day and Following",
    day: "Jan 4",
  },
  "jan-5": {
    season: "Christmas",
    week: "Christmas Day and Following",
    day: "Jan 5",
  },
  epiphany: {
    season: "Epiphany",
    week: "The Epiphany and Following",
    day: "Jan 6",
  },
  "jan-7": {
    season: "Epiphany",
    week: "The Epiphany and Following",
    day: "Jan 7",
  },
  "jan-8": {
    season: "Epiphany",
    week: "The Epiphany and Following",
    day: "Jan 8",
  },
  "jan-9": {
    season: "Epiphany",
    week: "The Epiphany and Following",
    day: "Jan 9",
  },
  "jan-10": {
    season: "Epiphany",
    week: "The Epiphany and Following",
    day: "Jan 10",
  },
  "jan-11": {
    season: "Epiphany",
    week: "The Epiphany and Following",
    day: "Jan 11",
  },
  "jan-12": {
    season: "Epiphany",
    week: "The Epiphany and Following",
    day: "Jan 12",
  },
  "ash-wednesday": {
    season: "Lent",
    week: "Ash Wednesday and Following",
    day: "Wednesday",
  },
  "palm-sunday": { season: "Lent", week: "Holy Week", day: "Sunday" },
  "maundy-thursday": { season: "Lent", week: "Holy Week", day: "Thursday" },
  "good-friday": { season: "Lent", week: "Holy Week", day: "Friday" },
  "holy-saturday": { season: "Lent", week: "Holy Week", day: "Saturday" },
  "easter-day": { season: "Easter", week: "Easter Week", day: "Sunday" },
  ascension: { season: "Easter", week: "Week of 6 Easter", day: "Thursday" },
  "eve-of-pentecost": {
    season: "Easter",
    week: "Week of 7 Easter",
    day: "Saturday",
  },
  pentecost: { season: "Easter", week: "Pentecost", day: "Sunday" },
  "eve-of-trinity": {
    season: "The Season after Pentecost",
    week: undefined,
    day: "Saturday",
  },
  trinity: {
    season: "The Season after Pentecost",
    week: undefined,
    day: "Sunday",
  },
};

// evening specials: the eve of the next feast, keyed into the year tables.
const EVENING_DAY_KEYS: Record<string, YearKey> = {
  "christmas-eve": {
    season: "Advent",
    week: "Week of 4 Advent",
    day: "Dec 24",
  },
  "eve-of-holy-name": {
    season: "Christmas",
    week: "Christmas Day and Following",
    day: "Dec 31",
  },
  "eve-of-epiphany": {
    season: "Christmas",
    week: "Christmas Day and Following",
    day: "Jan 5",
  },
  "eve-of-1-epiphany": {
    season: "Epiphany",
    week: "The Epiphany and Following",
    day: "Saturday",
  },
  "eve-of-ascension": {
    season: "Easter",
    week: "Week of 6 Easter",
    day: "Wednesday",
  },
};

// special day names that resolve to fixed-date holy days instead of year tables.
const HOLY_DAY_SPECIALS = new Set(["st-stephen", "st-john", "holy-innocents"]);

const yearEntries = dolYearSchema.parse([...yearOneData, ...yearTwoData]);

function yearKeyOf(
  year: string,
  season: string,
  week: string | undefined,
  day: string,
): string {
  return `${year}\u0001${season}\u0001${week ?? ""}\u0001${day}`;
}

function weekToSeasonWeek(slot: DolSlot): { season: string; week: string } {
  switch (slot.week.kind) {
    case "advent":
      return { season: "Advent", week: `Week of ${slot.week.week} Advent` };
    case "christmas-following":
      return { season: "Christmas", week: "Christmas Day and Following" };
    case "epiphany-following":
      return { season: "Epiphany", week: "The Epiphany and Following" };
    case "epiphany":
      return { season: "Epiphany", week: `Week of ${slot.week.week} Epiphany` };
    case "last-epiphany":
      return { season: "Epiphany", week: "Week of Last Epiphany" };
    case "lent":
      return slot.week.week === 0
        ? { season: "Lent", week: "Ash Wednesday and Following" }
        : { season: "Lent", week: `Week of ${slot.week.week} Lent` };
    case "holy-week":
      return { season: "Lent", week: "Holy Week" };
    case "easter-week":
      return { season: "Easter", week: "Easter Week" };
    case "easter":
      return { season: "Easter", week: `Week of ${slot.week.week} Easter` };
    case "pentecost":
      return { season: "Easter", week: "Pentecost" };
    case "after-pentecost":
      return {
        season: "The Season after Pentecost",
        week: `Proper ${slot.week.proper}`,
      };
  }
}

// the First and Second Sunday after Christmas share a season/week/day; their
// titles alone distinguish them, so the index key carries the ordinal.
function ordinalKey(entry: DolEntry): string {
  const title = entry.title ?? "";
  if (title.includes("First Sunday after Christmas")) return "\u0002first";
  if (title.includes("Second Sunday after Christmas")) return "\u0002second";
  return "";
}

function buildYearIndex(entries: DolEntry[]): Map<string, DolEntry> {
  const index = new Map<string, DolEntry>();
  for (const entry of entries) {
    const key =
      yearKeyOf(
        entry.year ?? "",
        entry.season ?? "",
        entry.week,
        entry.day ?? "",
      ) + ordinalKey(entry);
    if (index.has(key)) {
      throw new Error(`duplicate DOL entry for ${JSON.stringify(entry)}`);
    }
    index.set(key, entry);
  }
  return index;
}

function buildHolyDayIndex(): Map<string, DolEntry> {
  const byDate = new Map<string, DolEntry>();
  for (const entry of holyDaysData) {
    if (entry.day !== undefined) byDate.set(entry.day, entry);
  }
  const byName = new Map<string, DolEntry>();
  for (const h of HOLY_DAYS) {
    const dateKey = `${MONTHS[h.month - 1]} ${h.day}`;
    const entry = byDate.get(dateKey);
    if (entry) byName.set(h.name, entry);
  }
  return byName;
}

const yearIndex = buildYearIndex(yearEntries);
const holyDaysByName = buildHolyDayIndex();

function findEntry(
  year: 1 | 2,
  key: YearKey,
  prefer: string | undefined,
): DolEntry | undefined {
  const suffix =
    prefer === "First"
      ? "\u0002first"
      : prefer === "Second"
        ? "\u0002second"
        : "";
  return yearIndex.get(
    yearKeyOf(
      `Year ${year === 1 ? "One" : "Two"}`,
      key.season,
      key.week,
      key.day,
    ) + suffix,
  );
}

// the entry for a resolved day slot. special days of the year tables (the
// First/Second Sunday after Christmas, the dated feast days) take precedence
// over a fixed-date holy day that happens to share the date; holy days win
// over the ordinary weekday reading.
export function entryForDay(slot: DolSlot): DolEntry | undefined {
  if (slot.day.kind === "special") {
    if (HOLY_DAY_SPECIALS.has(slot.day.name)) {
      return holyDaysByName.get(slot.day.name);
    }
    const key = SPECIAL_DAY_KEYS[slot.day.name];
    if (!key) return undefined;
    const prefer =
      slot.day.name === "first-sunday-after-christmas"
        ? "First"
        : slot.day.name === "second-sunday-after-christmas"
          ? "Second"
          : undefined;
    return findEntry(slot.year, key, prefer);
  }
  if (slot.holyDay) {
    const holy = holyDaysByName.get(slot.holyDay);
    if (holy) return holy;
  }
  const { season, week } = weekToSeasonWeek(slot);
  return findEntry(
    slot.year,
    { season, week, day: WEEKDAYS[slot.day.weekday] },
    undefined,
  );
}

// the evening of a day may belong to a special eve reading (Christmas Eve,
// Eve of the Epiphany, ...); otherwise Evening Prayer composes the next day.
export function entryForEvening(slot: DolSlot): DolEntry | undefined {
  const name = slot.evening?.kind === "special" ? slot.evening.name : undefined;
  if (!name) return undefined;
  const key = EVENING_DAY_KEYS[name];
  if (!key) return undefined;
  return findEntry(slot.year, key, undefined);
}

export function entryForDate(date: CalendarDate): DolEntry | undefined {
  return entryForDay(resolve(date));
}

// verify every psalm citation and lesson reference parses; any problem is a
// data bug that should fail loudly at startup, not silently in the UI.
export function validateLectionary(): string[] {
  const problems: string[] = [];
  const inspect = (
    raw: DolEntry | (typeof specialOccasionsData)[number],
    source: string,
    day: string,
  ) => {
    const entry = raw as DolEntry;
    for (const group of [
      entry.psalms.morning ?? [],
      entry.psalms.evening ?? [],
    ]) {
      for (const citation of group) {
        if (!parsePsalmCitation(citation)) {
          problems.push(`${source} psalm '${citation}' (${day})`);
        }
      }
    }
    for (const group of [
      entry.lessons,
      entry.lessons.morning,
      entry.lessons.evening,
    ]) {
      if (!group) continue;
      for (const field of [
        "first",
        "second",
        "third",
        "gospel",
        "altFirst",
        "altSecond",
        "altGospel",
      ] as const) {
        const value = group[field];
        if (typeof value !== "string") continue;
        const result = parseLessonRef(value);
        if (!result.ok) {
          problems.push(
            `${source} lesson '${value}' (${day}): ${result.error}`,
          );
        }
      }
    }
  };
  for (const entry of yearEntries) inspect(entry, "year", entry.day);
  for (const entry of holyDaysData) inspect(entry, "holy-day", entry.day);
  for (const entry of specialOccasionsData) {
    inspect(entry, "occasion", entry.title);
  }
  return problems;
}

export {
  dolYearSchema,
  holyDaysData,
  specialOccasionsData,
  yearOneData,
  yearTwoData,
};
