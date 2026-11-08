import { describe, expect, test } from "bun:test";
import {
  applyCustomization,
  sanitizeCustomization,
  sanitizeCustomizations,
} from "../customization";

describe("customization storage", () => {
  test("keeps only the shapes the composer understands", () => {
    expect(
      sanitizeCustomization({
        opening: "O God, come to my assistance.",
        invitatory: "jubilate",
        psalmCycle: "psalter30",
        canticle1: 8,
        canticle2: null,
        suffrages: "a",
        psalmMenu: "121",
        readingMenu: "Romans 5:5",
        collectMenu: "2",
      }),
    ).toEqual({
      opening: "O God, come to my assistance.",
      invitatory: "jubilate",
      psalmCycle: "psalter30",
      canticle1: 8,
      canticle2: null,
      suffrages: "a",
      psalmMenu: "121",
      readingMenu: "Romans 5:5",
      collectMenu: "2",
    });
  });

  test("keeps the readings forms", () => {
    for (const readings of ["1", "2", "3", "12", "13", "23", "123"]) {
      expect(sanitizeCustomization({ readings })).toEqual({ readings });
    }
  });

  test("drops invalid readings forms", () => {
    for (const readings of [
      "21",
      "113",
      "4",
      "0",
      "1.5",
      "",
      " ",
      3,
      true,
      "split",
    ]) {
      expect(sanitizeCustomization({ readings })).toEqual({});
    }
  });

  test("drops invalid values instead of breaking the office", () => {
    expect(
      sanitizeCustomization({
        opening: "",
        invitatory: "te deum",
        psalmCycle: "1662",
        canticle1: 22,
        canticle2: 1.5,
        suffrages: "c",
        psalmMenu: "",
        readingMenu: 5,
        collectMenu: [],
      }),
    ).toEqual({});
    expect(sanitizeCustomization(null)).toEqual({});
    expect(sanitizeCustomization("nope")).toEqual({});
  });

  test("keeps an explicit None and drops empty offices", () => {
    expect(sanitizeCustomizations({ noonday: {} })).toEqual({});
    expect(
      sanitizeCustomizations({
        "morning-rite-two": { canticle1: null },
        noonday: {},
      }),
    ).toEqual({ "morning-rite-two": { canticle1: null } });
  });

  test("a patch can set, clear and delete a slot", () => {
    expect(applyCustomization({ canticle1: 8 }, { canticle1: 12 })).toEqual({
      canticle1: 12,
    });
    expect(applyCustomization({ canticle1: 8 }, { canticle1: null })).toEqual({
      canticle1: null,
    });
    // undefined removes the override so the printed default applies again
    expect(
      applyCustomization({ canticle1: 8 }, { canticle1: undefined }),
    ).toEqual({});
    expect(
      applyCustomization({ suffrages: "a" }, { suffrages: undefined }),
    ).toEqual({});
  });
});
