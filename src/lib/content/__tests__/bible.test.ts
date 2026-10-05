import { describe, expect, it } from "bun:test";
import {
  ALL_SCRIPTURE_BOOKS,
  getScriptureBookMeta,
  getScriptureBooksByTestament,
  getScripturePassagesFromDolRef,
  loadScriptureBook,
} from "../bible";
import { loadKjvBook } from "../kjv";
import { slicePassage } from "../scripture";
import type { KjvBook } from "../types";
import { loadWebBook } from "../web";

describe("combined scripture canon", () => {
  it("has 81 books (66 canonical + 15 deuterocanonical)", () => {
    expect(ALL_SCRIPTURE_BOOKS.length).toBe(81);
    expect(getScriptureBooksByTestament("OT").length).toBe(39);
    expect(getScriptureBooksByTestament("NT").length).toBe(27);
    expect(getScriptureBooksByTestament("DC").length).toBe(15);
  });

  it("resolves both canonical and deuterocanonical names", () => {
    expect(getScriptureBookMeta("Gen")?.book).toBe("Genesis");
    expect(getScriptureBookMeta("Sirach")?.abbrev).toBe("Sir");
    expect(getScriptureBookMeta("Wisdom")).toBeDefined();
  });
});

describe("loadScriptureBook translation routing", () => {
  it("loads OT/NT text from the selected translation", async () => {
    const kjv = await loadScriptureBook("kjv", "Gen");
    const web = await loadScriptureBook("web", "Gen");
    expect(kjv?.verses["1"]?.["1"]).toBe(
      "In the beginning God created the heaven and the earth.",
    );
    expect(web?.verses["1"]?.["1"]).toBe(
      "In the beginning, God created the heavens and the earth.",
    );
  });

  it("matches the vendor loaders exactly", async () => {
    expect(await loadScriptureBook("kjv", "Gen")).toBe(
      await loadKjvBook("Gen"),
    );
    expect(await loadScriptureBook("web", "Gen")).toBe(
      await loadWebBook("Gen"),
    );
  });

  it("always loads deuterocanon from WEB, even under KJV", async () => {
    const kjv = await loadScriptureBook("kjv", "Wis");
    const web = await loadScriptureBook("web", "Wis");
    expect(kjv).not.toBeNull();
    expect(kjv?.testament).toBe("DC");
    expect(kjv).toBe(web);
  });

  it("returns null for an unrecognized book", async () => {
    expect(await loadScriptureBook("web", "NotABook")).toBeNull();
  });
});

// the text for one book, or the test fails outright rather than carrying a
// nullable book through the assertions that follow
async function textFor(abbrev: string): Promise<KjvBook> {
  const book = await loadScriptureBook("kjv", abbrev);
  if (!book) throw new Error(`no text loaded for ${abbrev}`);
  return book;
}

describe("deuterocanonical browseability", () => {
  // the reader offers chapters 1..meta.chapters for every DC book, so a
  // declared count that outruns the vendored text would show "Text not
  // available" to a reader following the chapter picker. Psalm 151 shipped
  // that way: its one chapter is keyed "151", not "1"
  it("resolves every chapter of every deuterocanonical book", async () => {
    for (const meta of getScriptureBooksByTestament("DC")) {
      const book = await textFor(meta.abbrev);
      for (let chapter = 1; chapter <= meta.chapters; chapter++) {
        expect(
          slicePassage(book, chapter),
          `${meta.abbrev} ${chapter}`,
        ).not.toBeNull();
      }
    }
  });

  it("declares no more chapters than the vendored text holds", async () => {
    for (const meta of getScriptureBooksByTestament("DC")) {
      const book = await textFor(meta.abbrev);
      expect(Object.keys(book.verses).length, meta.abbrev).toBe(meta.chapters);
    }
  });

  it("serves Psalm 151 from its published chapter number", async () => {
    // the vendored numbering keys this chapter "151"; the reader asks for 1
    const book = await textFor("Ps 151");
    expect(Object.keys(book.verses)).toEqual(["151"]);
    expect(slicePassage(book, 1)).toMatchObject({
      abbrev: "Ps 151",
      chapter: 1,
    });
  });

  it("still reports a missing chapter as unavailable", async () => {
    // the one-chapter fallback must not paper over a bad request against a
    // longer book by silently showing some other chapter
    const gen = await textFor("Gen");
    expect(slicePassage(gen, 51)).toBeNull();
    expect(slicePassage(gen, 0)).toBeNull();
  });

  it("resolves every deuterocanonical reading the lectionary cites", async () => {
    // one real ref per book, taken verbatim from the DOL files. 6 of the 15
    // are ever cited: Sir 40, Wis 20, 1 Macc 9, Jdt 8, Bar 2, 2 Esd 1
    const cited = [
      "Sir 3:3–9, 14–17",
      "Wis 1:16–2:1, 12–22",
      "1 Macc 1:1–28",
      "Bar 4:21–29",
      "Jdt 4:1–15",
      "2 Esd 2:42–47",
    ];
    for (const ref of cited) {
      const passages = await getScripturePassagesFromDolRef("kjv", ref);
      expect(passages.length, ref).toBeGreaterThan(0);
      expect(passages[0]?.testament, ref).toBe("DC");
      expect(passages[0]?.verses.length, ref).toBeGreaterThan(0);
    }
  });
});

describe("getScripturePassagesFromDolRef translation routing", () => {
  it("reads a canonical lesson in the active translation", async () => {
    const kjv = await getScripturePassagesFromDolRef("kjv", "Gen 1:1");
    const web = await getScripturePassagesFromDolRef("web", "Gen 1:1");
    expect(kjv[0]?.verses[0]?.text).toContain("the heaven and the earth");
    expect(web[0]?.verses[0]?.text).toContain("the heavens and the earth");
  });

  it("reads deuterocanonical lessons under either translation", async () => {
    const kjv = await getScripturePassagesFromDolRef("kjv", "Wis 1:1");
    const web = await getScripturePassagesFromDolRef("web", "Wis 1:1");
    expect(kjv.length).toBe(1);
    expect(kjv[0]?.book).toBe("Wisdom of Solomon");
    expect(web[0]?.verses[0]?.text).toBe(kjv[0]?.verses[0]?.text);
  });

  it("expands multi-range refs in the active translation", async () => {
    const passages = await getScripturePassagesFromDolRef(
      "web",
      "Gen 17:1–12a, 15–16",
    );
    expect(passages.length).toBe(2);
    expect(passages[0]?.verses.length).toBe(12);
    expect(passages[1]?.verses.length).toBe(2);
  });
});
