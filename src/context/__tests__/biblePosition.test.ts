import { beforeEach, describe, expect, it } from "bun:test";
import {
  clearSavedPositions,
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
