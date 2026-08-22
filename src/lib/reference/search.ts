import { collectSections, collectsBySection } from "../content/collects";
import {
  psalmIncipit,
  psalmNumbers,
  psalmPassage,
  psalmVerseCount,
} from "../content/psalter";
import type { CollectRite, CollectSection } from "../content/types";

export type PsalmHit = {
  psalm: number;
  incipit: string;
  verses: number;
  // null when the psalm matched by number alone
  snippet: string | null;
};

export type CollectHit = {
  rite: CollectRite;
  section: CollectSection;
  title: string;
  snippet: string | null;
};

const RITES: CollectRite[] = ["traditional", "contemporary"];

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
// an empty query yields the full list with no snippets.
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
  const hits: PsalmHit[] = [];
  for (const n of numbers) {
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

// collects matching `query` by title or text, in printed order. an empty
// query yields the full list.
export function searchCollects(query: string): CollectHit[] {
  const q = query.trim().toLowerCase();
  const hits: CollectHit[] = [];
  for (const rite of RITES) {
    for (const section of collectSections(rite)) {
      for (const collect of collectsBySection(rite, section)) {
        if (!q) {
          hits.push({ rite, section, title: collect.title, snippet: null });
          continue;
        }
        const s = snippet(collect.title, q) ?? snippet(collect.text, q);
        if (s !== null) {
          hits.push({ rite, section, title: collect.title, snippet: s });
        }
      }
    }
  }
  return hits;
}
