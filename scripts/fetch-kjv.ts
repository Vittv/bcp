#!/usr/bin/env bun
/**
 * Fetch KJV Bible from aruljohn/Bible-kjv and convert to our JSON format.
 * Usage: bun scripts/fetch-kjv.ts
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const REPO = "aruljohn/Bible-kjv";
const OUT_DIR = join(import.meta.dir, "../src/lib/content/vendor/kjv");

// Our book metadata, abbrev and testament
const BOOKS: {
  file: string;
  book: string;
  abbrev: string;
  testament: "OT" | "NT";
}[] = [
  // OT
  { file: "Genesis", book: "Genesis", abbrev: "Gen", testament: "OT" },
  { file: "Exodus", book: "Exodus", abbrev: "Exod", testament: "OT" },
  { file: "Leviticus", book: "Leviticus", abbrev: "Lev", testament: "OT" },
  { file: "Numbers", book: "Numbers", abbrev: "Num", testament: "OT" },
  { file: "Deuteronomy", book: "Deuteronomy", abbrev: "Deut", testament: "OT" },
  { file: "Joshua", book: "Joshua", abbrev: "Josh", testament: "OT" },
  { file: "Judges", book: "Judges", abbrev: "Judg", testament: "OT" },
  { file: "Ruth", book: "Ruth", abbrev: "Ruth", testament: "OT" },
  { file: "1Samuel", book: "1 Samuel", abbrev: "1 Sam", testament: "OT" },
  { file: "2Samuel", book: "2 Samuel", abbrev: "2 Sam", testament: "OT" },
  { file: "1Kings", book: "1 Kings", abbrev: "1 Kgs", testament: "OT" },
  { file: "2Kings", book: "2 Kings", abbrev: "2 Kgs", testament: "OT" },
  {
    file: "1Chronicles",
    book: "1 Chronicles",
    abbrev: "1 Chr",
    testament: "OT",
  },
  {
    file: "2Chronicles",
    book: "2 Chronicles",
    abbrev: "2 Chr",
    testament: "OT",
  },
  { file: "Ezra", book: "Ezra", abbrev: "Ezra", testament: "OT" },
  { file: "Nehemiah", book: "Nehemiah", abbrev: "Neh", testament: "OT" },
  { file: "Esther", book: "Esther", abbrev: "Esth", testament: "OT" },
  { file: "Job", book: "Job", abbrev: "Job", testament: "OT" },
  { file: "Psalms", book: "Psalms", abbrev: "Ps", testament: "OT" },
  { file: "Proverbs", book: "Proverbs", abbrev: "Prov", testament: "OT" },
  {
    file: "Ecclesiastes",
    book: "Ecclesiastes",
    abbrev: "Eccl",
    testament: "OT",
  },
  {
    file: "SongofSolomon",
    book: "Song of Solomon",
    abbrev: "Song",
    testament: "OT",
  },
  { file: "Isaiah", book: "Isaiah", abbrev: "Isa", testament: "OT" },
  { file: "Jeremiah", book: "Jeremiah", abbrev: "Jer", testament: "OT" },
  {
    file: "Lamentations",
    book: "Lamentations",
    abbrev: "Lam",
    testament: "OT",
  },
  { file: "Ezekiel", book: "Ezekiel", abbrev: "Ezek", testament: "OT" },
  { file: "Daniel", book: "Daniel", abbrev: "Dan", testament: "OT" },
  { file: "Hosea", book: "Hosea", abbrev: "Hos", testament: "OT" },
  { file: "Joel", book: "Joel", abbrev: "Joel", testament: "OT" },
  { file: "Amos", book: "Amos", abbrev: "Amos", testament: "OT" },
  { file: "Obadiah", book: "Obadiah", abbrev: "Obad", testament: "OT" },
  { file: "Jonah", book: "Jonah", abbrev: "Jonah", testament: "OT" },
  { file: "Micah", book: "Micah", abbrev: "Mic", testament: "OT" },
  { file: "Nahum", book: "Nahum", abbrev: "Nah", testament: "OT" },
  { file: "Habakkuk", book: "Habakkuk", abbrev: "Hab", testament: "OT" },
  { file: "Zephaniah", book: "Zephaniah", abbrev: "Zeph", testament: "OT" },
  { file: "Haggai", book: "Haggai", abbrev: "Hag", testament: "OT" },
  { file: "Zechariah", book: "Zechariah", abbrev: "Zech", testament: "OT" },
  { file: "Malachi", book: "Malachi", abbrev: "Mal", testament: "OT" },
  // NT
  { file: "Matthew", book: "Matthew", abbrev: "Matt", testament: "NT" },
  { file: "Mark", book: "Mark", abbrev: "Mark", testament: "NT" },
  { file: "Luke", book: "Luke", abbrev: "Luke", testament: "NT" },
  { file: "John", book: "John", abbrev: "John", testament: "NT" },
  { file: "Acts", book: "Acts", abbrev: "Acts", testament: "NT" },
  { file: "Romans", book: "Romans", abbrev: "Rom", testament: "NT" },
  {
    file: "1Corinthians",
    book: "1 Corinthians",
    abbrev: "1 Cor",
    testament: "NT",
  },
  {
    file: "2Corinthians",
    book: "2 Corinthians",
    abbrev: "2 Cor",
    testament: "NT",
  },
  { file: "Galatians", book: "Galatians", abbrev: "Gal", testament: "NT" },
  { file: "Ephesians", book: "Ephesians", abbrev: "Eph", testament: "NT" },
  { file: "Philippians", book: "Philippians", abbrev: "Phil", testament: "NT" },
  { file: "Colossians", book: "Colossians", abbrev: "Col", testament: "NT" },
  {
    file: "1Thessalonians",
    book: "1 Thessalonians",
    abbrev: "1 Thess",
    testament: "NT",
  },
  {
    file: "2Thessalonians",
    book: "2 Thessalonians",
    abbrev: "2 Thess",
    testament: "NT",
  },
  { file: "1Timothy", book: "1 Timothy", abbrev: "1 Tim", testament: "NT" },
  { file: "2Timothy", book: "2 Timothy", abbrev: "2 Tim", testament: "NT" },
  { file: "Titus", book: "Titus", abbrev: "Titus", testament: "NT" },
  { file: "Philemon", book: "Philemon", abbrev: "Phlm", testament: "NT" },
  { file: "Hebrews", book: "Hebrews", abbrev: "Heb", testament: "NT" },
  { file: "James", book: "James", abbrev: "Jas", testament: "NT" },
  { file: "1Peter", book: "1 Peter", abbrev: "1 Pet", testament: "NT" },
  { file: "2Peter", book: "2 Peter", abbrev: "2 Pet", testament: "NT" },
  { file: "1John", book: "1 John", abbrev: "1 John", testament: "NT" },
  { file: "2John", book: "2 John", abbrev: "2 John", testament: "NT" },
  { file: "3John", book: "3 John", abbrev: "3 John", testament: "NT" },
  { file: "Jude", book: "Jude", abbrev: "Jude", testament: "NT" },
  { file: "Revelation", book: "Revelation", abbrev: "Rev", testament: "NT" },
];

async function fetchBook(info: (typeof BOOKS)[0]): Promise<void> {
  const url = `https://raw.githubusercontent.com/${REPO}/master/${encodeURIComponent(info.file)}.json`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`  ✗ ${info.book}: HTTP ${res.status}`);
    return;
  }
  const raw = (await res.json()) as {
    book_name: string;
    chapters: { chapter: string; verses: { verse: string; text: string }[] }[];
  };

  // convert to our format
  const verses: Record<string, Record<string, string>> = {};
  for (const ch of raw.chapters) {
    const chVerses: Record<string, string> = {};
    for (const v of ch.verses) {
      chVerses[v.verse] = v.text;
    }
    verses[ch.chapter] = chVerses;
  }

  const book = {
    book: info.book,
    abbrev: info.abbrev,
    testament: info.testament,
    chapters: raw.chapters.length,
    verses,
  };

  const filename = info.abbrev.toLowerCase().replace(/\s+/g, "") + ".json";
  await writeFile(join(OUT_DIR, filename), JSON.stringify(book) + "\n");
  console.log(
    `  ✓ ${info.book} → ${filename} (${raw.chapters.length} chapters)`,
  );
}

async function main() {
  console.log("Fetching KJV Bible from aruljohn/Bible-kjv...\n");

  // fetch in batches of 10 to avoid rate limiting
  for (let i = 0; i < BOOKS.length; i += 10) {
    const batch = BOOKS.slice(i, i + 10);
    await Promise.all(batch.map(fetchBook));
  }

  // generate barrel file
  // prefix with b_ to make valid JS identifiers (can't start with number)
  const toId = (filename: string) => `b_${filename}`;

  const imports = BOOKS.map((b) => {
    const filename = b.abbrev.toLowerCase().replace(/\s+/g, "");
    return `import ${toId(filename)} from "./${filename}.json";`;
  }).join("\n");

  const exports = BOOKS.map((b) => {
    const filename = b.abbrev.toLowerCase().replace(/\s+/g, "");
    return toId(filename);
  }).join(", ");

  const types = BOOKS.map((b) => {
    const filename = b.abbrev.toLowerCase().replace(/\s+/g, "");
    return `  ${toId(filename)}: typeof ${toId(filename)};`;
  }).join("\n");

  const recordEntries = BOOKS.map((b) => {
    const filename = b.abbrev.toLowerCase().replace(/\s+/g, "");
    return `  ${toId(filename)}: "${toId(filename)}",`;
  }).join("\n");

  const barrel = `// Auto-generated by scripts/fetch-kjv.ts, do not edit manually
${imports}

export { ${exports} };

export type KjvBookImports = {
${types}
};

export const kjvBookImports: Record<string, keyof KjvBookImports> = {
${recordEntries}
};
`;

  await writeFile(join(OUT_DIR, "index.ts"), barrel);
  console.log(`\n✓ Generated barrel file with ${BOOKS.length} books`);
  console.log(`✓ Done!`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
