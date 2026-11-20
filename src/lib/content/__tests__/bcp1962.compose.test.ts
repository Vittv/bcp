import { describe, expect, it } from "bun:test";
import {
  composeBcp1962Compline,
  composeBcp1962FamilyPrayer,
  composeBcp1962ForDate,
  composeBcp1962Litany,
  composeBcp1962Noonday,
  composeBcp1962OfficeForDate,
  DEFAULT_BCP1962_SCRIPTURE_SETTINGS,
  parseBcp1962LessonRef,
  resolveBcp1962LessonPassages,
  resolveBcp1962OfficeForDate,
} from "../bcp1962";

const at = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
};

describe("bcp1962 litany", () => {
  it("composes the Litany as a standalone office with speakers", () => {
    const doc = composeBcp1962Litany(at("2026-11-18"));
    expect(doc.edition).toBe("1962");
    expect(doc.officeName).toBe("The Litany");
    expect(doc.nodes[0].kind).toBe("rubric");
    expect(doc.nodes[doc.nodes.length - 1].kind).toBe("rubric");
    const heading = (text: string) =>
      doc.nodes.findIndex((n) => n.kind === "heading" && n.text === text);
    expect(heading("A Supplication")).toBeLessThan(
      heading("A Prayer of Saint Chrysostom"),
    );
    expect(heading("The Grace")).toBeGreaterThan(
      heading("A Prayer of Saint Chrysostom"),
    );
    const speakers = new Set(
      doc.nodes.flatMap((n) =>
        n.kind === "text" && n.speaker ? [n.speaker] : [],
      ),
    );
    expect(speakers.has("minister")).toBe(true);
    expect(speakers.has("people")).toBe(true);
    expect(
      doc.nodes.some(
        (n) =>
          n.kind === "text" &&
          n.text.includes("O God the Father, Creator of heaven and earth"),
      ),
    ).toBe(true);
  });
});

describe("bcp1962 short offices", () => {
  it("composes Prayers at Mid-day from the vendored text", () => {
    const doc = composeBcp1962Noonday(at("2026-11-18"));
    expect(doc.edition).toBe("1962");
    expect(doc.office).toBe("noonday");
    expect(doc.officeName).toBe("Prayers at Mid-day");
    const text = doc.sections.flatMap((s) =>
      s.nodes.map((n) => (n.kind === "text" ? n.text : "")),
    );
    expect(
      text.some((t) => t.includes("Blessed Saviour, who at this hour")),
    ).toBe(true);
    expect(doc.title).toBe("For Missions");
    const nodes = doc.sections[0].nodes;
    expect(nodes[0]).toMatchObject({
      kind: "heading",
      text: "The Lord's Prayer",
    });
    expect(
      nodes
        .filter((n) => n.kind === "heading" && n.scripture)
        .map((n) => ("citation" in n ? n.citation : undefined)),
    ).toEqual(["St John 12. 32", "Acts 26. 13", "Acts 10. 9"]);
    expect(nodes.filter((n) => n.kind === "text" && n.collect)).toHaveLength(3);
    expect(nodes.at(-1)).toMatchObject({ kind: "rubric" });
  });

  it("composes Compline with the respond, hymn and blessing", () => {
    const doc = composeBcp1962Compline(at("2026-11-18"));
    expect(doc.office).toBe("compline");
    expect(doc.officeName).toBe("The Order for Compline");
    const text = doc.sections.flatMap((s) =>
      s.nodes.map((n) => (n.kind === "text" ? n.text : "")),
    );
    expect(text.some((t) => t.includes("Into thy hands, O Lord"))).toBe(true);
    expect(text.some((t) => t.includes("Before the ending of the day"))).toBe(
      true,
    );
    expect(text.some((t) => t.includes("bless and preserve us"))).toBe(true);
    expect(
      doc.sections.some((s) =>
        s.nodes.some((n) => n.kind === "text" && n.speaker === "minister"),
      ),
    ).toBe(true);
    expect(
      doc.sections.some((s) =>
        s.nodes.some(
          (n) =>
            n.kind === "text" && n.text === "Amen." && n.speaker === "people",
        ),
      ),
    ).toBe(true);
  });
});

describe("bcp1962 family prayer", () => {
  it("uses the Morning form for morning and noonday", () => {
    for (const tab of ["morning", "noonday"] as const) {
      const doc = composeBcp1962FamilyPrayer(tab, at("2026-11-18"));
      expect(doc.officeName).toBe("Family Prayers, Morning");
      const text = doc.sections.flatMap((s) =>
        s.nodes.map((n) => (n.kind === "text" ? n.text : "")),
      );
      expect(text.some((t) => t.includes("early will I seek thee"))).toBe(true);
    }
  });

  it("uses the Evening form for evening and compline", () => {
    for (const tab of ["evening", "compline"] as const) {
      const doc = composeBcp1962FamilyPrayer(tab, at("2026-11-18"));
      expect(doc.officeName).toBe("Family Prayers, Evening");
      const text = doc.sections.flatMap((s) =>
        s.nodes.map((n) => (n.kind === "text" ? n.text : "")),
      );
      expect(text.some((t) => t.includes("evening sacrifice"))).toBe(true);
    }
  });
});

describe("bcp1962 date composition", () => {
  it("uses Year I and Year II Sunday lessons", () => {
    const year1 = composeBcp1962ForDate(at("2026-11-29"));
    expect(year1.observance.year).toBe(1);
    expect(year1.lessons?.morning.first).toBe("Isa. 1. 1–20");
    expect(year1.lessons?.morning.second).toBe("Matt. 24. 1–28");
    expect(year1.lessons?.evening.second).toBe("1 Thess. 5");

    const year2 = composeBcp1962ForDate(at("2027-11-28"));
    expect(year2.observance.year).toBe(2);
    expect(year2.lessons?.morning.second).toBe("Rev. 2. 1–17");
  });

  it("uses proper psalms for named feasts", () => {
    const christmas = composeBcp1962ForDate(at("2026-12-25"));
    expect(christmas.source).toBe("holy-day-proper");
    expect(christmas.psalmsSource).toBe("proper");
    expect(christmas.psalms?.mattins).toBe("45");
    expect(christmas.psalms?.evensong).toBe("85, 110");
  });

  it("applies the Trinity alternative first lessons", () => {
    const obs = composeBcp1962ForDate(at("2027-10-17"));
    expect(obs.observance.sectionId).toBe("trinity-21");
    expect(obs.lessons?.morning.first).toBe("Job 39. 31—40. 4");
    expect(obs.notes.some((n) => n.includes("alternative first lessons"))).toBe(
      true,
    );
  });
});

describe("bcp1962 scripture resolution", () => {
  it("resolves a simple lesson reference", async () => {
    const passages = await resolveBcp1962LessonPassages(
      "Isa. 1. 1–20",
      DEFAULT_BCP1962_SCRIPTURE_SETTINGS,
    );
    expect(passages.length).toBe(1);
    expect(passages[0]?.normalized).toBe("Isa. 1:1–20");
    expect(passages[0]?.passages.length).toBeGreaterThan(0);
  });

  it("expands the end keyword", async () => {
    const passages = await resolveBcp1962LessonPassages("Isa. 2. 10–end");
    expect(passages[0]?.normalized).toBe("Isa. 2:10–end");
    expect(passages[0]?.passages.length).toBeGreaterThan(0);
  });

  it("loads a cross-chapter lesson range", async () => {
    const passages = await resolveBcp1962LessonPassages(
      "Acts 12. 25\u201413. 12",
    );
    const verses = passages[0]?.passages[0]?.verses ?? [];
    expect(verses.length).toBe(13);
    expect(verses[0]?.number).toBe(25);
    expect(verses.at(-1)?.number).toBe(12);
    expect(verses.at(-1)?.chapter).toBe(13);
  });

  it("loads every verse of an end citation", async () => {
    const passages = await resolveBcp1962LessonPassages("Prov. 25. 11–end");
    const verses = passages[0]?.passages[0]?.verses ?? [];
    expect(verses.length).toBe(18);
    expect(verses[0]?.number).toBe(11);
    expect(verses.at(-1)?.number).toBe(28);
  });

  it("resolves psalm appointments into citations", async () => {
    const office = await resolveBcp1962OfficeForDate(
      at("2026-11-29"),
      "morning",
    );
    expect(office.psalms).toEqual(["9"]);
    expect(office.lessons.length).toBe(2);
  });

  it("structurally resolves parenthetical alternatives", async () => {
    const passages = await resolveBcp1962LessonPassages(
      "John. 4. 1–26 (27–42)",
    );
    expect(passages).toHaveLength(1);
    expect(passages[0]?.parsed?.ranges).toHaveLength(2);
    expect(passages[0]?.ranges?.some((r) => r.optional)).toBe(true);
    expect(passages[0]?.passages.length).toBeGreaterThan(1);
  });

  it("preserves a/b verse halves", async () => {
    const passages = await resolveBcp1962LessonPassages("John. 12. 20–36a");
    expect(passages[0]?.ranges?.[0]?.half).toBe("a");
    expect(passages[0]?.passages.length).toBeGreaterThan(0);
  });
});

describe("bcp1962 citation parsing", () => {
  it("accepts the book's St-prefixed gospel citations", () => {
    expect(parseBcp1962LessonRef("St Luke 1. 46.")).toMatchObject({
      ok: true,
      ref: {
        book: "Luke",
        ranges: [{ from: { chapter: 1, verse: 46 } }],
      },
    });
  });
});

describe("bcp1962 office composition", () => {
  it("composes a Morning Prayer from vendored 1962 texts", async () => {
    const doc = await composeBcp1962OfficeForDate(at("2026-11-29"), "morning");
    expect(doc.edition).toBe("1962");
    expect(doc.officeName).toBe("Morning Prayer");
    const sections = new Map(doc.sections.map((s) => [s.key, s]));
    const opening = sections.get("opening")?.nodes ?? [];
    expect(
      opening.some(
        (n) =>
          n.kind === "text" && n.text.startsWith("Dearly beloved brethren"),
      ),
    ).toBe(true);
    expect(
      opening.some(
        (n) =>
          n.kind === "text" && n.text.includes("Our Father who art in heaven"),
      ),
    ).toBe(true);
    expect(opening).toContainEqual({
      kind: "text",
      text: "Amen.",
      speaker: "people",
    });
    expect(
      opening.some(
        (n) => n.kind === "rubric" && n.text.includes("people shall answer"),
      ),
    ).toBe(true);
    expect(opening).toContainEqual({
      kind: "heading",
      text: "Venite, exultemus Domino",
    });
    expect(
      opening.some((n) => n.kind === "rubric" && n.text === "Psalm 95"),
    ).toBe(false);
    expect(
      opening.some(
        (n) => n.kind === "text" && n.text.startsWith("Glory be to the Father"),
      ),
    ).toBe(true);
    expect(
      opening.some(
        (n) =>
          n.kind === "rubric" && n.text.startsWith("Glory be to the Father"),
      ),
    ).toBe(false);
    expect(opening).toContainEqual({
      kind: "psalm",
      refs: ["95"],
      passages: [
        { ref: "95", passage: expect.objectContaining({ psalm: 95 }) },
      ],
    });
    expect(
      opening.some(
        (n) => n.kind === "text" && n.text.includes("O come, let us sing"),
      ),
    ).toBe(false);
    expect(
      opening.some(
        (n) => n.kind === "heading" && n.text === "Confession of Sin",
      ),
    ).toBe(true);
    const sentences = opening.filter(
      (n) => n.kind === "text" && n.group !== undefined,
    );
    expect(sentences).toHaveLength(26);
    const advent = sentences.find(
      (n) => n.kind === "text" && n.seasonLabel === "Advent.",
    );
    expect(advent).toMatchObject({
      kind: "text",
      group: "Advent",
      citation: "St Matthew 3. 2.",
      seasonLabel: "Advent.",
    });
    expect(advent?.kind === "text" && advent.text).toBe(
      "Repent ye; for the kingdom of heaven is at hand.",
    );
    const lentContinuation = sentences.find(
      (n) => n.kind === "text" && n.text.startsWith("Rend your heart"),
    );
    expect(
      lentContinuation?.kind === "text" && lentContinuation.seasonLabel,
    ).toBeUndefined();
    expect(
      sentences.filter((n) => n.kind === "text" && n.suggested),
    ).toHaveLength(1);
    const lessons = sections.get("lessons")?.nodes ?? [];
    expect(
      lessons.some(
        (n) => n.kind === "canticle" && n.id === "te-deum" && n.suggested,
      ),
    ).toBe(true);
    expect(lessons.filter((n) => n.kind === "lesson")).toHaveLength(2);
    const collects = sections.get("collects")?.nodes ?? [];
    expect(
      collects.some(
        (n) => n.kind === "text" && n.text.includes("author of peace"),
      ),
    ).toBe(true);
    expect(
      collects.some(
        (n) => n.kind === "text" && n.text.includes("beginning of this day"),
      ),
    ).toBe(true);
    const creed = sections.get("creed")?.nodes ?? [];
    expect(creed.filter((n) => n.kind === "creed")).toHaveLength(2);
    expect(creed).toMatchObject([
      { kind: "creed", id: "apostles", suggested: true },
      { kind: "creed", id: "athanasian", suggested: false },
    ]);
  });

  it("includes the Collect of the Day for a numbered Sunday", async () => {
    const doc = await composeBcp1962OfficeForDate(at("2026-11-15"), "morning");
    const collects =
      doc.sections.find((s) => s.key === "collects")?.nodes ?? [];
    expect(
      collects.some(
        (n) => n.kind === "heading" && n.text === "The Collect of the Day",
      ),
    ).toBe(true);
    expect(
      collects.some(
        (n) =>
          n.kind === "rubric" &&
          n.text === "THE TWENTY-FOURTH SUNDAY AFTER TRINITY",
      ),
    ).toBe(true);
  });

  it("composes an Evening Prayer with the evening canticles", async () => {
    const doc = await composeBcp1962OfficeForDate(at("2026-11-29"), "evening");
    expect(doc.officeName).toBe("Evening Prayer");
    const lessons = doc.sections.find((s) => s.key === "lessons")?.nodes ?? [];
    const canticles = lessons
      .filter((n) => n.kind === "canticle")
      .map((n) => (n.kind === "canticle" ? n.id : ""));
    expect(canticles).toContain("magnificat");
    expect(canticles).toContain("nunc-dimittis");
    expect(
      doc.sections
        .find((s) => s.key === "collects")
        ?.nodes.some(
          (n) => n.kind === "text" && n.text.includes("Lighten our darkness"),
        ),
    ).toBe(true);
  });
});
