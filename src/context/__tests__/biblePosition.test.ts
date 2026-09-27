import { beforeEach, describe, expect, it } from "bun:test";
import { clearSavedPositions, savedPositions } from "../BibleContext";

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

function store(testament: "OT" | "NT", pos: StoredPos): void {
  localStorage.setItem(`bcp-bible-${testament}`, JSON.stringify(pos));
}

describe("savedPositions", () => {
  it("returns nulls with nothing stored", () => {
    expect(savedPositions()).toEqual({ OT: null, NT: null });
  });

  it("returns a lone old testament position", () => {
    store("OT", { abbrev: "Gen", chapter: 12, savedAt: 100 });
    expect(savedPositions()).toEqual({
      OT: { abbrev: "Gen", chapter: 12, savedAt: 100 },
      NT: null,
    });
  });

  it("returns a lone new testament position", () => {
    store("NT", { abbrev: "John", chapter: 3, savedAt: 200 });
    expect(savedPositions()).toEqual({
      OT: null,
      NT: { abbrev: "John", chapter: 3, savedAt: 200 },
    });
  });

  it("keeps both testaments independent of which was saved last", () => {
    store("OT", { abbrev: "Gen", chapter: 12, savedAt: 200 });
    store("NT", { abbrev: "John", chapter: 3, savedAt: 100 });
    expect(savedPositions()).toEqual({
      OT: { abbrev: "Gen", chapter: 12, savedAt: 200 },
      NT: { abbrev: "John", chapter: 3, savedAt: 100 },
    });
  });

  it("shows a legacy position in each testament, not one or the other", () => {
    store("OT", { abbrev: "Gen", chapter: 12 });
    store("NT", { abbrev: "John", chapter: 3 });
    expect(savedPositions()).toEqual({
      OT: { abbrev: "Gen", chapter: 12, savedAt: 0 },
      NT: { abbrev: "John", chapter: 3, savedAt: 0 },
    });
  });

  it("ignores a position naming a book that does not exist", () => {
    store("OT", { abbrev: "Gone", chapter: 4, savedAt: 100 });
    store("NT", { abbrev: "John", chapter: 3, savedAt: 50 });
    expect(savedPositions()).toEqual({
      OT: null,
      NT: { abbrev: "John", chapter: 3, savedAt: 50 },
    });
  });

  it("ignores a book that belongs to the other testament", () => {
    store("OT", { abbrev: "Matt", chapter: 12, savedAt: 100 });
    store("NT", { abbrev: "Gen", chapter: 3, savedAt: 50 });
    expect(savedPositions()).toEqual({ OT: null, NT: null });
  });

  it("clamps a chapter past the end of the book", () => {
    store("OT", { abbrev: "Gen", chapter: 99, savedAt: 100 });
    expect(savedPositions().OT?.chapter).toBe(50);
  });

  it("clears both positions", () => {
    store("OT", { abbrev: "Gen", chapter: 12, savedAt: 100 });
    store("NT", { abbrev: "John", chapter: 3, savedAt: 200 });
    clearSavedPositions();
    expect(savedPositions()).toEqual({ OT: null, NT: null });
  });
});
