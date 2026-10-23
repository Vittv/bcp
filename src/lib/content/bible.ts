import { KJV_BOOKS, loadKjvBook } from "./kjv";
import { KJVA_BOOKS, loadKjvABook } from "./kjva";
import {
  type BookLoader,
  getBookMeta,
  getPassagesFromDolRef,
  type ScriptureBookMeta,
} from "./scripture";
import type { KjvBook, KjvPassage } from "./types";
import { loadWebBook, WEB_DC_BOOKS } from "./web";

export type Translation = "kjv" | "web";

// the deuterocanonical corpus: a book list and a text, together. KJVA is
// the 1611's fourteen books, every one of them read in the 1611's apocryphal
// text; WEB is its fifteen books, every one of them read in the World
// english Bible. nothing is ever mixed, so a book always says which text it
// is in by construction
export type ApocryphaCorpus = "kjva" | "web";

// the two text settings the reader picks. they travel together because one
// lesson ref can name a canonical book and a deuterocanonical book at once,
// and each has to be read in the text the reader chose for it
export type ScriptureSettings = {
  translation: Translation;
  apocrypha: ApocryphaCorpus;
};

// the canonical books, which every translation shares
const CANONICAL_BOOKS: readonly ScriptureBookMeta[] = KJV_BOOKS;

/** the deuterocanonical books of one corpus: the list and the text together */
export function dcBooks(corpus: ApocryphaCorpus): ScriptureBookMeta[] {
  return corpus === "kjva" ? KJVA_BOOKS : WEB_DC_BOOKS;
}

// the app-wide catalogue: the 66 canonical books plus every deuterocanonical
// book either corpus holds. the ten books the corpora share carry one entry,
// since their shape is the same in both. DOL lesson refs resolve against
// this superset.
export const ALL_SCRIPTURE_BOOKS: readonly ScriptureBookMeta[] = (() => {
  const seen = new Set<string>();
  const out: ScriptureBookMeta[] = [];
  for (const book of [...CANONICAL_BOOKS, ...KJVA_BOOKS, ...WEB_DC_BOOKS]) {
    if (seen.has(book.abbrev)) continue;
    seen.add(book.abbrev);
    out.push(book);
  }
  return out;
})();

export function getScriptureBookMeta(
  abbrevOrName: string,
): ScriptureBookMeta | undefined {
  return getBookMeta(ALL_SCRIPTURE_BOOKS, abbrevOrName);
}

export function getScriptureBooksByTestament(
  testament: "OT" | "NT",
): ScriptureBookMeta[] {
  return ALL_SCRIPTURE_BOOKS.filter((b) => b.testament === testament);
}

// the flat order the prev/next arrows walk (OT, NT, Deuterocanon); ranking by
// book then chapter keeps a book edge, where the chapter resets, a forward
// step. the canonical books hold fixed ranks, and the deuterocanonical books
// are ranked inside their own corpus, so the walk is linear in whichever
// corpus the reader has
const CANON_RANK = new Map<string, number>();
CANONICAL_BOOKS.forEach((b, i) => {
  CANON_RANK.set(b.abbrev, i);
});

const DC_RANK: Record<ApocryphaCorpus, Map<string, number>> = {
  kjva: new Map(
    KJVA_BOOKS.map((b, i) => [b.abbrev, CANONICAL_BOOKS.length + i]),
  ),
  web: new Map(
    WEB_DC_BOOKS.map((b, i) => [b.abbrev, CANONICAL_BOOKS.length + i]),
  ),
};

/** rank a position in the canon, for telling a forward step from a backward one */
export function readingRank(
  abbrev: string | null,
  chapter: number,
  corpus: ApocryphaCorpus,
): number {
  const book =
    abbrev === null
      ? -1
      : (CANON_RANK.get(abbrev) ?? DC_RANK[corpus].get(abbrev) ?? -1);
  return book * 1000 + chapter;
}

// the same work at another address in the other corpus. one side is a whole
// book and the other a chapter inside a book, so the chapter never carries
// over: the link opens at the target's own address
const CORPUS_LINKS: {
  corpus: ApocryphaCorpus;
  abbrev: string;
  // the chapters the link leaves from, or null for the whole book
  chapters: number[] | null;
  target: { abbrev: string; chapter: number };
}[] = [
  {
    corpus: "kjva",
    abbrev: "Sus",
    chapters: null,
    target: { abbrev: "Dan Grk", chapter: 13 },
  },
  {
    corpus: "kjva",
    abbrev: "Bel",
    chapters: null,
    target: { abbrev: "Dan Grk", chapter: 14 },
  },
  {
    corpus: "web",
    abbrev: "Dan Grk",
    chapters: [13],
    target: { abbrev: "Sus", chapter: 1 },
  },
  {
    corpus: "web",
    abbrev: "Dan Grk",
    chapters: [14],
    target: { abbrev: "Bel", chapter: 1 },
  },
];

/**
 * the same work at another address in the other corpus, if there is one.
 * the Rest of Esther has none: its text is the additions only, seven
 * chapters, while the WEB's Esther (Greek) is the whole Greek Esther in ten
 * chapters with the additions merged in. the same material at different
 * divisions is not a chapter-for-chapter counterpart, so the link would
 * send the reader to the wrong place
 */
export function corpusLink(
  corpus: ApocryphaCorpus,
  abbrev: string,
  chapter: number,
): { abbrev: string; chapter: number } | null {
  for (const link of CORPUS_LINKS) {
    if (link.corpus !== corpus || link.abbrev !== abbrev) continue;
    if (link.chapters && !link.chapters.includes(chapter)) continue;
    return link.target;
  }
  return null;
}

/** the corpus that holds a deuterocanonical book */
export function corpusHolding(
  abbrevOrName: string,
  selected: ApocryphaCorpus,
): ApocryphaCorpus {
  if (getBookMeta(dcBooks(selected), abbrevOrName)) return selected;
  return selected === "kjva" ? "web" : "kjva";
}

// the canonical text follows the translation setting and the
// deuterocanonical text follows the corpus the reader has selected
export async function loadScriptureBook(
  settings: ScriptureSettings,
  abbrevOrName: string,
): Promise<KjvBook | null> {
  const meta = getScriptureBookMeta(abbrevOrName);
  if (!meta) return null;
  if (meta.testament === "DC") {
    // a book the selected corpus does not hold reads in the corpus that
    // does, which only a lesson ref can produce
    if (corpusHolding(abbrevOrName, settings.apocrypha) === "kjva") {
      return loadKjvABook(abbrevOrName);
    }
    return loadWebBook(abbrevOrName);
  }
  if (settings.translation === "web") {
    return loadWebBook(abbrevOrName);
  }
  return loadKjvBook(abbrevOrName);
}

// load every range of a lesson ref, each in the text the reader chose for
// its corpus
export async function getScripturePassagesFromDolRef(
  settings: ScriptureSettings,
  ref: string,
): Promise<KjvPassage[]> {
  const loadBook: BookLoader = (b) => loadScriptureBook(settings, b);
  return getPassagesFromDolRef(ALL_SCRIPTURE_BOOKS, loadBook, ref);
}
