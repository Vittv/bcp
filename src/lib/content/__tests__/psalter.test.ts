import { describe, expect, test } from "bun:test";
import { psalmExists, psalmPassage, psalmVerseCount } from "../psalter";

describe("psalter", () => {
  test("all 150 psalms present", () => {
    for (let n = 1; n <= 150; n++) {
      expect(psalmExists(n)).toBe(true);
    }
  });

  test("total verses match the BCP psalter", () => {
    let total = 0;
    for (let n = 1; n <= 150; n++) total += psalmVerseCount(n);
    expect(total).toBe(2507);
  });

  test("Psalm 119 has 176 verses in 22 stanzas", () => {
    expect(psalmVerseCount(119)).toBe(176);
    const passage = psalmPassage({ psalm: 119 });
    const stanzas = new Set(
      passage?.verses.map((v) => v.stanza).filter(Boolean),
    );
    expect(stanzas.size).toBe(22);
  });

  test("part boundaries are contiguous", () => {
    expect(
      psalmPassage({ psalm: 89, verses: { start: 19, end: 52 } })?.verses,
    ).toHaveLength(34);
    expect(
      psalmPassage({ psalm: 18, verses: { start: 21, end: 50 } })?.verses,
    ).toHaveLength(30);
  });

  test("verse range clips correctly", () => {
    const passage = psalmPassage({
      psalm: 119,
      verses: { start: 89, end: 112 },
    });
    expect(passage?.verses).toHaveLength(24);
    expect(passage?.verses[0].number).toBe(89);
    expect(passage?.verses[23].number).toBe(112);
  });

  test("stanza letter lands on its first verse", () => {
    const passage = psalmPassage({
      psalm: 119,
      verses: { start: 89, end: 89 },
    });
    expect(passage?.verses[0].stanza).toBe("Lamedh");
  });

  test("whole-psalm passage preserves verse text", () => {
    const passage = psalmPassage({ psalm: 1 });
    expect(passage?.verses[0].text).toContain("Happy are they");
    expect(passage?.verses[0].text).toContain("*");
  });

  test("unknown psalm yields undefined", () => {
    expect(psalmPassage({ psalm: 151 })).toBeUndefined();
    expect(psalmExists(0)).toBe(false);
  });
});
