import { psalterSchema } from "./schemas";
import type { Psalm, PsalmCitation, PsalmPassage } from "./types";
import psalterData from "./vendor/bcp/psalter.min.json";

const psalms = psalterSchema.parse(psalterData);

export function psalmExists(psalm: number): boolean {
  return Object.hasOwn(psalms, String(psalm));
}

// all psalm numbers, in canonical order.
export function psalmNumbers(): number[] {
  return Object.keys(psalms)
    .map(Number)
    .sort((a, b) => a - b);
}

// opening words of verse 1, for reference-list display.
export function psalmIncipit(psalm: number): string | undefined {
  const first = Object.entries(
    psalms[String(psalm)]?.parts[0]?.verses ?? {},
  ).sort(([a], [b]) => Number(a) - Number(b))[0];
  if (!first) return undefined;
  const text = cleanVerse(first[1]);
  return text.length > 60 ? `${text.slice(0, 57).trimEnd()}…` : text;
}

export function psalmTitle(psalm: number): string | undefined {
  return psalms[String(psalm)]?.parts[0]?.title ?? undefined;
}

export function psalmVerseCount(psalm: number): number {
  const parts = psalms[String(psalm)]?.parts ?? [];
  if (parts.length === 0) return 0;
  const last = parts[parts.length - 1];
  return Math.max(0, ...Object.keys(last.verses).map(Number));
}

// the BCP psalter marks psalm-book divisions and the daily-office schedule
// (e.g. "<Book Two>", "*Fourteenth Day: Evening Prayer*") on the last verse
// of certain psalms; strip them before display.
const PSALTER_MARKERS = [
  /<Book [A-Za-z]+>/g,
  /\*[^*]*Day: (?:Morning|Evening|Noonday) Prayer\*/g,
  /\s*-{3,}\(end of BCPSALTER\.TXT\)\s*-{0,}\s*$/,
];

function cleanVerse(text: string): string {
  let t = text;
  for (const re of PSALTER_MARKERS) t = t.replace(re, "");
  return t.trim();
}

// flatten the parts of a psalm into a single verse list, carrying the
// Hebrew stanza letter (Psalm 119) onto the verse it begins.
function versesOf(psalm: Psalm): PsalmPassage["verses"] {
  const out: PsalmPassage["verses"] = [];
  for (const part of psalm.parts) {
    for (const [number, text] of Object.entries(part.verses)) {
      out.push({
        number: Number(number),
        text: cleanVerse(text),
        stanza: part.stanzas?.[number],
      });
    }
  }
  return out;
}

// full verse lists cached per psalm: search scans every passage on
// each keystroke and re-running the marker regexes there made typing
// crawl. ranged citations clip fresh; they're rare and cheap.
const allVersesCache = new Map<number, PsalmPassage["verses"]>();

// render the verses selected by a citation. an unqualified citation yields
// the whole psalm; a verse range clips it, and the lengthen/extend parts of
// a citation are appended so the full appointed passage is available.
export function psalmPassage(
  citation: PsalmCitation,
): PsalmPassage | undefined {
  const psalm = psalms[String(citation.psalm)];
  if (!psalm) return undefined;
  let all = allVersesCache.get(citation.psalm);
  if (!all) {
    all = versesOf(psalm);
    allVersesCache.set(citation.psalm, all);
  }
  const ranges = [citation.verses, citation.lengthen, citation.extend].filter(
    (r): r is NonNullable<typeof r> => r !== undefined,
  );
  if (ranges.length === 0) return { psalm: citation.psalm, verses: all };
  const verses = all.filter((v) =>
    ranges.some((r) => v.number >= r.start && v.number <= r.end),
  );
  return { psalm: citation.psalm, verses };
}
