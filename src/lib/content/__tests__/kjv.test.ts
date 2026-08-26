import { describe, expect, it } from "bun:test";
import {
  getBooksByTestament,
  getKjvBookMeta,
  getKjvPassageFromDolRef,
  KJV_BOOKS,
  loadKjvBook,
  parseDolLessonRef,
  sliceKjvPassage,
} from "../kjv";
import { kjvBookSchema } from "../schemas";

describe("KJV book metadata", () => {
  it("has 66 books total", () => {
    expect(KJV_BOOKS.length).toBe(66);
  });

  it("has 39 OT books", () => {
    const ot = getBooksByTestament("OT");
    expect(ot.length).toBe(39);
  });

  it("has 27 NT books", () => {
    const nt = getBooksByTestament("NT");
    expect(nt.length).toBe(27);
  });

  it("Genesis has correct metadata", () => {
    const gen = getKjvBookMeta("Gen");
    expect(gen).toBeDefined();
    expect(gen?.book).toBe("Genesis");
    expect(gen?.abbrev).toBe("Gen");
    expect(gen?.testament).toBe("OT");
    expect(gen?.chapters).toBe(50);
  });

  it("John has correct metadata", () => {
    const john = getKjvBookMeta("John");
    expect(john).toBeDefined();
    expect(john?.book).toBe("John");
    expect(john?.abbrev).toBe("John");
    expect(john?.testament).toBe("NT");
    expect(john?.chapters).toBe(21);
  });

  it("recognizes DOL reference names", () => {
    expect(getKjvBookMeta("Exod")).toBeDefined();
    expect(getKjvBookMeta("Ex")).toBeDefined();
    expect(getKjvBookMeta("1 Sam")).toBeDefined();
    expect(getKjvBookMeta("1 Sm")).toBeDefined();
    expect(getKjvBookMeta("Ps")).toBeDefined();
    expect(getKjvBookMeta("Psalm")).toBeDefined();
  });
});

describe("KJV passage slicing", () => {
  const mockBook = {
    book: "Genesis",
    abbrev: "Gen",
    testament: "OT" as const,
    chapters: 50,
    verses: {
      "1": {
        "1": "In the beginning...",
        "2": "And the earth was...",
        "3": "And God said...",
      },
      "2": {
        "1": "Thus the heavens...",
        "2": "And on the seventh day...",
        "23": "And Adam said, This is now bone of my bones...",
      },
    },
  };

  it("slices a full chapter", () => {
    const passage = sliceKjvPassage(mockBook, 1);
    expect(passage).not.toBeNull();
    expect(passage?.chapter).toBe(1);
    expect(passage?.verses.length).toBe(3);
    expect(passage?.verses[0].number).toBe(1);
    expect(passage?.verses[2].number).toBe(3);
  });

  it("slices a verse range", () => {
    const passage = sliceKjvPassage(mockBook, 1, 2, 3);
    expect(passage).not.toBeNull();
    expect(passage?.verses.length).toBe(2);
    expect(passage?.verses[0].number).toBe(2);
    expect(passage?.verses[1].number).toBe(3);
  });

  it("slices a single verse", () => {
    const passage = sliceKjvPassage(mockBook, 2, 23, 23);
    expect(passage).not.toBeNull();
    expect(passage?.verses.length).toBe(1);
    expect(passage?.verses[0].number).toBe(23);
    expect(passage?.verses[0].text).toContain("bone of my bones");
  });

  it("returns null for non-existent chapter", () => {
    const passage = sliceKjvPassage(mockBook, 999);
    expect(passage).toBeNull();
  });

  it("returns null for empty verse range", () => {
    const passage = sliceKjvPassage(mockBook, 1, 10, 10);
    expect(passage).toBeNull();
  });
});

describe("DOL lesson reference parsing", () => {
  it("parses simple chapter reference", () => {
    const parsed = parseDolLessonRef("Gen 1");
    expect(parsed).toEqual({
      book: "Gen",
      chapter: 1,
      verseStart: undefined,
      verseEnd: undefined,
    });
  });

  it("parses chapter:verse reference", () => {
    const parsed = parseDolLessonRef("Gen 2:23");
    expect(parsed).toEqual({
      book: "Gen",
      chapter: 2,
      verseStart: 23,
      verseEnd: undefined,
    });
  });

  it("parses verse range with hyphen", () => {
    const parsed = parseDolLessonRef("Gen 1:1-5");
    expect(parsed).toEqual({
      book: "Gen",
      chapter: 1,
      verseStart: 1,
      verseEnd: 5,
    });
  });

  it("parses verse range with en-dash", () => {
    const parsed = parseDolLessonRef("Gen 1:1–5");
    expect(parsed).toEqual({
      book: "Gen",
      chapter: 1,
      verseStart: 1,
      verseEnd: 5,
    });
  });

  it("parses numbered book references", () => {
    expect(parseDolLessonRef("1 Sam 1:1")).toEqual({
      book: "1 Sam",
      chapter: 1,
      verseStart: 1,
      verseEnd: undefined,
    });
    expect(parseDolLessonRef("2 Cor 5:17")).toEqual({
      book: "2 Cor",
      chapter: 5,
      verseStart: 17,
      verseEnd: undefined,
    });
  });

  it("returns null for invalid references", () => {
    expect(parseDolLessonRef("NotABook 1")).toBeNull();
    expect(parseDolLessonRef("Gen")).toBeNull();
    expect(parseDolLessonRef("Gen abc")).toBeNull();
  });
});

describe("KJV book loading", () => {
  it("loads Genesis from vendor file", async () => {
    const book = await loadKjvBook("Gen");
    expect(book).not.toBeNull();
    expect(book?.book).toBe("Genesis");
    expect(book?.abbrev).toBe("Gen");
    expect(book?.testament).toBe("OT");
    expect(book?.chapters).toBe(50);
    expect(book?.verses["1"]).toBeDefined();
    expect(book?.verses["2"]["23"]).toContain("bone of my bones");
  });

  it("loads John from vendor file", async () => {
    const book = await loadKjvBook("John");
    expect(book).not.toBeNull();
    expect(book?.book).toBe("John");
    expect(book?.testament).toBe("NT");
    expect(book?.chapters).toBe(21);
  });

  it("returns null for non-existent book", async () => {
    const book = await loadKjvBook("NotABook");
    expect(book).toBeNull();
  });

  it("validates schema for loaded books", async () => {
    const book = await loadKjvBook("Gen");
    expect(book).not.toBeNull();
    const result = kjvBookSchema.safeParse(book);
    expect(result.success).toBe(true);
  });
});

describe("End-to-end DOL ref to passage", () => {
  it("resolves Gen 2:23 to the correct verse", async () => {
    const passage = await getKjvPassageFromDolRef("Gen 2:23");
    expect(passage).not.toBeNull();
    expect(passage?.book).toBe("Genesis");
    expect(passage?.chapter).toBe(2);
    expect(passage?.verses.length).toBe(1);
    expect(passage?.verses[0].number).toBe(23);
    expect(passage?.verses[0].text).toContain("bone of my bones");
    expect(passage?.verses[0].text).toContain("Woman");
    expect(passage?.verses[0].text).toContain("Man");
  });

  it("resolves Gen 1:1-5 to a range", async () => {
    const passage = await getKjvPassageFromDolRef("Gen 1:1-5");
    expect(passage).not.toBeNull();
    expect(passage?.verses.length).toBe(5);
    expect(passage?.verses[0].number).toBe(1);
    expect(passage?.verses[4].number).toBe(5);
  });

  it("returns null for invalid refs", async () => {
    const passage = await getKjvPassageFromDolRef("InvalidBook 1:1");
    expect(passage).toBeNull();
  });
});
