import { loadKjvBook } from "./kjv";
import {
  type BookLoader,
  getBookMeta,
  getPassagesFromDolRef,
  type ScriptureBookMeta,
} from "./scripture";
import type { KjvBook, KjvPassage } from "./types";
import { loadWebBook, WEB_BOOKS } from "./web";

export type Translation = "kjv" | "web";

// the app-wide catalog: the 66 canonical books (in either translation)
// plus the 15 deuterocanonical books, which exist only in WEB. DOL lesson
// refs resolve against this superset.
export const ALL_SCRIPTURE_BOOKS: readonly ScriptureBookMeta[] = WEB_BOOKS;

export function getScriptureBookMeta(
  abbrevOrName: string,
): ScriptureBookMeta | undefined {
  return getBookMeta(ALL_SCRIPTURE_BOOKS, abbrevOrName);
}

export function getScriptureBooksByTestament(
  testament: "OT" | "NT" | "DC",
): ScriptureBookMeta[] {
  return ALL_SCRIPTURE_BOOKS.filter((b) => b.testament === testament);
}

// the flat order the prev/next arrows walk (OT, NT, Deuterocanon); ranking by
// book then chapter keeps a book edge, where the chapter resets, a forward step
const CANON_RANK = new Map<string, number>();
ALL_SCRIPTURE_BOOKS.forEach((b, i) => {
  CANON_RANK.set(b.abbrev, i);
});

/** rank a position in the canon, for telling a forward step from a backward one */
export function readingRank(abbrev: string | null, chapter: number): number {
  const book = abbrev === null ? -1 : (CANON_RANK.get(abbrev) ?? -1);
  return book * 1000 + chapter;
}

// deuterocanon has no KJV text, so it always loads from WEB regardless of
// the active translation; canonical OT/NT text follows the selection
export async function loadScriptureBook(
  translation: Translation,
  abbrevOrName: string,
): Promise<KjvBook | null> {
  const meta = getScriptureBookMeta(abbrevOrName);
  if (!meta) return null;
  if (meta.testament === "DC" || translation === "web") {
    return loadWebBook(abbrevOrName);
  }
  return loadKjvBook(abbrevOrName);
}

// load every range of a lesson ref in the active translation, using WEB
// for deuterocanonical readings and the selected translation for OT/NT
export async function getScripturePassagesFromDolRef(
  translation: Translation,
  ref: string,
): Promise<KjvPassage[]> {
  const loadBook: BookLoader = (b) => loadScriptureBook(translation, b);
  return getPassagesFromDolRef(ALL_SCRIPTURE_BOOKS, loadBook, ref);
}
