import { beforeEach, describe, expect, it } from "bun:test";
import {
  ALL_BOOKS,
  clearSavedPositions,
  openingRef,
  savedPositions,
  type Testament,
} from "../BibleContext";

beforeEach(() => {
  const store: Record<string, string> = {};
  const mockStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const k of Object.keys(store)) {
        delete store[k];
      }
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    length: Object.keys(store).length,
  };
  // SAFETY: test mock matches Storage interface
  global.localStorage = mockStorage as Storage;
  localStorage.clear();
});

// written straight to the stored shape, so the test pins the on-disk form
type StoredPos = { abbrev: string; chapter: number; savedAt?: number };

function store(corpus: Testament, pos: StoredPos): void {
  localStorage.setItem(`bcp-bible-${corpus}`, JSON.stringify(pos));
}

describe("savedPositions", () => {
  it("returns nulls with nothing stored", () => {
    expect(savedPositions()).toEqual({ OT: null, NT: null, DC: null });
  });

  it("returns a lone old testament position", () => {
    store("OT", { abbrev: "Gen", chapter: 12, savedAt: 100 });
    expect(savedPositions()).toEqual({
      OT: { abbrev: "Gen", chapter: 12, savedAt: 100 },
      NT: null,
      DC: null,
    });
  });

  it("returns a lone new testament position", () => {
    store("NT", { abbrev: "John", chapter: 3, savedAt: 200 });
    expect(savedPositions()).toEqual({
      OT: null,
      NT: { abbrev: "John", chapter: 3, savedAt: 200 },
      DC: null,
    });
  });

  it("returns a lone deuterocanonical position", () => {
    store("DC", { abbrev: "Sir", chapter: 40, savedAt: 300 });
    expect(savedPositions()).toEqual({
      OT: null,
      NT: null,
      DC: { abbrev: "Sir", chapter: 40, savedAt: 300 },
    });
  });

  it("keeps both testaments independent of which was saved last", () => {
    store("OT", { abbrev: "Gen", chapter: 12, savedAt: 200 });
    store("NT", { abbrev: "John", chapter: 3, savedAt: 100 });
    expect(savedPositions()).toEqual({
      OT: { abbrev: "Gen", chapter: 12, savedAt: 200 },
      NT: { abbrev: "John", chapter: 3, savedAt: 100 },
      DC: null,
    });
  });

  it("keeps the deuterocanonical position independent of the canonical two", () => {
    store("OT", { abbrev: "Gen", chapter: 12, savedAt: 200 });
    store("NT", { abbrev: "John", chapter: 3, savedAt: 100 });
    store("DC", { abbrev: "Wis", chapter: 19, savedAt: 50 });
    expect(savedPositions()).toEqual({
      OT: { abbrev: "Gen", chapter: 12, savedAt: 200 },
      NT: { abbrev: "John", chapter: 3, savedAt: 100 },
      DC: { abbrev: "Wis", chapter: 19, savedAt: 50 },
    });
  });

  it("shows a legacy position in each testament, not one or the other", () => {
    store("OT", { abbrev: "Gen", chapter: 12 });
    store("NT", { abbrev: "John", chapter: 3 });
    expect(savedPositions()).toEqual({
      OT: { abbrev: "Gen", chapter: 12, savedAt: 0 },
      NT: { abbrev: "John", chapter: 3, savedAt: 0 },
      DC: null,
    });
  });

  it("ignores a position naming a book that does not exist", () => {
    store("OT", { abbrev: "Gone", chapter: 4, savedAt: 100 });
    store("NT", { abbrev: "John", chapter: 3, savedAt: 50 });
    expect(savedPositions()).toEqual({
      OT: null,
      NT: { abbrev: "John", chapter: 3, savedAt: 50 },
      DC: null,
    });
  });

  it("ignores a book that belongs to the other testament", () => {
    store("OT", { abbrev: "Matt", chapter: 12, savedAt: 100 });
    store("NT", { abbrev: "Gen", chapter: 3, savedAt: 50 });
    expect(savedPositions()).toEqual({ OT: null, NT: null, DC: null });
  });

  it("ignores a canonical book stored under the deuterocanonical corpus", () => {
    // DC is its own resume slot, not a shared one: a slot must not resume
    // into a book its own list does not contain
    store("DC", { abbrev: "John", chapter: 3, savedAt: 100 });
    store("NT", { abbrev: "John", chapter: 3, savedAt: 100 });
    expect(savedPositions()).toEqual({
      OT: null,
      NT: { abbrev: "John", chapter: 3, savedAt: 100 },
      DC: null,
    });
  });

  it("clamps a chapter past the end of the book", () => {
    store("OT", { abbrev: "Gen", chapter: 99, savedAt: 100 });
    expect(savedPositions().OT?.chapter).toBe(50);
  });

  it("clamps a deuterocanonical chapter past the end of the book", () => {
    store("DC", { abbrev: "Bar", chapter: 99, savedAt: 100 });
    expect(savedPositions().DC?.chapter).toBe(6);
  });

  it("clears every position", () => {
    store("OT", { abbrev: "Gen", chapter: 12, savedAt: 100 });
    store("NT", { abbrev: "John", chapter: 3, savedAt: 200 });
    store("DC", { abbrev: "Sir", chapter: 40, savedAt: 300 });
    clearSavedPositions();
    expect(savedPositions()).toEqual({ OT: null, NT: null, DC: null });
  });
});

// the sidebar row pairs a saved position with this fallback, so a reader who
// has never opened a corpus still sees where the row would take them
describe("openingRef", () => {
  it("names the first chapter of the first book of each corpus", () => {
    expect(openingRef("OT")).toEqual({ abbrev: "Gen", chapter: 1 });
    expect(openingRef("NT")).toEqual({ abbrev: "Matt", chapter: 1 });
    expect(openingRef("DC")).toEqual({ abbrev: "Tob", chapter: 1 });
  });

  it("agrees with the first book the corpus actually lists", () => {
    for (const t of ["OT", "NT", "DC"] as const) {
      expect(openingRef(t)?.abbrev).toBe(ALL_BOOKS[t][0]?.abbrev);
    }
  });

  it("stays the fallback and never reports a stored position", () => {
    // it reads no storage, so a saved position cannot leak through it: that
    // is what lets the sidebar prefer the saved one and use this only when
    // there is none
    store("DC", { abbrev: "Sir", chapter: 40, savedAt: 100 });
    expect(openingRef("DC")).toEqual({ abbrev: "Tob", chapter: 1 });
    expect(savedPositions().DC?.abbrev).toBe("Sir");
  });

  it("does not make an untouched reader look like they have progress", () => {
    // Settings gates its reset button on savedPositions still reading null,
    // so the fallback must not leak into that shape
    expect(savedPositions()).toEqual({ OT: null, NT: null, DC: null });
  });
});
