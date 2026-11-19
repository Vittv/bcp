import { describe, expect, it } from "bun:test";
import { getScripturePassagesFromDolRef } from "../bible";
import { KJV_BOOKS } from "../kjv";
import { parseDolRef } from "../scripture";

describe("chapter-only scripture refs", () => {
  it("parses a bare chapter without inventing a verse", () => {
    expect(parseDolRef(KJV_BOOKS, "Proverbs 20")).toMatchObject({
      book: "Proverbs",
      chapter: 20,
    });
    expect(parseDolRef(KJV_BOOKS, "Proverbs 20")?.verseStart).toBeUndefined();
  });

  it("loads the whole chapter, not just one verse", async () => {
    for (const ref of ["Proverbs 20", "Acts 1", "Hebrews 6"]) {
      const passages = await getScripturePassagesFromDolRef(
        { translation: "kjv", apocrypha: "kjva" },
        ref,
      );
      expect(passages).toHaveLength(1);
      expect(passages[0].verses.length).toBeGreaterThan(1);
      expect(passages[0].verses[0].number).toBe(1);
    }
  });
});
