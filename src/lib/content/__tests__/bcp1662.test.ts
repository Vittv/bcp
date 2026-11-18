import { describe, expect, it } from "bun:test";
import {
  athanasianCreedDay,
  resolveBcp1662Observance,
} from "../../calendar/bcp1662";
import {
  composeBcp1662ForDate,
  getBcp1662LessonsForDate,
  normalizeBcp1662LessonRef,
  resolveBcp1662LessonPassages,
} from "../bcp1662";
import { composeBcp1662Day } from "../vendor/bcp1662";

describe("bcp1662 composition", () => {
  it("normalizes common 1662 lesson ref forms", () => {
    expect(normalizeBcp1662LessonRef("Prov. 3. to v. 28")).toBe("Prov. 3:1-28");
    expect(normalizeBcp1662LessonRef("Ecclesiasticus 4")).toBe("Sirach 4");
    expect(
      normalizeBcp1662LessonRef("Ecclesiasticus 21; Ecclesiasticus 24"),
    ).toBe("Sirach 21; Sirach 24");
  });

  it("attaches proper lessons/psalms for fixed feasts by daily label", () => {
    const christmas = composeBcp1662Day("december", 25);
    expect(christmas?.resolvedFeastName).toBe(
      "Nativity of Christ (Christmas Day)",
    );
    expect(christmas?.properLessons?.name).toBe(
      "Nativity of Christ (Christmas Day)",
    );
    expect(christmas?.morning.psalms?.name).toBe("Christmas Day");
  });

  it("resolves Advent Sunday observance and proper lessons", () => {
    const date = { year: 2026, month: 11, day: 29 };
    const obs = resolveBcp1662Observance(date);
    expect(obs.properSundayName).toBe("First Sunday in Advent");
    const morning = getBcp1662LessonsForDate(date, "morning");
    expect(morning).toEqual({
      lessons: "Isaiah 1",
      source: "sunday-proper",
      name: "First Sunday in Advent",
    });
  });

  it("resolves and composes a Sunday proper office with scripture passages", async () => {
    const composed = composeBcp1662ForDate({ year: 2026, month: 11, day: 15 });
    expect(composed.observance.properSundayName).toBe(
      "Twenty-fourth Sunday after Trinity",
    );
    const lessons = await resolveBcp1662LessonPassages({
      first: "Proverbs 13",
      second: null,
    });
    expect(lessons[0]?.passages[0]?.verses.length).toBe(25);
  });

  it("resolves multi-segment and single-chapter lesson refs", async () => {
    const multi = await resolveBcp1662LessonPassages("Numbers 23; Numbers 24");
    expect(multi[0]?.passages.map((p) => p.verses.length)).toEqual([30, 25]);
    const short = await resolveBcp1662LessonPassages("2 John; 3 John");
    expect(short[0]?.passages.map((p) => p.book)).toEqual(["2 John", "3 John"]);
    expect(short[0]?.passages.map((p) => p.verses.length)).toEqual([13, 14]);
  });

  it("uses monthly psalter cycle when no proper psalms are appointed", async () => {
    const { resolveBcp1662OfficeForDate } = await import("../bcp1662");
    const office = await resolveBcp1662OfficeForDate(
      { year: 2026, month: 1, day: 2 },
      "morning",
    );
    expect(office.psalmsSource).toBe("monthly");
    expect(office.monthlyPsalms).toEqual(["9", "10", "11"]);
    expect(office.psalms).toBeUndefined();
  });

  it("places the occasional prayers before the two final prayers", async () => {
    const { composeBcp1662OfficeForDate } = await import("../bcp1662");
    const doc = await composeBcp1662OfficeForDate(
      { year: 2026, month: 11, day: 17 },
      "evening",
    );
    const nodes = doc.sections.find((s) => s.key === "closing")?.nodes ?? [];
    const occasional = nodes.flatMap((n) =>
      n.kind === "occasional" ? [{ group: n.group, title: n.title }] : [],
    );
    expect(occasional.length).toBeGreaterThan(0);
    expect(occasional.some((p) => p.group === "Prayers")).toBe(true);
    expect(occasional.some((p) => p.group === "Thanksgivings")).toBe(true);
    const first = nodes.findIndex((n) => n.kind === "occasional");
    const chrysostom = nodes.findIndex(
      (n) => n.kind === "heading" && n.text === "A Prayer of St. Chrysostom",
    );
    expect(first).toBeGreaterThan(-1);
    expect(first).toBeLessThan(chrysostom);
  });

  it("appoints the Athanasian Creed on its proper feasts", () => {
    const onFeast = (month: number, day: number) =>
      athanasianCreedDay(resolveBcp1662Observance({ year: 2026, month, day }));
    expect(onFeast(11, 17)).toBe(false);
    expect(onFeast(12, 25)).toBe(true);
    expect(onFeast(1, 6)).toBe(true);
    expect(onFeast(4, 5)).toBe(true);
    expect(onFeast(5, 24)).toBe(true);
    expect(onFeast(5, 31)).toBe(true);
    expect(onFeast(11, 30)).toBe(true);
  });

  it("switches the creed to Athanasian at Matins on an appointed feast", async () => {
    const { composeBcp1662OfficeForDate } = await import("../bcp1662");
    const date = { year: 2026, month: 5, day: 31 };
    const morning = await composeBcp1662OfficeForDate(date, "morning");
    const section = morning.sections.find((s) => s.key === "creed");
    expect(section?.heading).toBe("The Creed of Saint Athanasius");
    const creeds = section?.nodes.flatMap((n) =>
      n.kind === "creed" ? [{ id: n.id, suggested: n.suggested }] : [],
    );
    expect(creeds).toEqual([
      { id: "apostles", suggested: false },
      { id: "athanasian", suggested: true },
    ]);
    const evening = await composeBcp1662OfficeForDate(date, "evening");
    expect(evening.sections.find((s) => s.key === "creed")?.heading).toBe(
      "The Apostles' Creed",
    );
  });

  it("emits canticles with a suggested default and drops invented section rules", async () => {
    const { composeBcp1662OfficeForDate } = await import("../bcp1662");
    const date = { year: 2026, month: 11, day: 17 };
    const morning = await composeBcp1662OfficeForDate(date, "morning");
    const canticles = morning.sections
      .find((s) => s.key === "lessons")
      ?.nodes.flatMap((n) =>
        n.kind === "canticle"
          ? [{ slot: n.slot, id: n.id, suggested: n.suggested }]
          : [],
      );
    expect(canticles).toEqual([
      { slot: "first", id: "te-deum", suggested: true },
      { slot: "first", id: "benedicite", suggested: false },
      { slot: "second", id: "benedictus", suggested: true },
      { slot: "second", id: "jubilate", suggested: false },
    ]);
    expect(morning.sections.map((s) => s.heading)).toEqual([
      undefined,
      "Psalms",
      "The Lessons",
      "The Apostles' Creed",
      "The Prayers",
      undefined,
      undefined,
    ]);
    const evening = await composeBcp1662OfficeForDate(date, "evening");
    const eveningIds = evening.sections
      .find((s) => s.key === "lessons")
      ?.nodes.flatMap((n) => (n.kind === "canticle" ? [n.id] : []));
    expect(eveningIds).toEqual([
      "magnificat",
      "cantate-domino",
      "nunc-dimittis",
      "deus-misereatur",
    ]);
  });
});
