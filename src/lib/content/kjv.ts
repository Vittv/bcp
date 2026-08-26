import { kjvBookSchema } from "./schemas";
import type { KjvBook, KjvPassage } from "./types";
import * as kjvBooks from "./vendor/kjv/index";

export type { KjvBook, KjvPassage };

export type KjvBookMeta = {
  book: string;
  abbrev: string;
  testament: "OT" | "NT";
  chapters: number;
  dolRefNames: string[];
};

export const KJV_BOOKS: KjvBookMeta[] = [
  {
    book: "Genesis",
    abbrev: "Gen",
    testament: "OT",
    chapters: 50,
    dolRefNames: ["Gen"],
  },
  {
    book: "Exodus",
    abbrev: "Exod",
    testament: "OT",
    chapters: 40,
    dolRefNames: ["Exod", "Ex"],
  },
  {
    book: "Leviticus",
    abbrev: "Lev",
    testament: "OT",
    chapters: 27,
    dolRefNames: ["Lev"],
  },
  {
    book: "Numbers",
    abbrev: "Num",
    testament: "OT",
    chapters: 36,
    dolRefNames: ["Num", "Nm"],
  },
  {
    book: "Deuteronomy",
    abbrev: "Deut",
    testament: "OT",
    chapters: 34,
    dolRefNames: ["Deut", "Dt"],
  },
  {
    book: "Joshua",
    abbrev: "Josh",
    testament: "OT",
    chapters: 24,
    dolRefNames: ["Josh", "Jos"],
  },
  {
    book: "Judges",
    abbrev: "Judg",
    testament: "OT",
    chapters: 21,
    dolRefNames: ["Judg", "Jdg", "Jg"],
  },
  {
    book: "Ruth",
    abbrev: "Ruth",
    testament: "OT",
    chapters: 4,
    dolRefNames: ["Ruth", "Ru"],
  },
  {
    book: "1 Samuel",
    abbrev: "1 Sam",
    testament: "OT",
    chapters: 31,
    dolRefNames: ["1 Sam", "1 Sm", "1 Samuel"],
  },
  {
    book: "2 Samuel",
    abbrev: "2 Sam",
    testament: "OT",
    chapters: 24,
    dolRefNames: ["2 Sam", "2 Sm", "2 Samuel"],
  },
  {
    book: "1 Kings",
    abbrev: "1 Kgs",
    testament: "OT",
    chapters: 22,
    dolRefNames: ["1 Kgs", "1 Ki", "1 Kings"],
  },
  {
    book: "2 Kings",
    abbrev: "2 Kgs",
    testament: "OT",
    chapters: 25,
    dolRefNames: ["2 Kgs", "2 Ki", "2 Kings"],
  },
  {
    book: "1 Chronicles",
    abbrev: "1 Chr",
    testament: "OT",
    chapters: 29,
    dolRefNames: ["1 Chr", "1 Ch", "1 Chronicles"],
  },
  {
    book: "2 Chronicles",
    abbrev: "2 Chr",
    testament: "OT",
    chapters: 36,
    dolRefNames: ["2 Chr", "2 Ch", "2 Chronicles"],
  },
  {
    book: "Ezra",
    abbrev: "Ezra",
    testament: "OT",
    chapters: 10,
    dolRefNames: ["Ezra"],
  },
  {
    book: "Nehemiah",
    abbrev: "Neh",
    testament: "OT",
    chapters: 13,
    dolRefNames: ["Neh", "Ne"],
  },
  {
    book: "Esther",
    abbrev: "Esth",
    testament: "OT",
    chapters: 10,
    dolRefNames: ["Esth", "Est"],
  },
  {
    book: "Job",
    abbrev: "Job",
    testament: "OT",
    chapters: 42,
    dolRefNames: ["Job", "Jb"],
  },
  {
    book: "Psalms",
    abbrev: "Ps",
    testament: "OT",
    chapters: 150,
    dolRefNames: ["Ps", "Psalm", "Psa", "Psalms"],
  },
  {
    book: "Proverbs",
    abbrev: "Prov",
    testament: "OT",
    chapters: 31,
    dolRefNames: ["Prov", "Pr", "Proverbs"],
  },
  {
    book: "Ecclesiastes",
    abbrev: "Eccl",
    testament: "OT",
    chapters: 12,
    dolRefNames: ["Eccl", "Ec", "Ecclesiastes", "Qoheleth"],
  },
  {
    book: "Song of Solomon",
    abbrev: "Song",
    testament: "OT",
    chapters: 8,
    dolRefNames: [
      "Song",
      "Sg",
      "Song of Solomon",
      "Song of Songs",
      "Canticles",
    ],
  },
  {
    book: "Isaiah",
    abbrev: "Isa",
    testament: "OT",
    chapters: 66,
    dolRefNames: ["Isa", "Is", "Isaiah"],
  },
  {
    book: "Jeremiah",
    abbrev: "Jer",
    testament: "OT",
    chapters: 52,
    dolRefNames: ["Jer", "Je", "Jeremiah"],
  },
  {
    book: "Lamentations",
    abbrev: "Lam",
    testament: "OT",
    chapters: 5,
    dolRefNames: ["Lam", "La", "Lamentations"],
  },
  {
    book: "Ezekiel",
    abbrev: "Ezek",
    testament: "OT",
    chapters: 48,
    dolRefNames: ["Ezek", "Eze", "Ezekiel"],
  },
  {
    book: "Daniel",
    abbrev: "Dan",
    testament: "OT",
    chapters: 12,
    dolRefNames: ["Dan", "Da", "Daniel"],
  },
  {
    book: "Hosea",
    abbrev: "Hos",
    testament: "OT",
    chapters: 14,
    dolRefNames: ["Hos", "Ho", "Hosea"],
  },
  {
    book: "Joel",
    abbrev: "Joel",
    testament: "OT",
    chapters: 3,
    dolRefNames: ["Joel", "Jl"],
  },
  {
    book: "Amos",
    abbrev: "Amos",
    testament: "OT",
    chapters: 9,
    dolRefNames: ["Amos", "Am"],
  },
  {
    book: "Obadiah",
    abbrev: "Obad",
    testament: "OT",
    chapters: 1,
    dolRefNames: ["Obad", "Ob", "Obadiah"],
  },
  {
    book: "Jonah",
    abbrev: "Jonah",
    testament: "OT",
    chapters: 4,
    dolRefNames: ["Jonah", "Jon", "Jnh"],
  },
  {
    book: "Micah",
    abbrev: "Mic",
    testament: "OT",
    chapters: 7,
    dolRefNames: ["Mic", "Mc", "Micah"],
  },
  {
    book: "Nahum",
    abbrev: "Nah",
    testament: "OT",
    chapters: 3,
    dolRefNames: ["Nah", "Na", "Nahum"],
  },
  {
    book: "Habakkuk",
    abbrev: "Hab",
    testament: "OT",
    chapters: 3,
    dolRefNames: ["Hab", "Habakkuk"],
  },
  {
    book: "Zephaniah",
    abbrev: "Zeph",
    testament: "OT",
    chapters: 3,
    dolRefNames: ["Zeph", "Zep", "Zephaniah"],
  },
  {
    book: "Haggai",
    abbrev: "Hag",
    testament: "OT",
    chapters: 2,
    dolRefNames: ["Hag", "Hg", "Haggai"],
  },
  {
    book: "Zechariah",
    abbrev: "Zech",
    testament: "OT",
    chapters: 14,
    dolRefNames: ["Zech", "Zec", "Zechariah"],
  },
  {
    book: "Malachi",
    abbrev: "Mal",
    testament: "OT",
    chapters: 4,
    dolRefNames: ["Mal", "Ml", "Malachi"],
  },
  {
    book: "Matthew",
    abbrev: "Matt",
    testament: "NT",
    chapters: 28,
    dolRefNames: ["Matt", "Mt", "Matthew"],
  },
  {
    book: "Mark",
    abbrev: "Mark",
    testament: "NT",
    chapters: 16,
    dolRefNames: ["Mark", "Mk", "Mr"],
  },
  {
    book: "Luke",
    abbrev: "Luke",
    testament: "NT",
    chapters: 24,
    dolRefNames: ["Luke", "Lk", "L"],
  },
  {
    book: "John",
    abbrev: "John",
    testament: "NT",
    chapters: 21,
    dolRefNames: ["John", "Jn", "Jhn"],
  },
  {
    book: "Acts",
    abbrev: "Acts",
    testament: "NT",
    chapters: 28,
    dolRefNames: ["Acts", "Ac"],
  },
  {
    book: "Romans",
    abbrev: "Rom",
    testament: "NT",
    chapters: 16,
    dolRefNames: ["Rom", "Ro", "Rm", "Romans"],
  },
  {
    book: "1 Corinthians",
    abbrev: "1 Cor",
    testament: "NT",
    chapters: 16,
    dolRefNames: ["1 Cor", "1 Co", "1 Corinthians"],
  },
  {
    book: "2 Corinthians",
    abbrev: "2 Cor",
    testament: "NT",
    chapters: 13,
    dolRefNames: ["2 Cor", "2 Co", "2 Corinthians"],
  },
  {
    book: "Galatians",
    abbrev: "Gal",
    testament: "NT",
    chapters: 6,
    dolRefNames: ["Gal", "Ga", "Galatians"],
  },
  {
    book: "Ephesians",
    abbrev: "Eph",
    testament: "NT",
    chapters: 6,
    dolRefNames: ["Eph", "Ephesians"],
  },
  {
    book: "Philippians",
    abbrev: "Phil",
    testament: "NT",
    chapters: 4,
    dolRefNames: ["Phil", "Php", "Pp", "Philippians"],
  },
  {
    book: "Colossians",
    abbrev: "Col",
    testament: "NT",
    chapters: 4,
    dolRefNames: ["Col", "Co", "Colossians"],
  },
  {
    book: "1 Thessalonians",
    abbrev: "1 Thess",
    testament: "NT",
    chapters: 5,
    dolRefNames: ["1 Thess", "1 Th", "1 Thessalonians"],
  },
  {
    book: "2 Thessalonians",
    abbrev: "2 Thess",
    testament: "NT",
    chapters: 3,
    dolRefNames: ["2 Thess", "2 Th", "2 Thessalonians"],
  },
  {
    book: "1 Timothy",
    abbrev: "1 Tim",
    testament: "NT",
    chapters: 6,
    dolRefNames: ["1 Tim", "1 Ti", "1 Timothy"],
  },
  {
    book: "2 Timothy",
    abbrev: "2 Tim",
    testament: "NT",
    chapters: 4,
    dolRefNames: ["2 Tim", "2 Ti", "2 Timothy"],
  },
  {
    book: "Titus",
    abbrev: "Titus",
    testament: "NT",
    chapters: 3,
    dolRefNames: ["Titus", "Tit", "Ti"],
  },
  {
    book: "Philemon",
    abbrev: "Phlm",
    testament: "NT",
    chapters: 1,
    dolRefNames: ["Phlm", "Phm", "Philemon"],
  },
  {
    book: "Hebrews",
    abbrev: "Heb",
    testament: "NT",
    chapters: 13,
    dolRefNames: ["Heb", "Hebrews"],
  },
  {
    book: "James",
    abbrev: "Jas",
    testament: "NT",
    chapters: 5,
    dolRefNames: ["Jas", "Jm", "James"],
  },
  {
    book: "1 Peter",
    abbrev: "1 Pet",
    testament: "NT",
    chapters: 5,
    dolRefNames: ["1 Pet", "1 Pe", "1 Peter", "1 Pt"],
  },
  {
    book: "2 Peter",
    abbrev: "2 Pet",
    testament: "NT",
    chapters: 3,
    dolRefNames: ["2 Pet", "2 Pe", "2 Peter", "2 Pt"],
  },
  {
    book: "1 John",
    abbrev: "1 John",
    testament: "NT",
    chapters: 5,
    dolRefNames: ["1 John", "1 Jn", "1 Jhn"],
  },
  {
    book: "2 John",
    abbrev: "2 John",
    testament: "NT",
    chapters: 1,
    dolRefNames: ["2 John", "2 Jn", "2 Jhn"],
  },
  {
    book: "3 John",
    abbrev: "3 John",
    testament: "NT",
    chapters: 1,
    dolRefNames: ["3 John", "3 Jn", "3 Jhn"],
  },
  {
    book: "Jude",
    abbrev: "Jude",
    testament: "NT",
    chapters: 1,
    dolRefNames: ["Jude", "Jud"],
  },
  {
    book: "Revelation",
    abbrev: "Rev",
    testament: "NT",
    chapters: 22,
    dolRefNames: ["Rev", "Re", "Revelation", "Apocalypse"],
  },
];

const FILENAME_MAP: Record<string, string> = {};
for (const b of KJV_BOOKS) {
  const fileKey = `b_${b.abbrev.toLowerCase().replace(/\s+/g, "")}`;
  FILENAME_MAP[b.abbrev.toLowerCase().replace(/\s+/g, "")] = fileKey;
  FILENAME_MAP[b.book.toLowerCase().replace(/\s+/g, "")] = fileKey;
  for (const ref of b.dolRefNames) {
    FILENAME_MAP[ref.toLowerCase().replace(/\s+/g, "")] = fileKey;
  }
}

function filenameForBook(abbrevOrName: string): string | null {
  const key = abbrevOrName.toLowerCase().replace(/\s+/g, "");
  return FILENAME_MAP[key] ?? null;
}

const bookCache = new Map<string, KjvBook>();

export async function loadKjvBook(
  abbrevOrName: string,
): Promise<KjvBook | null> {
  const filename = filenameForBook(abbrevOrName);
  if (!filename) return null;

  if (bookCache.has(filename)) {
    return bookCache.get(filename) ?? null;
  }

  try {
    // SAFETY: filename is validated by filenameForBook against known books
    const bookModule = kjvBooks[filename as keyof typeof kjvBooks] as
      | KjvBook
      | undefined;
    if (!bookModule) {
      console.error(`KJV book ${filename} not found in static imports`);
      return null;
    }
    const parsed = kjvBookSchema.safeParse(bookModule);
    if (!parsed.success) {
      console.error(`KJV book ${filename} failed validation:`, parsed.error);
      return null;
    }
    bookCache.set(filename, parsed.data);
    return parsed.data;
  } catch (e) {
    console.error(`Failed to load KJV book ${filename}:`, e);
    return null;
  }
}

export function getKjvBookMeta(abbrevOrName: string): KjvBookMeta | undefined {
  const key = abbrevOrName.toLowerCase().replace(/\s+/g, "");
  for (const b of KJV_BOOKS) {
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

export function getBooksByTestament(testament: "OT" | "NT"): KjvBookMeta[] {
  return KJV_BOOKS.filter((b) => b.testament === testament);
}

export function getAllKjvBooks(): KjvBookMeta[] {
  return [...KJV_BOOKS];
}

export function sliceKjvPassage(
  book: KjvBook,
  chapter: number,
  verseStart?: number,
  verseEnd?: number,
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

  const verses: { number: number; text: string }[] = [];
  for (let v = start; v <= end; v++) {
    const text = chapterVerses[String(v)];
    if (text !== undefined) {
      verses.push({ number: v, text });
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

const DOL_BOOK_PATTERN = (() => {
  const names = new Set<string>();
  for (const b of KJV_BOOKS) {
    names.add(b.abbrev);
    names.add(b.book);
    for (const ref of b.dolRefNames) names.add(ref);
  }
  const escaped = Array.from(names)
    .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .sort((a, b) => b.length - a.length)
    .join("|");
  return new RegExp(`^(${escaped})\\s+(\\d+)(?::(\\d+)(?:[-–](\\d+))?)?$`, "i");
})();

export function parseDolLessonRef(ref: string): {
  book: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
} | null {
  const match = ref.match(DOL_BOOK_PATTERN);
  if (!match) return null;

  const [, bookRef, chapterStr, verseStartStr, verseEndStr] = match;
  const chapter = parseInt(chapterStr, 10);
  if (Number.isNaN(chapter)) return null;

  return {
    book: bookRef.trim(),
    chapter,
    verseStart: verseStartStr ? parseInt(verseStartStr, 10) : undefined,
    verseEnd: verseEndStr ? parseInt(verseEndStr, 10) : undefined,
  };
}

export async function getKjvPassageFromDolRef(
  ref: string,
): Promise<KjvPassage | null> {
  const parsed = parseDolLessonRef(ref);
  if (!parsed) return null;

  const book = await loadKjvBook(parsed.book);
  if (!book) return null;

  return sliceKjvPassage(
    book,
    parsed.chapter,
    parsed.verseStart,
    parsed.verseEnd,
  );
}
