import { describe, expect, it } from "bun:test";
import {
  ALL_SCRIPTURE_BOOKS,
  dcBooks,
  getScriptureBookMeta,
  getScriptureBooksByTestament,
  getScripturePassagesFromDolRef,
  loadScriptureBook,
  readingRank,
  type ScriptureSettings,
} from "../bible";
import { loadKjvBook } from "../kjv";
import { KJVA_BOOKS, loadKjvABook } from "../kjva";
import { slicePassage } from "../scripture";
import type { KjvBook } from "../types";
import { loadWebBook } from "../web";

// the canonical text and the apocryphal text are separate settings
const KJV_CANON: ScriptureSettings = { translation: "kjv", apocrypha: "web" };
const WEB_CANON: ScriptureSettings = { translation: "web", apocrypha: "web" };
const KJV_APOC: ScriptureSettings = { translation: "kjv", apocrypha: "kjva" };
const WEB_APOC: ScriptureSettings = { translation: "web", apocrypha: "kjva" };

describe("combined scripture canon", () => {
  it("has 85 books (66 canonical + 14 KJVA DC + 15 WEB DC - 10 shared)", () => {
    expect(ALL_SCRIPTURE_BOOKS.length).toBe(85);
    expect(getScriptureBooksByTestament("OT").length).toBe(39);
    expect(getScriptureBooksByTestament("NT").length).toBe(27);
  });

  it("resolves both canonical and deuterocanonical names", () => {
    expect(getScriptureBookMeta("Gen")?.book).toBe("Genesis");
    expect(getScriptureBookMeta("Sirach")?.abbrev).toBe("Sir");
    expect(getScriptureBookMeta("Wisdom")).toBeDefined();
  });
});

describe("readingRank", () => {
  it("orders chapters forward within a book", () => {
    expect(readingRank("Mark", 2, "web")).toBeGreaterThan(
      readingRank("Mark", 1, "web"),
    );
  });

  it("ranks a step into the next book as forward, though the chapter resets", () => {
    expect(readingRank("Luke", 1, "web")).toBeGreaterThan(
      readingRank("Mark", 16, "web"),
    );
  });

  it("treats a step back into the previous book as backward", () => {
    expect(readingRank("Mark", 16, "web")).toBeLessThan(
      readingRank("Luke", 1, "web"),
    );
  });

  it("ranks the next book ahead of a single-chapter book", () => {
    expect(readingRank("Rev", 1, "web")).toBeGreaterThan(
      readingRank("Jude", 1, "web"),
    );
  });

  it("sorts the Deuterocanon after the New Testament", () => {
    expect(readingRank("Tob", 1, "web")).toBeGreaterThan(
      readingRank("Rev", 22, "web"),
    );
  });

  it("ranks a cleared position below every open book", () => {
    expect(readingRank(null, 1, "web")).toBeLessThan(
      readingRank("Gen", 1, "web"),
    );
  });
});

describe("loadScriptureBook translation routing", () => {
  it("loads OT/NT text from the selected translation", async () => {
    const kjv = await loadScriptureBook(KJV_CANON, "Gen");
    const web = await loadScriptureBook(WEB_CANON, "Gen");
    expect(kjv?.verses["1"]?.["1"]).toBe(
      "In the beginning God created the heaven and the earth.",
    );
    expect(web?.verses["1"]?.["1"]).toBe(
      "In the beginning, God created the heavens and the earth.",
    );
  });

  it("matches the vendor loaders exactly", async () => {
    expect(await loadScriptureBook(KJV_CANON, "Gen")).toBe(
      await loadKjvBook("Gen"),
    );
    expect(await loadScriptureBook(WEB_CANON, "Gen")).toBe(
      await loadWebBook("Gen"),
    );
  });

  it("returns null for an unrecognized book", async () => {
    expect(await loadScriptureBook(WEB_CANON, "NotABook")).toBeNull();
  });
});

describe("apocryphal text routing", () => {
  const KJVA_ABBREVS = new Set(KJVA_BOOKS.map((b) => b.abbrev));
  const WEB_ONLY_ABBREVS = dcBooks("web")
    .map((b) => b.abbrev)
    .filter((abbrev) => !KJVA_ABBREVS.has(abbrev));
  const KJVA_ONLY_ABBREVS = dcBooks("kjva")
    .map((b) => b.abbrev)
    .filter((abbrev) => !dcBooks("web").some((b) => b.abbrev === abbrev));

  it("has fourteen books under KJVA and fifteen under WEB", () => {
    expect(dcBooks("kjva").length).toBe(14);
    expect(dcBooks("web").length).toBe(15);
    expect([...KJVA_ONLY_ABBREVS].sort()).toEqual([
      "Bel",
      "Rest Esth",
      "S3Y",
      "Sus",
    ]);
    expect([...WEB_ONLY_ABBREVS].sort()).toEqual([
      "3 Macc",
      "4 Macc",
      "Add Esth",
      "Dan Grk",
      "Ps 151",
    ]);
    for (const meta of dcBooks("kjva")) {
      expect(getScriptureBookMeta(meta.abbrev)?.testament).toBe("DC");
    }
    for (const meta of dcBooks("web")) {
      expect(getScriptureBookMeta(meta.abbrev)?.testament).toBe("DC");
    }
  });

  it("reads a book in the selected corpus in that corpus's text", async () => {
    const kjva = await loadScriptureBook(WEB_APOC, "Sir");
    const web = await loadScriptureBook(WEB_CANON, "Sir");
    expect(kjva).not.toBeNull();
    expect(web).not.toBeNull();
    expect(kjva).not.toBe(web);
    expect(kjva?.verses["1"]?.["1"]).not.toBe(web?.verses["1"]?.["1"]);
  });

  it("reads a book outside the selected corpus in the corpus that holds it", async () => {
    const underWeb = await loadScriptureBook(WEB_CANON, "Bel");
    expect(underWeb).not.toBeNull();
    const underKjva = await loadScriptureBook(WEB_APOC, "Bel");
    expect(underKjva).not.toBeNull();
    expect(underWeb).toBe(underKjva);
    expect(underWeb).toBe(await loadKjvABook("Bel"));
  });

  it("reads the WEB-only books in the WEB under either corpus", async () => {
    for (const abbrev of WEB_ONLY_ABBREVS) {
      const underKjva = await loadScriptureBook(WEB_APOC, abbrev);
      const underWeb = await loadScriptureBook(WEB_CANON, abbrev);
      expect(underKjva, abbrev).not.toBeNull();
      expect(underKjva, abbrev).toBe(underWeb);
    }
  });

  it("keeps the canonical text out of the apocryphal setting's reach", async () => {
    const canonical = [
      ...getScriptureBooksByTestament("OT"),
      ...getScriptureBooksByTestament("NT"),
    ];
    for (const meta of canonical) {
      const underKjva = await loadScriptureBook(WEB_APOC, meta.abbrev);
      const underWeb = await loadScriptureBook(WEB_CANON, meta.abbrev);
      expect(underKjva, meta.abbrev).toBe(underWeb);
      const kjvUnderKjva = await loadScriptureBook(KJV_APOC, meta.abbrev);
      const kjvUnderWeb = await loadScriptureBook(KJV_CANON, meta.abbrev);
      expect(kjvUnderKjva, meta.abbrev).toBe(kjvUnderWeb);
    }
  });
});

// text for one book, or the test fails rather than threading nulls through
async function textFor(
  settings: ScriptureSettings,
  abbrev: string,
): Promise<KjvBook> {
  const book = await loadScriptureBook(settings, abbrev);
  if (!book) throw new Error(`no text loaded for ${abbrev}`);
  return book;
}

describe("deuterocanonical browseability", () => {
  it("resolves every chapter of every deuterocanonical book in each corpus", async () => {
    for (const corpus of ["kjva", "web"] as const) {
      for (const meta of dcBooks(corpus)) {
        const book = await textFor(
          { translation: "web", apocrypha: corpus },
          meta.abbrev,
        );
        for (let chapter = 1; chapter <= meta.chapters; chapter++) {
          expect(
            slicePassage(book, chapter),
            `${meta.abbrev} ${chapter}`,
          ).not.toBeNull();
        }
      }
    }
  });

  it("declares no more chapters than the vendored text holds", async () => {
    for (const corpus of ["kjva", "web"] as const) {
      for (const meta of dcBooks(corpus)) {
        const book = await textFor(
          { translation: "web", apocrypha: corpus },
          meta.abbrev,
        );
        expect(Object.keys(book.verses).length, meta.abbrev).toBe(
          meta.chapters,
        );
      }
    }
  });

  it("serves Psalm 151 from its published chapter number", async () => {
    const book = await textFor(WEB_CANON, "Ps 151");
    expect(Object.keys(book.verses)).toEqual(["151"]);
    expect(slicePassage(book, 1)).toMatchObject({
      abbrev: "Ps 151",
      chapter: 1,
    });
  });

  it("still reports a missing chapter as unavailable", async () => {
    const gen = await textFor(KJV_CANON, "Gen");
    expect(slicePassage(gen, 51)).toBeNull();
    expect(slicePassage(gen, 0)).toBeNull();
  });

  it("resolves every deuterocanonical reading the lectionary cites", async () => {
    const cited = [
      "Sir 3:3–9, 14–17",
      "Wis 1:16–2:1, 12–22",
      "1 Macc 1:1–28",
      "Bar 4:21–29",
      "Jdt 4:1–15",
      "2 Esd 2:42–47",
    ];
    for (const ref of cited) {
      const passages = await getScripturePassagesFromDolRef(WEB_APOC, ref);
      expect(passages.length, ref).toBeGreaterThan(0);
      expect(passages[0]?.testament, ref).toBe("DC");
      expect(passages[0]?.verses.length, ref).toBeGreaterThan(0);
    }
  });
});

describe("getScripturePassagesFromDolRef translation routing", () => {
  it("reads a canonical lesson in the active translation", async () => {
    const kjv = await getScripturePassagesFromDolRef(KJV_CANON, "Gen 1:1");
    const web = await getScripturePassagesFromDolRef(WEB_CANON, "Gen 1:1");
    expect(kjv[0]?.verses[0]?.text).toContain("the heaven and the earth");
    expect(web[0]?.verses[0]?.text).toContain("the heavens and the earth");
  });

  it("reads a deuterocanonical lesson in the active apocryphal text", async () => {
    const kjva = await getScripturePassagesFromDolRef(WEB_APOC, "Wis 1:1");
    const web = await getScripturePassagesFromDolRef(WEB_CANON, "Wis 1:1");
    expect(kjva.length).toBe(1);
    expect(kjva[0]?.book).toBe("Wisdom of Solomon");
    expect(kjva[0]?.verses[0]?.text).not.toBe(web[0]?.verses[0]?.text);
  });

  it("keeps a canonical lesson in the canonical text under either apocryphal text", async () => {
    const kjva = await getScripturePassagesFromDolRef(WEB_APOC, "Gen 1:1");
    const web = await getScripturePassagesFromDolRef(WEB_CANON, "Gen 1:1");
    expect(kjva[0]?.verses[0]?.text).toBe(web[0]?.verses[0]?.text);
  });

  it("expands multi-range refs in the active translation", async () => {
    const passages = await getScripturePassagesFromDolRef(
      WEB_CANON,
      "Gen 17:1–12a, 15–16",
    );
    expect(passages.length).toBe(2);
    expect(passages[0]?.verses.length).toBe(12);
    expect(passages[1]?.verses.length).toBe(2);
  });
});
