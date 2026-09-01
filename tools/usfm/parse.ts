// USFM -> our vendored bible JSON format.
// The schema matches src/lib/content/vendor/kjv exactly, so the same
// loaders, types and validation are reusable for any USFM-based vendor.
// Handles the WEBBE corpus: footnotes (\f...\f*), cross-refs (\x...\x*),
// word wrappers (\w text|attrs\w*, \+w text|attrs\+w*), words of Jesus
// (\wj...\wj*), Hebrew transliterations (\+wh), keywords (\k),
// Selah notes (\qs) and book-title wrappers (\+bk).
// Structural lines (\h, \mt, \d, \s1...) are dropped, so psalm
// superscriptions are excluded to match the vendored KJV.

export type VerseMap = Record<string, string>;
export type ChapterMap = Record<string, VerseMap>;

export type ParsedBook = {
  chapters: number;
  verses: ChapterMap;
};

// ranges like \v 28-29 mark a combined verse: the text is kept under the
// first verse number of the range
const verseLine = /^\\v\s+(\d+)(?:[-–—](\d+))?(?:\s(.*))?$/;
const chapterLine = /^\\c\s+(\d+)\s*$/;
const publishedChapterLine = /^\\cp\s+(\d+)\s*$/;
const chapterLabelLine = /^\\cl(?:\s.*)?$/;

// lines that continue the current verse (poetry, prose paragraphs);
// the leading marker is stripped but inline markers stay for cleaning.
const contentLine =
  /^\\(q1|q2|q3|q4|qr|qm|qs|wj|pi1|pi2|pmc|pm|pr|pc|p|m|b|nb|mi|w|add|f|x)(?=[\s*])\s*(.*)$/;

function stripFootnotesAndRefs(s: string): string {
  // \f + ... \f* and \x ... \x* blocks; replace with a space so words
  // on either side of the removed block don't get glued together
  let out = s;
  out = out.replace(/\\f(?=[\s+])[\s\S]*?\\f\*/g, " ");
  out = out.replace(/\\x(?=[\s])[\s\S]*?\\x\*/g, " ");
  return out;
}

function unwrapMarkers(s: string): string {
  let out = s;
  // \w visible|strong="H123"\w* -> keep the text before the pipe
  out = out.replace(/\\w\s+([^|\\]*)(?:\|[^\\]*)?\\w\*/g, "$1");
  // \+w visible|strong="G123"\+w* -> keep the text before the pipe
  out = out.replace(/\\\+w\s+([^|\\]*)(?:\|[^\\]*)?\\\+w\*/g, "$1");
  // paired markers whose inner text is kept verbatim
  out = out.replace(/\\\+wh([\s\S]*?)\\\+wh\*/g, "$1");
  out = out.replace(/\\\+bk([\s\S]*?)\\\+bk\*/g, "$1");
  out = out.replace(/\\wj([\s\S]*?)\\wj\*/g, "$1");
  out = out.replace(/\\k([\s\S]*?)\\k\*/g, "$1");
  out = out.replace(/\\qs([\s\S]*?)\\qs\*/g, "$1");
  // drop any leftover markers (\fr, \ft, stray closes, unknown codes)
  out = out.replace(/\\[+a-z0-9]+\*?/g, "");
  return out;
}

export function cleanVerseText(raw: string): string {
  return unwrapMarkers(stripFootnotesAndRefs(raw)).replace(/\s+/g, " ").trim();
}

export function parseUsfmText(usfm: string): ParsedBook {
  const verses: ChapterMap = {};
  let chapter: number | null = null;
  let chapterHasVerse = false;
  let verseNum: number | null = null;
  let verseParts: string[] = [];

  const flushVerse = () => {
    if (verseNum !== null && chapter !== null) {
      const text = cleanVerseText(verseParts.join("\n"));
      if (text.length > 0) {
        const chapterKey = String(chapter);
        if (!verses[chapterKey]) verses[chapterKey] = {};
        const chapterMap = verses[chapterKey];
        chapterMap[String(verseNum)] = text;
        chapterHasVerse = true;
      }
    }
    verseNum = null;
    verseParts = [];
  };

  const startChapter = (num: number) => {
    flushVerse();
    chapter = num;
    chapterHasVerse = false;
  };

  for (const rawLine of usfm.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "") continue;

    const vMatch = verseLine.exec(line);
    if (vMatch) {
      flushVerse();
      if (chapter === null) chapter = 1;
      verseNum = parseInt(vMatch[1], 10);
      verseParts = [vMatch[3] ?? ""];
      chapterHasVerse = true;
      continue;
    }

    const cMatch = chapterLine.exec(line);
    if (cMatch) {
      startChapter(parseInt(cMatch[1], 10));
      continue;
    }

    const cpMatch = publishedChapterLine.exec(line);
    if (cpMatch) {
      // use the published number (e.g. Psalm 151) unless verses were already placed
      if (!chapterHasVerse) startChapter(parseInt(cpMatch[1], 10));
      continue;
    }

    if (chapterLabelLine.test(line)) continue;

    const cLine = contentLine.exec(line);
    if (cLine && verseNum !== null) {
      verseParts.push(cLine[2]);
      continue;
    }

    if (cLine === null && !line.startsWith("\\") && verseNum !== null) {
      // plain continuation text without any leading marker
      verseParts.push(line);
    }

    // any remaining backslash line is a structural heading (\s1, \d,
    // \mt1, \sp, ...) and is dropped
  }

  flushVerse();
  return { chapters: Object.keys(verses).length, verses };
}
