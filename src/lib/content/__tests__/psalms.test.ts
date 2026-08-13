import { describe, expect, test } from "bun:test";
import { parsePsalmCitation } from "../psalms";

describe("parsePsalmCitation", () => {
  test("whole psalm", () => {
    expect(parsePsalmCitation("1")).toEqual({ psalm: 1 });
    expect(parsePsalmCitation("150")).toEqual({ psalm: 150 });
  });

  test("verse range with en dash", () => {
    expect(parsePsalmCitation("119:121–144")).toEqual({
      psalm: 119,
      verses: { start: 121, end: 144 },
    });
  });

  test("verse range with hyphen", () => {
    expect(parsePsalmCitation("46:1-11")).toEqual({
      psalm: 46,
      verses: { start: 1, end: 11 },
    });
  });

  test("single verse", () => {
    expect(parsePsalmCitation("2:1")).toEqual({
      psalm: 2,
      verses: { start: 1, end: 1 },
    });
  });

  test("lengthen and extend parts", () => {
    expect(parsePsalmCitation("8(1-9)")).toEqual({
      psalm: 8,
      lengthen: { start: 1, end: 9 },
    });
    expect(parsePsalmCitation("90:1-8(9-12)13-17")).toEqual({
      psalm: 90,
      verses: { start: 1, end: 8 },
      lengthen: { start: 9, end: 12 },
      extend: { start: 13, end: 17 },
    });
  });

  test("optional psalm", () => {
    expect(parsePsalmCitation("[141]")).toEqual({
      psalm: 141,
      optional: true,
    });
  });

  test("optional psalm cannot carry verses", () => {
    expect(parsePsalmCitation("[141:1-3]")).toBeNull();
  });

  test("whitespace tolerated", () => {
    expect(parsePsalmCitation("  1 ")).toEqual({ psalm: 1 });
  });

  test("mismatched brackets", () => {
    expect(parsePsalmCitation("[1")).toBeNull();
    expect(parsePsalmCitation("1]")).toBeNull();
  });

  test("garbage", () => {
    expect(parsePsalmCitation("")).toBeNull();
    expect(parsePsalmCitation("foo")).toBeNull();
    expect(parsePsalmCitation("1:2:3")).toBeNull();
    expect(parsePsalmCitation("[1")).toBeNull();
  });
});
