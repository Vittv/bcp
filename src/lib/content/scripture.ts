import type { KjvBook, KjvPassage, Testament } from "./types";

// metadata for a scripture book as stored in the vendored JSON. the DOL
// references books by several names, so each entry carries the aliases
// that must resolve to it.
export type ScriptureBookMeta = {
  book: string;
  abbrev: string;
  testament: Testament;
  chapters: number;
  dolRefNames: string[];
};

export type ParseResult = {
  book: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
  endChapter?: number;
};

export type BookLoader = (abbrevOrName: string) => Promise<KjvBook | null>;

export function getBookMeta(
  books: readonly ScriptureBookMeta[],
  abbrevOrName: string,
): ScriptureBookMeta | undefined {
  const key = abbrevOrName.toLowerCase().replace(/\s+/g, "");
  for (const b of books) {
    if (
      b.abbrev.toLowerCase().replace(/\s+/g, "") === key ||
      b.book.toLowerCase().replace(/\s+/g, "") === key ||
      b.dolRefNames.some((r) => r.toLowerCase().replace(/\s+/g, "") === key)
    ) {
      return b;
    }
  }
  return undefined;
}

export function slicePassage(
  book: KjvBook,
  chapter: number,
  verseStart?: number,
  verseEnd?: number,
  endChapter?: number,
): KjvPassage | null {
  const chapterKey = String(chapter);
  const chapterVerses = book.verses[chapterKey];
  if (!chapterVerses) return null;

  const verseNums = Object.keys(chapterVerses)
    .map((k) => parseInt(k, 10))
    .sort((a, b) => a - b);
  if (verseNums.length === 0) return null;

  const start = verseStart ?? verseNums[0];
  const end =
    verseEnd ??
    (verseStart !== undefined ? verseStart : verseNums[verseNums.length - 1]);

  const verses: { number: number; text: string; chapter?: number }[] = [];

  if (endChapter && endChapter > chapter) {
    // cross-chapter range: verseEnd refers to the end chapter's verse
    for (let v = start; v <= verseNums[verseNums.length - 1]; v++) {
      const text = chapterVerses[String(v)];
      if (text !== undefined) verses.push({ number: v, text, chapter });
    }
    for (let c = chapter + 1; c <= endChapter; c++) {
      const cv = book.verses[String(c)];
      if (!cv) continue;
      const cvNums = Object.keys(cv)
        .map((k) => parseInt(k, 10))
        .sort((a, b) => a - b);
      const cStart = c === endChapter ? 1 : cvNums[0];
      const cEnd = c === endChapter ? end : (cvNums[cvNums.length - 1] ?? 0);
      for (let v = cStart; v <= cEnd; v++) {
        const text = cv[String(v)];
        if (text !== undefined) {
          verses.push({ number: v, text, chapter: c });
        }
      }
    }
  } else {
    for (let v = start; v <= end; v++) {
      const text = chapterVerses[String(v)];
      if (text !== undefined) verses.push({ number: v, text });
    }
  }

  if (verses.length === 0) return null;

  return {
    book: book.book,
    abbrev: book.abbrev,
    testament: book.testament,
    chapter,
    verses,
  };
}

function buildBookPattern(books: readonly ScriptureBookMeta[]): RegExp {
  const names = new Set<string>();
  for (const b of books) {
    names.add(b.abbrev);
    names.add(b.book);
    for (const ref of b.dolRefNames) names.add(ref);
  }
  const escaped = Array.from(names)
    .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .sort((a, b) => b.length - a.length)
    .join("|");
  return new RegExp(`^(${escaped})\\s+`, "i");
}

export function parseDolRef(
  books: readonly ScriptureBookMeta[],
  ref: string,
): ParseResult | null {
  const match = ref.match(buildBookPattern(books));
  if (!match) return null;

  const bookRef = match[1].trim();
  const rest = ref.slice(match[0].length);
  const meta = getBookMeta(books, bookRef);

  // strip parenthetical annotations like (1–9) and letter suffixes like 19a, 23b
  const cleaned = rest.replace(/\([^)]*\)/g, "").replace(/(\d)[a-d]/gi, "$1");

  // single-chapter books (Obadiah, Jude): a range without a chapter marker
  // like "15–21" means verses 15–21 within the only chapter
  if (meta && meta.chapters === 1) {
    const vMatch = cleaned.match(/(\d+)/);
    if (vMatch && !cleaned.includes(":")) {
      const verseNums = cleaned.match(/(\d+)/g);
      if (verseNums) {
        const vs = parseInt(verseNums[0], 10);
        const ve =
          verseNums.length > 1
            ? parseInt(verseNums[verseNums.length - 1], 10)
            : vs;
        if (!Number.isNaN(vs) && !Number.isNaN(ve) && vs <= ve) {
          return {
            book: bookRef,
            chapter: 1,
            verseStart: vs,
            verseEnd: ve,
          };
        }
      }
    }
  }

  // malformed refs like "36:27:37–2" (chapter, verse, endChapter, endVerse,
  // missing a separator, so it reads as a cross-chapter 36:27 through 37:2)
  const malformedCross = cleaned.match(
    /^(\d+)\s*:\s*(\d+)\s*:\s*(\d+)\s*[-–]\s*(\d+)/,
  );
  if (malformedCross) {
    const chapter = parseInt(malformedCross[1], 10);
    const verseStart = parseInt(malformedCross[2], 10);
    const endChapter = parseInt(malformedCross[3], 10);
    const verseEnd = parseInt(malformedCross[4], 10);
    if (
      !Number.isNaN(chapter) &&
      !Number.isNaN(verseStart) &&
      !Number.isNaN(endChapter) &&
      !Number.isNaN(verseEnd)
    ) {
      return { book: bookRef, chapter, verseStart, verseEnd, endChapter };
    }
  }

  // extract first chapter:verse range. Supports both in-chapter ranges
  // "16:16–22" and cross-chapter ranges "6:17–7:10" / "7:59–8:8".
  const rangeMatch = cleaned.match(
    /(\d+)\s*:\s*(\d+)\s*[-–]\s*(\d+)(?:\s*:\s*(\d+))?/,
  );
  if (rangeMatch) {
    const chapter = parseInt(rangeMatch[1], 10);
    const verseStart = parseInt(rangeMatch[2], 10);
    const endChapterRaw = parseInt(rangeMatch[3], 10);
    const endVerseRaw = rangeMatch[4] ? parseInt(rangeMatch[4], 10) : undefined;
    if (
      !Number.isNaN(chapter) &&
      !Number.isNaN(verseStart) &&
      !Number.isNaN(endChapterRaw)
    ) {
      if (rangeMatch[4]) {
        // cross-chapter range: 6:17–7:10
        const endChapter = endChapterRaw;
        const verseEnd = endVerseRaw;
        return {
          book: bookRef,
          chapter,
          verseStart,
          verseEnd,
          endChapter,
        };
      }
      // in-chapter range: 16:16–22
      const verseEnd = endChapterRaw;
      return { book: bookRef, chapter, verseStart, verseEnd };
    }
  }

  // single verse (chapter:verse without a range)
  const singleVerseMatch = cleaned.match(/(\d+)\s*:\s*(\d+)/);
  if (singleVerseMatch) {
    const chapter = parseInt(singleVerseMatch[1], 10);
    const verse = parseInt(singleVerseMatch[2], 10);
    if (!Number.isNaN(chapter) && !Number.isNaN(verse)) {
      return { book: bookRef, chapter, verseStart: verse, verseEnd: verse };
    }
  }

  // try chapter only (no verse range)
  const chapterMatch = cleaned.match(/(\d+)/);
  if (chapterMatch) {
    const chapter = parseInt(chapterMatch[1], 10);
    if (!Number.isNaN(chapter)) {
      return { book: bookRef, chapter };
    }
  }

  return null;
}

export async function getPassageFromDolRef(
  books: readonly ScriptureBookMeta[],
  loadBook: BookLoader,
  ref: string,
): Promise<KjvPassage | null> {
  const parsed = parseDolRef(books, ref);
  if (!parsed) return null;

  const book = await loadBook(parsed.book);
  if (!book) return null;

  return slicePassage(
    book,
    parsed.chapter,
    parsed.verseStart,
    parsed.verseEnd,
    parsed.endChapter,
  );
}

// load every range of a lesson ref, which may combine semicolon-separated
// groups and comma-separated ranges (e.g. "Gen 17:1–12a, 15–16" or
// "Isaiah 26:3; 30:15"). Verse-only pieces inherit the running chapter.
export async function getPassagesFromDolRef(
  books: readonly ScriptureBookMeta[],
  loadBook: BookLoader,
  ref: string,
): Promise<KjvPassage[]> {
  const groups = ref.split(";").map((s) => s.trim());
  if (groups.length === 0) return [];

  const firstParsed = parseDolRef(books, groups[0]);
  if (!firstParsed) return [];
  const book = firstParsed.book;

  const results: KjvPassage[] = [];
  let lastChapter = firstParsed.chapter;

  for (const group of groups) {
    for (let range of group.split(",").map((s) => s.trim())) {
      // only the first range of the ref carries the book name; strip it so we
      // always rebuild fullRef from the running chapter
      if (range.toLowerCase().startsWith(book.toLowerCase())) {
        range = range.slice(book.length).trim();
      }
      if (/:/.test(range)) {
        const parsed = parseDolRef(books, `${book} ${range}`);
        if (parsed) lastChapter = parsed.chapter;
      }
      const fullRef = /:/.test(range)
        ? `${book} ${range}`
        : `${book} ${lastChapter}:${range}`;
      const passage = await getPassageFromDolRef(books, loadBook, fullRef);
      if (passage) results.push(passage);
    }
  }

  return results;
}
