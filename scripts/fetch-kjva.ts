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
 * Only the books whose chapter structure matches the book the app already has
 * are vendored, so the deuterocanonical corpus keeps the same shape under
 * either apocryphal text.
 *
 * Usage: bun scripts/fetch-kjva.ts
 */

import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseUsfmText } from "../tools/usfm/parse";

const SOURCE_URL = "https://eBible.org/Scriptures/eng-kjv_usfm.zip";
const OUT_DIR = join(import.meta.dir, "../src/lib/content/vendor/kjva");

type BookInfo = {
  // the file prefix in the USFM zip, without the "eng-kjv.usfm" suffix
  id: string;
  book: string;
  abbrev: string;
  chapters: number;
};

// the ten deuterocanonical books the KJVD carries in the same shape as the
// book the app already has. the five the app has that the KJVD does not match
// (Esther Greek, Daniel Greek, Psalm 151, 3 Maccabees, 4 Maccabees) are not
// here, and neither are the three KJVD-only books
const BOOKS: BookInfo[] = [
  { id: "41-TOB", book: "Tobit", abbrev: "Tob", chapters: 14 },
  { id: "42-JDT", book: "Judith", abbrev: "Jdt", chapters: 16 },
  { id: "45-WIS", book: "Wisdom of Solomon", abbrev: "Wis", chapters: 19 },
  { id: "46-SIR", book: "Sirach", abbrev: "Sir", chapters: 51 },
  { id: "47-BAR", book: "Baruch", abbrev: "Bar", chapters: 6 },
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
      console.log(`  - skip ${file} (not one of the ten matching books)`);
      continue;
    }
    const usfm = await readFile(join(extractedDir, file), "utf8");
    const parsedBook = parseUsfmText(usfm);

    if (parsedBook.chapters !== info.chapters) {
      throw new Error(
        `${info.book}: expected ${info.chapters} chapters, got ${parsedBook.chapters}`,
      );
    }

    const book = {
      book: info.book,
      abbrev: info.abbrev,
      testament: "DC",
      chapters: parsedBook.chapters,
      verses: parsedBook.verses,
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

Ten deuterocanonical books, the ones whose chapter structure matches the book
the app already has:

Tobit, Judith, Wisdom of Solomon, Sirach, Baruch, 1 Maccabees, 2 Maccabees,
1 Esdras, Prayer of Manasses, 2 Esdras.

Five deuterocanonical books read in the World English Bible under both
settings, because the KJVD either has no counterpart or has one in a
different shape:

- Esther (Greek): the KJVD carries the additions only, seven chapters keyed
  10 to 16 as the 1611 prints them, against the WEB's whole Greek Esther in
  ten chapters. Different text under a different division, not one text
  renumbered.
- Daniel (Greek), Psalm 151, 3 Maccabees, 4 Maccabees: no counterpart in
  the KJVD. The 1611 print has no 3 or 4 Maccabees, and Psalm 151, which the
  1611 did print, is missing from this source.

Three KJVD-only books, 3 Holy Children's Song, Susanna and Bel and the
Dragon, are not vendored either. The app has no standalone books for them,
and adding them would make the deuterocanonical corpus differ between the
two texts.

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
- 10 books, all deuterocanonical
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
