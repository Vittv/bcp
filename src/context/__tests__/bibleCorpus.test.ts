import { describe, expect, it } from "bun:test";
import { dcBooks } from "../../lib/content/bible";
import { getAllKjvBooks } from "../../lib/content/kjv";
import {
  booksFor,
  pageEntryRestore,
  pageForBook,
  TESTAMENTS,
} from "../BibleContext";

// the three readable corpora for one apocrypha corpus; the routing tests
// below read all of them
describe("pageForBook", () => {
  it("routes each corpus to its own page", () => {
    expect(pageForBook("Gen")).toBe("old-testament");
    expect(pageForBook("Ps")).toBe("old-testament");
    expect(pageForBook("Rev")).toBe("new-testament");
    expect(pageForBook("Sir")).toBe("apocrypha");
  });

  it("routes every book of every corpus to a real page", () => {
    for (const corpus of ["kjva", "web"] as const) {
      for (const t of TESTAMENTS) {
        for (const b of booksFor(corpus)[t]) {
          expect(pageForBook(b.abbrev), b.abbrev).not.toBeNull();
        }
      }
    }
  });

  it("routes a book named by any of its citation aliases", () => {
    expect(pageForBook("Sirach")).toBe("apocrypha");
    expect(pageForBook("Baruch")).toBe("apocrypha");
    expect(pageForBook("Wisdom of Solomon")).toBe("apocrypha");
    expect(pageForBook("Daniel (Greek)")).toBe("apocrypha");
    expect(pageForBook("1 Maccabees")).toBe("apocrypha");
    expect(pageForBook("Prayer of Manasses")).toBe("apocrypha");
    expect(pageForBook("Song of Solomon")).toBe("old-testament");
  });

  it("returns null for a book that does not exist", () => {
    expect(pageForBook("NotABook")).toBeNull();
  });
});

describe("pageEntryRestore", () => {
  it("does nothing off the bible pages", () => {
    expect(pageEntryRestore("today", "NT")).toBeNull();
    expect(pageEntryRestore("psalms", "DC")).toBeNull();
    expect(pageEntryRestore("lectionary", null)).toBeNull();
  });

  it("keeps a history restore that names the corpus being entered", () => {
    expect(pageEntryRestore("apocrypha", "DC")).toEqual({
      testament: "DC",
      keepRestored: true,
    });
    expect(pageEntryRestore("new-testament", "NT")).toEqual({
      testament: "NT",
      keepRestored: true,
    });
  });

  it("rejects a history restore from another corpus", () => {
    expect(pageEntryRestore("apocrypha", "NT")).toEqual({
      testament: "DC",
      keepRestored: false,
    });
    expect(pageEntryRestore("old-testament", "DC")).toEqual({
      testament: "OT",
      keepRestored: false,
    });
  });

  it("restores from storage when no restore positioned the page", () => {
    for (const [page, testament] of [
      ["old-testament", "OT"],
      ["new-testament", "NT"],
      ["apocrypha", "DC"],
    ] as const) {
      expect(pageEntryRestore(page, null)).toEqual({
        testament,
        keepRestored: false,
      });
    }
  });
});

describe("the deuterocanonical corpora", () => {
  it("has fourteen books under KJVA and fifteen under WEB", () => {
    expect(dcBooks("kjva").length).toBe(14);
    expect(dcBooks("web").length).toBe(15);
  });

  it("gives every book the testament its list claims", () => {
    for (const corpus of ["kjva", "web"] as const) {
      for (const t of TESTAMENTS) {
        for (const b of booksFor(corpus)[t]) {
          expect(b.testament, b.abbrev).toBe(t);
        }
      }
    }
  });

  it("keeps abbrevs unique across the corpora", () => {
    for (const corpus of ["kjva", "web"] as const) {
      const seen = new Map<string, string>();
      for (const t of TESTAMENTS) {
        for (const b of booksFor(corpus)[t]) {
          const prev = seen.get(b.abbrev);
          expect(prev, `${b.abbrev} in both ${prev} and ${t}`).toBeUndefined();
          seen.set(b.abbrev, t);
        }
      }
    }
  });

  it("leaves the KJV catalog at the canonical 66", () => {
    expect(getAllKjvBooks().length).toBe(66);
    const kjvAbbrevs = new Set(getAllKjvBooks().map((b) => b.abbrev));
    for (const corpus of ["kjva", "web"] as const) {
      for (const b of dcBooks(corpus)) {
        expect(kjvAbbrevs.has(b.abbrev), b.abbrev).toBe(false);
      }
    }
  });

  it("orders KJVA as the 1611 prints it", () => {
    expect(dcBooks("kjva").map((b) => b.abbrev)).toEqual([
      "Tob",
      "Jdt",
      "Rest Esth",
      "Wis",
      "Sir",
      "Bar",
      "S3Y",
      "Sus",
      "Bel",
      "1 Macc",
      "2 Macc",
      "1 Esd",
      "Pr Man",
      "2 Esd",
    ]);
  });

  it("orders WEB as the WEB publishes it", () => {
    expect(dcBooks("web").map((b) => b.abbrev)).toEqual([
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

  it("differs at exactly the books the corpora split", () => {
    const kjva = new Set(dcBooks("kjva").map((b) => b.abbrev));
    const web = new Set(dcBooks("web").map((b) => b.abbrev));
    const shared = [...kjva].filter((a) => web.has(a));
    const kjvaOnly = [...kjva].filter((a) => !web.has(a));
    const webOnly = [...web].filter((a) => !kjva.has(a));
    expect(shared.sort()).toEqual([
      "1 Esd",
      "1 Macc",
      "2 Esd",
      "2 Macc",
      "Bar",
      "Jdt",
      "Pr Man",
      "Sir",
      "Tob",
      "Wis",
    ]);
    expect(kjvaOnly.sort()).toEqual(["Bel", "Rest Esth", "S3Y", "Sus"]);
    expect(webOnly.sort()).toEqual([
      "3 Macc",
      "4 Macc",
      "Add Esth",
      "Dan Grk",
      "Ps 151",
    ]);
  });

  it("gives every DC book at least one chapter in both corpora", () => {
    for (const corpus of ["kjva", "web"] as const) {
      for (const b of dcBooks(corpus)) {
        expect(b.chapters, b.abbrev).toBeGreaterThan(0);
      }
    }
  });
});
