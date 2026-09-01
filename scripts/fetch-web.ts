#!/usr/bin/env bun
/**
 * Fetch World English Bible British Edition (WEBBE) USFM from eBible.org and
 * convert to our JSON format using tools/usfm/parse.ts.
 * Usage: bun scripts/fetch-web.ts
 */

import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { KJV_BOOKS } from "../src/lib/content/kjv";
import { parseUsfmText } from "../tools/usfm/parse";

const SOURCE_URL = "https://eBible.org/Scriptures/eng-webbe_usfm.zip";
const OUT_DIR = join(import.meta.dir, "../src/lib/content/vendor/web");

type BookInfo = {
  id: string;
  book: string;
  abbrev: string;
  testament: "OT" | "NT" | "DC";
};

// USFM book code -> our canonical abbrev (metadata comes from KJV_BOOKS)
const CANONICAL_CODE_TO_ABBREV: Record<string, string> = {
  GEN: "Gen",
  EXO: "Exod",
  LEV: "Lev",
  NUM: "Num",
  DEU: "Deut",
  JOS: "Josh",
  JDG: "Judg",
  RUT: "Ruth",
  "1SA": "1 Sam",
  "2SA": "2 Sam",
  "1KI": "1 Kgs",
  "2KI": "2 Kgs",
  "1CH": "1 Chr",
  "2CH": "2 Chr",
  EZR: "Ezra",
  NEH: "Neh",
  EST: "Esth",
  JOB: "Job",
  PSA: "Ps",
  PRO: "Prov",
  ECC: "Eccl",
  SNG: "Song",
  ISA: "Isa",
  JER: "Jer",
  LAM: "Lam",
  EZK: "Ezek",
  DAN: "Dan",
  HOS: "Hos",
  JOL: "Joel",
  AMO: "Amos",
  OBA: "Obad",
  JON: "Jonah",
  MIC: "Mic",
  NAM: "Nah",
  HAB: "Hab",
  ZEP: "Zeph",
  HAG: "Hag",
  ZEC: "Zech",
  MAL: "Mal",
  MAT: "Matt",
  MRK: "Mark",
  LUK: "Luke",
  JHN: "John",
  ACT: "Acts",
  ROM: "Rom",
  "1CO": "1 Cor",
  "2CO": "2 Cor",
  GAL: "Gal",
  EPH: "Eph",
  PHP: "Phil",
  COL: "Col",
  "1TH": "1 Thess",
  "2TH": "2 Thess",
  "1TI": "1 Tim",
  "2TI": "2 Tim",
  TIT: "Titus",
  PHM: "Phlm",
  HEB: "Heb",
  JAS: "Jas",
  "1PE": "1 Pet",
  "2PE": "2 Pet",
  "1JN": "1 John",
  "2JN": "2 John",
  "3JN": "3 John",
  JUD: "Jude",
  REV: "Rev",
};

const DEUTEROCANON: BookInfo[] = [
  { id: "TOB", book: "Tobit", abbrev: "Tob", testament: "DC" },
  { id: "JDT", book: "Judith", abbrev: "Jdt", testament: "DC" },
  {
    id: "ESG",
    book: "Esther (Greek)",
    abbrev: "Add Esth",
    testament: "DC",
  },
  {
    id: "WIS",
    book: "Wisdom of Solomon",
    abbrev: "Wis",
    testament: "DC",
  },
  { id: "SIR", book: "Sirach", abbrev: "Sir", testament: "DC" },
  { id: "BAR", book: "Baruch", abbrev: "Bar", testament: "DC" },
  {
    id: "1MA",
    book: "1 Maccabees",
    abbrev: "1 Macc",
    testament: "DC",
  },
  {
    id: "2MA",
    book: "2 Maccabees",
    abbrev: "2 Macc",
    testament: "DC",
  },
  { id: "1ES", book: "1 Esdras", abbrev: "1 Esd", testament: "DC" },
  {
    id: "MAN",
    book: "Prayer of Manasses",
    abbrev: "Pr Man",
    testament: "DC",
  },
  { id: "PS2", book: "Psalm 151", abbrev: "Ps 151", testament: "DC" },
  {
    id: "3MA",
    book: "3 Maccabees",
    abbrev: "3 Macc",
    testament: "DC",
  },
  { id: "2ES", book: "2 Esdras", abbrev: "2 Esd", testament: "DC" },
  {
    id: "4MA",
    book: "4 Maccabees",
    abbrev: "4 Macc",
    testament: "DC",
  },
  {
    id: "DAG",
    book: "Daniel (Greek)",
    abbrev: "Dan Grk",
    testament: "DC",
  },
];

function canonicalBooks(): BookInfo[] {
  const byAbbrev = new Map(KJV_BOOKS.map((b) => [b.abbrev, b]));
  return Object.entries(CANONICAL_CODE_TO_ABBREV).map(([id, abbrev]) => {
    const meta = byAbbrev.get(abbrev);
    if (!meta) throw new Error(`no KJV metadata for abbrev ${abbrev}`);
    return { id, book: meta.book, abbrev, testament: meta.testament };
  });
}

const BOOKS = [...canonicalBooks(), ...DEUTEROCANON];

const EXPECTED_CHAPTERS: Record<string, number> = {
  TOB: 14,
  JDT: 16,
  ESG: 10,
  WIS: 19,
  SIR: 51,
  BAR: 6,
  "1MA": 16,
  "2MA": 15,
  "1ES": 9,
  MAN: 1,
  PS2: 1,
  "3MA": 7,
  "2ES": 16,
  "4MA": 18,
  DAG: 14,
};

async function ensureSource(): Promise<string> {
  const cacheDir = join(tmpdir(), "bcp-webbe-usfm");
  const zipPath = join(cacheDir, "eng-webbe_usfm.zip");
  const extractedDir = join(cacheDir, "eng-webbe_usfm");
  await mkdir(cacheDir, { recursive: true });

  if (!existsSync(join(extractedDir, "02-GENeng-webbe.usfm"))) {
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
  console.log("Fetching and parsing WEBBE USFM...\n");
  const extractedDir = await ensureSource();
  const files = (await readdir(extractedDir)).filter((f) =>
    f.endsWith(".usfm"),
  );
  await mkdir(OUT_DIR, { recursive: true });

  const books = [];
  for (const file of files) {
    const idMatch = file.match(/([A-Z0-9]+)eng-webbe\.usfm$/);
    if (!idMatch) continue;
    const info = BOOK_BY_ID.get(idMatch[1]);
    if (!info) {
      console.log(`  - skip ${file} (not a canonical/adopted book)`);
      continue;
    }
    const usfm = await readFile(join(extractedDir, file), "utf8");
    const parsedBook = parseUsfmText(usfm);

    const expected = EXPECTED_CHAPTERS[info.id];
    if (expected !== undefined && parsedBook.chapters !== expected) {
      console.warn(
        `  ! ${info.book}: expected ${expected} chapters, got ${parsedBook.chapters}`,
      );
    }

    const book = {
      book: info.book,
      abbrev: info.abbrev,
      testament: info.testament,
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

  // generate barrel file (same shape as the KJV vendor barrel)
  // the identifier drops the file extension: b_gen, not b_gen.json
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

  const barrel = `// Auto-generated by scripts/fetch-web.ts, do not edit manually
${imports}

export { ${exports_} };

export type WebBookImports = {
${types}
};

export const webBookImports: Record<string, keyof WebBookImports> = {
${recordEntries}
};
`;

  await writeFile(join(OUT_DIR, "index.ts"), barrel);

  const provenance = `# World English Bible, British Edition (WEBBE) provenance

The World English Bible (WEB) is a Modern English translation of the Holy
Bible. It is built upon the American Standard Version (ASV) of 1901, and is
in the PUBLIC DOMAIN, with no copyright and no licensing restrictions.

The British Edition (WEBBE) uses British spellings and the acronym "LORD"
for the divine name. The deuterocanonical books ("Apocrypha", marked as
testament "DC") are drawn from the single ecumenical collection; Psalm 151,
the Prayer of Manasses, and the Greek additions to Daniel and Esther are
included.

## Source

- eBible.org: https://ebible.org/Scriptures/eng-webbe_usfm.zip
- Project: https://ebible.org/eng-webbe/

## Extraction notes

- Each book is a separate JSON file (gen.json, exod.json, ..., dangrk.json)
- Same schema and file naming as the KJV vendor (src/lib/content/vendor/kjv)
- Parsed from USFM with tools/usfm/parse.ts (see scripts/fetch-web.ts)
- Chapter/verse numbers follow the deuterocanonical "published" numbering,
  so Psalm 151 is chapter "151" and Esther (Greek) keeps the Hebrew-Esther
  verse numbers with the additions merged into 1:1, 5:1, and 8:12
- Footnotes, cross-references, Strong's numbers, and section headings are
  removed; psalm superscriptions (\\d in USFM) are dropped to match the
  vendored KJV, but "Selah" and the words of Jesus are kept
- Verses consisting only of an editorial footnote (e.g. Sirach verses
  omitted by the best authorities, Romans 16:25) are excluded, since they
  have no renderable text; combined-verse ranges like "\\v 28-29" keep
  their text under the first verse number
- 81 books: 39 OT, 27 NT, 15 deuterocanonical
`;

  await writeFile(join(OUT_DIR, "PROVENANCE.md"), provenance);
  console.log(`\n✓ Generated barrel file with ${books.length} books`);
  console.log(`✓ Generated PROVENANCE.md`);
  console.log(`✓ Done!`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
