import { beforeEach, describe, expect, it } from "bun:test";
import {
  getAllProgress,
  getMark,
  getPosition,
  isChapterRead,
  markReached,
  resetBook,
  setPosition,
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

  it("position persists per testament", () => {
    setPosition("OT", "Gen", 3, 100);
    setPosition("NT", "John", 1, 50);
    const otPos = getPosition("OT");
    const ntPos = getPosition("NT");
    expect(otPos.book).toBe("Gen");
    expect(otPos.chapter).toBe(3);
    expect(otPos.scrollY).toBe(100);
    expect(ntPos.book).toBe("John");
    expect(ntPos.chapter).toBe(1);
    expect(ntPos.scrollY).toBe(50);
  });

  it("position defaults to Gen 1 / Matt 1", () => {
    const otPos = getPosition("OT");
    const ntPos = getPosition("NT");
    expect(otPos.book).toBe("Gen");
    expect(otPos.chapter).toBe(1);
    expect(ntPos.book).toBe("Matt");
    expect(ntPos.chapter).toBe(1);
  });
});
