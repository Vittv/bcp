import lesserFeastData from "../content/vendor/lff/calendar.min.json";
import type { CalendarDate } from "./types";

// the fixed-date commemorations of Lesser Feasts and Fasts 2024 that the
// Prayer Book calendar does not already carry. the book's biographies and
// propers are copyrighted, so this table holds the calendar only: date, name
// and the trial-use marker.
export type LesserFeast = {
  slug: string;
  name: string;
  month: number;
  day: number;
  /** authorized for trial use in the 2024 edition. */
  trial?: boolean;
};

type LesserFeastRow = {
  month: number;
  day: number;
  slug: string;
  name: string;
  trial?: boolean;
};

function buildFeasts(): LesserFeast[] {
  // SAFETY: the rows are validated field by field below before any entry is
  // built; the assertion only narrows the JSON import's literal shape.
  const rows = lesserFeastData as LesserFeastRow[];
  const feasts: LesserFeast[] = [];
  const slugs = new Set<string>();
  for (const row of rows) {
    const { month, day, slug, name } = row;
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new Error(`lesser feasts: bad month in ${slug}`);
    }
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      throw new Error(`lesser feasts: bad day in ${slug}`);
    }
    if (!name.trim()) {
      throw new Error(`lesser feasts: empty name for ${slug}`);
    }
    if (slugs.has(slug)) {
      throw new Error(`lesser feasts: duplicate slug ${slug}`);
    }
    slugs.add(slug);
    feasts.push({ slug, name, month, day, trial: row.trial });
  }
  return feasts.sort(
    (a, b) =>
      a.month - b.month || a.day - b.day || a.slug.localeCompare(b.slug),
  );
}

export const LESSER_FEASTS: LesserFeast[] = buildFeasts();

/** the official 2024 PDF, linked from every detail page. */
export const LESSER_FEASTS_URL =
  "https://www.episcopalchurch.org/resources/lesser-feasts-and-fasts-english/";

const byDate = new Map<string, LesserFeast[]>();
const bySlug = new Map<string, LesserFeast>();
for (const feast of LESSER_FEASTS) {
  const key = `${feast.month}-${feast.day}`;
  const list = byDate.get(key);
  if (list) list.push(feast);
  else byDate.set(key, [feast]);
  bySlug.set(feast.slug, feast);
}

/** every lesser feast on a date, in the table's order. */
export function lesserFeastsForDate(date: CalendarDate): LesserFeast[] {
  return byDate.get(`${date.month}-${date.day}`) ?? [];
}

export function lesserFeastBySlug(slug: string): LesserFeast | undefined {
  return bySlug.get(slug);
}

/** the first lesser feast on a date, else the first entry in date order. */
export function firstLesserFeastForDate(date: CalendarDate): LesserFeast {
  return lesserFeastsForDate(date)[0] ?? LESSER_FEASTS[0];
}

/** the next lesser feast at or after `date`, wrapping to the start. */
export function upcomingLesserFeast(date: CalendarDate): LesserFeast {
  for (const feast of LESSER_FEASTS) {
    if (
      feast.month > date.month ||
      (feast.month === date.month && feast.day >= date.day)
    ) {
      return feast;
    }
  }
  return LESSER_FEASTS[0];
}
