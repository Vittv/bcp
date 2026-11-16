/**
 * 1662 BCP lectionary/psalm-appointment vendor data (best-effort, pending PD
 * image-level verification). See README.md / PROVENANCE.md in this directory.
 *
 * This is a small data-access/compose slice for exercising the vendored tables,
 * not a full 1662 calendar or Daily Office resolver.
 */
import dailyData from "./lectionary-daily.json";
import properData from "./lectionary-proper.json";
import properPsalmsData from "./proper-psalms.json";
import rulesData from "./lectionary-rules.json";

export type Bcp1662Office = "morning" | "evening";

export type Bcp1662LessonPair = {
  first: string | null;
  second: string | null;
};

export type Bcp1662DailyEntry = {
  morning: Bcp1662LessonPair;
  evening: Bcp1662LessonPair;
  feast?: string;
};

export type Bcp1662DailyMonth =
  | "january"
  | "february"
  | "march"
  | "april"
  | "may"
  | "june"
  | "july"
  | "august"
  | "september"
  | "october"
  | "november"
  | "december";

export type Bcp1662ProperPsalmDay = {
  name: string;
  mattins: number[];
  evensong: number[];
};

export type Bcp1662Rule = {
  id: string;
  summary: string;
};

export const BCP1662_DAILY =
  // SAFETY: vendored static JSON table matching the declared 1662 data shape; validated by scripts/check-bcp1662-vendor.ts and documented in PROVENANCE.md.
  dailyData as {
    meta: { edition: string; title: string; compiled: string };
    months: Record<Bcp1662DailyMonth, Record<string, Bcp1662DailyEntry>>;
  };

export const BCP1662_PROPER_LESSONS =
  // SAFETY: vendored static JSON table matching the declared proper-lessons shape; validated by scripts/check-bcp1662-vendor.ts.
  properData as {
    meta: { edition: string; title: string; compiled: string };
    sundays: Array<{
      season: string;
      entries: Array<{
        name: string;
        mattins: string | Bcp1662LessonPair;
        evensong: string | Bcp1662LessonPair;
        notes?: string[];
      }>;
      notes?: string[];
    }>;
    holyDays: Array<{
      name: string;
      mattins: string | Bcp1662LessonPair;
      evensong: string | Bcp1662LessonPair;
      notes?: string[];
    }>;
  };

export const BCP1662_PROPER_PSALMS =
  // SAFETY: vendored static JSON table matching the declared proper-psalms shape; validated by scripts/check-bcp1662-vendor.ts.
  properPsalmsData as {
    meta: { edition: string; title: string; compiled: string };
    days: Bcp1662ProperPsalmDay[];
  };

export const BCP1662_RULES =
  // SAFETY: vendored static JSON table matching the declared rules shape; validated by scripts/check-bcp1662-vendor.ts.
  rulesData as {
    meta: { edition: string; title: string; compiled: string };
    rules: Bcp1662Rule[];
  };

/** Look up the daily-calendar lessons for a civil month/day (1-based day). */
export function getBcp1662DailyLessons(
  month: Bcp1662DailyMonth,
  day: number,
): Bcp1662DailyEntry | undefined {
  return BCP1662_DAILY.months[month]?.[String(day)];
}

/** True if the daily entry has no appointed lessons in either office (typically a proper/holy-day slot). */
export function isBcp1662DailyAllNull(entry: Bcp1662DailyEntry): boolean {
  const { morning: m, evening: e } = entry;
  return !m.first && !m.second && !e.first && !e.second;
}

/** Find proper psalms by exact appointed-day name (e.g. "Christmas Day"). */
export function getBcp1662ProperPsalms(
  name: string,
): Bcp1662ProperPsalmDay | undefined {
  return BCP1662_PROPER_PSALMS.days.find((d) => d.name === name);
}

/** Find a holy-day proper-lessons entry by exact name. */
export function getBcp1662HolyDayProperLessons(name: string) {
  return BCP1662_PROPER_LESSONS.holyDays.find((d) => d.name === name);
}

/** Compose a simple daily-office view for a month/day from the daily calendar table only. */
export function composeBcp1662DailyOffice(
  month: Bcp1662DailyMonth,
  day: number,
  office: Bcp1662Office,
): { lessons: Bcp1662LessonPair; feast?: string; note?: string } | undefined {
  const entry = getBcp1662DailyLessons(month, day);
  if (!entry) return undefined;
  const lessons = entry[office];
  const allNull = isBcp1662DailyAllNull(entry);
  return {
    lessons,
    feast: entry.feast,
    note: allNull
      ? "No daily-calendar lessons appointed (proper/holy-day lessons may apply)."
      : undefined,
  };
}
