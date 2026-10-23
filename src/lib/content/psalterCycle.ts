import type { Psalm, PsalterDay } from "./types";

// the 1979 psalter prints its 30-day cycle as headings on the last verse of
// the psalm before each portion. the generator writes the derived table to
// the vendor file and the test re-derives it, so this module stays free of
// that file and either can run before it exists.

const DAY_WORDS: Record<string, number> = {
  first: 1,
  second: 2,
  third: 3,
  fourth: 4,
  fifth: 5,
  sixth: 6,
  seventh: 7,
  eighth: 8,
  ninth: 9,
  tenth: 10,
  eleventh: 11,
  twelfth: 12,
  thirteenth: 13,
  fourteenth: 14,
  fifteenth: 15,
  sixteenth: 16,
  seventeenth: 17,
  eighteenth: 18,
  nineteenth: 19,
  twentieth: 20,
  "twenty-first": 21,
  "twenty-second": 22,
  "twenty-third": 23,
  "twenty-fourth": 24,
  "twenty-fifth": 25,
  "twenty-sixth": 26,
  "twenty-seventh": 27,
  "twenty-eighth": 28,
  "twenty-ninth": 29,
  thirtieth: 30,
};

// the heading names the portion that opens after it, e.g. the marker on the
// last verse of Psalm 5 opens Psalm 6 as the First Day's evening
const HEADING = /\*([A-Za-z]+(?:-[A-Za-z]+)?) Day: (Morning|Evening) Prayer\*/;

export const PSALTER_DAY_COUNT = 30;

type Portion = {
  day: number;
  office: "morning" | "evening";
  citations: string[];
};

type Coord = { psalm: number; verse: number };

type FlatVerse = Coord & { text: string };

function flatten(psalms: Record<string, Psalm>): FlatVerse[] {
  const out: FlatVerse[] = [];
  const numbers = Object.keys(psalms)
    .map(Number)
    .sort((a, b) => a - b);
  for (const psalm of numbers) {
    for (const part of psalms[String(psalm)].parts) {
      const verses = Object.keys(part.verses)
        .map(Number)
        .sort((a, b) => a - b);
      for (const verse of verses) {
        out.push({ psalm, verse, text: part.verses[String(verse)] });
      }
    }
  }
  return out;
}

function lastVerse(psalm: Psalm): number {
  let max = 0;
  for (const part of psalm.parts) {
    for (const key of Object.keys(part.verses)) {
      max = Math.max(max, Number(key));
    }
  }
  return max;
}

// the citations covering the verses between two coordinates, one per psalm
function citationsBetween(
  from: Coord,
  to: Coord,
  psalms: Record<string, Psalm>,
): string[] {
  const out: string[] = [];
  for (let psalm = from.psalm; psalm <= to.psalm; psalm++) {
    const end = lastVerse(psalms[String(psalm)]);
    const start = psalm === from.psalm ? from.verse : 1;
    const stop = psalm === to.psalm ? to.verse : end;
    out.push(
      start === 1 && stop === end ? `${psalm}` : `${psalm}:${start}-${stop}`,
    );
  }
  return out;
}

export function derivePsalterDays(psalms: Record<string, Psalm>): PsalterDay[] {
  const flat = flatten(psalms);
  if (flat.length === 0) return [];

  const portions: Portion[] = [];
  let start: Coord = { psalm: flat[0].psalm, verse: flat[0].verse };
  let current: Portion = { day: 1, office: "morning", citations: [] };

  for (let i = 0; i < flat.length; i++) {
    const { psalm, verse, text } = flat[i];
    const match = HEADING.exec(text);
    if (!match) continue;
    const day = DAY_WORDS[match[1].toLowerCase()];
    if (!day) throw new Error(`unknown psalter day heading: ${match[0]}`);
    current.citations = citationsBetween(start, { psalm, verse }, psalms);
    portions.push(current);
    const next = flat[i + 1];
    if (!next) break;
    start = { psalm: next.psalm, verse: next.verse };
    current = {
      day,
      office: match[2].toLowerCase() === "morning" ? "morning" : "evening",
      citations: [],
    };
  }

  const last = flat[flat.length - 1];
  current.citations = citationsBetween(start, last, psalms);
  portions.push(current);

  const days: PsalterDay[] = [];
  for (let day = 1; day <= PSALTER_DAY_COUNT; day++) {
    const morning = portions.find(
      (p) => p.day === day && p.office === "morning",
    );
    const evening = portions.find(
      (p) => p.day === day && p.office === "evening",
    );
    if (!morning || !evening) {
      throw new Error(`psalter day ${day} is missing a portion`);
    }
    days.push({
      day,
      morning: morning.citations,
      evening: evening.citations,
    });
  }
  return days;
}
