import type { CollectSection } from "./types";
import { BCP1662_PROPER_COLLECTS } from "./vendor/bcp1662";
import { BCP1962_PROPER_COLLECTS } from "./vendor/bcp1962";

export type OlderEdition = "1662" | "1962";

export type EditionCollect = {
  section: CollectSection;
  title: string;
  text: string;
};

// the 1962 book prints its proper headings in capitals, and the vendored names
// keep that voice. the picker and reading pane use sentence-style title case
// like the other editions; the printed wording itself is never changed.
const LOWERCASE_TITLE_WORDS = new Set([
  "a",
  "after",
  "and",
  "as",
  "at",
  "before",
  "being",
  "by",
  "called",
  "commonly",
  "for",
  "from",
  "in",
  "of",
  "on",
  "or",
  "the",
  "throughout",
  "to",
  "with",
]);

// a few printed small-caps words and hyphenations came through pdftotext split
const NAME_REPAIRS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bC HURCH\b/g, "Church"],
  [/\bO VERSEAS\b/g, "Overseas"],
  [/\bF RUITS\b/g, "Fruits"],
  [/\bLA BOURS\b/g, "Labours"],
  [/\bM EN\b/g, "Men"],
  [/\bTWENTY -/g, "Twenty-"],
  [/\s+([.,;:])/g, "$1"],
];

function displayTitle(name: string): string {
  if (name !== name.toUpperCase()) return name;
  let fixed = name;
  for (const [pattern, replacement] of NAME_REPAIRS) {
    fixed = fixed.replace(pattern, replacement);
  }
  let first = true;
  return fixed
    .toLowerCase()
    .split(/(\s+)/)
    .map((word) => {
      if (!word.trim()) return word;
      const bare = word.replace(/[^a-z]/gi, "").toLowerCase();
      if (!first && LOWERCASE_TITLE_WORDS.has(bare)) return word;
      first = false;
      return word.replace(/[a-z]/, (c) => c.toUpperCase());
    })
    .join("");
}

// the older books do not print the 1979 section groupings; map their flat
// proper-collect lists onto the four section ids the reference page already
// understands, so selection and history state need no new shape.
function sectionFor(name: string): CollectSection {
  if (/^For\b|^Of the\b|^On\b|^At\b|^In Time|^Before|^During/i.test(name)) {
    return "various-occasions";
  }
  if (
    /\bSAINT\b|\bST\.?\b|HOLY-DAY|APOSTLE|EVANGELIST|MARTYR|CONFESSOR|VIRGIN/i.test(
      name,
    )
  ) {
    return "holy-days";
  }
  return "church-year";
}

function sourceFor(
  edition: OlderEdition,
): Array<{ name: string; text: string }> {
  return edition === "1662"
    ? BCP1662_PROPER_COLLECTS.collects
    : BCP1962_PROPER_COLLECTS.collects;
}

export function collectsForEdition(edition: OlderEdition): EditionCollect[] {
  return sourceFor(edition).map((c) => ({
    section: sectionFor(c.name),
    title: displayTitle(c.name),
    text: c.text,
  }));
}

export function editionCollectPassage(
  edition: OlderEdition,
  section: CollectSection,
  title: string,
): EditionCollect | undefined {
  return collectsForEdition(edition).find(
    (c) => c.section === section && c.title === title,
  );
}

export function firstCollectForEdition(edition: OlderEdition): {
  section: CollectSection;
  title: string;
} {
  const first = collectsForEdition(edition)[0];
  return { section: first.section, title: first.title };
}

export function searchEditionCollects(
  edition: OlderEdition,
  query: string,
): EditionCollect[] {
  const all = collectsForEdition(edition);
  const q = query.trim().toLowerCase();
  if (!q) return all;
  return all.filter(
    (c) =>
      c.title.toLowerCase().includes(q) || c.text.toLowerCase().includes(q),
  );
}
