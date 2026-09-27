import { beforeEach, describe, expect, it } from "bun:test";
import {
  clearProgress,
  getAllProgress,
  getMark,
  isChapterRead,
  markReached,
  resetBook,
} from "../bibleProgress";

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

describe("bibleProgress", () => {
  it("markReached stores highest chapter", () => {
    markReached("Gen", 1);
    expect(getMark("Gen")).toBe(1);
    markReached("Gen", 3);
    expect(getMark("Gen")).toBe(3);
    markReached("Gen", 2);
    expect(getMark("Gen")).toBe(3);
  });

  it("getMark returns 0 for unread books", () => {
    expect(getMark("Exod")).toBe(0);
  });

  it("resetBook removes progress for a book", () => {
    markReached("Gen", 10);
    resetBook("Gen");
    expect(getMark("Gen")).toBe(0);
  });

  it("getAllProgress returns all stored progress", () => {
    markReached("Gen", 5);
    markReached("Exod", 3);
    const all = getAllProgress();
    expect(all.Gen).toBe(5);
    expect(all.Exod).toBe(3);
  });

  it("isChapterRead returns true for chapters at or below mark", () => {
    markReached("Gen", 5);
    expect(isChapterRead("Gen", 1)).toBe(true);
    expect(isChapterRead("Gen", 5)).toBe(true);
    expect(isChapterRead("Gen", 6)).toBe(false);
  });

  it("clearProgress drops every book's mark", () => {
    markReached("Gen", 5);
    markReached("Exod", 3);
    clearProgress();
    expect(getAllProgress()).toEqual({});
    expect(getMark("Gen")).toBe(0);
  });

  it("clearProgress is a no-op on an empty store", () => {
    clearProgress();
    expect(getAllProgress()).toEqual({});
  });
});
