import { describe, expect, it } from "bun:test";
import {
  ALL_SCRIPTURE_BOOKS,
  getScriptureBookMeta,
  getScriptureBooksByTestament,
  getScripturePassagesFromDolRef,
  loadScriptureBook,
} from "../bible";
import { loadKjvBook } from "../kjv";
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
