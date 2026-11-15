import type { PageId } from "../components/shell/Sidebar";
import {
  type ApocryphaCorpus,
  corpusLink,
  dcBooks,
  getScriptureBookMeta,
  getScriptureBooksByTestament,
} from "../lib/content/bible";
import type { ScriptureBookMeta } from "../lib/content/scripture";
import type { Testament } from "../lib/content/types";
import {
  readStorageJson,
  readStorageString,
  removeStorageItem,
  writeStorageJson,
} from "../lib/storage";

export type { Testament };

// the app's three readable corpora: the canonical 66 in either translation,
// plus the deuterocanonical corpus, whose book list is whichever corpus the
// reader has selected. DC is a corpus here, not an appendix of the page: it
// gets its own list, resume slot and reading progress like OT and NT
export const BOOKS_BY_CORPUS: Record<
  ApocryphaCorpus,
  Record<Testament, ScriptureBookMeta[]>
> = {
  kjva: {
    OT: getScriptureBooksByTestament("OT"),
    NT: getScriptureBooksByTestament("NT"),
    DC: dcBooks("kjva"),
  },
  web: {
    OT: getScriptureBooksByTestament("OT"),
    NT: getScriptureBooksByTestament("NT"),
    DC: dcBooks("web"),
  },
};

/** the three readable corpora, for the corpus the reader has selected */
export function booksFor(
  corpus: ApocryphaCorpus,
): Record<Testament, ScriptureBookMeta[]> {
  return BOOKS_BY_CORPUS[corpus];
}

// the readable corpora, in the order they appear in the sidebar's scripture
// block. anything that iterates all three (a reset, an aggregate) uses this
// rather than re-listing the keys, so a corpus cannot be added to one and
// missed by the other
export const TESTAMENTS: Testament[] = ["OT", "NT", "DC"];

// the two deuterocanonical corpora, for the slots a reset has to clear
export const CORPORA: ApocryphaCorpus[] = ["kjva", "web"];

export function bookByAbbrev(
  abbrev: string,
  corpus: ApocryphaCorpus,
): ScriptureBookMeta | undefined {
  for (const t of TESTAMENTS) {
    const found = booksFor(corpus)[t].find((b) => b.abbrev === abbrev);
    if (found) return found;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

export type SavedPos = { abbrev: string; chapter: number; savedAt: number };

const STORAGE_PREFIX = "bcp-bible-";

// the deuterocanonical slot is one per corpus, so a switch lands on the new
// corpus's own last place rather than the old one's. the canonical two keep
// one slot each, because the canonical text does not move with the corpus
function storageKey(t: Testament, corpus: ApocryphaCorpus): string {
  return t === "DC" ? `${STORAGE_PREFIX}DC-${corpus}` : `${STORAGE_PREFIX}${t}`;
}

function loadPos(t: Testament, corpus: ApocryphaCorpus): SavedPos | null {
  const raw = readStorageString(storageKey(t, corpus));
  if (!raw) return null;
  try {
    // SAFETY: fields validated by the type guard below
    const parsed = JSON.parse(raw) as SavedPos;
    if (
      typeof parsed.abbrev === "string" &&
      typeof parsed.chapter === "number"
    ) {
      return {
        abbrev: parsed.abbrev,
        chapter: parsed.chapter,
        // legacy positions have no stamp, and 0 sorts below every real one
        savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : 0,
      };
    }
  } catch {
    // ignore
  }
  return null;
}

export function savePos(
  t: Testament,
  corpus: ApocryphaCorpus,
  pos: SavedPos,
): void {
  writeStorageJson(storageKey(t, corpus), pos);
}

/** drop every saved position, so the next open starts at a book's first chapter */
export function clearSavedPositions(): void {
  for (const t of TESTAMENTS) {
    for (const corpus of CORPORA) {
      removeStorageItem(storageKey(t, corpus));
    }
  }
  removeStorageItem(BOOK_STORAGE_KEY);
}

// per-book place for the picker; the corpus position names only one book,
// so a bare pick would otherwise reopen every book at its first chapter.
// the map is keyed by abbrev and shared, so the books common to both corpora
// remember their place across a switch
const BOOK_STORAGE_KEY = "bcp-bible-books";

function loadBookPositions(): Record<string, number> {
  const parsed = readStorageJson<unknown>(BOOK_STORAGE_KEY);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
  const positions: Record<string, number> = {};
  for (const [abbrev, chapter] of Object.entries(parsed)) {
    if (typeof chapter === "number") positions[abbrev] = chapter;
  }
  return positions;
}

export function saveBookPos(abbrev: string, chapter: number): void {
  const positions = loadBookPositions();
  positions[abbrev] = chapter;
  writeStorageJson(BOOK_STORAGE_KEY, positions);
}

/** where a book pick opens: the reader's last place, clamped, 1 if never opened */
export function lastChapterFor(
  abbrev: string,
  corpus: ApocryphaCorpus,
): number {
  const meta = bookByAbbrev(abbrev, corpus);
  if (!meta) return 1;
  const stored = loadBookPositions()[abbrev];
  if (typeof stored !== "number") return 1;
  return Math.min(Math.max(1, Math.floor(stored)), meta.chapters);
}

// only a position the reader would actually restore: a book a content drop
// removed, or a chapter past the end, would label the row with a tap that
// disagrees. clamping mirrors resolvePos
function usablePos(
  t: Testament,
  corpus: ApocryphaCorpus,
  pos: SavedPos | null,
): SavedPos | null {
  if (!pos) return null;
  const found = booksFor(corpus)[t].find((b) => b.abbrev === pos.abbrev);
  if (!found) return null;
  return {
    ...pos,
    chapter: Math.min(Math.max(1, pos.chapter), found.chapters),
  };
}

// every corpus's saved position, validated the way the reader restores
// them. the sidebar's scripture rows each carry their own "where you left
// off" label, so they never compete: a legacy or stale position in one
// corpus cannot keep another row from showing its own.
//
// a corpus with nothing stored reads null here, which is how Settings tells
// an untouched reader apart from one with progress to clear. the sidebar
// pairs this with openingRef rather than a default baked in here, so a null
// keeps meaning "nothing saved" for that gate
export function savedPositions(
  corpus: ApocryphaCorpus,
): Record<Testament, SavedPos | null> {
  return {
    OT: usablePos("OT", corpus, loadPos("OT", corpus)),
    NT: usablePos("NT", corpus, loadPos("NT", corpus)),
    DC: usablePos("DC", corpus, loadPos("DC", corpus)),
  };
}

// whether any corpus holds a saved position. the settings reset gates on
// this rather than on the current corpus's own positions, so a reader who
// read in one corpus can still clear it while standing in the other
export function hasSavedPosition(): boolean {
  for (const corpus of CORPORA) {
    for (const t of TESTAMENTS) {
      if (loadPos(t, corpus)) return true;
    }
  }
  return false;
}

// where a corpus opens when nothing is saved: the first chapter of its first
// book, which is where resolvePos sends a reader who has never been there.
// the sidebar names this so a fresh row still answers "where would this
// take me" instead of sitting blank until the first read
export function openingRef(
  t: Testament,
  corpus: ApocryphaCorpus,
): { abbrev: string; chapter: number } | null {
  const first = booksFor(corpus)[t][0];
  return first ? { abbrev: first.abbrev, chapter: 1 } : null;
}

// ---------------------------------------------------------------------------
// Module-level pending ref setter (for NavigationContext integration)
// ---------------------------------------------------------------------------

export type PendingRef = { abbrev: string; chapter: number } | null;

let _pendingRefTarget: PendingRef = null;

export function setBiblePendingRef(
  ref: { abbrev: string; chapter: number } | null,
): void {
  _pendingRefTarget = ref;
}

export function consumePendingBibleRef(): PendingRef {
  const ref = _pendingRefTarget;
  _pendingRefTarget = null;
  return ref;
}

// which reader page owns which corpus. both directions live here so a
// cross-link into the bible never has to re-derive the mapping
export const TESTAMENT_FOR_PAGE: Partial<Record<PageId, Testament>> = {
  "old-testament": "OT",
  "new-testament": "NT",
  apocrypha: "DC",
};

export const PAGE_FOR_TESTAMENT: Record<Testament, PageId> = {
  OT: "old-testament",
  NT: "new-testament",
  DC: "apocrypha",
};

export function isBiblePage(p: PageId): boolean {
  return p in TESTAMENT_FOR_PAGE;
}

export function pageTestament(p: PageId): Testament {
  return TESTAMENT_FOR_PAGE[p] ?? "OT";
}

/**
 * what a page entry should restore. off the bible pages there is nothing to
 * do. on a bible page, a history restore that already positioned this same
 * corpus holds, so storage must not overwrite the restored chapter; a restore
 * that landed elsewhere does not carry over, or the page opens the last
 * corpus's book instead of its own
 */
export function pageEntryRestore(
  page: PageId,
  restored: Testament | null,
): { testament: Testament; keepRestored: boolean } | null {
  if (!isBiblePage(page)) return null;
  const testament = pageTestament(page);
  return { testament, keepRestored: restored === testament };
}

/**
 * the reader page that owns a book, for a cross-link into the bible.
 * resolves by abbrev and by any citation alias, so a link built from a
 * lesson's ref ("Sirach") lands in the same page as one built from the
 * picker's abbrev ("Sir"). null for a book no corpus holds
 */
export function pageForBook(abbrevOrName: string): PageId | null {
  const meta = getScriptureBookMeta(abbrevOrName);
  return meta ? PAGE_FOR_TESTAMENT[meta.testament] : null;
}

/** Resolve a saved position to a real book + chapter, falling back to first book. */
export function resolvePos(
  t: Testament,
  corpus: ApocryphaCorpus,
  saved: SavedPos | null,
): {
  book: ScriptureBookMeta | null;
  chapter: number;
} {
  const books = booksFor(corpus)[t];
  if (books.length === 0) return { book: null, chapter: 1 };
  if (saved) {
    const found = books.find((b) => b.abbrev === saved.abbrev);
    if (found) {
      const ch = Math.min(Math.max(1, saved.chapter), found.chapters);
      return { book: found, chapter: ch };
    }
  }
  return { book: books[0], chapter: 1 };
}

// where a corpus switch lands, in the order the ladder defines:
// 1. the new corpus has the book at the same address, so the reader stays
// 2. the new corpus has the same work at another address, so the reader goes
// 3. the new corpus's last read position
// 4. the new corpus's first book
export function corpusLanding(
  from: ApocryphaCorpus,
  to: ApocryphaCorpus,
  current: ScriptureBookMeta,
  chapter: number,
): { abbrev: string; chapter: number } | null {
  const nextBooks = dcBooks(to);

  const same = nextBooks.find((b) => b.abbrev === current.abbrev);
  if (same) {
    return {
      abbrev: same.abbrev,
      chapter: Math.min(Math.max(1, chapter), same.chapters),
    };
  }

  const link = corpusLink(from, current.abbrev, chapter);
  if (link) {
    const target = nextBooks.find((b) => b.abbrev === link.abbrev);
    if (target) {
      return {
        abbrev: target.abbrev,
        chapter: Math.min(Math.max(1, link.chapter), target.chapters),
      };
    }
  }

  const saved = usablePos("DC", to, loadPos("DC", to));
  if (saved) return { abbrev: saved.abbrev, chapter: saved.chapter };

  const first = nextBooks[0];
  return first ? { abbrev: first.abbrev, chapter: 1 } : null;
}
