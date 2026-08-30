import type { DolEntry, DolLessonGroup } from "../content/types";
import holyDayData from "../content/vendor/dol/dol-holy-days.min.json";
import type { CalendarDate } from "./types";

// the sanctorale: the fixed-date holy days the DOL assigns readings for.
// 29 real holy days (each joining the vendored dol-holy-days table to a
// slug) plus 7 "Eve of ..." entries that anticipate the following feast and
// carry only evening content. Everything else in the daily office comes
// from the moveable temporal tables (feasts.ts + the two year tables).
export type SanctoraleSlug = {
  month: number;
  day: number;
  slug: string;
  /** for eve entries: the slug of the feast the eve anticipates. */
  eveOf?: string;
};

export const SANCTORALE_SLUGS: SanctoraleSlug[] = [
  { month: 1, day: 18, slug: "confession-of-st-peter" },
  { month: 1, day: 25, slug: "conversion-of-st-paul" },
  { month: 2, day: 1, slug: "eve-of-presentation", eveOf: "presentation" },
  { month: 2, day: 2, slug: "presentation" },
  { month: 2, day: 24, slug: "st-matthias" },
  { month: 3, day: 19, slug: "st-joseph" },
  { month: 3, day: 24, slug: "eve-of-annunciation", eveOf: "annunciation" },
  { month: 3, day: 25, slug: "annunciation" },
  { month: 4, day: 25, slug: "st-mark" },
  { month: 5, day: 1, slug: "philip-and-james" },
  { month: 5, day: 30, slug: "eve-of-visitation", eveOf: "visitation" },
  { month: 5, day: 31, slug: "visitation" },
  { month: 6, day: 11, slug: "st-barnabas" },
  {
    month: 6,
    day: 23,
    slug: "eve-of-st-john-the-baptist",
    eveOf: "nativity-of-st-john-the-baptist",
  },
  { month: 6, day: 24, slug: "nativity-of-st-john-the-baptist" },
  { month: 6, day: 29, slug: "peter-and-paul" },
  { month: 7, day: 22, slug: "st-mary-magdalene" },
  { month: 7, day: 25, slug: "st-james" },
  {
    month: 8,
    day: 5,
    slug: "eve-of-transfiguration",
    eveOf: "transfiguration",
  },
  { month: 8, day: 6, slug: "transfiguration" },
  { month: 8, day: 15, slug: "st-mary-the-virgin" },
  { month: 8, day: 24, slug: "st-bartholomew" },
  { month: 9, day: 13, slug: "eve-of-holy-cross", eveOf: "holy-cross" },
  { month: 9, day: 14, slug: "holy-cross" },
  { month: 9, day: 21, slug: "st-matthew" },
  { month: 9, day: 29, slug: "st-michael-and-all-angels" },
  { month: 10, day: 18, slug: "st-luke" },
  { month: 10, day: 23, slug: "st-james-of-jerusalem" },
  { month: 10, day: 28, slug: "simon-and-jude" },
  { month: 10, day: 31, slug: "eve-of-all-saints", eveOf: "all-saints" },
  { month: 11, day: 1, slug: "all-saints" },
  { month: 11, day: 30, slug: "st-andrew" },
  { month: 12, day: 21, slug: "st-thomas" },
  { month: 12, day: 26, slug: "st-stephen" },
  { month: 12, day: 27, slug: "st-john" },
  { month: 12, day: 28, slug: "holy-innocents" },
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

/** the fully-resolved sanctorale entry for a date or slug. */
export type SanctoraleEntry = {
  slug: string;
  title: string;
  month: number;
  day: number;
  /** set on eve entries: the feast slug the eve anticipates. */
  eveOf?: string;
  psalms: {
    morning?: string[];
    evening?: string[];
  };
  lessons: {
    morning?: DolLessonGroup;
    evening?: DolLessonGroup;
  };
};

function parseDay(day: string): { month: number; day: number } | null {
  const m = day.match(/^([A-Za-z]{3})\s+(\d{1,2})$/);
  if (!m) return null;
  const month = MONTHS.indexOf(m[1]);
  if (month === -1) return null;
  const d = parseInt(m[2], 10);
  if (!Number.isInteger(d) || d < 1 || d > 31) return null;
  return { month: month + 1, day: d };
}

const dayLabel = (entry: { month: number; day: number }): string =>
  `${MONTHS[entry.month - 1]} ${entry.day}`;

function buildEntries(): SanctoraleEntry[] {
  const byDate = new Map<string, DolEntry>();
  for (const item of holyDayData) {
    const decay = parseDay(item.day);
    if (!decay) {
      throw new Error(`sanctorale: unparseable day '${item.day}'`);
    }
    const key = dayLabel(decay);
    if (byDate.has(key)) {
      throw new Error(`sanctorale: duplicate date ${key}`);
    }
    byDate.set(key, item);
  }

  const entries: SanctoraleEntry[] = [];
  for (const spec of SANCTORALE_SLUGS) {
    const raw = byDate.get(dayLabel(spec));
    if (!raw || raw.title === undefined) {
      throw new Error(`sanctorale: no vendored entry for ${spec.slug}`);
    }
    entries.push({
      slug: spec.slug,
      title: raw.title,
      month: spec.month,
      day: spec.day,
      eveOf: spec.eveOf,
      psalms: {
        morning: raw.psalms.morning,
        evening: raw.psalms.evening,
      },
      lessons: {
        morning: raw.lessons.morning,
        evening: raw.lessons.evening,
      },
    });
  }
  entries.sort((a, b) => a.month - b.month || a.day - b.day);
  return entries;
}

export const SANCTORALE_ENTRIES: SanctoraleEntry[] = buildEntries();

const bySlug = new Map<string, SanctoraleEntry>();
const byDate = new Map<string, SanctoraleEntry>();
const evesByDate = new Map<string, SanctoraleEntry>();
for (const entry of SANCTORALE_ENTRIES) {
  bySlug.set(entry.slug, entry);
  if (entry.eveOf) {
    evesByDate.set(dayLabel(entry), entry);
  } else {
    byDate.set(dayLabel(entry), entry);
  }
}

/** the full-day sanctorale entry (feast or holy day) for a date, if any. */
export function sanctoraleForDate(
  date: CalendarDate,
): SanctoraleEntry | undefined {
  return byDate.get(`${MONTHS[date.month - 1]} ${date.day}`);
}

/** the eve entry whose date anticipates a feast the next day, if any. */
export function eveForDate(date: CalendarDate): SanctoraleEntry | undefined {
  return evesByDate.get(`${MONTHS[date.month - 1]} ${date.day}`);
}

export function sanctoraleBySlug(slug: string): SanctoraleEntry | undefined {
  return bySlug.get(slug);
}

/** the proper title for a sanctorale slug (the StatusBar's display name). */
export function sanctoraleTitle(slug: string): string | undefined {
  return bySlug.get(slug)?.title;
}

const MONTH_NAMES = [
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

export function monthDayLabel(month: number, day: number): string {
  return `${MONTH_NAMES[month - 1] ?? month} ${day}`;
}

// the short "Nov 1" form for the saints index, where names win the space
export function monthDayShortLabel(month: number, day: number): string {
  return `${MONTHS[month - 1] ?? month} ${day}`;
}

export function sanctoraleDateLabel(entry: SanctoraleEntry): string {
  return monthDayLabel(entry.month, entry.day);
}

// ---------------------------------------------------------------------------
// Mention dictionary
// ---------------------------------------------------------------------------

// name variants for a sanctorale entry: the full title plus progressively
// shorter, exact "Saint X" forms so prose like "called your servant Saint
// Paul" can be linked without fuzzy surname matching. First-name-only
// forms never appear (the collect bodies that name saints by first name
// alone are deliberately out of scope). primary variants are the entry's
// own name (leading title, the part before any comma, the first "Saint X"
// chunk); secondary halves ("and Saint Paul" in the joint Peter-and-Paul
// feast) only fill key slots not already claimed by a feast's own name.
function cleanChunk(chunk: string): string {
  return chunk.replace(/\s+the\s+[A-Z][a-z]+$/i, "").trim();
}

function nameVariants(entry: SanctoraleEntry): {
  primary: string[];
  secondary: string[];
} {
  const primary: string[] = [];
  const secondary: string[] = [];
  const seen = new Set<string>();
  const add = (s: string, set: string[]) => {
    const t = s.trim().replace(/\s+/g, " ");
    if (!t || seen.has(t)) return;
    seen.add(t);
    set.push(t);
  };
  add(entry.title, primary);
  add(entry.title.replace(/^The\s+/, ""), primary);
  const beforeComma = entry.title.split(",")[0].trim();
  if (beforeComma !== entry.title) add(beforeComma, primary);

  const saintRe =
    /Saint\s+[A-Z][A-Za-z'\u2019.-]*(?:\s+[A-Z][A-Za-z'\u2019.-]*)*/g;
  const chunks = entry.title.match(saintRe) ?? [];
  for (let i = 0; i < chunks.length; i++) {
    const set = i === 0 ? primary : secondary;
    add(chunks[i], set);
    const base = cleanChunk(chunks[i]);
    if (base !== chunks[i]) add(base, set);
  }
  return { primary, secondary };
}

export function sanctoraleNameVariants(entry: SanctoraleEntry): string[] {
  const { primary, secondary } = nameVariants(entry);
  return [...primary, ...secondary];
}

type MentionIndex = Map<string, SanctoraleEntry>;

// surfaces in longest-first order; collisions favor a feast's own name over
// another entry's incidental half, then the earlier date.
function buildMentionIndex(): { index: MentionIndex; surfaces: string[] } {
  const index = new Map<string, SanctoraleEntry>();
  const insert = (variant: string, entry: SanctoraleEntry) => {
    if (!index.has(variant)) index.set(variant, entry);
  };
  for (const entry of SANCTORALE_ENTRIES) {
    for (const variant of nameVariants(entry).primary) {
      insert(variant, entry);
    }
  }
  for (const entry of SANCTORALE_ENTRIES) {
    for (const variant of nameVariants(entry).secondary) {
      insert(variant, entry);
    }
  }
  const surfaces = Array.from(index.keys()).sort((a, b) => b.length - a.length);
  return { index, surfaces };
}

const { index: mentionIndex, surfaces: mentionSurfaces } = buildMentionIndex();

export type MentionRun = {
  text: string;
  entry?: SanctoraleEntry;
};

// split a text run into plain segments and exact-case saint mentions,
// longest surface first so "Saint James of Jerusalem" never fragments into
// "Saint James" + " of Jerusalem".
export function tokenizeSanctoraleMentions(text: string): MentionRun[] {
  const runs: MentionRun[] = [];
  let plain = "";
  const flush = () => {
    if (plain) {
      runs.push({ text: plain });
      plain = "";
    }
  };
  let pos = 0;
  while (pos < text.length) {
    const surface = matchSurfaceAt(text, pos);
    if (surface === undefined) {
      plain += text[pos];
      pos += 1;
      continue;
    }
    flush();
    const entry = mentionIndex.get(surface);
    runs.push({ text: surface, entry });
    pos += surface.length;
  }
  flush();
  return runs;
}

function matchSurfaceAt(text: string, pos: number): string | undefined {
  if (pos > 0 && /[A-Za-z]/.test(text[pos - 1])) return undefined; // mid-word
  for (const surface of mentionSurfaces) {
    const end = pos + surface.length;
    if (end > text.length) continue;
    if (text.slice(pos, end) !== surface) continue;
    const next = text[end];
    if (next !== undefined && /[A-Za-z]/.test(next)) continue; // longer word
    return surface;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validateSanctorale(): string[] {
  const problems: string[] = [];
  const slugs = new Set<string>();
  const dates = new Set<string>();
  for (const entry of SANCTORALE_ENTRIES) {
    if (slugs.has(entry.slug)) {
      problems.push(`duplicate slug ${entry.slug}`);
    }
    slugs.add(entry.slug);
    const key = dayLabel(entry);
    if (dates.has(key)) {
      problems.push(`duplicate date ${key}`);
    }
    dates.add(key);
    if (entry.eveOf) {
      const feast = bySlug.get(entry.eveOf);
      if (!feast) {
        problems.push(
          `${entry.slug}: eveOf '${entry.eveOf}' does not resolve to an entry`,
        );
      } else {
        const afterEve = nextCalendarDay(entry);
        if (feast.month !== afterEve.month || feast.day !== afterEve.day) {
          problems.push(
            `${entry.slug}: eve must anticipate the feast on the next day (got ${dayLabel(feast)})`,
          );
        }
      }
    }
  }
  return problems;
}

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function nextCalendarDay(entry: { month: number; day: number }): {
  month: number;
  day: number;
} {
  if (entry.day < DAYS_IN_MONTH[entry.month - 1]) {
    return { month: entry.month, day: entry.day + 1 };
  }
  return { month: entry.month + 1, day: 1 };
}
