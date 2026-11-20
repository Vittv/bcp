import type { CalendarEdition } from "../calendar/types";
import {
  psalmIncipit,
  psalmNumbers,
  psalmPassage,
  psalmVerseCount,
} from "./psalter";
import type { PsalmPassage } from "./types";
import { BCP1662_PSALTER, getBcp1662PsalmPassage } from "./vendor/bcp1662";
import { BCP1962_PSALTER, getBcp1962PsalmPassage } from "./vendor/bcp1962";

function vendorPsalter(edition: "1962" | "1662") {
  return edition === "1962" ? BCP1962_PSALTER : BCP1662_PSALTER;
}

// the canonical psalm numbers each book actually prints; the 1962 psalter
// omits Psalm 58, so its picker has 149 rows rather than 150
export function editionPsalmNumbers(edition: CalendarEdition): number[] {
  if (edition === "1979") return psalmNumbers();
  return Object.keys(vendorPsalter(edition))
    .map(Number)
    .sort((a, b) => a - b);
}

export function editionPsalmPassage(
  edition: CalendarEdition,
  psalm: number,
): PsalmPassage | undefined {
  if (edition === "1979") return psalmPassage({ psalm });
  const ref = String(psalm);
  return edition === "1962"
    ? getBcp1962PsalmPassage(ref)
    : getBcp1662PsalmPassage(ref);
}

export function editionPsalmVerseCount(
  edition: CalendarEdition,
  psalm: number,
): number {
  if (edition === "1979") return psalmVerseCount(psalm);
  return editionPsalmPassage(edition, psalm)?.verses.length ?? 0;
}

export function editionPsalmIncipit(
  edition: CalendarEdition,
  psalm: number,
): string {
  if (edition === "1979") return psalmIncipit(psalm) ?? "";
  const verses = vendorPsalter(edition)[String(psalm)]?.parts[0]?.verses;
  const first = Object.entries(verses ?? {}).sort(
    ([a], [b]) => Number(a) - Number(b),
  )[0];
  if (!first) return "";
  const text = first[1].replace(/[/*]/g, " ").replace(/\s+/g, " ").trim();
  return text.length > 60 ? `${text.slice(0, 57).trimEnd()}…` : text;
}
