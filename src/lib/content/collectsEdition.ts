import type { CollectSection } from "./types";
import { BCP1662_PROPER_COLLECTS } from "./vendor/bcp1662";
import { BCP1962_PROPER_COLLECTS } from "./vendor/bcp1962";

export type OlderEdition = "1662" | "1962";

export type EditionCollect = {
  section: CollectSection;
  title: string;
  text: string;
};

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
    title: c.name,
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
