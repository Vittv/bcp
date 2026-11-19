import { describe, expect, it } from "bun:test";
import { allFeasts } from "../../calendar/feastsByTradition";
import { getScripturePassagesFromDolRef } from "../bible";
import { propersForFeast } from "../feastPropers";
import { KJV_BOOKS } from "../kjv";
import { parseDolRef } from "../scripture";

describe("1962 Eucharistic propers", () => {
  it("supplies both readings for a saint from the proper headings", () => {
    const andrew = allFeasts("acc").find(
      (f) => f.canonical === "st-andrew" && f.month === 11 && f.day === 30,
    );
    if (!andrew) throw new Error("missing Saint Andrew");
    expect(propersForFeast(andrew, "acc").readings).toEqual([
      "Romans 10. 8.",
      "St Matthew 4. 18.",
    ]);
  });

  it("handles a proper whose first reading is titled Lesson", () => {
    const saints = allFeasts("acc").find((f) => f.canonical === "all-saints");
    if (!saints) throw new Error("missing All Saints");
    expect(propersForFeast(saints, "acc").readings).toEqual([
      "Revelation 7. 9.",
      "St Matthew 5. 1.",
    ]);
  });
});

describe("1962 proper citation resolution", () => {
  it("resolves St-prefixed dotted citations to the appointed verse", async () => {
    const cases = [
      ["St Luke 1. 46.", "Luke", 1, 46],
      ["St Matthew 4. 18.", "Matthew", 4, 18],
      ["1 St John 4. 16.", "1 John", 4, 16],
    ] as const;
    for (const [ref, book, chapter, verse] of cases) {
      expect(parseDolRef(KJV_BOOKS, ref)).toMatchObject({
        book,
        chapter,
        verseStart: verse,
        verseEnd: verse,
      });
      const passages = await getScripturePassagesFromDolRef(
        { translation: "kjv", apocrypha: "kjva" },
        ref,
      );
      expect(passages).toHaveLength(1);
      expect(passages[0].verses[0].number).toBe(verse);
    }
  });

  it("keeps the verse of a plain dotted citation", () => {
    expect(parseDolRef(KJV_BOOKS, "Isaiah 7. 10.")).toMatchObject({
      book: "Isaiah",
      chapter: 7,
      verseStart: 10,
    });
  });
});
