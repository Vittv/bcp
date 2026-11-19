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
import psalterCycleData from "./psalter-cycle.json";
import psalterData from "./psalter.min.json";
import rulesData from "./lectionary-rules.json";
import officeTextData from "./office-text/offices.json";
import canticlesData from "./office-text/canticles.json";
import fixedCollectsData from "./office-text/collects.json";
import prayersData from "./office-text/prayers-thanksgivings.json";
import litanyData from "./office-text/litany.json";
import properCollectsData from "./office-text/collects-proper.json";
import type { PsalmPassage } from "../../types";

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

export type Bcp1662MonthlyPsalms = {
  morning: string[];
  evening: string[];
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

export const BCP1662_PSALTER_CYCLE =
  // SAFETY: vendored static JSON table matching the declared 30-day psalter-cycle shape; validated by scripts/check-bcp1662-vendor.ts.
  psalterCycleData as {
    meta: { edition: string; title: string; compiled: string };
    days: Record<string, Bcp1662MonthlyPsalms>;
  };

type Bcp1662PsalmPart = {
  title?: string | null;
  stanzas?: Record<string, string>;
  verses: Record<string, string>;
};

export const BCP1662_PSALTER =
  // SAFETY: vendored static 1662 Coverdale psalter text (PD/Bible Browser source), schema-compatible psalm map.
  psalterData as Record<string, { parts: Bcp1662PsalmPart[] }>;

export const BCP1662_RULES =
  // SAFETY: vendored static JSON table matching the declared rules shape; validated by scripts/check-bcp1662-vendor.ts.
  rulesData as {
    meta: { edition: string; title: string; compiled: string };
    rules: Bcp1662Rule[];
  };

export type Bcp1662OfficeTextVersicle = {
  speaker: string;
  text: string;
};

export type Bcp1662OfficeTextOffice = {
  id: "morning" | "evening";
  name: string;
  openingRubric?: string;
  openingVersicles?: Bcp1662OfficeTextVersicle[];
  openingVersiclesRubric?: string;
  gloriaStandingRubric?: string;
  lordsPrayerOpeningRubric?: string;
  psalmsRubric?: string;
  firstLessonRubric?: string;
  secondLessonRubric?: string;
  creedRubric?: string;
  prayersRubric?: string;
  lordsPrayerRubric?: string;
  suffragesRubric?: string;
  collectsRubric?: string;
  endRubric?: string;
  invitatory?: {
    default?: string;
    options?: string[];
    rubric?: string;
  };
  canticles?: {
    afterFirst?: string[];
    afterSecond?: string[];
  };
  preces?: Bcp1662OfficeTextVersicle[];
};

export type Bcp1662InvitatoryText = {
  title: string;
  rubric?: string;
  text: string;
};

export type Bcp1662CommonPrayer = {
  id: string;
  title: string;
  text: string;
};

export type Bcp1662OpeningSentence = {
  label: string;
  text: string;
};

export const BCP1662_OFFICE_TEXT =
  // SAFETY: vendored static 1662 office-text JSON (best-effort draft) matching the declared shape.
  officeTextData as {
    meta: { edition: string; title: string; status?: string };
    common: {
      exhortation?: string;
      confession: string;
      confession_rubric?: string;
      absolution_priest: string;
      absolution_rubric?: string;
      absolution_note?: string;
      amen_rubric?: string;
      lords_prayer: string;
      lords_prayer_opening?: string;
      apostles_creed: string;
      athanasian_creed?: string;
      athanasian_creed_rubric?: string;
      creed_rubric?: string;
      grace: string;
      venite?: Bcp1662InvitatoryText;
      easterAnthems?: Bcp1662InvitatoryText;
      openingSentences?: Bcp1662OpeningSentence[];
      suffrages?: Bcp1662OfficeTextVersicle[];
      prayers?: Bcp1662CommonPrayer[];
      anthem_rubric?: string;
      state_prayers_rubric_morning?: string;
      state_prayers_rubric_evening?: string;
      gloria_patri?: string;
      lesson_note?: string;
      psalms_gloria_rubric?: string;
    };
    offices: Bcp1662OfficeTextOffice[];
  };

export type Bcp1662Canticle = {
  id: string;
  title: string;
  rubric?: string;
  text: string;
};

export const BCP1662_CANTICLES =
  // SAFETY: vendored static 1662 canticles JSON (best-effort draft) matching the declared shape.
  canticlesData as {
    meta: { edition: string; title: string; status?: string };
    canticles: Bcp1662Canticle[];
  };

export type Bcp1662FixedCollect = {
  id: string;
  office: "morning" | "evening";
  title: string;
  text: string;
};

export const BCP1662_FIXED_COLLECTS =
  // SAFETY: vendored static 1662 fixed collects JSON (best-effort draft) matching the declared shape.
  fixedCollectsData as {
    meta: { edition: string; title: string; status?: string };
    collects: Bcp1662FixedCollect[];
  };

export type Bcp1662ProperCollect = {
  name: string;
  text: string;
};

export const BCP1662_PROPER_COLLECTS =
  // SAFETY: vendored static 1662 proper collects JSON (best-effort subset) matching the declared shape.
  properCollectsData as {
    meta: { edition: string; title: string; status?: string };
    collects: Bcp1662ProperCollect[];
  };

export function getBcp1662OfficeText(office: Bcp1662Office) {
  return BCP1662_OFFICE_TEXT.offices.find((o) => o.id === office);
}

export function getBcp1662Canticle(id: string) {
  return BCP1662_CANTICLES.canticles.find((c) => c.id === id);
}

export type Bcp1662LitanyLine =
  | { kind: "rubric"; text: string }
  | { kind: "heading"; text: string }
  | {
      kind: "text";
      text: string;
      speaker?: "minister" | "people" | "all";
    };

const BCP1662_LITANY =
  // SAFETY: vendored static 1662 litany JSON matching the declared shape.
  litanyData as {
    lines: Bcp1662LitanyLine[];
  };

export function getBcp1662Litany(): { lines: Bcp1662LitanyLine[] } {
  return BCP1662_LITANY;
}

export type Bcp1662OccasionalPrayer = {
  id: string;
  title: string;
  text: string;
  group: "Prayers" | "Thanksgivings";
};

const BCP1662_PRAYERS =
  // SAFETY: vendored static 1662 prayers JSON matching the declared shape.
  prayersData as {
    rubric?: string;
    prayers: { id: string; title: string; text: string }[];
    thanksgivings: { id: string; title: string; text: string }[];
  };

export function getBcp1662OccasionalPrayers(): Bcp1662OccasionalPrayer[] {
  // rain and fair weather share an id across the two groups, so qualify it
  // with the group to keep selection unambiguous
  return [
    ...BCP1662_PRAYERS.prayers.map((p) => ({
      ...p,
      id: `prayer-${p.id}`,
      group: "Prayers" as const,
    })),
    ...BCP1662_PRAYERS.thanksgivings.map((t) => ({
      ...t,
      id: `thanksgiving-${t.id}`,
      group: "Thanksgivings" as const,
    })),
  ];
}

export function getBcp1662FixedCollects(office: Bcp1662Office) {
  return BCP1662_FIXED_COLLECTS.collects.filter((c) => c.office === office);
}

export function getBcp1662ProperCollect(name: string) {
  return BCP1662_PROPER_COLLECTS.collects.find((c) => c.name === name);
}

function versesOf1662(psalm: { parts: Bcp1662PsalmPart[] }): PsalmPassage["verses"] {
  const out: PsalmPassage["verses"] = [];
  for (const part of psalm.parts) {
    for (const [number, text] of Object.entries(part.verses)) {
      out.push({
        number: Number(number),
        text,
        stanza: part.stanzas?.[number],
      });
    }
  }
  return out;
}

/** resolve a 1662 psalm ref (e.g. "82", "119:1-32") to a psalm passage. */
export function getBcp1662PsalmPassage(ref: string): PsalmPassage | undefined {
  const m = /^(\d{1,3})(?::(\d+)(?:-(\d+))?)?$/.exec(ref.trim());
  if (!m) return undefined;
  const psalmNum = Number(m[1]);
  const psalm = BCP1662_PSALTER[String(psalmNum)];
  if (!psalm) return undefined;
  const all = versesOf1662(psalm);
  if (!m[2]) return { psalm: psalmNum, verses: all };
  const start = Number(m[2]);
  const end = m[3] ? Number(m[3]) : start;
  return {
    psalm: psalmNum,
    verses: all.filter((v) => v.number >= start && v.number <= end),
  };
}

/** resolve a list of 1662 psalm refs/numbers to passages, preserving order. */
export function getBcp1662PsalmPassages(
  refs: Array<string | number>,
): PsalmPassage[] {
  const out: PsalmPassage[] = [];
  for (const r of refs) {
    const passage = getBcp1662PsalmPassage(String(r));
    if (passage) out.push(passage);
  }
  return out;
}

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

export function normalizeFeastKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[.:,]/g, "")
    .replace(/\bye\b/g, "the")
    .replace(/\bbl\b/g, "blessed")
    .replace(/\bvirg\b/g, "virgin")
    .replace(/\bmart\b/g, "martyr")
    .replace(/\bapost\b/g, "apostle")
    .replace(/\bevangel?\b/g, "evangelist")
    .replace(/\barch\s*b\b/g, "archbishop")
    .replace(/\bb\b(?=\s+of|\s+and)/g, "bishop")
    .replace(/\s+/g, " ")
    .trim();
}

// Daily-calendar feast labels (abbreviated 1662/print forms) -> proper-table names.
const FEAST_ALIASES: Record<string, string> = {
  [normalizeFeastKey("Circumc. of our Ld.")]: "Circumcision of our Lord",
  [normalizeFeastKey("Christmas day.")]: "Nativity of Christ (Christmas Day)",
  [normalizeFeastKey("Epiphanie of our Ld.")]: "Epiphany",
  [normalizeFeastKey("Convers: of S. Paul")]: "Conversion of St. Paul",
  [normalizeFeastKey("Purif. of Marie ye. B. Virg.")]:
    "Purification of the Virgin Mary",
  [normalizeFeastKey("Matthias Apost. & M.")]: "St. Matthias",
  [normalizeFeastKey("Annunc. of Mary")]: "Annunciation of our Lady",
  [normalizeFeastKey("S. Mark Evang. & Mart.")]: "St. Mark",
  [normalizeFeastKey("S. Phil & S. Jac Ap. & M.")]: "St. Philip and St. James",
  [normalizeFeastKey("S. Andr. Apost. & M.")]: "St. Andrew",
  [normalizeFeastKey("S Thomas Apost. & M.")]: "St. Thomas the Apostle",
  [normalizeFeastKey("S. Steph. ye. first Mart.")]: "St. Stephen",
  [normalizeFeastKey("S. John Apost. & Evang.")]: "St. John the Evangelist",
  [normalizeFeastKey("Innocents day.")]: "Innocents' Day",
  [normalizeFeastKey("S. Barnab, Apost. & M.")]: "St. Barnabas",
  [normalizeFeastKey("Nativ. of S. John Bapt:")]: "St. John Baptist",
  [normalizeFeastKey("S. Pet. Apost. & M.")]: "St. Peter",
  [normalizeFeastKey("S. Iames Apost. & M.")]: "St. James",
  [normalizeFeastKey("S. Barth. Apost. & M.")]: "St. Bartholomew",
  [normalizeFeastKey("S. Mat. Ap. Evang. & M.")]: "St. Matthew",
  [normalizeFeastKey("S. Mich. & all Angels")]: "St. Michael and All Angels",
  [normalizeFeastKey("S. Luke Evang.")]: "St. Luke",
  [normalizeFeastKey("S. Sim. & S. Jud. Ap. & M.")]: "St. Simon and St. Jude",
  [normalizeFeastKey("All Saints day.")]: "All Saints",
};

function resolveProperName(name: string): string {
  const key = normalizeFeastKey(name);
  return FEAST_ALIASES[key] ?? name;
}

/** Find proper psalms by appointed-day name (accepts common daily-calendar feast aliases). */
export function getBcp1662ProperPsalms(
  name: string,
): Bcp1662ProperPsalmDay | undefined {
  const resolved = resolveProperName(name);
  return (
    BCP1662_PROPER_PSALMS.days.find((d) => d.name === resolved) ??
    BCP1662_PROPER_PSALMS.days.find(
      (d) => normalizeFeastKey(d.name) === normalizeFeastKey(name),
    )
  );
}

/** Find a holy-day proper-lessons entry by name (accepts common daily-calendar feast aliases). */
export function getBcp1662HolyDayProperLessons(name: string) {
  const resolved = resolveProperName(name);
  return (
    BCP1662_PROPER_LESSONS.holyDays.find((d) => d.name === resolved) ??
    BCP1662_PROPER_LESSONS.holyDays.find(
      (d) => normalizeFeastKey(d.name) === normalizeFeastKey(name),
    )
  );
}

/** monthly psalter for a day of month (1-31), day 31 uses day 30. */
export function getBcp1662MonthlyPsalms(dayOfMonth: number): Bcp1662MonthlyPsalms {
  const d = dayOfMonth >= 31 ? 30 : dayOfMonth <= 0 ? 1 : dayOfMonth;
  return (
    BCP1662_PSALTER_CYCLE.days[String(d)] ??
    BCP1662_PSALTER_CYCLE.days["1"]
  );
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

export type Bcp1662DayComposition = {
  month: Bcp1662DailyMonth;
  day: number;
  entry: Bcp1662DailyEntry;
  morning: { lessons: Bcp1662LessonPair; psalms?: Bcp1662ProperPsalmDay };
  evening: { lessons: Bcp1662LessonPair; psalms?: Bcp1662ProperPsalmDay };
  feast?: string;
  resolvedFeastName?: string;
  properLessons?: ReturnType<typeof getBcp1662HolyDayProperLessons>;
  monthlyPsalms: Bcp1662MonthlyPsalms;
  notes: string[];
};

/**
 * Compose both offices for a civil month/day using the daily calendar table and,
 * when a feast/name is known (from the entry or passed explicitly), attach
 * matching proper psalms/holy-day proper lessons. Sunday/movable proper
 * resolution requires a 1662 calendar and is not handled here.
 */
export function composeBcp1662Day(
  month: Bcp1662DailyMonth,
  day: number,
  feastName?: string,
): Bcp1662DayComposition | undefined {
  const entry = getBcp1662DailyLessons(month, day);
  if (!entry) return undefined;
  const feast = feastName ?? entry.feast;
  const resolvedFeastName = feast ? resolveProperName(feast) : undefined;
  const properPsalms = feast ? getBcp1662ProperPsalms(feast) : undefined;
  const properLessons = feast ? getBcp1662HolyDayProperLessons(feast) : undefined;
  const monthlyPsalms = getBcp1662MonthlyPsalms(day);
  const notes: string[] = [];
  if (isBcp1662DailyAllNull(entry)) {
    notes.push(
      "No daily-calendar lessons appointed (proper/holy-day lessons may apply).",
    );
  }
  if (feast && properLessons) {
    notes.push(`Proper lessons are appointed for ${resolvedFeastName ?? feast}.`);
  }
  if (feast && properPsalms) {
    notes.push(`Proper psalms are appointed for ${resolvedFeastName ?? feast}.`);
  }
  return {
    month,
    day,
    entry,
    morning: { lessons: entry.morning, psalms: properPsalms },
    evening: { lessons: entry.evening, psalms: properPsalms },
    feast,
    resolvedFeastName,
    properLessons,
    monthlyPsalms,
    notes,
  };
}

const BCP1662_MONTHS: Bcp1662DailyMonth[] = [
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

export function bcp1662MonthFromNumber(month: number): Bcp1662DailyMonth | undefined {
  return BCP1662_MONTHS[month - 1];
}

/**
 * Best-effort normalization of 1662 lesson strings toward "Book chapter:verse"
 * style used by scripture/lesson parsers (e.g. "Prov. 3. to v. 28" ->
 * "Prov 3:1-28", "Joel 2. to v. 16" -> "Joel 2:1-16").
 * This is not exhaustive; unresolved strings should be treated as display-only.
 */
export function normalizeBcp1662LessonRef(ref: string): string {
  let s = ref.trim();
  // Common 1662/Apocrypha book-name aliases to forms recognized by scripture parsing.
  const bookAliases: Array<[RegExp, string]> = [
    [/\bEcclesiasticus\b/gi, "Sirach"],
    [/\bEcclus\.?\b/gi, "Sirach"],
    [/\bWisdom of Solomon\b/gi, "Wisdom"],
    [/\bCanticles\b/gi, "Song"],
    [/\bSolomon'?s Song\b/gi, "Song"],
    [/\bRevelations?\b/gi, "Rev"],
    [/\bPsalm\b/gi, "Ps"],
  ];
  for (const [re, rep] of bookAliases) {
    s = s.replace(re, rep);
  }
  // "to v. N" / "to verse N" / "unto v. N" meaning from start of chapter to verse N
  s = s.replace(/\bto\s+v\.?\s*(\d+)/gi, "1-$1");
  s = s.replace(/\bunto\s+v\.?\s*(\d+)/gi, "1-$1");
  // "v. N to v. M" / "v. N to M"
  s = s.replace(/\bv\.?\s*(\d+)\s+to\s+v\.?\s*(\d+)/gi, "$1-$2");
  s = s.replace(/\bv\.?\s*(\d+)\s*[-\u2013]\s*v\.?\s*(\d+)/gi, "$1-$2");
  s = s.replace(/\bv\.?\s*(\d+)/gi, "$1");
  // chapter dot "3." -> "3" (before verse/range context)
  s = s.replace(/(\d+)\.(?=\s|$)/g, "$1");
  // "Book 3 1-28" style after replacements -> "Book 3:1-28" when second number looks like verse range start
  s = s.replace(/^((?:\d\s+)?[A-Za-z.]+)\s+(\d+)\s+(\d)/, "$1 $2:$3");
  // normalize whitespace
  s = s.replace(/\s+/g, " ").trim();
  return s;
}
