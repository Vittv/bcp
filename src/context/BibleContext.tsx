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
  corpusHolding,
  dcBooks,
  getScriptureBookMeta,
  readingRank,
} from "../lib/content/bible";
import { markReached } from "../lib/content/bibleProgress";
import type { ScriptureBookMeta } from "../lib/content/scripture";
import { registerPageStepper } from "../lib/input/sequenceNav";
import {
  bookByAbbrev,
  booksFor,
  clearSavedPositions,
  consumePendingBibleRef,
  corpusLanding,
  hasSavedPosition,
  isBiblePage,
  lastChapterFor,
  openingRef,
  pageEntryRestore,
  pageForBook,
  pageTestament,
  resolvePos,
  type SavedPos,
  saveBookPos,
  savedPositions,
  savePos,
  setBiblePendingRef,
  TESTAMENTS,
  type Testament,
} from "./BibleContext.helpers";

export type { SavedPos, Testament };
export {
  booksFor,
  clearSavedPositions,
  corpusLanding,
  hasSavedPosition,
  lastChapterFor,
  openingRef,
  pageEntryRestore,
  pageForBook,
  savedPositions,
  setBiblePendingRef,
  TESTAMENTS,
};

export function bibleBookName(abbrev: string): string {
  // the combined canon, so a deuterocanonical book spells out (Sirach) rather
  // than falling back to its own abbrev (Sir)
  return getScriptureBookMeta(abbrev)?.book ?? abbrev;
}

type BibleState = {
  testament: Testament;
  book: ScriptureBookMeta | null;
  chapter: number;
  books: ScriptureBookMeta[];
  corpus: import("../lib/content/bible").ApocryphaCorpus;
  selectTestament: (t: Testament) => void;
  selectBook: (abbrev: string, chapter?: number) => void;
  switchCorpus: (
    corpus: import("../lib/content/bible").ApocryphaCorpus,
  ) => void;
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
    savedPositions(apocrypha)[initialTestament],
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
    const pendingRef = consumePendingBibleRef();
    if (pendingRef) {
      const ref = pendingRef;
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
      const pos = resolvePos(t, apocrypha, savedPositions(apocrypha)[t]);
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
      const pos = resolvePos(t, apocrypha, savedPositions(apocrypha)[t]);
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
    (next: import("../lib/content/bible").ApocryphaCorpus) => {
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
    setBiblePendingRef({ abbrev, chapter });
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
