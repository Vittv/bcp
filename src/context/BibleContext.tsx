import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { PageId } from "../components/shell/Sidebar";
import { useHistory, useHistoryField } from "../context/HistoryContext";
import { useTranslation } from "../context/TranslationContext";
import {
  type ApocryphaCorpus,
  corpusHolding,
  corpusLink,
  dcBooks,
  getScriptureBookMeta,
  getScriptureBooksByTestament,
  readingRank,
} from "../lib/content/bible";
import { markReached } from "../lib/content/bibleProgress";
import type { ScriptureBookMeta } from "../lib/content/scripture";
import type { Testament } from "../lib/content/types";
import { registerPageStepper } from "../lib/input/sequenceNav";

export type { Testament };

// the app's three readable corpora: the canonical 66 in either translation,
// plus the deuterocanonical corpus, whose book list is whichever corpus the
// reader has selected. DC is a corpus here, not an appendix of the page: it
// gets its own list, resume slot and reading progress like OT and NT
const BOOKS_BY_CORPUS: Record<
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
const CORPORA: ApocryphaCorpus[] = ["kjva", "web"];

function bookByAbbrev(
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
  try {
    const raw = localStorage.getItem(storageKey(t, corpus));
    if (!raw) return null;
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

function savePos(t: Testament, corpus: ApocryphaCorpus, pos: SavedPos): void {
  try {
    localStorage.setItem(storageKey(t, corpus), JSON.stringify(pos));
  } catch {
    // ignore
  }
}

/** drop every saved position, so the next open starts at a book's first chapter */
export function clearSavedPositions(): void {
  try {
    for (const t of TESTAMENTS) {
      for (const corpus of CORPORA) {
        localStorage.removeItem(storageKey(t, corpus));
      }
    }
    localStorage.removeItem(BOOK_STORAGE_KEY);
  } catch {
    // ignore
  }
}

// per-book place for the picker; the corpus position names only one book,
// so a bare pick would otherwise reopen every book at its first chapter.
// the map is keyed by abbrev and shared, so the books common to both corpora
// remember their place across a switch
const BOOK_STORAGE_KEY = "bcp-bible-books";

function loadBookPositions(): Record<string, number> {
  try {
    const raw = localStorage.getItem(BOOK_STORAGE_KEY);
    if (!raw) return {};
    // SAFETY: entries are validated by the guard below
    const parsed = JSON.parse(raw) as Record<string, number>;
    const positions: Record<string, number> = {};
    for (const [abbrev, chapter] of Object.entries(parsed)) {
      if (typeof chapter === "number") positions[abbrev] = chapter;
    }
    return positions;
  } catch {
    return {};
  }
}

function saveBookPos(abbrev: string, chapter: number): void {
  try {
    const positions = loadBookPositions();
    positions[abbrev] = chapter;
    localStorage.setItem(BOOK_STORAGE_KEY, JSON.stringify(positions));
  } catch {
    // ignore
  }
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

let _pendingRefTarget: PendingRef = null;

export function setBiblePendingRef(
  ref: { abbrev: string; chapter: number } | null,
): void {
  _pendingRefTarget = ref;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type PendingRef = { abbrev: string; chapter: number } | null;

type BibleState = {
  testament: Testament;
  book: ScriptureBookMeta | null;
  chapter: number;
  books: ScriptureBookMeta[];
  corpus: ApocryphaCorpus;
  selectTestament: (t: Testament) => void;
  selectBook: (abbrev: string, chapter?: number) => void;
  switchCorpus: (corpus: ApocryphaCorpus) => void;
  clearBook: () => void;
  nextChapter: () => void;
  prevChapter: () => void;
  selectChapter: (n: number) => void;
  goToRef: (abbrev: string, chapter: number) => void;
  restoreRef: (ref: { abbrev: string; chapter: number } | null) => void;
};

const Ctx = createContext<BibleState | null>(null);

export function useBible(): BibleState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBible outside BibleProvider");
  return ctx;
}

export function bibleBookName(abbrev: string): string {
  // the combined canon, so a deuterocanonical book spells out (Sirach) rather
  // than falling back to its own abbrev (Sir)
  return getScriptureBookMeta(abbrev)?.book ?? abbrev;
}

// which reader page owns which corpus. both directions live here so a
// cross-link into the bible never has to re-derive the mapping
const TESTAMENT_FOR_PAGE: Partial<Record<PageId, Testament>> = {
  "old-testament": "OT",
  "new-testament": "NT",
  apocrypha: "DC",
};

const PAGE_FOR_TESTAMENT: Record<Testament, PageId> = {
  OT: "old-testament",
  NT: "new-testament",
  DC: "apocrypha",
};

function isBiblePage(p: PageId): boolean {
  return p in TESTAMENT_FOR_PAGE;
}

function pageTestament(p: PageId): Testament {
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
function resolvePos(
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

export function BibleProvider({
  children,
  page,
  onReadingChange,
  onChapterChange,
}: {
  children: ReactNode;
  page: PageId;
  onReadingChange?: (label: string | null) => void;
  onChapterChange?: () => void;
}) {
  // the corpus the reader has selected. it lives in the translation context
  // because it is a setting, but the switch has to run here, where the
  // reader's position is, so the landing is picked against the new corpus
  const { apocrypha, setApocrypha } = useTranslation();

  const initialTestament = isBiblePage(page) ? pageTestament(page) : "OT";
  const initial = resolvePos(
    initialTestament,
    apocrypha,
    loadPos(initialTestament, apocrypha),
  );

  const [testament, setTestament] = useState<Testament>(initialTestament);
  const [book, setBook] = useState<ScriptureBookMeta | null>(initial.book);
  const [chapter, setChapter] = useState(initial.chapter);

  // browser history: pushes record each chapter/book step, restores replay
  const history = useHistory();

  // the corpus a history restore positioned (null when the last restore did
  // not land on a bible page). kept per-corpus rather than as a boolean so a
  // restore that lands elsewhere cannot suppress the next page's own restore
  const restoredTestament = useRef<Testament | null>(null);

  // sync testament + restore position when page changes to a bible page
  const prevPage = useRef(page);
  useEffect(() => {
    if (prevPage.current === page) return;
    prevPage.current = page;
    const entry = pageEntryRestore(page, restoredTestament.current);
    restoredTestament.current = null;
    if (!entry || entry.keepRestored) return;
    const t = entry.testament;
    if (_pendingRefTarget) {
      const ref = _pendingRefTarget;
      _pendingRefTarget = null;
      const found =
        booksFor(apocrypha)[t].find((b) => b.abbrev === ref.abbrev) ??
        booksFor(apocrypha)[t][0];
      const ch = Math.min(Math.max(1, ref.chapter), found.chapters);
      setTestament(t);
      setBook(found);
      setChapter(ch);
      // the navigation entry carried this ref, but its chapter may have
      // been clamped; fold the exact position in so any later restore of
      // this entry replays the same book
      history?.replace({
        bible: { abbrev: found.abbrev, chapter: ch },
      });
    } else {
      const pos = resolvePos(t, apocrypha, loadPos(t, apocrypha));
      setTestament(t);
      setBook(pos.book);
      setChapter(pos.chapter);
      // the navigation entry was pushed before this position existed (it
      // comes from storage, not the navigate call), so fold it into the top
      // snapshot: replaying this entry must restore the book, not clear it
      if (pos.book) {
        history?.replace({
          bible: { abbrev: pos.book.abbrev, chapter: pos.chapter },
        });
      }
    }
  }, [page, history?.replace, apocrypha]);

  // persist position + report to status bar (only while on a bible page)
  useEffect(() => {
    if (book && isBiblePage(page)) {
      savePos(testament, apocrypha, {
        abbrev: book.abbrev,
        chapter,
        savedAt: Date.now(),
      });
      // keep the book's own place for the picker
      saveBookPos(book.abbrev, chapter);
      // every route into a chapter lands here, so a cross-link counts as read
      markReached(book.abbrev, chapter);
      onReadingChange?.(`${bibleBookName(book.abbrev)} ${chapter}`);
    }
  }, [page, testament, apocrypha, book, chapter, onReadingChange]);

  // scroll to top when the reader advances to a later position, so a next-book
  // step scrolls up like a next-chapter step; a backward move keeps its place
  const prevPosRef = useRef({ abbrev: book?.abbrev ?? null, chapter });
  useEffect(() => {
    const prev = prevPosRef.current;
    const abbrev = book?.abbrev ?? null;
    if (prev.abbrev === abbrev && prev.chapter === chapter) return;
    prevPosRef.current = { abbrev, chapter };
    if (
      readingRank(abbrev, chapter, apocrypha) >
      readingRank(prev.abbrev, prev.chapter, apocrypha)
    ) {
      onChapterChange?.();
    }
  }, [book, chapter, apocrypha, onChapterChange]);

  const books = booksFor(apocrypha)[testament];

  const selectTestament = useCallback(
    (t: Testament) => {
      setTestament(t);
      const pos = resolvePos(t, apocrypha, loadPos(t, apocrypha));
      setBook(pos.book);
      setChapter(pos.chapter);
      history?.push({
        bible: pos.book
          ? { abbrev: pos.book.abbrev, chapter: pos.chapter }
          : null,
      });
    },
    [history, apocrypha],
  );

  // the book carries its own corpus, so a deuterocanonical pick switches the
  // reader to DC; a pick without a chapter reopens the reader's last place
  const selectBook = useCallback(
    (abbrev: string, chapter?: number) => {
      const found = bookByAbbrev(abbrev, apocrypha);
      if (!found) return;
      const ch = Math.min(
        Math.max(1, chapter ?? lastChapterFor(abbrev, apocrypha)),
        found.chapters,
      );
      setTestament(found.testament);
      setBook(found);
      setChapter(ch);
      history?.push({ bible: { abbrev: found.abbrev, chapter: ch } });
    },
    [history, apocrypha],
  );

  // the corpus switch, with the landing the ladder defines. it lives in the
  // provider rather than in the bar, because the bar would otherwise set the
  // corpus and pick a book against the old one
  const switchCorpus = useCallback(
    (next: ApocryphaCorpus) => {
      if (next === apocrypha) return;
      // the canonical books do not move with the corpus, so a reader on an
      // OT or NT page stays exactly where they are
      if (testament !== "DC" || !book) {
        setApocrypha(next);
        return;
      }
      const landing = corpusLanding(apocrypha, next, book, chapter);
      setApocrypha(next);
      if (!landing) return;
      const found = dcBooks(next).find((b) => b.abbrev === landing.abbrev);
      if (!found) return;
      const ch = Math.min(Math.max(1, landing.chapter), found.chapters);
      setTestament("DC");
      setBook(found);
      setChapter(ch);
      history?.push({ bible: { abbrev: found.abbrev, chapter: ch } });
    },
    [apocrypha, book, chapter, history, setApocrypha, testament],
  );

  const clearBook = useCallback(() => {
    setBook(null);
    setChapter(1);
    history?.push({ bible: null });
  }, [history]);

  const nextChapter = useCallback(() => {
    if (book && chapter < book.chapters) {
      setChapter((c) => c + 1);
      history?.push({ bible: { abbrev: book.abbrev, chapter: chapter + 1 } });
    }
  }, [book, chapter, history]);

  const prevChapter = useCallback(() => {
    if (book && chapter > 1) {
      setChapter((c) => c - 1);
      history?.push({ bible: { abbrev: book.abbrev, chapter: chapter - 1 } });
    }
  }, [book, chapter, history]);

  // direct jump from the chapter picker; the guard keeps the live chapter
  // in the history trail just like next/prev
  const selectChapter = useCallback(
    (n: number) => {
      if (book && n >= 1 && n <= book.chapters && n !== chapter) {
        setChapter(n);
        history?.push({ bible: { abbrev: book.abbrev, chapter: n } });
      }
    },
    [book, chapter, history],
  );

  // the arrow-key sequence of the bible page, matching the reading pane's
  // bottom nav exactly: a chapter step, then the next/previous book at the
  // chapter's edge, so right/left walk the testament linearly. the raw
  // setters deliberately skip the push the UI arrows make, so arrow strides
  // never leave their own back/forward steps
  const stepChapter = useCallback(
    (delta: number): boolean => {
      if (!book) return false;
      if (delta > 0) {
        if (chapter < book.chapters) {
          setChapter((c) => c + 1);
          return true;
        }
        const idx = books.findIndex((b) => b.abbrev === book.abbrev);
        const nextBook =
          idx >= 0 && idx < books.length - 1 ? books[idx + 1] : null;
        if (nextBook) {
          setBook(nextBook);
          setChapter(1);
          return true;
        }
        return false;
      }
      if (delta < 0) {
        if (chapter > 1) {
          setChapter((c) => c - 1);
          return true;
        }
        const idx = books.findIndex((b) => b.abbrev === book.abbrev);
        const prevBook = idx > 0 ? books[idx - 1] : null;
        if (prevBook) {
          setBook(prevBook);
          setChapter(1);
          return true;
        }
        return false;
      }
      return false;
    },
    [book, chapter, books],
  );

  // register the chapter stepper for the shell's arrow keys while a bible
  // page is active; unregistering on leave keeps the table current
  useEffect(() => {
    if (!isBiblePage(page)) return;
    registerPageStepper(page, stepChapter);
    return () => registerPageStepper(page, null);
  }, [page, stepChapter]);

  const goToRef = useCallback((abbrev: string, chapter: number) => {
    _pendingRefTarget = { abbrev, chapter };
  }, []);

  // history replay targets this instead of the user-facing setters, so it
  // never pushes (the restoring flag would swallow those anyway)
  const restoreRef = useCallback(
    (ref: { abbrev: string; chapter: number } | null) => {
      if (!ref) {
        // a step with no open book is the picker page: returning to it clears
        // the open book instead of leaving the last chapter open over it, so
        // Back from a chapter lands back on the book list
        setBook(null);
        setChapter(1);
        return;
      }
      const found =
        bookByAbbrev(ref.abbrev, apocrypha) ?? getScriptureBookMeta(ref.abbrev);
      if (!found) return;
      restoredTestament.current = found.testament;
      // a book the current corpus does not hold reads in the corpus that
      // does, so a restored position opens where it was left
      if (found.testament === "DC") {
        const holding = corpusHolding(found.abbrev, apocrypha);
        if (holding !== apocrypha) setApocrypha(holding);
      }
      setTestament(found.testament);
      setBook(found);
      setChapter(Math.min(Math.max(1, ref.chapter), found.chapters));
    },
    [apocrypha, setApocrypha],
  );

  // snapshot the open position while on a bible page; a restore replays it
  useHistoryField(
    "bible",
    () => (book && isBiblePage(page) ? { abbrev: book.abbrev, chapter } : null),
    restoreRef,
  );

  return (
    <Ctx.Provider
      value={{
        testament,
        book,
        chapter,
        books,
        corpus: apocrypha,
        selectTestament,
        selectBook,
        switchCorpus,
        clearBook,
        nextChapter,
        prevChapter,
        selectChapter,
        goToRef,
        restoreRef,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
