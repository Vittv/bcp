#!/usr/bin/env bun
/**
 * Verify the app's Daily Office lectionary against the comparison tables
 * fetched at run time: Forward Movement's readings table, and Venite's
 * readings and psalms tables. The two readings tables carry the same rows -
 * the summary counts how many differ - so neither is a second opinion on the
 * other.
 *
 * Usage: bun scripts/verify-lectionary.ts [year ...] [--verbose]
 *
 * Each `year` names a church year (Advent 1 to the Saturday before the next
 * Advent 1). Defaults to the current civil year and the one after.
 *
 * The comparison is deliberately loose in one direction only. The app's data
 * is a superset of the reference tables in several known ways:
 *   - bracketed ``[psalms]`` and ``X or Y`` alternatives that the reference
 *     psalm table lists only once;
 *   - the invitatory Psalm 95 on the Lenten weekdays where the print marks it
 *     ``95*`` (the reference psalm table leaves it out);
 *   - alternative lessons (``altFirst`` etc.) that the print offers with
 *     ``or`` and the reference readings table drops.
 * A reference set that is a strict subset of ours therefore counts as a table
 * gap, not a failure, and is reported separately.
 *
 * A handful of reference rows are themselves wrong (verified line by line
 * against the printed BCP); those are listed in KNOWN_DIFFS with the printed
 * reading and do not fail the run. Anything outside those categories is an
 * unexplained difference and exits non-zero.
 */

import { z } from "zod";
import { civilFromDays, daysFromCivil } from "../src/lib/calendar/date";
import { resolve } from "../src/lib/calendar/dol";
import type { DolSlot } from "../src/lib/calendar/types";
import { entryForDay, entryForEvening } from "../src/lib/content/lectionary";
import { parsePsalmCitation } from "../src/lib/content/psalms";
import type { DolEntry, DolLessonGroup } from "../src/lib/content/types";

const READINGS_URL =
  "https://prayer.forwardmovement.org/data/lectionary/bcp1979_daily_office.json";
const VENITE_READINGS_URL =
  "https://venite.app/offline/lectionary/bcp1979_daily_office.json";
const VENITE_PSALMS_URL =
  "https://venite.app/offline/lectionary/bcp1979_daily_psalms.json";

const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const ORD = ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
const ADVENT_ORD = ["first", "second", "third", "fourth"];

// day names in our resolver that key straight into the reference tables
const SPECIAL_KEYS: Record<string, string> = {
  "dec-24": "december-24",
  "christmas-day": "christmas-day",
  "first-sunday-after-christmas": "sunday-1st-sunday-after-christmas",
  "second-sunday-after-christmas": "sunday-2nd-sunday-after-christmas",
  "holy-name": "holy-name",
  "dec-29": "december-29",
  "dec-30": "december-30",
  "dec-31": "december-31",
  "jan-2": "january-2",
  "jan-3": "january-3",
  "jan-4": "january-4",
  "jan-5": "january-5",
  epiphany: "epiphany",
  "jan-7": "january-7",
  "jan-8": "january-8",
  "jan-9": "january-9",
  "jan-10": "january-10",
  "jan-11": "january-11",
  "jan-12": "january-12",
  "st-stephen": "st-stephen",
  "st-john": "st-john",
  "holy-innocents": "holy-innocents",
  "palm-sunday": "sunday-holy-week",
  "maundy-thursday": "thursday-holy-week",
  "good-friday": "friday-holy-week",
  "holy-saturday": "saturday-holy-week",
  "easter-day": "sunday-easter",
  ascension: "thursday-6th-easter",
  "eve-of-pentecost": "eve-of-pentecost",
  pentecost: "sunday-pentecost",
  "eve-of-trinity": "eve-trinity-sunday",
  trinity: "sunday-trinity-sunday",
};

// our sanctorale slugs that the reference tables spell differently
const HOLY_SLUG_ALIASES: Record<string, string> = {
  "philip-and-james": "ss-philip-and-james",
  "peter-and-paul": "ss-peter-and-paul",
  "simon-and-jude": "ss-simon-and-jude",
  "st-michael-and-all-angels": "st-michael",
  presentation: "the-presentation",
  transfiguration: "the-transfiguration",
  visitation: "the-visitation",
  "all-saints": "all-saints-day",
};

// eve slugs (our evening entries) that the reference tables spell differently
const EVE_SLUG_ALIASES: Record<string, string> = {
  "eve-of-presentation": "eve-of-the-presentation",
  "eve-of-annunciation": "eve-of-the-annunciation",
  "eve-of-visitation": "eve-of-the-visitation",
  "eve-of-transfiguration": "eve-of-the-transfiguration",
  "eve-of-epiphany": "eve-epiphany",
  "eve-of-1-epiphany": "eve-1st-epiphany",
  "eve-of-ascension": "eve-wednesday-6th-easter",
};

// ---------------------------------------------------------------------------
// citation canonicalization
//
// Both sides are reduced to "<book>:<verses>" with the book mapped through
// BOOK_CANON (so "Ecclus.", "Sir" and "Sirach" agree), dashes unified to "-",
// brackets turned into parentheses, and all whitespace dropped. That makes
// "1 Cor. 6:3-13 (14--7:1)" equal to "1 Cor 6:3–13(14–7:1)".
// ---------------------------------------------------------------------------

const BOOK_CANON: Record<string, string> = {
  genesis: "gen",
  gen: "gen",
  exodus: "exod",
  exod: "exod",
  leviticus: "lev",
  lev: "lev",
  numbers: "num",
  num: "num",
  deuteronomy: "deut",
  deut: "deut",
  joshua: "josh",
  josh: "josh",
  judges: "judg",
  judg: "judg",
  ruth: "ruth",
  ru: "ruth",
  "1samuel": "1sam",
  "1sam": "1sam",
  "2samuel": "2sam",
  "2sam": "2sam",
  "1kings": "1kgs",
  "1kgs": "1kgs",
  "1kg": "1kgs",
  "1ki": "1kgs",
  "1king": "1kgs",
  "2kings": "2kgs",
  "2kgs": "2kgs",
  "2kg": "2kgs",
  "2ki": "2kgs",
  "2king": "2kgs",
  "1chronicles": "1chr",
  "1chr": "1chr",
  "1ch": "1chr",
  "1chron": "1chr",
  "2chronicles": "2chr",
  "2chr": "2chr",
  "2ch": "2chr",
  "2chron": "2chr",
  ezra: "ezra",
  ezr: "ezra",
  nehemiah: "neh",
  neh: "neh",
  esther: "esth",
  esth: "esth",
  job: "job",
  psalm: "ps",
  psalms: "ps",
  ps: "ps",
  proverbs: "prov",
  prov: "prov",
  ecclesiastes: "eccl",
  eccl: "eccl",
  qoheleth: "eccl",
  songofsolomon: "song",
  songofsongs: "song",
  canticles: "song",
  canticle: "song",
  cant: "song",
  song: "song",
  isaiah: "isa",
  isa: "isa",
  jeremiah: "jer",
  jer: "jer",
  lamentations: "lam",
  lam: "lam",
  ezekiel: "ezek",
  ezek: "ezek",
  daniel: "dan",
  dan: "dan",
  hosea: "hos",
  hos: "hos",
  joel: "joel",
  amos: "amos",
  obadiah: "obad",
  obad: "obad",
  jonah: "jonah",
  jon: "jonah",
  micah: "mic",
  mic: "mic",
  nahum: "nah",
  nah: "nah",
  habakkuk: "hab",
  hab: "hab",
  zephaniah: "zeph",
  zeph: "zeph",
  zep: "zeph",
  haggai: "hag",
  hag: "hag",
  zechariah: "zech",
  zech: "zech",
  malachi: "mal",
  mal: "mal",
  judith: "jdt",
  jdt: "jdt",
  tobit: "tob",
  tob: "tob",
  "1maccabees": "1macc",
  "1macc": "1macc",
  "1mac": "1macc",
  "2maccabees": "2macc",
  "2macc": "2macc",
  "2mac": "2macc",
  "1esdras": "1esd",
  "1esd": "1esd",
  "2esdras": "2esd",
  "2esd": "2esd",
  baruch: "bar",
  bar: "bar",
  sirach: "sir",
  sir: "sir",
  ecclesiasticus: "sir",
  ecclus: "sir",
  wisdom: "wis",
  wisd: "wis",
  wis: "wis",
  wisdomofsolomon: "wis",
  matthew: "matt",
  matt: "matt",
  mat: "matt",
  mt: "matt",
  mark: "mark",
  mk: "mark",
  luke: "luke",
  lk: "luke",
  john: "john",
  jn: "john",
  acts: "acts",
  act: "acts",
  romans: "rom",
  rom: "rom",
  "1corinthians": "1cor",
  "1cor": "1cor",
  "2corinthians": "2cor",
  "2cor": "2cor",
  galatians: "gal",
  gal: "gal",
  ephesians: "eph",
  eph: "eph",
  ephes: "eph",
  philippians: "phil",
  phil: "phil",
  php: "phil",
  colossians: "col",
  col: "col",
  "1thessalonians": "1thess",
  "1thess": "1thess",
  "1thes": "1thess",
  "2thessalonians": "2thess",
  "2thess": "2thess",
  "2thes": "2thess",
  "1timothy": "1tim",
  "1tim": "1tim",
  "1ti": "1tim",
  "2timothy": "2tim",
  "2tim": "2tim",
  "2ti": "2tim",
  titus: "tit",
  tit: "tit",
  philemon: "phlm",
  phlm: "phlm",
  philem: "phlm",
  hebrews: "heb",
  heb: "heb",
  james: "jas",
  jas: "jas",
  "1peter": "1pet",
  "1pet": "1pet",
  "2peter": "2pet",
  "2pet": "2pet",
  "1john": "1john",
  "1jn": "1john",
  "2john": "2john",
  "2jn": "2john",
  "3john": "3john",
  "3jn": "3john",
  jude: "jude",
  revelation: "rev",
  rev: "rev",
  apocalypse: "rev",
  apoc: "rev",
};

const DASHES = /[\u2012\u2013\u2014\u2212]/g;

// The tables group several ranges of one book into a single citation
// ("Job 12:1,14:1-22" or "Gal 3:23-29; 4:4-7") where our data keeps them as
// separate references. Split every citation into its individual ranges so the
// two sides agree regardless of grouping.
function splitRanges(verseText: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of verseText) {
    if (ch === "(" || ch === "[") depth += 1;
    else if (ch === ")" || ch === "]") depth = Math.max(0, depth - 1);
    if ((ch === "," || ch === ";") && depth === 0) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim()).filter(Boolean);
}

function normalizeRange(range: string): string {
  return range
    .toLowerCase()
    .replace(/\[/g, "(")
    .replace(/\]/g, ")")
    .replace(DASHES, "-")
    .replace(/-{2,}/g, "-")
    .replace(/\./g, "")
    .replace(/\s+/g, "");
}

// a citation becomes the set of "<canonical book> <range>" ranges it names
function normalizeCitation(citation: string): string[] {
  const t = citation.trim().replace(DASHES, "-").replace(/\s+/g, " ");
  const m = t.match(/^([1-3]?\s*[A-Za-z][^0-9]*?)\s*(\d.*)$/);
  if (!m) {
    const key = t.toLowerCase().replace(/[^a-z0-9]/g, "");
    return [BOOK_CANON[key] ?? key];
  }
  const bookKey = m[1].toLowerCase().replace(/[^a-z0-9]/g, "");
  const book = BOOK_CANON[bookKey] ?? bookKey;
  return splitRanges(m[2]).map((range) => `${book} ${normalizeRange(range)}`);
}

function setOf(refs: string[]): Set<string> {
  const out = new Set<string>();
  for (const ref of refs)
    for (const range of normalizeCitation(ref)) out.add(range);
  return out;
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

function isSubset(a: Set<string>, b: Set<string>): boolean {
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

function subtract(a: Set<string>, b: Set<string>): string[] {
  return [...a].filter((x) => !b.has(x));
}

// ---------------------------------------------------------------------------
// the app's side
// ---------------------------------------------------------------------------

type ReferenceRow = {
  day: string;
  when: string;
  type: string;
  citation: string;
};

function dayKey(slot: DolSlot): { key?: string; skip?: string } {
  // this mirrors entryForDay: a special day of the year tables (the First or
  // Second Sunday after Christmas, a dated feast) wins over a fixed-date holy
  // day on the same date; a holy day wins over the ordinary weekday reading.
  if (slot.day.kind === "special") {
    const key = SPECIAL_KEYS[slot.day.name];
    if (key) return { key };
    return { skip: `special '${slot.day.name}'` };
  }
  if (slot.holyDay) {
    return { key: HOLY_SLUG_ALIASES[slot.holyDay] ?? slot.holyDay };
  }
  const w = WEEKDAYS[slot.day.weekday];
  switch (slot.week.kind) {
    case "advent":
      return { key: `${w}-${ADVENT_ORD[slot.week.week - 1]}-advent` };
    case "epiphany":
      return { key: `${w}-${ORD[slot.week.week]}-epiphany` };
    case "last-epiphany":
      return { key: `${w}-last-epiphany` };
    case "lent":
      return slot.week.week === 0
        ? { skip: "ash wednesday and following" }
        : { key: `${w}-${ORD[slot.week.week]}-lent` };
    case "holy-week":
      return { key: `${w}-holy-week` };
    case "easter-week":
      return { key: `${w}-easter` };
    case "easter":
      return { key: `${w}-${ORD[slot.week.week]}-easter` };
    case "after-pentecost":
      return { key: `${w}-proper-${slot.week.proper}` };
    case "christmas-following":
    case "epiphany-following":
    case "pentecost":
      return { skip: `${slot.week.kind} weekday` };
  }
}

const LESSON_FIELDS = [
  "first",
  "second",
  "third",
  "gospel",
  "altFirst",
  "altSecond",
  "altGospel",
] as const satisfies readonly (keyof DolLessonGroup)[];

// every lesson the day appoints (alternatives included), in any group
function ourReadings(entry: DolEntry): string[] {
  const groups = [
    entry.lessons,
    entry.lessons.morning,
    entry.lessons.evening,
  ].filter((g): g is DolLessonGroup => !!g);
  const out = new Set<string>();
  for (const group of groups) {
    for (const field of LESSON_FIELDS) {
      const ref = group[field];
      if (ref) out.add(ref);
    }
  }
  return [...out];
}

// an evening entry's lessons (which the reference tables file under day rows)
function ourEveningReadings(entry: DolEntry): string[] {
  const group = entry.lessons.evening ?? entry.lessons;
  return LESSON_FIELDS.map((f) => group[f]).filter((r): r is string => !!r);
}

function psalmNumbers(
  entry: DolEntry,
  office: "morning" | "evening",
): number[] {
  return (entry.psalms[office] ?? [])
    .map((c) => parsePsalmCitation(c)?.psalm)
    .filter((n): n is number => n !== undefined);
}

// ---------------------------------------------------------------------------
// the reference side
// ---------------------------------------------------------------------------

const READING_TYPES = new Set([
  "first_reading",
  "second_reading",
  "third_reading",
  "gospel",
  "holy_day_morning_1",
  "holy_day_morning_2",
  "holy_day_evening_1",
  "holy_day_evening_2",
]);

function referenceReadings(
  rows: ReferenceRow[],
  key: string,
  when: string,
): string[] {
  return rows
    .filter(
      (r) => r.day === key && r.when === when && READING_TYPES.has(r.type),
    )
    .map((r) => r.citation);
}

function referenceEvening(
  rows: ReferenceRow[],
  key: string,
  when: string,
): string[] {
  const eve = rows.filter(
    (r) =>
      r.day === key &&
      r.when === when &&
      (r.type === "holy_day_evening_1" || r.type === "holy_day_evening_2"),
  );
  if (eve.length > 0) return eve.map((r) => r.citation);
  return rows
    .filter(
      (r) =>
        r.day === key &&
        r.when === when &&
        (r.type === "first_reading" || r.type === "second_reading"),
    )
    .map((r) => r.citation);
}

// ---------------------------------------------------------------------------
// differences the reference tables get wrong, verified against the printed BCP
// (bcponline.org/DOLectionary). `when` is "1", "2" or "*" for either year.
// ---------------------------------------------------------------------------

type KnownDiff = {
  key: string;
  when: string;
  field: "readings" | "eve" | "psalm-am" | "psalm-pm";
  why: string;
};

const KNOWN_DIFFS: KnownDiff[] = [
  // --- readings: the reference table drops or mangles a row ---
  {
    key: "tuesday-easter",
    when: "1",
    field: "readings",
    why: "reference table 'Acts 2:26-41[42-47]' is a typo; print: Acts 2:36-41(42-47)",
  },
  {
    key: "saturday-second-advent",
    when: "2",
    field: "readings",
    why: "reference table 'Haggai 2:1-19'; print: Haggai 2:1-9",
  },
  {
    key: "thursday-2nd-lent",
    when: "2",
    field: "readings",
    why: "reference table '1 Cor 6:12-30'; print: 1 Cor 6:12-20",
  },
  {
    key: "wednesday-holy-week",
    when: "2",
    field: "readings",
    why: "reference table adds '14-17' to Lam 2:1-9; print: Lam 2:1-9",
  },
  {
    key: "friday-holy-week",
    when: "*",
    field: "readings",
    why: "reference table omits John 13:36-38 (year one) / 1 Pet 1:10-20 (year two); print has the full set",
  },
  {
    key: "saturday-holy-week",
    when: "*",
    field: "readings",
    why: "reference table splits the rows and drops Heb 4:1-16 / Rom 8:1-11; print has Job/Lam + Heb + Rom",
  },
  {
    key: "sunday-easter",
    when: "1",
    field: "readings",
    why: "reference table files the evening lesson (Isa 51:9-11) as a second reading; print MP: Exod 12:1-14, John 1:1-18",
  },
  {
    key: "st-michael",
    when: "*",
    field: "readings",
    why: "reference table files the alternative evening lesson (Dan 12:1-3) as a morning reading; print MP: Job 38:1-7, Heb 1:1-14",
  },
  {
    key: "st-mark",
    when: "1",
    field: "readings",
    why: "reference table keeps only a stray evening row; print MP: Sir 2:1-11, Acts 12:25-13:3",
  },
  {
    key: "eve-trinity-sunday",
    when: "*",
    field: "readings",
    why: "an eve entry: our evening reading is the reference table's day row (Ecclus 42:15-25, Eph 3:14-21)",
  },
  {
    key: "friday-proper-13",
    when: "2",
    field: "readings",
    why: "reference table 'John 2:2-12'; print: John 2:1-12",
  },
  {
    key: "saturday-proper-25",
    when: "1",
    field: "readings",
    why: "reference table 'Matt 13:31-35'; print: Matt 13:31-55",
  },
  {
    key: "sunday-proper-13",
    when: "1",
    field: "readings",
    why: "reference table 'Rom 4:7-12'; print: Rom 14:7-12",
  },
  {
    key: "wednesday-proper-9",
    when: "1",
    field: "readings",
    why: "reference table 'Luke 24:12-35'; print: Luke 24:13-35",
  },
  {
    key: "january-2",
    when: "1",
    field: "readings",
    why: "reference table 'John 6:35-42,48-51'; print: John 6:35-41, 48-51",
  },
  {
    key: "january-9",
    when: "2",
    field: "readings",
    why: "reference table 'Col 1:24-2:7'; print: Col 1:21-2:7",
  },
  {
    key: "friday-proper-25",
    when: "2",
    field: "readings",
    why: "reference table adds 'Ecclus 34:1-8,21-27'; print: Ecclus 34:1-8, 18-22",
  },
  {
    key: "saturday-proper-25",
    when: "2",
    field: "readings",
    why: "reference table adds 'Ecclus 35:1-22a'; print: Ecclus 35:1-17",
  },
  // --- psalms: the reference psalm table drops or adds a number ---
  {
    key: "sunday-easter",
    when: "*",
    field: "psalm-pm",
    why: "print: '113, 114, or 118'; the alternative 118 is not bracketed in our table",
  },
  {
    key: "december-31",
    when: "*",
    field: "psalm-pm",
    why: "print: Dec 31 evening '----------' and Eve of Holy Name evening 90; the reference year-one row carries 48",
  },
  {
    key: "holy-cross",
    when: "*",
    field: "psalm-am",
    why: "print: Holy Cross Day MP 66; the reference table adds 67",
  },
  {
    key: "ss-simon-and-jude",
    when: "*",
    field: "psalm-am",
    why: "print: SS Simon & Jude MP 66; the reference table adds 67",
  },
];

const knownReason = (
  key: string,
  when: string,
  field: string,
): string | undefined =>
  KNOWN_DIFFS.find(
    (d) =>
      d.key === key && (d.when === when || d.when === "*") && d.field === field,
  )?.why;

// ---------------------------------------------------------------------------
// run
// ---------------------------------------------------------------------------

const DETAIL_LIMIT = 8;

type Note = { label: string; count: number; detail: string[] };

function note(list: Note[], label: string, detail: string) {
  let n = list.find((x) => x.label === label);
  if (!n) {
    n = { label, count: 0, detail: [] };
    list.push(n);
  }
  n.count += 1;
  n.detail.push(detail);
}

function datesInChurchYear(year: number): string[] {
  const out: string[] = [];
  let d = daysFromCivil(year - 1, 11, 20);
  const end = daysFromCivil(year, 12, 5);
  while (d <= end) {
    const c = civilFromDays(d);
    out.push(`${c.year}-${c.month}-${c.day}`);
    d += 1;
  }
  return out;
}

function parseDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { year: y, month: m, day: d };
}

// the reference tables are JSON arrays of { day, when, type, citation }
const referenceRowSchema = z.object({
  day: z.string(),
  when: z.coerce.string(),
  type: z.string(),
  citation: z.string(),
});

async function fetchTable(url: string): Promise<ReferenceRow[]> {
  const payload = await fetch(url).then((r) => r.json());
  const rows = z.array(z.unknown()).parse(payload);
  const out: ReferenceRow[] = [];
  for (const row of rows) {
    const parsed = referenceRowSchema.safeParse(row);
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes("--verbose");
  const years = args.map(Number).filter(Boolean);
  const targets = years.length > 0 ? years : [2026, 2027];

  const [fmRows, veniteRows, psalmRows] = await Promise.all([
    fetchTable(READINGS_URL),
    fetchTable(VENITE_READINGS_URL),
    fetchTable(VENITE_PSALMS_URL),
  ]);

  // the two readings tables should agree with each other, cell for cell
  const cell = (r: ReferenceRow) => `${r.day}|${r.when}|${r.type}`;
  const fmIndex = new Map(fmRows.map((r) => [cell(r), r.citation]));
  const veniteIndex = new Map(veniteRows.map((r) => [cell(r), r.citation]));
  let tableDrift = 0;
  for (const k of new Set([...fmIndex.keys(), ...veniteIndex.keys()])) {
    if (fmIndex.get(k) !== veniteIndex.get(k)) tableDrift += 1;
  }

  // reference psalm numbers by day/year/office (deduped: Psalm 119 is split
  // into its Hebrew-letter sections in the reference table)
  const psalmIndex = new Map<
    string,
    { morning: Set<number>; evening: Set<number> }
  >();
  for (const r of psalmRows) {
    const k = `${r.day}|${r.when}`;
    const cell = psalmIndex.get(k) ?? {
      morning: new Set(),
      evening: new Set(),
    };
    const m = r.citation.match(/^psalm_(\d+)/);
    if (m) {
      const n = Number(m[1]);
      if (r.type === "morning_psalms") cell.morning.add(n);
      if (r.type === "evening_psalms") cell.evening.add(n);
    }
    psalmIndex.set(k, cell);
  }

  const unexplained: string[] = [];
  const skips = new Map<string, number>();
  let checked = 0;
  let readingsChecked = 0;
  let psalmsChecked = 0;
  let eveChecked = 0;
  const tableGaps: Note[] = [];
  const knownHits: Note[] = [];

  for (const year of targets) {
    for (const iso of datesInChurchYear(year)) {
      const slot = resolve(parseDate(iso));
      const mapped = dayKey(slot);
      if (!mapped.key) {
        const reason = mapped.skip ?? "unmapped";
        skips.set(reason, (skips.get(reason) ?? 0) + 1);
        continue;
      }
      const key = mapped.key;
      const when = String(slot.year);
      const entry = entryForDay(slot);
      if (!entry) {
        unexplained.push(`${iso} no entry for ${key}`);
        continue;
      }
      checked += 1;

      // readings ------------------------------------------------------------
      const reference = referenceReadings(fmRows, key, when);
      if (reference.length === 0) {
        skips.set(
          `no reference readings for ${key}`,
          (skips.get(`no reference readings for ${key}`) ?? 0) + 1,
        );
      } else {
        readingsChecked += 1;
        const ours = setOf(ourReadings(entry));
        const theirs = setOf(reference);
        if (!setsEqual(ours, theirs)) {
          const reason = knownReason(key, when, "readings");
          if (reason) {
            note(knownHits, "readings", `${iso} ${key} y${when}: ${reason}`);
          } else if (isSubset(theirs, ours)) {
            const extras = subtract(ours, theirs);
            note(
              tableGaps,
              "readings",
              `${iso} ${key} y${when}: reference table omits ${extras.join(", ")}`,
            );
          } else {
            unexplained.push(
              `${iso} readings ${key} y${when}\n` +
                `      ours:     ${ourReadings(entry).join("; ")}\n` +
                `      reference: ${reference.join("; ")}`,
            );
          }
        }
      }

      // psalmody ------------------------------------------------------------
      const p = psalmIndex.get(`${key}|${when}`);
      if (p && (p.morning.size > 0 || p.evening.size > 0)) {
        psalmsChecked += 1;
        for (const office of ["morning", "evening"] as const) {
          const field = office === "morning" ? "psalm-am" : "psalm-pm";
          const referenceNums = p[office];
          if (referenceNums.size === 0) continue;
          const ours = new Set(psalmNumbers(entry, office));
          const oursRaw = entry.psalms[office] ?? [];
          const equal =
            ours.size === referenceNums.size &&
            [...referenceNums].every((n) => ours.has(n));
          if (equal) continue;
          const extras = [...ours].filter((n) => !referenceNums.has(n));
          const missing = [...referenceNums].filter((n) => !ours.has(n));
          const optional =
            oursRaw.some((c) => c.includes("[")) ||
            (extras.length > 0 &&
              extras.every((n) => n === 95) &&
              missing.length === 0);
          const reason = knownReason(key, when, field);
          const detail = `${iso} ${office} psalms ${key} y${when}: ours ${[...ours].sort((a, b) => a - b).join(", ")} | reference ${[...referenceNums].sort((a, b) => a - b).join(", ")}`;
          if (reason) note(knownHits, field, `${detail} — ${reason}`);
          else if (optional) note(tableGaps, field, detail);
          else unexplained.push(detail);
        }
      }

      // the evening of the day may belong to an eve reading -----------------
      const eveningEntry = entryForEvening(slot);
      if (eveningEntry) {
        const name = slot.evening?.kind === "special" ? slot.evening.name : "";
        const eveKey = EVE_SLUG_ALIASES[name] ?? name;
        const referenceEve = referenceEvening(fmRows, eveKey, when);
        if (referenceEve.length === 0) {
          skips.set(
            `no reference eve rows for ${eveKey}`,
            (skips.get(`no reference eve rows for ${eveKey}`) ?? 0) + 1,
          );
        } else {
          eveChecked += 1;
          const ours = setOf(ourEveningReadings(eveningEntry));
          const theirs = setOf(referenceEve);
          if (!setsEqual(ours, theirs)) {
            const reason = knownReason(eveKey, when, "eve");
            const detail = `${iso} eve ${eveKey} y${when}: ours ${ourEveningReadings(eveningEntry).join("; ")} | reference ${referenceEve.join("; ")}`;
            if (reason) note(knownHits, "eve", `${detail} — ${reason}`);
            else if (isSubset(theirs, ours)) note(tableGaps, "eve", detail);
            else unexplained.push(detail);
          }
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // report
  // -------------------------------------------------------------------------

  console.log(
    `readings tables: Forward Movement ${fmRows.length} rows, Venite ${veniteRows.length} rows, ${tableDrift} disagreeing cells`,
  );
  console.log(
    `checked ${checked} days (${readingsChecked} with reference readings, ${psalmsChecked} with reference psalms, ${eveChecked} with reference eve readings) across ${targets.join(", ")}`,
  );
  for (const [reason, count] of [...skips].sort((a, b) => b[1] - a[1])) {
    console.log(`  skipped ${count} (${reason})`);
  }

  const summarize = (list: Note[], heading: string) => {
    const total = list.reduce((n, g) => n + g.count, 0);
    console.log(`${heading}: ${total}`);
    for (const g of list) {
      const shown = verbose ? g.detail : g.detail.slice(0, DETAIL_LIMIT);
      console.log(`  ${g.label}: ${g.count}`);
      for (const d of shown) console.log(`    ${d}`);
      if (shown.length < g.count) {
        console.log(`    (${g.count - shown.length} more; pass --verbose)`);
      }
    }
  };
  summarize(
    tableGaps,
    "table gaps (the reference table is a strict subset of ours)",
  );
  summarize(knownHits, "known differences (reviewed against the printed BCP)");

  if (unexplained.length === 0) {
    console.log("unexplained differences: 0");
    console.log("all compared days match the reference tables");
    return;
  }
  console.log(`unexplained differences: ${unexplained.length}`);
  for (const m of unexplained.slice(0, 200)) console.log(`  ${m}`);
  process.exitCode = 1;
}

await main();
