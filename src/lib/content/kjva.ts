import { kjvBookSchema } from "./schemas";
import type { ScriptureBookMeta } from "./scripture";
import { getBookMeta } from "./scripture";
import type { KjvBook } from "./types";
import * as kjvaBooks from "./vendor/kjva/index";
import { kjvaBookImports } from "./vendor/kjva/index";

export type { KjvBook };

export type KjvaBookMeta = ScriptureBookMeta;

// the ten deuterocanonical books the KJVA carries in the same shape as the
// book the app already has, so the corpus keeps its shape under either
// apocryphal text. the five the app has that the KJVA does not carry in a
// matching shape (Esther Greek, Daniel Greek, Psalm 151, 3 Maccabees,
// 4 Maccabees) are not here, and read in the WEB under either setting
export const KJVA_BOOKS: KjvaBookMeta[] = [
  {
    book: "Tobit",
    abbrev: "Tob",
    testament: "DC",
    chapters: 14,
    dolRefNames: ["Tobit", "Tob"],
  },
  {
    book: "Judith",
    abbrev: "Jdt",
    testament: "DC",
    chapters: 16,
    dolRefNames: ["Judith", "Jdt"],
  },
  {
    book: "Wisdom of Solomon",
    abbrev: "Wis",
    testament: "DC",
    chapters: 19,
    dolRefNames: ["Wisdom", "Wis"],
  },
  {
    book: "Sirach",
    abbrev: "Sir",
    testament: "DC",
    chapters: 51,
    dolRefNames: ["Sirach", "Sir"],
  },
  {
    book: "Baruch",
    abbrev: "Bar",
    testament: "DC",
    chapters: 6,
    dolRefNames: ["Baruch", "Bar"],
  },
  {
    book: "1 Maccabees",
    abbrev: "1 Macc",
    testament: "DC",
    chapters: 16,
    dolRefNames: ["1 Maccabees", "1 Macc"],
  },
  {
    book: "2 Maccabees",
    abbrev: "2 Macc",
    testament: "DC",
    chapters: 15,
    dolRefNames: ["2 Maccabees", "2 Macc"],
  },
  {
    book: "1 Esdras",
    abbrev: "1 Esd",
    testament: "DC",
    chapters: 9,
    dolRefNames: ["1 Esdras", "1 Esd"],
  },
  {
    book: "Prayer of Manasses",
    abbrev: "Pr Man",
    testament: "DC",
    chapters: 1,
    dolRefNames: ["Prayer of Manasses", "Pr Man"],
  },
  {
    book: "2 Esdras",
    abbrev: "2 Esd",
    testament: "DC",
    chapters: 16,
    dolRefNames: ["2 Esdras", "2 Esd"],
  },
];

const FILENAME_MAP: Record<string, string> = {};
for (const b of KJVA_BOOKS) {
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

export async function loadKjvABook(
  abbrevOrName: string,
): Promise<KjvBook | null> {
  const filename = filenameForBook(abbrevOrName);
  if (!filename) return null;

  if (bookCache.has(filename)) {
    return bookCache.get(filename) ?? null;
  }

  try {
    // SAFETY: filename is validated by filenameForBook against known books,
    // so kjvaBookImports is guaranteed to have a typed key for it
    const bookKey = kjvaBookImports[filename];
    // biome-ignore lint/performance/noDynamicNamespaceImportAccess: the validated key selects from the whole-book namespace, which exists to be indexed
    const bookModule = bookKey ? kjvaBooks[bookKey] : undefined;
    if (!bookModule) {
      console.error(`KJVA book ${filename} not found in static imports`);
      return null;
    }
    const parsed = kjvBookSchema.safeParse(bookModule);
    if (!parsed.success) {
      console.error(`KJVA book ${filename} failed validation:`, parsed.error);
      return null;
    }
    bookCache.set(filename, parsed.data);
    return parsed.data;
  } catch (e) {
    console.error(`Failed to load KJVA book ${filename}:`, e);
    return null;
  }
}

// whether the KJVA carries this book. the routing asks this before choosing
// a text, so the five books the 1611 does not have fall to the WEB by name
// rather than by a silent catch
export function getKjvaBookMeta(
  abbrevOrName: string,
): KjvaBookMeta | undefined {
  return getBookMeta(KJVA_BOOKS, abbrevOrName);
}
