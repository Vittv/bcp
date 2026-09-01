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
import type { KjvBookMeta } from "../lib/content/kjv";
import { getBooksByTestament, getKjvBookMeta } from "../lib/content/kjv";

export type Testament = "OT" | "NT";

export const ALL_BOOKS: Record<Testament, KjvBookMeta[]> = {
  OT: getBooksByTestament("OT"),
  NT: getBooksByTestament("NT"),
};

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

type SavedPos = { abbrev: string; chapter: number };

const STORAGE_PREFIX = "bcp-bible-";

function storageKey(t: Testament): string {
  return `${STORAGE_PREFIX}${t}`;
}

function loadPos(t: Testament): SavedPos | null {
  try {
    const raw = localStorage.getItem(storageKey(t));
    if (!raw) return null;
    // SAFETY: fields validated by the type guard below
    const parsed = JSON.parse(raw) as SavedPos;
    if (
      typeof parsed.abbrev === "string" &&
      typeof parsed.chapter === "number"
    ) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

function savePos(t: Testament, pos: SavedPos): void {
  try {
    localStorage.setItem(storageKey(t), JSON.stringify(pos));
  } catch {
    // ignore
  }
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
  book: KjvBookMeta | null;
  chapter: number;
  books: KjvBookMeta[];
  selectTestament: (t: Testament) => void;
  selectBook: (abbrev: string) => void;
  clearBook: () => void;
  nextChapter: () => void;
  prevChapter: () => void;
  goToRef: (abbrev: string, chapter: number) => void;
};

const Ctx = createContext<BibleState | null>(null);

export function useBible(): BibleState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBible outside BibleProvider");
  return ctx;
}

export function bibleBookName(abbrev: string): string {
  return getKjvBookMeta(abbrev)?.book ?? abbrev;
}

function isBiblePage(p: PageId): boolean {
  return p === "old-testament" || p === "new-testament";
}

function pageTestament(p: PageId): Testament {
  return p === "new-testament" ? "NT" : "OT";
}

/** Resolve a saved position to a real book + chapter, falling back to first book. */
function resolvePos(
  t: Testament,
  saved: SavedPos | null,
): {
  book: KjvBookMeta | null;
  chapter: number;
} {
  const books = ALL_BOOKS[t];
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
  const initialTestament = isBiblePage(page) ? pageTestament(page) : "OT";
  const initial = resolvePos(initialTestament, loadPos(initialTestament));

  const [testament, setTestament] = useState<Testament>(initialTestament);
  const [book, setBook] = useState<KjvBookMeta | null>(initial.book);
  const [chapter, setChapter] = useState(initial.chapter);

  // sync testament + restore position when page changes to a bible page
  const prevPage = useRef(page);
  useEffect(() => {
    if (prevPage.current === page) return;
    prevPage.current = page;
    if (isBiblePage(page)) {
      const t = pageTestament(page);
      setTestament(t);
      if (_pendingRefTarget) {
        const ref = _pendingRefTarget;
        _pendingRefTarget = null;
        const found =
          ALL_BOOKS[t].find((b) => b.abbrev === ref.abbrev) ?? ALL_BOOKS[t][0];
        setBook(found);
        setChapter(Math.min(Math.max(1, ref.chapter), found.chapters));
      } else {
        const pos = resolvePos(t, loadPos(t));
        setBook(pos.book);
        setChapter(pos.chapter);
      }
    }
  }, [page]);

  // persist position + report to status bar (only while on a bible page)
  useEffect(() => {
    if (book && isBiblePage(page)) {
      savePos(testament, { abbrev: book.abbrev, chapter });
      onReadingChange?.(`${bibleBookName(book.abbrev)} ${chapter}`);
    }
  }, [page, testament, book, chapter, onReadingChange]);

  // scroll to top when chapter advances (skip initial mount, skip going backward)
  const prevChapterRef = useRef(chapter);
  useEffect(() => {
    if (prevChapterRef.current !== chapter) {
      const wentForward = chapter > prevChapterRef.current;
      prevChapterRef.current = chapter;
      if (wentForward) onChapterChange?.();
    }
  }, [chapter, onChapterChange]);

  const books = ALL_BOOKS[testament];

  const selectTestament = useCallback((t: Testament) => {
    setTestament(t);
    const pos = resolvePos(t, loadPos(t));
    setBook(pos.book);
    setChapter(pos.chapter);
  }, []);

  const selectBook = useCallback((abbrev: string) => {
    const found =
      ALL_BOOKS.OT.find((b) => b.abbrev === abbrev) ??
      ALL_BOOKS.NT.find((b) => b.abbrev === abbrev);
    // the browser only navigates OT/NT, so a DC-authored book never matches
    if (found && found.testament !== "DC") {
      setTestament(found.testament);
      setBook(found);
      setChapter(1);
    }
  }, []);

  const clearBook = useCallback(() => {
    setBook(null);
    setChapter(1);
  }, []);

  const nextChapter = useCallback(() => {
    if (book && chapter < book.chapters) setChapter((c) => c + 1);
  }, [book, chapter]);

  const prevChapter = useCallback(() => {
    if (chapter > 1) setChapter((c) => c - 1);
  }, [chapter]);

  const goToRef = useCallback((abbrev: string, chapter: number) => {
    _pendingRefTarget = { abbrev, chapter };
  }, []);

  return (
    <Ctx.Provider
      value={{
        testament,
        book,
        chapter,
        books,
        selectTestament,
        selectBook,
        clearBook,
        nextChapter,
        prevChapter,
        goToRef,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
