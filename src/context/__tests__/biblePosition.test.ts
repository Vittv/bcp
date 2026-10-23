import { beforeEach, describe, expect, it } from "bun:test";
import {
  booksFor,
  clearSavedPositions,
  corpusLanding,
  hasSavedPosition,
  lastChapterFor,
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

// the DC slot is one per corpus, so a switch lands on that corpus's own
// place; the canonical two are shared
function slotKey(t: Testament, corpus: "kjva" | "web"): string {
  return t === "DC" ? `bcp-bible-DC-${corpus}` : `bcp-bible-${t}`;
}

// written straight to the stored shape, so the test pins the on-disk form
type StoredPos = { abbrev: string; chapter: number; savedAt?: number };

function store(t: Testament, corpus: "kjva" | "web", pos: StoredPos): void {
  localStorage.setItem(slotKey(t, corpus), JSON.stringify(pos));
}

function storeBooks(positions: Record<string, number>): void {
  localStorage.setItem("bcp-bible-books", JSON.stringify(positions));
}

describe("savedPositions", () => {
  it("returns nulls with nothing stored", () => {
    expect(savedPositions("web")).toEqual({ OT: null, NT: null, DC: null });
    expect(savedPositions("kjva")).toEqual({ OT: null, NT: null, DC: null });
  });

  it("returns a lone old testament position", () => {
    store("OT", "web", { abbrev: "Gen", chapter: 12, savedAt: 100 });
    expect(savedPositions("web")).toEqual({
      OT: { abbrev: "Gen", chapter: 12, savedAt: 100 },
      NT: null,
      DC: null,
    });
  });

  it("returns a lone new testament position", () => {
    store("NT", "web", { abbrev: "John", chapter: 3, savedAt: 200 });
    expect(savedPositions("web")).toEqual({
      OT: null,
      NT: { abbrev: "John", chapter: 3, savedAt: 200 },
      DC: null,
    });
  });

  it("returns a lone deuterocanonical position", () => {
    store("DC", "web", { abbrev: "Sir", chapter: 40, savedAt: 300 });
    expect(savedPositions("web")).toEqual({
      OT: null,
      NT: null,
      DC: { abbrev: "Sir", chapter: 40, savedAt: 300 },
    });
  });

  it("keeps both testaments independent of which was saved last", () => {
    store("OT", "web", { abbrev: "Gen", chapter: 12, savedAt: 200 });
    store("NT", "web", { abbrev: "John", chapter: 3, savedAt: 100 });
    expect(savedPositions("web")).toEqual({
      OT: { abbrev: "Gen", chapter: 12, savedAt: 200 },
      NT: { abbrev: "John", chapter: 3, savedAt: 100 },
      DC: null,
    });
  });

  it("keeps the deuterocanonical position independent of the canonical two", () => {
    store("OT", "web", { abbrev: "Gen", chapter: 12, savedAt: 200 });
    store("NT", "web", { abbrev: "John", chapter: 3, savedAt: 100 });
    store("DC", "web", { abbrev: "Wis", chapter: 19, savedAt: 50 });
    expect(savedPositions("web")).toEqual({
      OT: { abbrev: "Gen", chapter: 12, savedAt: 200 },
      NT: { abbrev: "John", chapter: 3, savedAt: 100 },
      DC: { abbrev: "Wis", chapter: 19, savedAt: 50 },
    });
  });

  it("shows a legacy position in each testament, not one or the other", () => {
    store("OT", "web", { abbrev: "Gen", chapter: 12 });
    store("NT", "web", { abbrev: "John", chapter: 3 });
    expect(savedPositions("web")).toEqual({
      OT: { abbrev: "Gen", chapter: 12, savedAt: 0 },
      NT: { abbrev: "John", chapter: 3, savedAt: 0 },
      DC: null,
    });
  });

  it("ignores a position naming a book that does not exist", () => {
    store("OT", "web", { abbrev: "Gone", chapter: 4, savedAt: 100 });
    store("NT", "web", { abbrev: "John", chapter: 3, savedAt: 50 });
    expect(savedPositions("web")).toEqual({
      OT: null,
      NT: { abbrev: "John", chapter: 3, savedAt: 50 },
      DC: null,
    });
  });

  it("ignores a book that belongs to the other testament", () => {
    store("OT", "web", { abbrev: "Matt", chapter: 12, savedAt: 100 });
    store("NT", "web", { abbrev: "Gen", chapter: 3, savedAt: 50 });
    expect(savedPositions("web")).toEqual({ OT: null, NT: null, DC: null });
  });

  it("ignores a canonical book stored under the deuterocanonical corpus", () => {
    store("DC", "web", { abbrev: "John", chapter: 3, savedAt: 100 });
    store("NT", "web", { abbrev: "John", chapter: 3, savedAt: 100 });
    expect(savedPositions("web")).toEqual({
      OT: null,
      NT: { abbrev: "John", chapter: 3, savedAt: 100 },
      DC: null,
    });
  });

  it("treats each corpus's deuterocanonical slot as its own place", () => {
    store("DC", "kjva", { abbrev: "Rest Esth", chapter: 3, savedAt: 100 });
    store("DC", "web", { abbrev: "Dan Grk", chapter: 13, savedAt: 200 });
    expect(savedPositions("kjva").DC).toEqual({
      abbrev: "Rest Esth",
      chapter: 3,
      savedAt: 100,
    });
    expect(savedPositions("web").DC).toEqual({
      abbrev: "Dan Grk",
      chapter: 13,
      savedAt: 200,
    });
  });

  it("shares the canonical slots between the corpora", () => {
    // both corpora restore the same canonical place
    store("OT", "kjva", { abbrev: "Gen", chapter: 12, savedAt: 100 });
    store("NT", "kjva", { abbrev: "John", chapter: 3, savedAt: 200 });
    expect(savedPositions("web").OT).toEqual({
      abbrev: "Gen",
      chapter: 12,
      savedAt: 100,
    });
    expect(savedPositions("web").NT).toEqual({
      abbrev: "John",
      chapter: 3,
      savedAt: 200,
    });
  });

  it("ignores a deuterocanonical position the corpus does not hold", () => {
    store("DC", "kjva", { abbrev: "Sus", chapter: 1, savedAt: 100 });
    expect(savedPositions("kjva").DC?.abbrev).toBe("Sus");
    expect(savedPositions("web").DC).toBeNull();
  });

  it("clamps a chapter past the end of the book", () => {
    store("OT", "web", { abbrev: "Gen", chapter: 99, savedAt: 100 });
    expect(savedPositions("web").OT?.chapter).toBe(50);
  });

  it("clamps a deuterocanonical chapter past the end of the book", () => {
    store("DC", "web", { abbrev: "Bar", chapter: 99, savedAt: 100 });
    expect(savedPositions("web").DC?.chapter).toBe(6);
  });

  it("clears every position in both corpora", () => {
    store("OT", "web", { abbrev: "Gen", chapter: 12, savedAt: 100 });
    store("NT", "web", { abbrev: "John", chapter: 3, savedAt: 200 });
    store("DC", "web", { abbrev: "Sir", chapter: 40, savedAt: 300 });
    store("DC", "kjva", { abbrev: "Tob", chapter: 5, savedAt: 400 });
    storeBooks({ Gen: 12, John: 3 });
    clearSavedPositions();
    expect(savedPositions("web")).toEqual({ OT: null, NT: null, DC: null });
    expect(savedPositions("kjva")).toEqual({ OT: null, NT: null, DC: null });
    expect(lastChapterFor("Gen", "web")).toBe(1);
    expect(lastChapterFor("John", "web")).toBe(1);
  });
});

describe("corpusLanding", () => {
  const dcBook = (corpus: "kjva" | "web", abbrev: string) => {
    const meta = booksFor(corpus).DC.find((b) => b.abbrev === abbrev);
    if (!meta) throw new Error(`no ${abbrev} in ${corpus}`);
    return meta;
  };

  it("stays on a book both corpora hold, clamped to the new chapter count", () => {
    expect(corpusLanding("kjva", "web", dcBook("kjva", "Tob"), 5)).toEqual({
      abbrev: "Tob",
      chapter: 5,
    });
    expect(corpusLanding("kjva", "web", dcBook("kjva", "Tob"), 99)).toEqual({
      abbrev: "Tob",
      chapter: 14,
    });
  });

  it("follows the same work to its other address", () => {
    expect(corpusLanding("kjva", "web", dcBook("kjva", "Sus"), 1)).toEqual({
      abbrev: "Dan Grk",
      chapter: 13,
    });
    expect(corpusLanding("kjva", "web", dcBook("kjva", "Bel"), 1)).toEqual({
      abbrev: "Dan Grk",
      chapter: 14,
    });
    expect(corpusLanding("web", "kjva", dcBook("web", "Dan Grk"), 13)).toEqual({
      abbrev: "Sus",
      chapter: 1,
    });
    expect(corpusLanding("web", "kjva", dcBook("web", "Dan Grk"), 14)).toEqual({
      abbrev: "Bel",
      chapter: 1,
    });
  });

  it("falls to the new corpus's last read position when there is no counterpart", () => {
    store("DC", "web", { abbrev: "Sir", chapter: 3, savedAt: 100 });
    expect(
      corpusLanding("kjva", "web", dcBook("kjva", "Rest Esth"), 4),
    ).toEqual({ abbrev: "Sir", chapter: 3 });
  });

  it("falls to the new corpus's first book when nothing is saved", () => {
    expect(
      corpusLanding("kjva", "web", dcBook("kjva", "Rest Esth"), 4),
    ).toEqual({ abbrev: "Tob", chapter: 1 });
  });
});

describe("hasSavedPosition", () => {
  it("is false with nothing stored", () => {
    expect(hasSavedPosition()).toBe(false);
  });

  it("is true when only the other corpus holds a position", () => {
    store("DC", "kjva", { abbrev: "Tob", chapter: 5, savedAt: 100 });
    expect(hasSavedPosition()).toBe(true);
    expect(savedPositions("web").DC).toBeNull();
  });
});

describe("openingRef", () => {
  it("names the first chapter of the first book of each corpus", () => {
    for (const corpus of ["kjva", "web"] as const) {
      expect(openingRef("OT", corpus)).toEqual({ abbrev: "Gen", chapter: 1 });
      expect(openingRef("NT", corpus)).toEqual({ abbrev: "Matt", chapter: 1 });
      expect(openingRef("DC", corpus)).toEqual({ abbrev: "Tob", chapter: 1 });
    }
  });

  it("agrees with the first book the corpus actually lists", () => {
    for (const corpus of ["kjva", "web"] as const) {
      for (const t of ["OT", "NT", "DC"] as const) {
        expect(openingRef(t, corpus)?.abbrev).toBe(
          booksFor(corpus)[t][0]?.abbrev,
        );
      }
    }
  });

  it("stays the fallback and never reports a stored position", () => {
    store("DC", "web", { abbrev: "Sir", chapter: 40, savedAt: 100 });
    expect(openingRef("DC", "web")).toEqual({ abbrev: "Tob", chapter: 1 });
    expect(savedPositions("web").DC?.abbrev).toBe("Sir");
  });

  it("does not make an untouched reader look like they have progress", () => {
    expect(savedPositions("web")).toEqual({ OT: null, NT: null, DC: null });
  });
});

describe("lastChapterFor", () => {
  it("opens a book the reader has never been in at its first chapter", () => {
    expect(lastChapterFor("Luke", "web")).toBe(1);
    expect(lastChapterFor("Tob", "web")).toBe(1);
    expect(lastChapterFor("Sus", "kjva")).toBe(1);
  });

  it("returns where the reader last left the book", () => {
    storeBooks({ Luke: 12, Matt: 5 });
    expect(lastChapterFor("Luke", "web")).toBe(12);
    expect(lastChapterFor("Matt", "web")).toBe(5);
  });

  it("keeps every book's place independent of the others", () => {
    storeBooks({ Luke: 12, John: 3 });
    expect(lastChapterFor("Luke", "web")).toBe(12);
    expect(lastChapterFor("Mark", "web")).toBe(1);
  });

  it("carries a shared book's place across the corpora", () => {
    storeBooks({ Tob: 9 });
    expect(lastChapterFor("Tob", "kjva")).toBe(9);
    expect(lastChapterFor("Tob", "web")).toBe(9);
  });

  it("reads a KJVA-only book under KJVA and not under WEB", () => {
    storeBooks({ "Rest Esth": 4 });
    expect(lastChapterFor("Rest Esth", "kjva")).toBe(4);
    expect(lastChapterFor("Rest Esth", "web")).toBe(1);
  });

  it("clamps a place past the end of the book", () => {
    storeBooks({ John: 99 });
    expect(lastChapterFor("John", "web")).toBe(21);
  });

  it("clamps a place below the first chapter", () => {
    storeBooks({ Gen: 0 });
    expect(lastChapterFor("Gen", "web")).toBe(1);
  });

  it("ignores an entry naming a book that does not exist", () => {
    storeBooks({ Gone: 4 });
    expect(lastChapterFor("Gone", "web")).toBe(1);
  });

  it("ignores an entry that is not a chapter number", () => {
    localStorage.setItem(
      "bcp-bible-books",
      JSON.stringify({ Luke: "12", Ps: null }),
    );
    expect(lastChapterFor("Luke", "web")).toBe(1);
    expect(lastChapterFor("Ps", "web")).toBe(1);
  });

  it("ignores storage that is not the stored shape", () => {
    localStorage.setItem("bcp-bible-books", "not json");
    expect(lastChapterFor("Luke", "web")).toBe(1);
  });

  it("survives storage that throws on read", () => {
    localStorage.getItem = () => {
      throw new Error("blocked");
    };
    expect(lastChapterFor("Luke", "web")).toBe(1);
  });
});
