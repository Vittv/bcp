import { describe, expect, test } from "bun:test";
import { searchPsalmsForEdition } from "../../reference/search";
import {
  editionPsalmIncipit,
  editionPsalmNumbers,
  editionPsalmPassage,
  editionPsalmVerseCount,
} from "../psalmsEdition";

describe("edition psalms", () => {
  test("lists the psalms each book actually prints", () => {
    expect(editionPsalmNumbers("1979")).toHaveLength(150);
    expect(editionPsalmNumbers("1662")).toHaveLength(150);
    expect(editionPsalmNumbers("1962")).toHaveLength(149);
    expect(editionPsalmNumbers("1962")).not.toContain(58);
  });

  test("reads incipits and passages from the selected book", () => {
    expect(editionPsalmIncipit("1979", 1)).toMatch(/^Happy are they/);
    expect(editionPsalmIncipit("1962", 1)).toMatch(/^Blessed is the man/);
    expect(editionPsalmIncipit("1662", 1)).toMatch(/^Blessed is the man/);
    expect(editionPsalmPassage("1962", 23)?.verses.length).toBeGreaterThan(0);
    expect(editionPsalmVerseCount("1662", 23)).toBeGreaterThan(0);
  });

  test("searches the selected book's psalms", () => {
    expect(searchPsalmsForEdition("1962", "")).toHaveLength(149);
    expect(searchPsalmsForEdition("1962", "psalm 58")).toHaveLength(0);
    expect(searchPsalmsForEdition("1979", "psalm 58")).toHaveLength(1);
  });
});
