import { describe, expect, test } from "bun:test";
import { formatLessonRef, parseLessonRef } from "../lessons";

describe("parseLessonRef", () => {
  test("simple chapter:verse", () => {
    const r = parseLessonRef("Gen 48:8–22");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.ref.book).toBe("Gen");
    expect(r.ref.ranges).toMatchObject([
      { from: { chapter: 48, verse: 8 }, to: { chapter: 48, verse: 22 } },
    ]);
  });

  test("en dash and hyphen both work", () => {
    expect(parseLessonRef("Rom 12:9–21").ok).toBe(true);
    expect(parseLessonRef("Rom 12:9-21").ok).toBe(true);
  });

  test("multi-range with semicolon spans chapters", () => {
    const r = parseLessonRef("Luke 1:1–4; 3:1–14");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.ref.ranges).toMatchObject([
      { from: { chapter: 1, verse: 1 }, to: { chapter: 1, verse: 4 } },
      { from: { chapter: 3, verse: 1 }, to: { chapter: 3, verse: 14 } },
    ]);
  });

  test("comma repeats chapter", () => {
    const r = parseLessonRef("Sir 10:1–8, 12–18");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.ref.ranges).toMatchObject([
      { from: { chapter: 10, verse: 1 }, to: { chapter: 10, verse: 8 } },
      { from: { chapter: 10, verse: 12 }, to: { chapter: 10, verse: 18 } },
    ]);
  });

  test("cross-chapter range", () => {
    const r = parseLessonRef("Jas 4:13–5:6");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.ref.ranges).toMatchObject([
      {
        from: { chapter: 4, verse: 13 },
        to: { chapter: 5, verse: 6 },
      },
    ]);
  });

  test("single-chapter book implicitly chapter 1", () => {
    for (const input of ["Phlm 4–7", "Obad 1–4", "2 John 1–6", "Jude 17–23"]) {
      const r = parseLessonRef(input);
      expect(r.ok).toBe(true);
      if (!r.ok) continue;
      expect(r.ref.ranges[0].from.chapter).toBe(1);
    }
  });

  test("optional group in parentheses", () => {
    const r = parseLessonRef("Isa 6:1–8(9–13)");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.ref.ranges).toMatchObject([
      {
        from: { chapter: 6, verse: 1 },
        to: { chapter: 6, verse: 8 },
        optional: false,
      },
      {
        from: { chapter: 6, verse: 9 },
        to: { chapter: 6, verse: 13 },
        optional: true,
      },
    ]);
  });

  test("aliases", () => {
    expect(parseLessonRef("1 KINGS 3:1–4").ok).toBe(true);
    expect(parseLessonRef("James 5:7–10").ok).toBe(true);
    expect(parseLessonRef("ECCLESIASTICUS 10:1").ok).toBe(true);
  });

  test("lowercase book accepted", () => {
    expect(parseLessonRef("matt 5:1–12").ok).toBe(true);
  });

  test("errors", () => {
    expect(parseLessonRef("").ok).toBe(false);
    expect(parseLessonRef("Foo 1:1").ok).toBe(false);
    expect(parseLessonRef("Matt").ok).toBe(false);
    expect(parseLessonRef("Matt 1:").ok).toBe(false);
    expect(parseLessonRef("Ps 119:89").ok).toBe(false);
  });
});

describe("formatLessonRef", () => {
  test("round-trips a cross-chapter reference", () => {
    const r = parseLessonRef("Rev 21:1–4, 9–14");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(formatLessonRef(r.ref)).toBe("Rev 21:1–4; 21:9–14");
  });

  test("round-trips optional range", () => {
    const r = parseLessonRef("Isa 6:1–8(9–13)");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(formatLessonRef(r.ref)).toBe("Isa 6:1–8; (6:9–13)");
  });
});
