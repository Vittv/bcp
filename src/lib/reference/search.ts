import { allCollects, collectText } from "../content/collects";
import { getAllKjvBooks, loadKjvBook } from "../content/kjv";
import {
  psalmIncipit,
  psalmNumbers,
  psalmPassage,
  psalmVerseCount,
} from "../content/psalter";
import type { CollectSection } from "../content/types";

export type BibleHit = {
  abbrev: string;
  book: string;
  chapter: number;
  verse: number;
  snippet: string;
};

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

type BibleLine = {
  abbrev: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
};

// every KJV verse flattened into one line as soon as the full Bible has been
// loaded. built lazily on first search so the first keystroke pays the cost
// and every later one is a cheap linear scan.
let bibleIndex: BibleLine[] | null = null;
let bibleIndexPromise: Promise<BibleLine[]> | null = null;

async function loadBibleIndex(): Promise<BibleLine[]> {
  if (bibleIndex) return bibleIndex;
  bibleIndexPromise ??= (async () => {
    const lines: BibleLine[] = [];
    const metas = getAllKjvBooks();
    for (const meta of metas) {
      const book = await loadKjvBook(meta.abbrev);
      if (!book) continue;
      for (const [chapterKey, verses] of Object.entries(book.verses)) {
        const chapter = parseInt(chapterKey, 10);
        if (Number.isNaN(chapter)) continue;
        for (const [verseKey, text] of Object.entries(verses)) {
          const verse = parseInt(verseKey, 10);
          if (Number.isNaN(verse)) continue;
          lines.push({
            abbrev: book.abbrev,
            book: book.book,
            chapter,
            verse,
            text,
          });
        }
      }
    }
    bibleIndex = lines;
    return lines;
  })();
  return bibleIndexPromise;
}

// verses of `query` across the whole Bible, in canonical order. one hit per
// matching verse; the caller caps the count it renders. an empty query yields
// no hits (the full Bible is far too large to list).
export async function searchBible(query: string): Promise<BibleHit[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const lines = await loadBibleIndex();
  const hits: BibleHit[] = [];
  for (const line of lines) {
    const s = snippet(line.text, q);
    if (s === null) {
      // match against the book + chapter reference with spaces stripped on
      // both sides so "John 3" matches "john3", "Psalm 20" style refs, etc.
      const ref = `${line.book} ${line.chapter}`
        .toLowerCase()
        .replace(/\s+/g, "");
      const compactQ = q.replace(/\s+/g, "");
      if (!ref.includes(compactQ)) continue;
      hits.push({
        abbrev: line.abbrev,
        book: line.book,
        chapter: line.chapter,
        verse: line.verse,
        snippet: `${line.book} ${line.chapter}:${line.verse}`,
      });
      continue;
    }
    hits.push({
      abbrev: line.abbrev,
      book: line.book,
      chapter: line.chapter,
      verse: line.verse,
      snippet: s,
    });
  }
  return hits;
}

export type GlobalHit =
  | {
      kind: "psalm";
      psalm: number;
      incipit: string;
      snippet: string | null;
    }
  | {
      kind: "collect";
      section: CollectSection;
      title: string;
      snippet: string | null;
    }
  | { kind: "bible"; bible: BibleHit };

// group a query across psalms, collects, and the whole Bible. scripture titles
// (e.g. "John 3") are matched against book and chapter names by searchBible.
export async function globalSearch(query: string): Promise<GlobalHit[]> {
  const q = query.trim();
  if (!q) return [];
  const psalmHits = searchPsalms(q).slice(0, 8);
  const collectHits = searchCollects(q).slice(0, 6);
  const bibleHits = (await searchBible(q)).slice(0, 10);
  return [
    ...psalmHits.map((h) => ({
      kind: "psalm" as const,
      psalm: h.psalm,
      incipit: h.incipit,
      snippet: h.snippet,
    })),
    ...collectHits.map((h) => ({
      kind: "collect" as const,
      section: h.section,
      title: h.title,
      snippet: h.snippet,
    })),
    ...bibleHits.map((h) => ({ kind: "bible" as const, bible: h })),
  ];
}
