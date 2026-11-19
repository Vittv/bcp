import { describe, expect, it } from "bun:test";
import {
  composeBcp1962Compline,
  composeBcp1962FamilyPrayer,
  composeBcp1962ForDate,
  composeBcp1962Litany,
  composeBcp1962Noonday,
  composeBcp1962OfficeForDate,
  DEFAULT_BCP1962_SCRIPTURE_SETTINGS,
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
