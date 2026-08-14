import { describe, expect, test } from "bun:test";
import { canticleExists, canticlePassage, canticleTitle } from "../canticles";

describe("canticles", () => {
  test("all 21 canticles present", () => {
    for (let n = 1; n <= 21; n++) {
      expect(canticleExists(n)).toBe(true);
    }
  });

  test("known titles resolve", () => {
    expect(canticleTitle(3)).toBe("The Song of Mary");
    expect(canticleTitle(8)).toBe("The Song of Moses");
    expect(canticleTitle(13)).toBe("A Song of Praise");
    expect(canticleTitle(21)).toBe("You are God");
  });

  test("Magnificat has ten verses", () => {
    const passage = canticlePassage(3);
    expect(passage?.sections[0].verses).toHaveLength(10);
  });

  test("Nunc Dimittis has four verses", () => {
    const passage = canticlePassage(17);
    expect(passage?.sections[0].verses).toHaveLength(4);
  });

  test("Te Deum covers its whole text", () => {
    const passage = canticlePassage(21);
    const text = passage?.sections[0].verses.join(" ");
    expect(text).toContain("You are God");
    expect(text).toContain("glory everlasting");
  });

  test("Benedicite sections are partitioned", () => {
    const passage = canticlePassage(12);
    expect(passage?.sections.map((s) => s.title)).toEqual([
      "Invocation",
      "I  The Cosmic Order",
      "II  The Earth and its Creatures",
      "III  The People of God",
      "Doxology",
    ]);
  });

  test("Benedicite selection keeps Invocation and Doxology", () => {
    const passage = canticlePassage(12, { start: 1, end: 1 });
    expect(passage?.sections.map((s) => s.title)).toEqual([
      "Invocation",
      "I  The Cosmic Order",
      "Doxology",
    ]);
  });

  test("full-range selection does not duplicate", () => {
    const passage = canticlePassage(12, { start: 0, end: 4 });
    expect(passage?.sections).toHaveLength(5);
  });

  test("unknown canticle yields undefined", () => {
    expect(canticlePassage(0)).toBeUndefined();
    expect(canticlePassage(22)).toBeUndefined();
    expect(canticleExists(22)).toBe(false);
  });
});
