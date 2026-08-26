const STORAGE_KEY = "bcp:bible-progress:v1";
const POSITION_KEY = "bcp:bible-position:v1";

export type BibleProgress = Record<string, number>;

export type BiblePosition = {
  ot: { book: string; chapter: number; scrollY?: number };
  nt: { book: string; chapter: number; scrollY?: number };
};

function getStorage(): Storage | null {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  if (
    typeof globalThis !== "undefined" &&
    // SAFETY: we just checked that localStorage exists on globalThis
    (globalThis as { localStorage?: Storage }).localStorage
  ) {
    // SAFETY: we just checked that localStorage exists on globalThis
    return (globalThis as { localStorage: Storage }).localStorage;
  }
  return null;
}

function loadProgress(): BibleProgress {
  const storage = getStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgress(progress: BibleProgress): void {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function loadPosition(): BiblePosition {
  const storage = getStorage();
  if (!storage) {
    return {
      ot: { book: "Gen", chapter: 1 },
      nt: { book: "Matt", chapter: 1 },
    };
  }
  try {
    const raw = storage.getItem(POSITION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ot: parsed.ot ?? { book: "Gen", chapter: 1 },
        nt: parsed.nt ?? { book: "Matt", chapter: 1 },
      };
    }
  } catch {
    // ignore
  }
  return {
    ot: { book: "Gen", chapter: 1 },
    nt: { book: "Matt", chapter: 1 },
  };
}

function savePosition(position: BiblePosition): void {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(POSITION_KEY, JSON.stringify(position));
}

export function markReached(bookAbbrev: string, chapter: number): void {
  const progress = loadProgress();
  const current = progress[bookAbbrev] ?? 0;
  if (chapter > current) {
    progress[bookAbbrev] = chapter;
    saveProgress(progress);
  }
}

export function getMark(bookAbbrev: string): number {
  const progress = loadProgress();
  return progress[bookAbbrev] ?? 0;
}

export function resetBook(bookAbbrev: string): void {
  const progress = loadProgress();
  delete progress[bookAbbrev];
  saveProgress(progress);
}

export function getAllProgress(): BibleProgress {
  return loadProgress();
}

export function getPosition(testament: "OT" | "NT"): {
  book: string;
  chapter: number;
  scrollY?: number;
} {
  const pos = loadPosition();
  return testament === "OT" ? pos.ot : pos.nt;
}

export function setPosition(
  testament: "OT" | "NT",
  book: string,
  chapter: number,
  scrollY?: number,
): void {
  const pos = loadPosition();
  if (testament === "OT") {
    pos.ot = { book, chapter, scrollY };
  } else {
    pos.nt = { book, chapter, scrollY };
  }
  savePosition(pos);
}

export function isChapterRead(bookAbbrev: string, chapter: number): boolean {
  return getMark(bookAbbrev) >= chapter;
}

export function resetBooks(bookAbbrevs: string[]): void {
  const progress = loadProgress();
  for (const abbrev of bookAbbrevs) {
    delete progress[abbrev];
  }
  saveProgress(progress);
}
