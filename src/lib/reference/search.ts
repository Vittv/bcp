import {
  SANCTORALE_ENTRIES,
  sanctoraleDateLabel,
  sanctoraleNameVariants,
} from "../calendar/sanctorale";
import { allCollects, collectText } from "../content/collects";
import {
  psalmIncipit,
  psalmNumbers,
  psalmPassage,
  psalmVerseCount,
} from "../content/psalter";
import type { CollectSection } from "../content/types";

export type PsalmHit = {
  psalm: number;
  incipit: string;
  verses: number;
  // null when the psalm matched by number alone
  snippet: string | null;
};

export type CollectHit = {
  section: CollectSection;
  title: string;
  snippet: string | null;
};

// a short excerpt of `text` centered on the first case-insensitive
// occurrence of `q`, or null when `q` does not occur.
function snippet(text: string, q: string): string | null {
  const at = text.toLowerCase().indexOf(q);
  if (at === -1) return null;
  const from = Math.max(0, at - 30);
  const to = Math.min(text.length, at + q.length + 40);
  return `${from > 0 ? "…" : ""}${text.slice(from, to).trim()}${to < text.length ? "…" : ""}`;
}

// psalms matching `query` by number or verse text, in canonical order.
// an empty query yields the full list with no snippets. a leading "psalm"
// or "ps" prefix (e.g. "Psalm 20") is parsed as an exact psalm number so
// natural phrasing navigates to that psalm rather than matching no text.
export function searchPsalms(query: string): PsalmHit[] {
  const q = query.trim().toLowerCase();
  const numbers = psalmNumbers();
  if (!q) {
    return numbers.map((n) => ({
      psalm: n,
      incipit: psalmIncipit(n) ?? "",
      verses: psalmVerseCount(n),
      snippet: null,
    }));
  }
  const prefixNum = q.match(/^(?:psalms?|ps)\s+(\d+)$/)?.[1];
  const hits: PsalmHit[] = [];
  for (const n of numbers) {
    if (prefixNum) {
      if (String(n) !== prefixNum) continue;
      hits.push({
        psalm: n,
        incipit: psalmIncipit(n) ?? "",
        verses: psalmVerseCount(n),
        snippet: null,
      });
      break;
    }
    let matched: string | null = String(n).includes(q) ? "" : null;
    for (const verse of psalmPassage({ psalm: n })?.verses ?? []) {
      const s = snippet(verse.text, q);
      if (s !== null) {
        matched = s;
        break;
      }
    }
    if (matched !== null) {
      hits.push({
        psalm: n,
        incipit: psalmIncipit(n) ?? "",
        verses: psalmVerseCount(n),
        snippet: matched || null,
      });
    }
  }
  return hits;
}

// collects matching `query` by title or by either rite's text, one hit
// per collect in printed order. an empty query yields the full list.
export function searchCollects(query: string): CollectHit[] {
  const q = query.trim().toLowerCase();
  const hits: CollectHit[] = [];
  for (const entry of allCollects()) {
    if (!q) {
      hits.push({ section: entry.section, title: entry.title, snippet: null });
      continue;
    }
    const s =
      snippet(entry.title, q) ??
      snippet(
        collectText("traditional", entry.section, entry.title) ?? "",
        q,
      ) ??
      snippet(collectText("contemporary", entry.section, entry.title) ?? "", q);
    if (s !== null) {
      hits.push({ section: entry.section, title: entry.title, snippet: s });
    }
  }
  return hits;
}

export type SaintHit = {
  slug: string;
  title: string;
  month: number;
  day: number;
  eveOf?: string;
  snippet: string | null;
};

// holy days and saints matching `query` by proper title or by any exact
// name variant (e.g. "Saint James" matches both the July feast and the
// brother-of-our-Lord feast). an empty query yields all 36 entries in
// calendar-date order.
export function searchSaints(query: string): SaintHit[] {
  const q = query.trim().toLowerCase();
  const hits: SaintHit[] = [];
  for (const entry of SANCTORALE_ENTRIES) {
    if (q) {
      const names = sanctoraleNameVariants(entry);
      const matched =
        names.some((v) => v.toLowerCase().includes(q)) ||
        sanctoraleDateLabel(entry).toLowerCase().includes(q);
      if (!matched) continue;
    }
    hits.push({
      slug: entry.slug,
      title: entry.title,
      month: entry.month,
      day: entry.day,
      eveOf: entry.eveOf,
      snippet: q ? snippet(entry.title, q) : null,
    });
  }
  return hits;
}
