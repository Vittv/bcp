import { describe, expect, test } from "bun:test";
import { parsePsalmCitation } from "../../content/psalms";
import { psalterDay, psalterDayForDate } from "../../content/psalterDays";
import { composeOffice, dayLabel } from "../compose";
import type {
  ComposedLesson,
  ComposedNode,
  ComposedSection,
  OfficeDocument,
} from "../types";
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
  // SAFETY: nodesOf filters by kind, so every element has kind "collect".
  return nodesOf(doc, "collect")[0] as
    | Extract<ComposedNode, { kind: "collect" }>
    | undefined;
}

function psalmNumbers(doc: OfficeDocument): number[] {
  // SAFETY: nodesOf filters by kind, so every element has kind "psalm".
  return nodesOf(doc, "psalm").map(
    (n) => (n as Extract<ComposedNode, { kind: "psalm" }>).passage.psalm,
  );
}

function psalmCitations(doc: OfficeDocument): string[] {
  // SAFETY: nodesOf filters by kind, so every element has kind "psalm".
  return nodesOf(doc, "psalm").map(
    (n) => (n as Extract<ComposedNode, { kind: "psalm" }>).citation,
  );
}

function rubricTexts(doc: OfficeDocument): string[] {
  // SAFETY: nodesOf filters by kind, so every element has kind "rubric".
  return nodesOf(doc, "rubric").map(
    (n) => (n as Extract<ComposedNode, { kind: "rubric" }>).text,
  );
}

function headingTexts(doc: OfficeDocument): string[] {
  // SAFETY: nodesOf filters by kind, so every element has kind "heading".
  return nodesOf(doc, "heading").map(
    (n) => (n as Extract<ComposedNode, { kind: "heading" }>).text,
  );
}

function lessonRefsOf(doc: OfficeDocument): string[] {
  return doc.sections.flatMap((s) =>
    s.nodes.flatMap((n) =>
      n.kind === "lessons"
        ? n.lessons.map((l) => l.ref)
        : n.kind === "reading"
          ? [n.lesson.ref]
          : [],
    ),
  );
}

function lessonsOf(doc: OfficeDocument): ComposedLesson[] {
  return doc.sections.flatMap((s) =>
    s.nodes.flatMap((n) =>
      n.kind === "lessons" ? n.lessons : n.kind === "reading" ? [n.lesson] : [],
    ),
  );
}

function textOf(doc: OfficeDocument): string[] {
  return doc.sections.flatMap((s) =>
    s.nodes.flatMap((n) => {
      switch (n.kind) {
        case "text":
        case "rubric":
        case "heading":
          return [n.text];
        case "psalm":
          return [n.passage.verses.map((v) => v.text).join(" ")];
        case "collect":
          return [n.passage.text];
        case "fixed-collect":
          return n.title ? [n.title, n.text] : [n.text];
        case "lessons":
          return [n.lessons.map((l) => l.ref).join(" ")];
        case "reading":
          return [n.lesson.ref];
        case "canticle":
          return [n.passage?.title ?? ""];
        default:
          return [""];
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
    // SAFETY: nodesOf filters by kind.
    const first = psalms?.nodes[0] as Extract<ComposedNode, { kind: "psalm" }>;
    expect(first.passage.verses[0].text).toContain("Hallelujah");
  });

  test("lessons render as labeled references", () => {
    expect(lessonsOf(doc).map((l) => [l.label, l.ref])).toEqual([
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

  test("opening sentences show one seasonal sentence", () => {
    const texts = textOf(doc);
    expect(texts).not.toContain("Advent");
    expect(texts).not.toContain("At any Time");
    expect(texts).toContain(
      "Watch, for you do not know when the master of the house will come, in the evening, or at midnight, or at cockcrow, or in the morning, lest he come suddenly and find you asleep.",
    );
    expect(texts).not.toContain("Alleluia! Christ is risen.");
    // the other Advent sentences are no longer printed by default
    expect(hasText(doc, "In the wilderness prepare the way of the Lord")).toBe(
      false,
    );
  });

  test("the opening sentence picker can still show all sentences", () => {
    const all = composeOffice(date, "morning-rite-two", {
      ...DEFAULT_PREFS,
      customization: { opening: "all" },
    });
    expect(hasText(all, "In the wilderness prepare the way of the Lord")).toBe(
      true,
    );
    expect(
      hasText(all, "Watch, for you do not know when the master of the house"),
    ).toBe(true);
  });

  test("dayLabel", () => {
    expect(dayLabel(date)).toBe("Sunday, November 29, 2026");
  });
});

describe("composeOffice: the evening boundary", () => {
  test("Evening Prayer prays the day's own office", () => {
    // Nov 29 2026 (Sunday, Advent 1): the evening is its own, not St. Andrew's.
    const doc = composeOffice(
      { year: 2026, month: 11, day: 29 },
      "evening-rite-two",
    );
    expect(doc.entryTitle).toBe("The First Sunday of Advent");
    expect(psalmNumbers(doc)).toEqual([111, 112, 113]);
    expect(lessonRefsOf(doc)).toEqual([
      "Isa 1:1–9",
      "2 Pet 3:1–10",
      "Matt 25:1–13",
    ]);
    expect(collectOf(doc)?.passage.title).toBe("First Sunday of Advent");
  });

  test("Christmas Eve evening uses its appointed special readings", () => {
    const doc = composeOffice(
      { year: 2024, month: 12, day: 24 },
      "evening-rite-two",
    );
    expect(doc.entryTitle).toBe("Christmas Eve");
    const psalms = nodesOf(doc, "psalm");
    expect(psalms[0]).toMatchObject({ citation: "89:1–29" });
    expect(lessonRefsOf(doc)).toEqual(["Isa 59:15b–21", "Phil 2:5–11"]);
    // the collect belongs to the feast whose first evensong this is.
    expect(collectOf(doc)?.passage.title).toBe(
      "The Nativity of Our Lord:  Christmas Day",
    );
  });

  test("a printed eve of a holy day reads the eve entry and the feast's collect", () => {
    // Eve of Holy Cross (Sep 13 2024, Friday evening) has its own appointed
    // reading and borrows the feast's collect.
    const doc = composeOffice(
      { year: 2024, month: 9, day: 13 },
      "evening-rite-two",
    );
    expect(doc.entryTitle).toBe("Eve of Holy Cross");
    expect(psalmNumbers(doc)).toEqual([46, 87]);
    expect(lessonRefsOf(doc)).toEqual(["1 Kgs 8:22–30", "Eph 2:11–22"]);
    expect(collectOf(doc)?.passage.title).toBe("Holy Cross Day");
  });

  test("a holy day without a printed eve leaves the prior evening ordinary", () => {
    // St. Mary Magdalene (Jul 21 2026, Tuesday) has no appointed eve, so the
    // weekday keeps its own office.
    const doc = composeOffice(
      { year: 2026, month: 7, day: 21 },
      "evening-rite-two",
    );
    expect(doc.entryTitle).toBeNull();
    // Tuesday of Proper 11 (week of Sunday July 19 2026)
    expect(psalmNumbers(doc)).toEqual([47, 48]);
    expect(lessonRefsOf(doc)).toEqual([
      "Josh 8:1–22",
      "Rom 14:1–12",
      "Matt 26:47–56",
    ]);
    expect(collectOf(doc)?.passage.title).toBe("Proper 11");
  });

  test("every part of a holy day names the day", () => {
    // Holy Cross Day (Sep 14 2026): the title shows on all offices, and the
    // evening reads the day's own appointed office (Ps 118, Gen 3:1-15,
    // 1 Pet 3:17-22) rather than the next day.
    const ids = [
      "morning-rite-two",
      "noonday",
      "owe",
      "evening-rite-two",
      "compline",
    ] as const;
    for (const id of ids) {
      const doc = composeOffice({ year: 2026, month: 9, day: 14 }, id);
      expect(doc.entryTitle).toBe("Holy Cross Day");
    }
    const evening = composeOffice(
      { year: 2026, month: 9, day: 14 },
      "evening-rite-two",
    );
    expect(psalmNumbers(evening)).toEqual([118]);
    expect(lessonRefsOf(evening)).toEqual(["Gen 3:1–15", "1 Pet 3:17–22"]);
    for (const id of ["noonday", "owe", "compline"] as const) {
      const doc = composeOffice({ year: 2026, month: 9, day: 14 }, id);
      expect(nodesOf(doc, "lessons")).toHaveLength(0);
    }
  });

  test("the fixed-date Eve of All Saints reads the eve entry and the feast's collect", () => {
    // Oct 31 2025 (Friday) evening: the "Eve of All Saints" appointed
    // reading, with the collect of the following feast.
    const doc = composeOffice(
      { year: 2025, month: 10, day: 31 },
      "evening-rite-two",
    );
    expect(doc.entryTitle).toBe("Eve of All Saints");
    expect(collectOf(doc)?.passage.title).toBe("All Saint's Day");
    const psalms = nodesOf(doc, "psalm");
    expect(psalms.length).toBeGreaterThan(0);
    expect(lessonRefsOf(doc).length).toBeGreaterThan(0);
  });

  test("the collect carries its feast's slug for the title link", () => {
    const allSaints = composeOffice(
      { year: 2026, month: 11, day: 1 },
      "morning-rite-two",
    );
    // the printed title differs from the lectionary feast it links to
    expect(collectOf(allSaints)?.passage.title).toBe("All Saint's Day");
    expect(collectOf(allSaints)?.slug).toBe("all-saints");

    // an eve borrows the following feast's collect, so the title links there
    const eve = composeOffice(
      { year: 2025, month: 10, day: 31 },
      "evening-rite-two",
    );
    expect(collectOf(eve)?.slug).toBe("all-saints");

    // a feast yielding to Sunday keeps the Sunday collect, with no feast slug
    const sunday = composeOffice(
      { year: 2026, month: 10, day: 18 },
      "morning-rite-two",
    );
    expect(collectOf(sunday)?.passage.title).toBe("Proper 24");
    expect(collectOf(sunday)?.slug).toBeUndefined();
  });

  test("the collect slot and closing prayers rank as headings", () => {
    const doc = composeOffice(
      { year: 2026, month: 11, day: 1 },
      "morning-rite-two",
    );

    // the collect slot heading sits directly above the day collect
    const suffrages = section(doc, "suffrages-b");
    expect(suffrages).toBeDefined();
    const tail = suffrages?.nodes ?? [];
    const collectIdx = tail.findIndex((n) => n.kind === "collect");
    expect(collectIdx).toBeGreaterThan(0);
    expect(tail[collectIdx - 1]).toMatchObject({
      kind: "heading",
      text: "The Collect of the Day",
    });

    // the book prints these as rubrics, but they are block titles
    const headings = headingTexts(doc);
    expect(headings).toContain("The General Thanksgiving");
    expect(headings).toContain("A Prayer of St. Chrysostom");
    const rubrics = rubricTexts(doc);
    expect(rubrics).not.toContain("The General Thanksgiving");
    expect(rubrics).not.toContain("A Prayer of St. Chrysostom");
  });

  test("headings keep their titles when rubrics are hidden", () => {
    const doc = composeOffice(
      { year: 2026, month: 11, day: 1 },
      "morning-rite-two",
      { ...DEFAULT_PREFS, showRubrics: false },
    );
    const headings = headingTexts(doc);
    expect(headings).toContain("The Collect of the Day");
    expect(headings).toContain("The General Thanksgiving");
    expect(headings).toContain("A Prayer of St. Chrysostom");
    expect(rubricTexts(doc)).toHaveLength(0);
  });

  test("Morning Prayer on an eve date stays an ordinary weekday", () => {
    const doc = composeOffice(
      { year: 2025, month: 10, day: 31 },
      "morning-rite-two",
    );
    expect(doc.entryTitle).toBeNull();
    expect(collectOf(doc)?.passage.title).not.toBe("All Saint's Day");
  });

  test("Morning Prayer keeps the current day", () => {
    const doc = composeOffice(
      { year: 2026, month: 7, day: 21 },
      "morning-rite-two",
    );
    expect(doc.entryTitle).toBeNull();
    // ordinary weekday entry, psalms of the day (not the holy day's):
    // Tuesday of Proper 11 appoints Psalm 45 in the morning.
    expect(psalmNumbers(doc)).toEqual([45]);
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
    // SAFETY: nodesOf filters by kind.
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
    // the seasonal heading is no longer printed; its first sentence is
    expect(textOf(doc)).toContain("Alleluia! Christ is risen.");
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
    // Wednesday of Proper 14 (week of Sunday August 9 2026)
    expect(collectOf(doc)?.passage.title).toBe("Proper 14");
    expect(psalmCitations(doc)).toEqual(["101", "109:1–4(5–19)20–30"]);
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

  test("all mission prayers and both thanksgiving prayers are shown", () => {
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
    ).toBe(true);
    expect(
      hasText(doc, "The grace of our Lord Jesus Christ, and the love of God"),
    ).toBe(true);
    expect(
      hasText(doc, "May the God of hope fill us with all joy and peace"),
    ).toBe(true);
    expect(hasText(doc, "Glory to God whose power, working in us")).toBe(true);
  });

  test("alternative lessons are hidden unless requested", () => {
    // Tuesday of Proper 20 (week of Sunday September 20 2026) carries an
    // alternate first lesson (Jdt)
    const date = { year: 2026, month: 9, day: 22 };
    const doc = composeOffice(date, "evening-rite-two");
    expect(lessonsOf(doc).map((l) => l.ref)).toEqual([
      "Esth 5:1–14",
      "Acts 18:12–28",
      "Luke 3:15–22",
    ]);
    const withAlt = composeOffice(date, "evening-rite-two", {
      ...DEFAULT_PREFS,
      showAlternates: true,
    });
    expect(lessonsOf(withAlt).map((l) => l.ref)).toEqual([
      "Esth 5:1–14",
      "Jdt 8:9–17; 9:1, 7–10",
      "Acts 18:12–28",
      "Luke 3:15–22",
    ]);
  });

  test("Compline trims its menus to the suggestions and prays one collect", () => {
    const doc = composeOffice({ year: 2026, month: 8, day: 14 }, "compline");
    // the suggested collect is the first printed one; the other three
    // collects and the Saturday collect stay in the menu
    expect(hasText(doc, "Be our light in the darkness, O Lord")).toBe(true);
    expect(hasText(doc, "Be present, O merciful God")).toBe(false);
    expect(hasText(doc, "Look down, O Lord, from your heavenly throne")).toBe(
      false,
    );
    expect(hasText(doc, "Visit this place, O Lord")).toBe(false);
    // the optional prayer keeps its printed first line
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

  test("readings and canticles interleave, two canticles for three readings", () => {
    const canticles = (doc: OfficeDocument) =>
      doc.sections
        .flatMap((s) => s.nodes)
        .flatMap((n) =>
          n.kind === "canticle" ? [n.passage?.number ?? null] : [],
        );
    const morning = composeOffice(
      { year: 2026, month: 8, day: 14 },
      "morning-rite-two",
    );
    // Friday morning: Canticle 10 after the first reading, 18 after the second
    expect(canticles(morning)).toEqual([10, 18]);
    const evening = composeOffice(
      { year: 2026, month: 8, day: 14 },
      "evening-rite-two",
    );
    // Friday evening: Canticle 13 then 17
    expect(canticles(evening)).toEqual([13, 17]);

    // the sequence in the lessons section is R1, C1, R2, C2, Gospel
    const kinds = section(morning, "lessons")?.nodes.map((n) => n.kind);
    expect(kinds).toContain("reading");
    expect(kinds).toContain("canticle");
    const order = (section(morning, "lessons")?.nodes ?? []).filter(
      (n) => n.kind === "reading" || n.kind === "canticle",
    );
    expect(order.map((n) => n.kind)).toEqual([
      "reading",
      "canticle",
      "reading",
      "canticle",
      "reading",
    ]);
  });

  test("canticles follow the p. 144 table for both rites", () => {
    const numbers = (doc: OfficeDocument) =>
      doc.sections
        .flatMap((s) => s.nodes)
        .flatMap((n) =>
          n.kind === "canticle" ? [n.passage?.number ?? null] : [],
        );
    const date = { year: 2026, month: 8, day: 14 };
    expect(numbers(composeOffice(date, "morning-rite-one"))).toEqual([10, 18]);
    expect(numbers(composeOffice(date, "evening-rite-one"))).toEqual([2, 5]);
    // an ordinary Sunday: 4/16 then 7/21 in Rite I / Rite II
    const sunday = { year: 2026, month: 8, day: 9 };
    expect(numbers(composeOffice(sunday, "morning-rite-one"))).toEqual([4, 7]);
    expect(numbers(composeOffice(sunday, "morning-rite-two"))).toEqual([
      16, 21,
    ]);
    // Advent Sunday morning takes 11 after the Old Testament reading
    const advent = { year: 2026, month: 11, day: 29 };
    expect(numbers(composeOffice(advent, "morning-rite-one"))).toEqual([11, 4]);
    expect(numbers(composeOffice(advent, "morning-rite-two"))).toEqual([
      11, 16,
    ]);
  });

  test("an explicit canticle choice overrides the table, null removes it", () => {
    const numbers = (doc: OfficeDocument) =>
      doc.sections
        .flatMap((s) => s.nodes)
        .flatMap((n) =>
          n.kind === "canticle" ? [n.passage?.number ?? null] : [],
        );
    const date = { year: 2026, month: 8, day: 14 };
    const picked = composeOffice(date, "morning-rite-two", {
      ...DEFAULT_PREFS,
      customization: { canticle1: 8, canticle2: null },
    });
    // the second slot still emits its None placeholder
    expect(numbers(picked)).toEqual([8, null]);
    const none = composeOffice(date, "morning-rite-two", {
      ...DEFAULT_PREFS,
      customization: { canticle1: null, canticle2: null },
    });
    expect(numbers(none)).toEqual([null, null]);
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

describe("composeOffice: inline choices", () => {
  const date = { year: 2026, month: 8, day: 14 };
  const advent = { year: 2026, month: 11, day: 29 };

  test("an opening sentence override replaces the seasonal pick", () => {
    const doc = composeOffice(advent, "morning-rite-two", {
      ...DEFAULT_PREFS,
      customization: {
        opening:
          "In the wilderness prepare the way of the Lord, make straight in the desert a highway for our God.",
      },
    });
    expect(
      hasText(
        doc,
        "In the wilderness prepare the way of the Lord, make straight in the desert a highway for our God.",
      ),
    ).toBe(true);
    expect(
      hasText(
        doc,
        "Watch, for you do not know when the master of the house will come",
      ),
    ).toBe(false);
  });

  test("the invitatory psalm can be swapped", () => {
    const doc = composeOffice(date, "morning-rite-two", {
      ...DEFAULT_PREFS,
      customization: { invitatory: "jubilate" },
    });
    expect(
      hasText(
        doc,
        "Be joyful in the Lord, all you lands; serve the Lord with gladness and come before his presence with song.",
      ),
    ).toBe(true);
    expect(
      hasText(
        doc,
        "Come let us sing to the Lord; let us shout for joy to the Rock of our salvation.",
      ),
    ).toBe(false);
  });

  test("the 30-day psalter replaces the office's appointed psalms", () => {
    const doc = composeOffice(date, "morning-rite-two", {
      ...DEFAULT_PREFS,
      customization: { psalmCycle: "psalter30" },
    });
    const portion = psalterDay(psalterDayForDate(date));
    const expected = (portion?.morning ?? []).flatMap((citation) => {
      const parsed = parsePsalmCitation(citation);
      return parsed ? [parsed.psalm] : [];
    });
    expect(expected.length).toBeGreaterThan(0);
    expect(psalmNumbers(doc)).toEqual(expected);
  });

  test("suffrages A and B swap, and B keeps the shared tail", () => {
    const morning = composeOffice(date, "morning-rite-two");
    expect(
      hasText(morning, "Save your people, Lord, and bless your inheritance;"),
    ).toBe(true);
    expect(hasText(morning, "Show us your mercy, O Lord;")).toBe(false);
    const a = composeOffice(date, "morning-rite-two", {
      ...DEFAULT_PREFS,
      customization: { suffrages: "a" },
    });
    expect(hasText(a, "Show us your mercy, O Lord;")).toBe(true);
    expect(
      hasText(a, "Save your people, Lord, and bless your inheritance;"),
    ).toBe(false);
    // the collect and prayer tail after Suffrages B still follows A
    expect(collectOf(a)?.passage.text).toBe(collectOf(morning)?.passage.text);
  });

  test("Full text prints the whole opening menu and both invitatories", () => {
    const doc = composeOffice(date, "morning-rite-two", {
      ...DEFAULT_PREFS,
      fullText: true,
    });
    expect(
      hasText(
        doc,
        "In the wilderness prepare the way of the Lord, make straight in the desert a highway for our God.",
      ),
    ).toBe(true);
    expect(
      hasText(
        doc,
        "Be joyful in the Lord, all you lands; serve the Lord with gladness and come before his presence with song.",
      ),
    ).toBe(true);
    expect(
      hasText(
        doc,
        "Come let us sing to the Lord; let us shout for joy to the Rock of our salvation.",
      ),
    ).toBe(true);
  });
});

describe("composeOffice: daily devotions", () => {
  const date = { year: 2026, month: 8, day: 21 };

  test("morning devotion composes the fixed service", () => {
    const doc = composeOffice(date, "devotions-morning");
    expect(doc.office).toBe("devotions-morning");
    expect(doc.officeName).toBe("Daily Devotion: In the Morning");
    expect(doc.rite).toBeNull();
    // devotions are independent of the lectionary
    expect(doc.entryTitle).toBeNull();
    // but its own psalm, reading, and collect are styled like office nodes
    expect(nodesOf(doc, "psalm")).toHaveLength(1);
    expect(psalmCitations(doc)).toEqual(["51"]);
    expect(nodesOf(doc, "lessons")).toHaveLength(1);
    expect(lessonRefsOf(doc)).toEqual(["1 Peter 1:3"]);
    expect(nodesOf(doc, "fixed-collect")).toHaveLength(1);
    expect(hasText(doc, "Open my lips, O Lord")).toBe(true);
    expect(hasText(doc, "Lord God, almighty and everlasting Father")).toBe(
      true,
    );
  });

  test("content is date-independent", () => {
    const a = composeOffice(
      { year: 2025, month: 12, day: 24 },
      "devotions-noon",
    );
    const b = composeOffice({ year: 2027, month: 4, day: 4 }, "devotions-noon");
    expect(a.sections).toEqual(b.sections);
  });

  test("the Noon 'or this' collect collapses to the first alternative", () => {
    const doc = composeOffice(date, "devotions-noon");
    expect(hasText(doc, "Blessed Savior, at this hour")).toBe(true);
    expect(hasText(doc, "my own peace I leave with you")).toBe(false);
  });

  test("personal mode strips speaker labels from the versicles", () => {
    const doc = composeOffice(date, "devotions-close", DEFAULT_PREFS);
    const speakers = doc.sections
      .flatMap((s) => s.nodes)
      .filter((n) => n.kind === "text" && n.speaker);
    expect(speakers).toHaveLength(0);

    const shared = composeOffice(date, "devotions-close", {
      ...DEFAULT_PREFS,
      personalMode: false,
    });
    const labeled = shared.sections
      .flatMap((s) => s.nodes)
      .filter((n) => n.kind === "text" && n.speaker === "all");
    expect(labeled.length).toBeGreaterThan(0);
  });

  test("each tab maps to its matching devotion", () => {
    const docs = [
      composeOffice(date, "devotions-morning"),
      composeOffice(date, "devotions-noon"),
      composeOffice(date, "devotions-evening"),
      composeOffice(date, "devotions-close"),
    ];
    expect(docs.map((d) => d.officeName)).toEqual([
      "Daily Devotion: In the Morning",
      "Daily Devotion: At Noon",
      "Daily Devotion: In the Early Evening",
      "Daily Devotion: At the Close of Day",
    ]);
    // every devotion ends with its collect (Close of Day adds the blessing)
    for (const doc of docs) {
      const texts = textOf(doc);
      expect(texts[texts.length - 1].endsWith("Amen."), doc.officeName).toBe(
        true,
      );
    }
  });
});

describe("composeOffice: precedence of Sundays and Holy Week", () => {
  function collectTitle(date: Parameters<typeof composeOffice>[0]): string {
    const doc = composeOffice(date, "morning-rite-two");
    const node = doc.sections
      .flatMap((s) => s.nodes)
      .find(
        (n): n is Extract<ComposedNode, { kind: "collect" }> =>
          n.kind === "collect",
      );
    return node?.passage.title ?? "";
  }

  test("a saint day falling on an ordinary Sunday yields to the Proper", () => {
    // St. Luke (Oct 18) falls on a Sunday in 2026.
    expect(collectTitle({ year: 2026, month: 10, day: 18 })).toBe("Proper 24");
  });

  test("feasts that outrank a Sunday keep their collect", () => {
    expect(collectTitle({ year: 2025, month: 2, day: 2 })).toBe(
      "The Presentation",
    );
    expect(collectTitle({ year: 2028, month: 8, day: 6 })).toBe(
      "The Transfiguration",
    );
    expect(collectTitle({ year: 2026, month: 11, day: 1 })).toBe(
      "All Saint's Day",
    );
  });

  test("a special day still outranks a coinciding holy day", () => {
    // Visitation (May 31) falls on Trinity Sunday in 2026.
    expect(collectTitle({ year: 2026, month: 5, day: 31 })).toBe(
      "First Sunday after Pentecost:  Trinity Sunday",
    );
  });

  test("fixed feasts are not observed in Holy Week", () => {
    // The Annunciation (Mar 25) falls on Maundy Thursday in 2027.
    expect(collectTitle({ year: 2027, month: 3, day: 25 })).toBe(
      "Maundy Thursday",
    );
  });
});

describe("composeOffice: Suffrages B closing menus", () => {
  const doc = composeOffice(
    { year: 2026, month: 8, day: 21 },
    "evening-rite-two",
  );

  function has(fragment: string): boolean {
    return textOf(doc).some((t) => t.includes(fragment));
  }

  test("the 'one or both' menu shows both thanksgiving prayers", () => {
    expect(has("Father of all mercies")).toBe(true);
    expect(has("grace at this time with one accord")).toBe(true);
  });

  test("all three concluding blessings are shown", () => {
    expect(has("grace of our Lord Jesus Christ")).toBe(true);
    expect(has("God of hope fill us")).toBe(true);
    expect(has("working in us, can do infinitely more")).toBe(true);
  });

  test("all mission prayers are shown", () => {
    expect(has("O God and Father of all, whom the whole heavens adore")).toBe(
      true,
    );
    expect(has("Keep watch, dear Lord, with those who work")).toBe(true);
  });
});

describe("composeOffice: Noonday and Compline menus", () => {
  const monday = { year: 2026, month: 8, day: 17 };

  test("the choices list every printed alternative", () => {
    const noonday = composeOffice(monday, "noonday").choices.menus;
    expect(noonday?.psalm?.options.map((o) => o.id)).toEqual([
      "suggested",
      "119",
      "121",
      "126",
    ]);
    expect(noonday?.reading?.options.map((o) => o.id)).toEqual([
      "suggested",
      "2 Corinthians 5:17-18",
      "Malachi 1:11",
    ]);
    expect(noonday?.collect?.options.map((o) => o.id)).toEqual([
      "suggested",
      "2",
      "3",
      "4",
      "day",
    ]);
    const compline = composeOffice(monday, "compline").choices.menus;
    expect(compline?.psalm?.options.map((o) => o.id)).toEqual([
      "suggested",
      "4",
      "31",
      "91",
      "134",
    ]);
    expect(compline?.reading?.options.map((o) => o.id)).toEqual([
      "suggested",
      "Matthew 11:28-30",
      "Hebrews 13:20-21",
      "1 Peter 5:8-9a",
    ]);
    expect(compline?.collect?.options.map((o) => o.id)).toEqual([
      "suggested",
      "2",
      "3",
      "4",
      "A Collect for Saturdays",
    ]);
  });

  test("Noonday follows the printed suggestions", () => {
    const doc = composeOffice(monday, "noonday");
    expect(psalmCitations(doc)).toEqual(["119", "121", "126"]);
    expect(
      hasText(doc, "The love of God has been poured into our hearts"),
    ).toBe(true);
    expect(hasText(doc, "If anyone is in Christ")).toBe(false);
    expect(hasText(doc, "Heavenly Father, send your Holy Spirit")).toBe(true);
    expect(hasText(doc, "Blessed Savior, at this hour")).toBe(false);
  });

  test("Compline follows the printed suggestions", () => {
    const doc = composeOffice(monday, "compline");
    expect(psalmCitations(doc)).toEqual(["4", "31", "91", "134"]);
    expect(hasText(doc, "Lord, you are in the midst of us")).toBe(true);
    expect(hasText(doc, "Come to me, all who labor")).toBe(false);
    expect(hasText(doc, "Be our light in the darkness, O Lord")).toBe(true);
    expect(hasText(doc, "We give thanks, O God, for revealing")).toBe(false);
  });

  test("the picked reading carries its printed citation", () => {
    const doc = composeOffice(monday, "noonday", {
      ...DEFAULT_PREFS,
      customization: { readingMenu: "Malachi 1:11" },
    });
    // SAFETY: nodesOf filters by kind, so every element is a text node
    const rows = nodesOf(doc, "text") as Extract<
      ComposedNode,
      { kind: "text" }
    >[];
    const cited = rows.filter((r) => r.citation);
    expect(cited.map((r) => r.citation)).toEqual(["Malachi 1:11"]);
    expect(cited[0]?.text.startsWith("From the rising of the sun")).toBe(true);
    // the people's response names no citation
    expect(
      rows.find((r) => r.text === "Thanks be to God.")?.citation,
    ).toBeUndefined();
  });

  test("full text prints a citation under every passage", () => {
    const doc = composeOffice(monday, "compline", {
      ...DEFAULT_PREFS,
      fullText: true,
    });
    // SAFETY: nodesOf filters by kind, so every element is a text node
    const rows = nodesOf(doc, "text") as Extract<
      ComposedNode,
      { kind: "text" }
    >[];
    expect(rows.flatMap((r) => (r.citation ? [r.citation] : []))).toEqual([
      "Jeremiah 14:9,22",
      "Matthew 11:28-30",
      "Hebrews 13:20-21",
      "1 Peter 5:8-9a",
    ]);
  });

  test("a picked psalm prays alone", () => {
    const doc = composeOffice(monday, "noonday", {
      ...DEFAULT_PREFS,
      customization: { psalmMenu: "126" },
    });
    expect(psalmCitations(doc)).toEqual(["126"]);
  });

  test("a picked reading and collect replace the suggestions", () => {
    const doc = composeOffice(monday, "compline", {
      ...DEFAULT_PREFS,
      customization: { readingMenu: "1 Peter 5:8-9a", psalmMenu: "91" },
    });
    expect(psalmCitations(doc)).toEqual(["91"]);
    expect(hasText(doc, "Be sober, be watchful")).toBe(true);
    expect(hasText(doc, "Come to me, all who labor")).toBe(false);
    const collect = composeOffice(monday, "noonday", {
      ...DEFAULT_PREFS,
      customization: { collectMenu: "3" },
    });
    expect(hasText(collect, "Almighty Savior, who at noonday")).toBe(true);
    expect(hasText(collect, "Heavenly Father, send your Holy Spirit")).toBe(
      false,
    );
  });

  test("the Saturday collect is a plain alternative with its title", () => {
    const doc = composeOffice({ year: 2026, month: 8, day: 15 }, "compline", {
      ...DEFAULT_PREFS,
      customization: { collectMenu: "A Collect for Saturdays" },
    });
    // the title rides on the collect block, in the heading voice
    // SAFETY: nodesOf filters by kind, so every element is a fixed-collect
    const blocks = nodesOf(doc, "fixed-collect") as Extract<
      ComposedNode,
      { kind: "fixed-collect" }
    >[];
    expect(blocks.map((b) => b.title)).toContain("A Collect for Saturdays");
    expect(hasText(doc, "We give thanks, O God, for revealing")).toBe(true);
    expect(hasText(doc, "Be our light in the darkness")).toBe(false);
  });

  test("Noonday may use the Collect of the Day", () => {
    // Holy Cross Day, Monday Sep 14 2026
    const doc = composeOffice({ year: 2026, month: 9, day: 14 }, "noonday", {
      ...DEFAULT_PREFS,
      customization: { collectMenu: "day" },
    });
    expect(headingTexts(doc)).toContain("The Collect of the Day");
    expect(collectOf(doc)?.passage.title).toBe("Holy Cross Day");
    expect(collectOf(doc)?.slug).toBe("holy-cross");
    expect(hasText(doc, "Heavenly Father, send your Holy Spirit")).toBe(false);
  });

  test("stale stored ids degrade to the printed default", () => {
    const doc = composeOffice(monday, "noonday", {
      ...DEFAULT_PREFS,
      customization: { psalmMenu: "999", collectMenu: "999" },
    });
    expect(psalmCitations(doc)).toEqual(["119", "121", "126"]);
    expect(hasText(doc, "Heavenly Father, send your Holy Spirit")).toBe(true);
  });

  test("full text prints the whole page and ignores the picks", () => {
    const doc = composeOffice(monday, "compline", {
      ...DEFAULT_PREFS,
      fullText: true,
      customization: { psalmMenu: "4", collectMenu: "A Collect for Saturdays" },
    });
    expect(psalmCitations(doc)).toEqual(["4", "31", "91", "134"]);
    // every reading and every collect, as the book prints them
    expect(hasText(doc, "Come to me, all who labor")).toBe(true);
    expect(hasText(doc, "Be present, O merciful God")).toBe(true);
    expect(hasText(doc, "We give thanks, O God, for revealing")).toBe(true);
    // no picker nodes, and a stored Collect-of-the-Day pick does not run
    expect(nodesOf(doc, "menu")).toHaveLength(0);
    expect(collectOf(doc)).toBeUndefined();
  });
});
