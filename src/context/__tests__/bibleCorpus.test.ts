import { describe, expect, it } from "bun:test";
import { getAllKjvBooks } from "../../lib/content/kjv";
import { ALL_BOOKS, pageForBook, TESTAMENTS } from "../BibleContext";

// the app reads three corpora, and two independent things depend on the
// routing between them: a cross-link into the bible picks the page, and the
// picker's book row is looked up by abbrev across all three lists. both are
// pinned here because a wrong answer opens the wrong reader silently
describe("pageForBook", () => {
  it("routes each corpus to its own page", () => {
    expect(pageForBook("Gen")).toBe("old-testament");
    expect(pageForBook("Ps")).toBe("old-testament");
    expect(pageForBook("Rev")).toBe("new-testament");
    expect(pageForBook("Sir")).toBe("apocrypha");
  });

  it("routes every book of every corpus to a real page", () => {
    for (const t of TESTAMENTS) {
      for (const b of ALL_BOOKS[t]) {
        expect(pageForBook(b.abbrev), b.abbrev).not.toBeNull();
      }
    }
  });

  it("routes a book named by any of its citation aliases", () => {
    // cross-links are built from whatever name the lesson used, so an alias
    // has to reach the same page as the abbrev it stands for
    expect(pageForBook("Sirach")).toBe("apocrypha");
    expect(pageForBook("Baruch")).toBe("apocrypha");
    expect(pageForBook("Wisdom of Solomon")).toBe("apocrypha");
    expect(pageForBook("Daniel (Greek)")).toBe("apocrypha");
    expect(pageForBook("1 Maccabees")).toBe("apocrypha");
    expect(pageForBook("Prayer of Manasses")).toBe("apocrypha");
    // the canonical side is alias-tolerant too
    expect(pageForBook("Song of Solomon")).toBe("old-testament");
  });

  it("returns null for a book that does not exist", () => {
    expect(pageForBook("NotABook")).toBeNull();
  });
});

describe("the three corpora", () => {
  it("splits 81 books across OT, NT and DC", () => {
    expect(ALL_BOOKS.OT.length).toBe(39);
    expect(ALL_BOOKS.NT.length).toBe(27);
    expect(ALL_BOOKS.DC.length).toBe(15);
    expect(
      ALL_BOOKS.OT.length + ALL_BOOKS.NT.length + ALL_BOOKS.DC.length,
    ).toBe(81);
  });

  it("gives every book the testament its list claims", () => {
    for (const t of TESTAMENTS) {
      for (const b of ALL_BOOKS[t]) {
        expect(b.testament, b.abbrev).toBe(t);
      }
    }
  });

  it("keeps abbrevs unique across the corpora", () => {
    // bookByAbbrev resolves the first list that holds an abbrev, so a
    // collision would send a deuterocanonical pick to the canonical reader
    const seen = new Map<string, string>();
    for (const t of TESTAMENTS) {
      for (const b of ALL_BOOKS[t]) {
        const prev = seen.get(b.abbrev);
        expect(prev, `${b.abbrev} in both ${prev} and ${t}`).toBeUndefined();
        seen.set(b.abbrev, t);
      }
    }
  });

  it("leaves the KJV catalog at the canonical 66", () => {
    // DC lives in the WEB superset only. widening the app's reader must not
    // widen the KJV catalog, which other code resolves against
    expect(getAllKjvBooks().length).toBe(66);
    const kjvAbbrevs = new Set(getAllKjvBooks().map((b) => b.abbrev));
    for (const b of ALL_BOOKS.DC) {
      expect(kjvAbbrevs.has(b.abbrev), b.abbrev).toBe(false);
    }
  });

  it("orders DC as the WEB publishes it, for a linear prev/next walk", () => {
    // the reader's arrows and its keyboard stepper both walk this list, so
    // the order is what paces the reader through the set. it follows the
    // source's own book list rather than the alphabet or any genre grouping,
    // which puts Daniel (Greek) next to Esther (Greek) where the WEB puts
    // both. taken from https://ebible.org/eng-webbe/
    expect(ALL_BOOKS.DC.map((b) => b.abbrev)).toEqual([
      "Tob",
      "Jdt",
      "Add Esth",
      "Dan Grk",
      "Wis",
      "Sir",
      "Bar",
      "1 Macc",
      "2 Macc",
      "1 Esd",
      "Pr Man",
      "Ps 151",
      "3 Macc",
      "2 Esd",
      "4 Macc",
    ]);
  });

  it("gives every DC book at least one chapter", () => {
    for (const b of ALL_BOOKS.DC) {
      expect(b.chapters, b.abbrev).toBeGreaterThan(0);
    }
  });
});
