#!/usr/bin/env bun
/**
 * Fetch the King James Version with Apocrypha (KJVD) USFM from eBible.org and
 * convert the deuterocanonical books to our JSON format using
 * tools/usfm/parse.ts.
 *
 * Only the apocrypha is vendored. The canonical books are skipped on purpose:
 * the app already has the 1769 Oxford standard text, which is the better
 * rendering, and putting a second canonical snapshot in the tree would make
 * the canonical text swappable by accident.
 *
 * The fourteen books here are the 1611's own apocryphal corpus, in the 1611's
 * order: the source module's order. Three books the 1611 print does not have
 * (Psalm 151, 3 Maccabees, 4 Maccabees) are not in this source at all, and
 * one book it has (the Septuagint Daniel) the source does not carry, so those
 * four read in the World English Bible under the WEB corpus.
 *
 * Usage: bun scripts/fetch-kjva.ts
 */

import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type ChapterMap, parseUsfmText } from "../tools/usfm/parse";

const SOURCE_URL = "https://eBible.org/Scriptures/eng-kjv_usfm.zip";
const OUT_DIR = join(import.meta.dir, "../src/lib/content/vendor/kjva");

type BookInfo = {
  // the file prefix in the USFM zip, without the "eng-kjv.usfm" suffix
  id: string;
  book: string;
  abbrev: string;
  chapters: number;
  // the source keys this book's chapters the way the 1611 print does,
  // continuing the canonical book it belongs to rather than starting fresh.
  // the vendor file renumbers them to be 1-based within the book
  sourceChapterStart?: number;
  // the same for the first chapter's verses, which the source also continues
  // from the canonical book's numbering
  sourceFirstVerseStart?: number;
};

// the fourteen deuterocanonical books the 1611 print carries, in the 1611's
// order, which is the source module's order. the reader's corpus is this
// book list read in this text
const BOOKS: BookInfo[] = [
  { id: "41-TOB", book: "Tobit", abbrev: "Tob", chapters: 14 },
  { id: "42-JDT", book: "Judith", abbrev: "Jdt", chapters: 16 },
  {
    id: "43-ESG",
    book: "Rest of Esther",
    abbrev: "Rest Esth",
    chapters: 7,
    // the source keys the additions 10 to 16, continuing the canonical
    // Esther, and the first chapter's verses from 4 for the same reason
    sourceChapterStart: 10,
    sourceFirstVerseStart: 4,
  },
  { id: "45-WIS", book: "Wisdom of Solomon", abbrev: "Wis", chapters: 19 },
  { id: "46-SIR", book: "Sirach", abbrev: "Sir", chapters: 51 },
  { id: "47-BAR", book: "Baruch", abbrev: "Bar", chapters: 6 },
  {
    id: "49-S3Y",
    book: "Song of the Three Children",
    abbrev: "S3Y",
    chapters: 1,
  },
  { id: "50-SUS", book: "Susanna", abbrev: "Sus", chapters: 1 },
  { id: "51-BEL", book: "Bel and the Dragon", abbrev: "Bel", chapters: 1 },
  { id: "52-1MA", book: "1 Maccabees", abbrev: "1 Macc", chapters: 16 },
  { id: "53-2MA", book: "2 Maccabees", abbrev: "2 Macc", chapters: 15 },
  { id: "54-1ES", book: "1 Esdras", abbrev: "1 Esd", chapters: 9 },
  { id: "55-MAN", book: "Prayer of Manasses", abbrev: "Pr Man", chapters: 1 },
  { id: "58-2ES", book: "2 Esdras", abbrev: "2 Esd", chapters: 16 },
];

async function ensureSource(): Promise<string> {
  const cacheDir = join(tmpdir(), "bcp-kjvd-usfm");
  const zipPath = join(cacheDir, "eng-kjv_usfm.zip");
  const extractedDir = join(cacheDir, "eng-kjv_usfm");
  await mkdir(cacheDir, { recursive: true });

  if (!existsSync(join(extractedDir, "41-TOBeng-kjv.usfm"))) {
    if (!existsSync(zipPath)) {
      console.log(`Downloading ${SOURCE_URL}`);
      const res = await fetch(SOURCE_URL);
      if (!res.ok) throw new Error(`download failed: HTTP ${res.status}`);
      await writeFile(zipPath, Buffer.from(await res.arrayBuffer()));
    }
    await rm(extractedDir, { recursive: true, force: true });
    await mkdir(extractedDir, { recursive: true });
    const unzip = Bun.spawnSync([
      "unzip",
      "-o",
      "-q",
      zipPath,
      "-d",
      extractedDir,
    ]);
    if (unzip.exitCode !== 0) {
      throw new Error(`unzip failed: ${unzip.stderr?.toString()}`);
    }
  }
  return extractedDir;
}

// renumber a book the source keys the way the 1611 print does, so the app's
// single-number chapter count keeps working and the reader sees a normal
// verse run from 1
function renumber(
  verses: ChapterMap,
  chapterStart: number,
  firstVerseStart: number,
): ChapterMap {
  const out: ChapterMap = {};
  for (const [chapterKey, chapterVerses] of Object.entries(verses)) {
    const chapter = parseInt(chapterKey, 10) - chapterStart + 1;
    const target: Record<string, string> = {};
    for (const [verseKey, text] of Object.entries(chapterVerses)) {
      const verse = parseInt(verseKey, 10);
      const renumbered = chapter === 1 ? verse - firstVerseStart + 1 : verse;
      target[String(renumbered)] = text;
    }
    out[String(chapter)] = target;
  }
  return out;
}

// the renumbered book must read as an ordinary book: chapters 1 to n, and
// the first chapter's verses from 1
function assertRenumbered(book: string, verses: ChapterMap, chapters: number) {
  const keys = Object.keys(verses)
    .map((k) => parseInt(k, 10))
    .sort((a, b) => a - b);
  const expected = Array.from({ length: chapters }, (_, i) => i + 1);
  if (keys.join(",") !== expected.join(",")) {
    throw new Error(
      `${book}: renumbered chapters are ${keys.join(",")}, expected ${expected.join(",")}`,
    );
  }
  const firstVerses = Object.keys(verses["1"] ?? {})
    .map((k) => parseInt(k, 10))
    .sort((a, b) => a - b);
  if (firstVerses[0] !== 1) {
    throw new Error(
      `${book}: renumbered first chapter starts at verse ${firstVerses[0]}, expected 1`,
    );
  }
}

const BOOK_BY_ID = new Map(BOOKS.map((b) => [b.id, b]));

async function main() {
  console.log("Fetching and parsing KJVD USFM...\n");
  const extractedDir = await ensureSource();
  const files = (await readdir(extractedDir)).filter((f) =>
    f.endsWith(".usfm"),
  );
  await mkdir(OUT_DIR, { recursive: true });

  const books: { info: BookInfo; filename: string }[] = [];
  for (const file of files) {
    const idMatch = file.match(/^(\d+-[A-Z0-9]+)eng-kjv\.usfm$/);
    if (!idMatch) continue;
    const info = BOOK_BY_ID.get(idMatch[1]);
    if (!info) {
      console.log(`  - skip ${file} (not one of the fourteen books)`);
      continue;
    }
    const usfm = await readFile(join(extractedDir, file), "utf8");
    const parsedBook = parseUsfmText(usfm);

    if (parsedBook.chapters !== info.chapters) {
      throw new Error(
        `${info.book}: expected ${info.chapters} chapters, got ${parsedBook.chapters}`,
      );
    }

    let verses = parsedBook.verses;
    if (info.sourceChapterStart !== undefined) {
      verses = renumber(
        verses,
        info.sourceChapterStart,
        info.sourceFirstVerseStart ?? 1,
      );
      assertRenumbered(info.book, verses, info.chapters);
    }

    const book = {
      book: info.book,
      abbrev: info.abbrev,
      testament: "DC",
      chapters: parsedBook.chapters,
      verses,
    };

    const filename = `${info.abbrev.toLowerCase().replace(/\s+/g, "")}.json`;
    await writeFile(join(OUT_DIR, filename), `${JSON.stringify(book)}\n`);
    books.push({ info, filename });
    console.log(
      `  ✓ ${info.book} → ${filename} (${parsedBook.chapters} chapters)`,
    );
  }

  if (books.length !== BOOKS.length) {
    throw new Error(
      `expected ${BOOKS.length} books, got ${books.length}: ${BOOKS.filter(
        (b) => !books.some((x) => x.info.id === b.id),
      )
        .map((b) => b.id)
        .join(", ")}`,
    );
  }

  // generate the barrel file (same shape as the WEB vendor barrel)
  // the identifier drops the file extension: b_tob, not b_tob.json
  const toId = (filename: string) => `b_${filename.replace(/\.json$/, "")}`;
  const imports = books
    .map((b) => `import ${toId(b.filename)} from "./${b.filename}";`)
    .join("\n");
  const exports_ = books.map((b) => toId(b.filename)).join(", ");
  const types = books
    .map((b) => `  ${toId(b.filename)}: typeof ${toId(b.filename)};`)
    .join("\n");
  const recordEntries = books
    .map((b) => `  ${toId(b.filename)}: "${toId(b.filename)}",`)
    .join("\n");

  const barrel = `// Auto-generated by scripts/fetch-kjva.ts, do not edit manually
${imports}

export { ${exports_} };

export type KjvaBookImports = {
${types}
};

export const kjvaBookImports: Record<string, keyof KjvaBookImports> = {
${recordEntries}
};
`;

  await writeFile(join(OUT_DIR, "index.ts"), barrel);

  const provenance = `# King James Version with Apocrypha (KJVA) provenance

The King James Version (Authorized Version) of 1611 is in the PUBLIC DOMAIN in
the United States and most jurisdictions. The apocryphal books here are the
1611 text as printed in the Authorized Version, from the eBible.org "King
James Version + Apocrypha" module, courtesy of the CrossWire Bible Society.

No license restrictions apply. The text may be freely copied, distributed,
modified, and used for any purpose.

## Source

- eBible.org: https://ebible.org/Scriptures/eng-kjv_usfm.zip
- Project: https://ebible.org/eng-kjv/

## What is vendored

Only the apocrypha. No canonical book is included, so there is no path by
which the canonical text can be swapped: the app's own KJV vendor (the 1769
Oxford standard text) stays the canonical text under every setting.

Fourteen deuterocanonical books, the 1611 print's own apocryphal corpus, in
the 1611's order:

Tobit, Judith, Rest of Esther, Wisdom of Solomon, Sirach, Baruch, the Song of
the Three Children, Susanna, Bel and the Dragon, 1 Maccabees, 2 Maccabees,
1 Esdras, Prayer of Manasses, 2 Esdras.

Four books read in the World English Bible under the WEB corpus, because the
source has no counterpart for them:

- Esther (Greek): the source carries the additions only, seven chapters keyed
  10 to 16 as the 1611 prints them, against the WEB's whole Greek Esther in
  ten chapters. Different text under a different division, not one text
  renumbered, so the two are never linked.
- Daniel (Greek): the source has no Septuagint Daniel. The WEB's is the
  whole Septuagint Daniel, chapters 1 to 12 in the Septuagint's text, then
  Susanna and Bel and the Dragon as chapters 13 and 14.
- Psalm 151: the 1611 print has it, the source does not.
- 3 Maccabees and 4 Maccabees: the 1611 print has neither.

## Extraction notes

- Each book is a separate JSON file (tob.json, jdt.json, ..., 2esd.json)
- Same schema and file naming as the WEB vendor (src/lib/content/vendor/web)
- Parsed from USFM with tools/usfm/parse.ts (see scripts/fetch-kjva.ts)
- Footnotes, cross-references, Strong's numbers, and section headings are
  removed
- The divine name is written "Lord" and "God", as it is in this source and in
  the WEB's apocrypha. The "LORD" convention the canonical vendors use comes
  from a small-caps marker this source does not carry in the apocrypha.
- Sirach has 1393 verses against the WEB's 1359, and 2 Esdras has 874 against
  944. The chapter structure is the same in both, the verse divisions are
  not.
- The Rest of Esther is renumbered. The source keys its chapters 10 to 16,
  continuing the canonical Esther the way the 1611 print does, and its first
  chapter's verses from 4 for the same reason. The vendor file renumbers
  both to 1-based within the book, so the app's single-number chapter count
  keeps working. The source's original keys are recorded here.
- 14 books, all deuterocanonical
`;

  await writeFile(join(OUT_DIR, "PROVENANCE.md"), provenance);
  console.log(`\n✓ Generated barrel file with ${books.length} books`);
  console.log("✓ Generated PROVENANCE.md");
  console.log("✓ Done!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
