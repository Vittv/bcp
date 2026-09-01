import { KJV_BOOKS, loadKjvBook } from "./kjv";
import { kjvBookSchema } from "./schemas";
import type { ScriptureBookMeta } from "./scripture";
import {
  getBookMeta,
  getPassageFromDolRef,
  getPassagesFromDolRef,
} from "./scripture";
import type { KjvBook, KjvPassage } from "./types";
import * as webBooks from "./vendor/web/index";
import { webBookImports } from "./vendor/web/index";

export type { KjvBook, KjvPassage };

export type WebBookMeta = ScriptureBookMeta;

// the deuterocanonical books that appear in offices and the sanctorale,
// with the DOL names used to cite them. their vendor files live under
// vendor/web named by lowercase abbrev without spaces.
const DEUTEROCANON: {
  abbrev: string;
  chapters: number;
  dolRefNames: string[];
}[] = [
  { abbrev: "Tob", chapters: 14, dolRefNames: ["Tobit", "Tob"] },
  { abbrev: "Jdt", chapters: 16, dolRefNames: ["Judith", "Jdt"] },
  { abbrev: "Add Esth", chapters: 10, dolRefNames: ["Add Esth"] },
  { abbrev: "Wis", chapters: 19, dolRefNames: ["Wisdom", "Wis"] },
  { abbrev: "Sir", chapters: 51, dolRefNames: ["Sirach", "Sir"] },
  { abbrev: "Bar", chapters: 6, dolRefNames: ["Baruch", "Bar"] },
  { abbrev: "1 Macc", chapters: 16, dolRefNames: ["1 Maccabees", "1 Macc"] },
  { abbrev: "2 Macc", chapters: 15, dolRefNames: ["2 Maccabees", "2 Macc"] },
  { abbrev: "1 Esd", chapters: 9, dolRefNames: ["1 Esdras", "1 Esd"] },
  {
    abbrev: "Pr Man",
    chapters: 1,
    dolRefNames: ["Prayer of Manasses", "Pr Man"],
  },
  { abbrev: "Ps 151", chapters: 1, dolRefNames: ["Ps 151"] },
  { abbrev: "3 Macc", chapters: 7, dolRefNames: ["3 Maccabees", "3 Macc"] },
  { abbrev: "2 Esd", chapters: 16, dolRefNames: ["2 Esdras", "2 Esd"] },
  { abbrev: "4 Macc", chapters: 18, dolRefNames: ["4 Maccabees", "4 Macc"] },
  {
    abbrev: "Dan Grk",
    chapters: 14,
    dolRefNames: ["Dan Grk", "Daniel (Greek)"],
  },
];

const DEUTEROCANON_BOOKS: ScriptureBookMeta[] = DEUTEROCANON.map((d) => ({
  book: bookNameFor(d.abbrev),
  abbrev: d.abbrev,
  testament: "DC",
  chapters: d.chapters,
  dolRefNames: d.dolRefNames,
}));

function bookNameFor(abbrev: string): string {
  switch (abbrev) {
    case "Tob":
      return "Tobit";
    case "Jdt":
      return "Judith";
    case "Add Esth":
      return "Esther (Greek)";
    case "Wis":
      return "Wisdom of Solomon";
    case "Sir":
      return "Sirach";
    case "Bar":
      return "Baruch";
    case "1 Macc":
      return "1 Maccabees";
    case "2 Macc":
      return "2 Maccabees";
    case "1 Esd":
      return "1 Esdras";
    case "Pr Man":
      return "Prayer of Manasses";
    case "Ps 151":
      return "Psalm 151";
    case "3 Macc":
      return "3 Maccabees";
    case "2 Esd":
      return "2 Esdras";
    case "4 Macc":
      return "4 Maccabees";
    case "Dan Grk":
      return "Daniel (Greek)";
    default:
      return abbrev;
  }
}

// the combined canon: KJV for the OT and NT, WEB for the deuterocanon.
// DOL references resolve against this superset, picking the KJV text for
// OT/NT readings and the WEB text for deuterocanonical readings.
export const WEB_BOOKS: ScriptureBookMeta[] = [
  ...KJV_BOOKS,
  ...DEUTEROCANON_BOOKS,
];

const WEB_FILENAME_MAP: Record<string, string> = {};
for (const b of WEB_BOOKS) {
  const fileKey = `b_${b.abbrev.toLowerCase().replace(/\s+/g, "")}`;
  const bareKey = b.abbrev.toLowerCase().replace(/\s+/g, "");
  WEB_FILENAME_MAP[bareKey] = fileKey;
  WEB_FILENAME_MAP[b.book.toLowerCase().replace(/\s+/g, "")] = fileKey;
  for (const ref of b.dolRefNames) {
    WEB_FILENAME_MAP[ref.toLowerCase().replace(/\s+/g, "")] = fileKey;
  }
}

function webFilenameFor(abbrevOrName: string): string | null {
  const key = abbrevOrName.toLowerCase().replace(/\s+/g, "");
  return WEB_FILENAME_MAP[key] ?? null;
}

export function getWebBookMeta(
  abbrevOrName: string,
): ScriptureBookMeta | undefined {
  return getBookMeta(WEB_BOOKS, abbrevOrName);
}

export function getWebBooksByTestament(
  testament: "OT" | "NT" | "DC",
): ScriptureBookMeta[] {
  return WEB_BOOKS.filter((b) => b.testament === testament);
}

export function getAllWebBooks(): ScriptureBookMeta[] {
  return [...WEB_BOOKS];
}

const webCache = new Map<string, KjvBook>();

export async function loadWebBook(
  abbrevOrName: string,
): Promise<KjvBook | null> {
  const filename = webFilenameFor(abbrevOrName);
  if (!filename) return null;

  if (webCache.has(filename)) {
    return webCache.get(filename) ?? null;
  }

  try {
    // SAFETY: filename is validated by webFilenameFor against known books,
    // so webBookImports is guaranteed to have a typed key for it
    const bookKey = webBookImports[filename];
    const bookModule = bookKey ? webBooks[bookKey] : undefined;
    if (!bookModule) {
      console.error(`WEB book ${filename} not found in static imports`);
      return null;
    }
    const parsed = kjvBookSchema.safeParse(bookModule);
    if (!parsed.success) {
      console.error(`WEB book ${filename} failed validation:`, parsed.error);
      return null;
    }
    webCache.set(filename, parsed.data);
    return parsed.data;
  } catch (e) {
    console.error(`Failed to load WEB book ${filename}:`, e);
    return null;
  }
}

// the primary loader used by the shared ref logic: KJV for OT/NT, WEB for DC.
async function loadCombinedBook(abbrevOrName: string): Promise<KjvBook | null> {
  const meta = getWebBookMeta(abbrevOrName);
  if (!meta) return null;
  if (meta.testament === "DC") {
    return loadWebBook(abbrevOrName);
  }
  return loadKjvBook(abbrevOrName);
}

export async function getWebPassageFromDolRef(
  ref: string,
): Promise<KjvPassage | null> {
  return getPassageFromDolRef(WEB_BOOKS, loadCombinedBook, ref);
}

// load every range of a lesson ref across the combined canon, using the
// WEB text for deuterocanonical (Sirach, Wisdom, ...) readings and the KJV
// text for the OT and NT. returns the semantic union of every cited range.
export async function getWebPassagesFromDolRef(
  ref: string,
): Promise<KjvPassage[]> {
  return getPassagesFromDolRef(WEB_BOOKS, loadCombinedBook, ref);
}
