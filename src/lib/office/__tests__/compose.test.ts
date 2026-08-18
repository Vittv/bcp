import { describe, expect, test } from "bun:test";
import { composeOffice, dayLabel } from "../compose";
import type { ComposedNode, ComposedSection, OfficeDocument } from "../types";
import { DEFAULT_PREFS } from "../types";

function section(
  doc: OfficeDocument,
  key: string,
): ComposedSection | undefined {
  return doc.sections.find((s) => s.key === key);
}

function nodesOf(
  doc: OfficeDocument,
  kind: ComposedNode["kind"],
): ComposedNode[] {
  return doc.sections.flatMap((s) => s.nodes).filter((n) => n.kind === kind);
}

function collectOf(
  doc: OfficeDocument,
): Extract<ComposedNode, { kind: "collect" }> | undefined {
  return nodesOf(doc, "collect")[0] as
    | Extract<ComposedNode, { kind: "collect" }>
    | undefined;
}

function psalmNumbers(doc: OfficeDocument): number[] {
  return nodesOf(doc, "psalm").map(
    (n) => (n as Extract<ComposedNode, { kind: "psalm" }>).passage.psalm,
  );
}

function textOf(doc: OfficeDocument): string[] {
  return doc.sections.flatMap((s) =>
    s.nodes.map((n) => {
      switch (n.kind) {
        case "text":
        case "rubric":
        case "heading":
          return n.text;
        case "psalm":
          return n.passage.verses.map((v) => v.text).join(" ");
        case "collect":
          return n.passage.text;
        case "lessons":
          return n.lessons.map((l) => l.ref).join(" ");
        default:
          return "";
      }
    }),
  );
}

function hasText(doc: OfficeDocument, fragment: string): boolean {
  return textOf(doc).some((t) => t.includes(fragment));
}

describe("composeOffice: Advent 1 2026", () => {
  const date = { year: 2026, month: 11, day: 29 };
  const doc = composeOffice(date, "morning-rite-two");

  test("office identity", () => {
    expect(doc.office).toBe("morning-rite-two");
    expect(doc.officeName).toBe("Daily Morning Prayer");
    expect(doc.rite).toBe("Two");
    expect(doc.date).toEqual(date);
    expect(doc.entryTitle).toBe("The First Sunday of Advent");
    expect(doc.slot).toEqual({
      year: 1,
      week: { kind: "advent", week: 1 },
      day: { kind: "weekday", weekday: 0 },
    });
  });

  test("appointed psalms are inlined", () => {
    expect(psalmNumbers(doc)).toEqual([146, 147]);
    const psalms = section(doc, "psalms");
    expect(psalms?.nodes[0]).toMatchObject({
      kind: "psalm",
      citation: "146",
    });
    const first = psalms?.nodes[0] as Extract<ComposedNode, { kind: "psalm" }>;
    expect(first.passage.verses[0].text).toContain("Hallelujah");
  });

  test("lessons render as labeled references", () => {
    const lessons = nodesOf(doc, "lessons")[0] as Extract<
      ComposedNode,
      { kind: "lessons" }
    >;
    expect(lessons.lessons.map((l) => [l.label, l.ref])).toEqual([
      ["First Lesson", "Isa 1:1–9"],
      ["Second Lesson", "2 Pet 3:1–10"],
      ["Gospel", "Matt 25:1–13"],
    ]);
  });

  test("collect of the day is the Sunday collect", () => {
    const collect = collectOf(doc);
    expect(collect?.passage.title).toBe("First Sunday of Advent");
    expect(collect?.passage.rite).toBe("contemporary");
  });

  test("opening sentences are the Advent group", () => {
    const texts = textOf(doc);
    expect(texts).toContain("Advent");
    expect(texts).toContain("At any Time");
    expect(texts).toContain(
      "Watch, for you do not know when the master of the house will come, in the evening, or at midnight, or at cockcrow, or in the morning, lest he come suddenly and find you asleep.",
    );
    expect(texts).not.toContain("Alleluia! Christ is risen.");
  });

  test("dayLabel", () => {
    expect(dayLabel(date)).toBe("Sunday, November 29, 2026");
  });
});

describe("composeOffice: the evening boundary", () => {
  test("Evening Prayer composes the next day's readings", () => {
    // Nov 29 2026 (Sunday) evening belongs to Nov 30, St. Andrew.
    const doc = composeOffice(
      { year: 2026, month: 11, day: 29 },
      "evening-rite-two",
    );
    expect(doc.entryTitle).toBe("Saint Andrew the Apostle");
    expect(psalmNumbers(doc)).toEqual([96, 100]);
    const lessons = nodesOf(doc, "lessons")[0] as Extract<
      ComposedNode,
      { kind: "lessons" }
    >;
    expect(lessons.lessons.map((l) => l.ref)).toEqual([
      "Isa 55:1–5",
      "John 1:35–42",
    ]);
    expect(collectOf(doc)?.passage.title).toBe("Saint Andrew");
  });

  test("Christmas Eve evening uses its appointed special readings", () => {
    const doc = composeOffice(
      { year: 2024, month: 12, day: 24 },
      "evening-rite-two",
    );
    expect(doc.entryTitle).toBe("Christmas Eve");
    const psalms = nodesOf(doc, "psalm");
    expect(psalms[0]).toMatchObject({ citation: "89:1–29" });
    const lessons = nodesOf(doc, "lessons")[0] as Extract<
      ComposedNode,
      { kind: "lessons" }
    >;
    expect(lessons.lessons.map((l) => l.ref)).toEqual([
      "Isa 59:15b–21",
      "Phil 2:5–11",
    ]);
    // the collect belongs to the feast whose first evensong this is.
    expect(collectOf(doc)?.passage.title).toBe(
      "The Nativity of Our Lord:  Christmas Day",
    );
  });

  test("the eve of a holy day reads the holy day's office", () => {
    const doc = composeOffice(
      { year: 2026, month: 7, day: 21 },
      "evening-rite-two",
    );
    expect(doc.entryTitle).toBe("Saint Mary Magdalene");
    expect(psalmNumbers(doc)).toEqual([30, 149]);
    const lessons = nodesOf(doc, "lessons")[0] as Extract<
      ComposedNode,
      { kind: "lessons" }
    >;
    expect(lessons.lessons.map((l) => l.ref)).toEqual([
      "Exod 15:19–21",
      "2 Cor 1:3–7",
    ]);
    expect(collectOf(doc)?.passage.title).toBe("Saint Mary Magdalene");
  });

  test("Morning Prayer keeps the current day", () => {
    const doc = composeOffice(
      { year: 2026, month: 7, day: 21 },
      "morning-rite-two",
    );
    expect(doc.entryTitle).toBeNull();
    // ordinary weekday entry, psalms of the day (not the holy day's).
    expect(psalmNumbers(doc)).toEqual([61, 62]);
  });
});

describe("composeOffice: golden Sundays", () => {
  test("Lent 1 2025", () => {
    const doc = composeOffice(
      { year: 2025, month: 3, day: 9 },
      "morning-rite-two",
    );
    expect(doc.entryTitle).toBe("The First Sunday in Lent");
    expect(psalmNumbers(doc)).toEqual([63, 98]);
    const ps63 = nodesOf(doc, "psalm")[0] as Extract<
      ComposedNode,
      { kind: "psalm" }
    >;
    // the (9–11) lengthening is folded into the passage.
    expect(ps63.passage.verses).toHaveLength(11);
    expect(collectOf(doc)?.passage.title).toBe("First Sunday in Lent");
    expect(textOf(doc)).toContain(
      "The Lord is full of compassion and mercy: Come let us adore him.",
    );
  });

  test("Pentecost 2025", () => {
    const doc = composeOffice(
      { year: 2025, month: 6, day: 8 },
      "morning-rite-two",
    );
    expect(doc.entryTitle).toBe("The Day of Pentecost: Whitsunday");
    expect(psalmNumbers(doc)).toEqual([118]);
    expect(collectOf(doc)?.passage.title).toBe(
      "The Day of Pentecost:  Whitsunday",
    );
    expect(textOf(doc)).toContain(
      "Easter Season, including Ascension Day and the Day of Pentecost",
    );
  });

  test("Trinity 2025", () => {
    const doc = composeOffice(
      { year: 2025, month: 6, day: 15 },
      "morning-rite-two",
    );
    expect(doc.entryTitle).toBe(
      "The First Sunday after Pentecost: Trinity Sunday",
    );
    expect(collectOf(doc)?.passage.title).toBe(
      "First Sunday after Pentecost:  Trinity Sunday",
    );
    expect(textOf(doc)).toContain("Trinity Sunday");
    expect(textOf(doc)).toContain(
      "Holy, holy, holy is the Lord God Almighty, who was, and is, and is to come!",
    );
  });

  test("traditional rite selects the traditional collect", () => {
    const doc = composeOffice(
      { year: 2025, month: 6, day: 8 },
      "morning-rite-one",
      { ...DEFAULT_PREFS, collectRite: "traditional" },
    );
    const collect = collectOf(doc);
    expect(collect?.passage.rite).toBe("traditional");
    expect(collect?.passage.title).toBe("The Day of Pentecost:  Whitsunday");
  });
});

describe("composeOffice: DOL special-case days", () => {
  test("St. Stephen (Dec 26 2026) uses the holy day readings and collect", () => {
    const doc = composeOffice(
      { year: 2026, month: 12, day: 26 },
      "morning-rite-two",
    );
    expect(doc.entryTitle).toBe("Saint Stephen, Deacon and Martyr");
    expect(psalmNumbers(doc)).toEqual([28, 30]);
    expect(collectOf(doc)?.passage.title).toBe("Saint Stephen");
  });

  test("Proper weekdays take the week's Proper collect", () => {
    const doc = composeOffice(
      { year: 2026, month: 8, day: 12 },
      "morning-rite-two",
    );
    expect(collectOf(doc)?.passage.title).toBe("Proper 15");
    const ps119 = nodesOf(doc, "psalm")[0] as Extract<
      ComposedNode,
      { kind: "psalm" }
    >;
    expect(ps119.citation).toBe("119:145–176");
    expect(ps119.passage.verses).toHaveLength(32);
  });

  test("daily collects during Easter and Holy Weeks", () => {
    const easterWeek = composeOffice(
      { year: 2025, month: 4, day: 21 },
      "morning-rite-two",
    );
    expect(collectOf(easterWeek)?.passage.title).toBe("Monday in Easter Week");
    const holyWeek = composeOffice(
      { year: 2025, month: 4, day: 14 },
      "morning-rite-two",
    );
    expect(collectOf(holyWeek)?.passage.title).toBe("Monday in Holy Week");
  });

  test("Epiphany season weekdays take the Epiphany collect", () => {
    const doc = composeOffice(
      { year: 2026, month: 1, day: 8 },
      "morning-rite-two",
    );
    expect(collectOf(doc)?.passage.title).toBe("The Epiphany");
  });
});

describe("composeOffice: preferences and other offices", () => {
  test("hiding rubrics drops rubric nodes but keeps the liturgy", () => {
    const doc = composeOffice(
      { year: 2026, month: 11, day: 29 },
      "morning-rite-two",
      { ...DEFAULT_PREFS, showRubrics: false },
    );
    expect(nodesOf(doc, "rubric")).toHaveLength(0);
    expect(psalmNumbers(doc)).toEqual([146, 147]);
    expect(collectOf(doc)?.passage.title).toBe("First Sunday of Advent");
    expect(nodesOf(doc, "text").length).toBeGreaterThan(0);
  });

  test("Noonday and Compline keep their fixed text", () => {
    for (const id of ["noonday", "compline"] as const) {
      const doc = composeOffice({ year: 2026, month: 8, day: 12 }, id);
      expect(doc.sections.length).toBeGreaterThan(0);
      expect(nodesOf(doc, "psalm")).toHaveLength(0);
      expect(nodesOf(doc, "lessons")).toHaveLength(0);
      expect(nodesOf(doc, "collect")).toHaveLength(0);
    }
  });

  test("unknown office throws", () => {
    expect(() =>
      // @ts-expect-error deliberately invalid
      composeOffice({ year: 2026, month: 8, day: 12 }, "nope"),
    ).toThrow();
  });

  test("occasional collects trim to the day-appropriate ones", () => {
    const doc = composeOffice(
      { year: 2026, month: 8, day: 14 },
      "evening-rite-two",
    );
    const texts = textOf(doc);
    expect(texts).toContain("A Collect for Fridays");
    expect(texts).toContain("A Collect for Peace");
    expect(texts).not.toContain("A Collect for Sundays");
    expect(texts).not.toContain("A Collect for Saturdays");
    expect(texts).not.toContain("A Collect for Aid against Perils");
    expect(texts).not.toContain("A Collect for the Presence of Christ");
  });

  test("only the first mission prayer and closing blessing are kept", () => {
    const doc = composeOffice(
      { year: 2026, month: 8, day: 14 },
      "evening-rite-two",
    );
    expect(
      hasText(doc, "O God and Father of all, whom the whole heavens adore"),
    ).toBe(true);
    expect(
      hasText(
        doc,
        "Keep watch, dear Lord, with those who work, or watch, or weep this night",
      ),
    ).toBe(false);
    expect(
      hasText(doc, "The grace of our Lord Jesus Christ, and the love of God"),
    ).toBe(true);
    expect(
      hasText(doc, "May the God of hope fill us with all joy and peace"),
    ).toBe(false);
    expect(hasText(doc, "Glory to God whose power, working in us")).toBe(false);
  });

  test("alternative lessons are hidden unless requested", () => {
    const date = { year: 2026, month: 8, day: 14 };
    const doc = composeOffice(date, "evening-rite-two");
    const lessons = nodesOf(doc, "lessons").flatMap(
      (n) => (n as Extract<ComposedNode, { kind: "lessons" }>).lessons,
    );
    expect(lessons.map((l) => l.ref)).toEqual(["Jer 31:1–14", "John 19:23–27"]);
    const withAlt = composeOffice(date, "evening-rite-two", {
      ...DEFAULT_PREFS,
      showAlternates: true,
    });
    const altLessons = nodesOf(withAlt, "lessons").flatMap(
      (n) => (n as Extract<ComposedNode, { kind: "lessons" }>).lessons,
    );
    expect(altLessons.map((l) => l.ref)).toEqual([
      "Jer 31:1–14",
      "Zech 2:10–13",
      "John 19:23–27",
      "Acts 1:6–14",
    ]);
  });

  test("Compline collapses its collect and prayer menus", () => {
    const doc = composeOffice({ year: 2026, month: 8, day: 14 }, "compline");
    expect(hasText(doc, "Be our light in the darkness, O Lord")).toBe(true);
    expect(hasText(doc, "Be present, O merciful God")).toBe(false);
    expect(hasText(doc, "Look down, O Lord, from your heavenly throne")).toBe(
      false,
    );
    expect(
      hasText(
        doc,
        "Keep watch, dear Lord, with those who work, or watch, or weep this night",
      ),
    ).toBe(true);
    expect(
      hasText(doc, "O God, your unfailing providence sustains the world"),
    ).toBe(false);
  });

  test("only one invitatory antiphon is kept", () => {
    const doc = composeOffice(
      { year: 2026, month: 8, day: 14 },
      "morning-rite-two",
    );
    expect(
      hasText(
        doc,
        "The earth is the Lord's for he made it: Come let us adore him.",
      ),
    ).toBe(true);
    expect(
      hasText(
        doc,
        "Worship the Lord in the beauty of his holiness: Come let us adore him.",
      ),
    ).toBe(false);
    expect(
      hasText(
        doc,
        "The mercy of the Lord is everlasting: Come let us adore him.",
      ),
    ).toBe(false);
  });

  test("as many canticles as lessons are kept", () => {
    const canticles = (doc: OfficeDocument) =>
      nodesOf(doc, "heading")
        .map((n) => (n as Extract<ComposedNode, { kind: "heading" }>).text)
        .filter((t) => /^(\d+|The Song of|Song of)/.test(t));
    const morning = composeOffice(
      { year: 2026, month: 8, day: 14 },
      "morning-rite-two",
    );
    expect(canticles(morning)).toEqual([
      "8 The Song of Moses Cantemus Domino",
      "9 The First Song of Isaiah Ecce, Deus",
      "10 The Second Song of Isaiah Quaerite Dominum",
    ]);
    const evening = composeOffice(
      { year: 2026, month: 8, day: 14 },
      "evening-rite-two",
    );
    expect(canticles(evening)).toEqual([
      "The Song of Mary Magnificat",
      "Song of Simeon Nunc Dimittis",
    ]);
  });

  test("personal mode is on by default: no speaker labels", () => {
    const doc = composeOffice(
      { year: 2026, month: 11, day: 29 },
      "morning-rite-two",
    );
    const speakers = doc.sections
      .flatMap((s) => s.nodes)
      .filter((n) => n.kind === "text" && n.speaker);
    expect(speakers).toHaveLength(0);
  });

  test("personal mode strips the absolution from the confession", () => {
    const doc = composeOffice(
      { year: 2026, month: 11, day: 29 },
      "morning-rite-two",
    );
    expect(
      hasText(doc, "Almighty God have mercy on you, forgive you all your sins"),
    ).toBe(false);
    // but the confession prayer itself remains
    expect(hasText(doc, "Most merciful God, we confess")).toBe(true);
  });

  test("turning personal mode off restores speakers and absolution", () => {
    const doc = composeOffice(
      { year: 2026, month: 11, day: 29 },
      "morning-rite-two",
      { ...DEFAULT_PREFS, personalMode: false },
    );
    const speakers = doc.sections
      .flatMap((s) => s.nodes)
      .filter((n) => n.kind === "text" && n.speaker);
    expect(speakers.length).toBeGreaterThan(0);
    expect(
      hasText(doc, "Almighty God have mercy on you, forgive you all your sins"),
    ).toBe(true);
  });
});
