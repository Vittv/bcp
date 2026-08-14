import type { Psalm, PsalmCitation, PsalmPassage } from "./types";
import psalterData from "./vendor/bcp/psalter.min.json";

const psalms = psalterData as unknown as Record<string, Psalm>;

export function psalmExists(psalm: number): boolean {
  return Object.hasOwn(psalms, String(psalm));
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

// flatten the parts of a psalm into a single verse list, carrying the
// Hebrew stanza letter (Psalm 119) onto the verse it begins.
function versesOf(psalm: Psalm): PsalmPassage["verses"] {
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

// render the verses selected by a citation. an unqualified citation yields
// the whole psalm; a verse range clips it.
export function psalmPassage(
  citation: PsalmCitation,
): PsalmPassage | undefined {
  const psalm = psalms[String(citation.psalm)];
  if (!psalm) return undefined;
  const all = versesOf(psalm);
  if (!citation.verses) return { psalm: citation.psalm, verses: all };
  const { start, end } = citation.verses;
  const verses = all.filter((v) => v.number >= start && v.number <= end);
  return { psalm: citation.psalm, verses };
}
