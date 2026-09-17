import { describe, expect, it } from "bun:test";
import { cleanVerseText } from "../../../../tools/usfm/parse";

describe("cleanVerseText footnote stripping", () => {
  it("removes the space a stripped footnote leaves before punctuation", () => {
    const rq = String.fromCharCode(0x201d); // right double quote
    const raw = `incomprehensible\\f + \\fr 13:18 \\ft or, wonderful\\f*?${rq}`;
    expect(cleanVerseText(raw)).toBe(`incomprehensible?${rq}`);
  });

  it("removes the space a stripped cross-ref leaves before punctuation", () => {
    expect(cleanVerseText("word\\x + \\xo 1:2 \\xt ref\\x*, and")).toBe(
      "word, and",
    );
  });

  it("keeps a single space when the footnote sits between words", () => {
    expect(cleanVerseText("Give\\f + \\fr 3:33 \\ft note\\f* thanks")).toBe(
      "Give thanks",
    );
  });

  it("leaves plain text unchanged", () => {
    expect(cleanVerseText("In the beginning, God created")).toBe(
      "In the beginning, God created",
    );
  });
});
