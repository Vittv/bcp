import { describe, expect, test } from "bun:test";
import {
  office,
  officeExists,
  officeList,
  officeSection,
  officeSections,
} from "../offices";
import type { OfficeItem, OfficeSectionKey } from "../types";

type TextItem = Extract<OfficeItem, { kind: "text" }>;

const OFFICE_IDS = [
  "morning-rite-one",
  "morning-rite-two",
  "evening-rite-one",
  "evening-rite-two",
  "noonday",
  "owe",
  "compline",
] as const;

describe("offices", () => {
  test("all seven offices are present in printed order", () => {
    expect(officeList().map((o) => o.id)).toEqual([...OFFICE_IDS]);
  });

  test("names and rites match the book", () => {
    expect(office("morning-rite-one")?.name).toBe("Daily Morning Prayer");
    expect(office("morning-rite-one")?.rite).toBe("One");
    expect(office("morning-rite-two")?.rite).toBe("Two");
    expect(office("evening-rite-two")?.name).toBe("Daily Evening Prayer");
    expect(office("noonday")?.name).toBe("An Order of Service for Noonday");
    expect(office("owe")?.name).toBe("An Order of Worship for the Evening");
    expect(office("compline")?.name).toBe("An Order for Compline");
    expect(office("noonday")?.rite).toBeUndefined();
  });

  test("section layout is stable", () => {
    const nine = [
      "opening",
      "confession",
      "invitatory",
      "psalms",
      "lessons",
      "creed",
      "prayers",
      "suffrages-a",
      "suffrages-b",
    ] satisfies OfficeSectionKey[];
    for (const id of [
      "morning-rite-one",
      "evening-rite-one",
      "morning-rite-two",
      "evening-rite-two",
    ] as const) {
      expect(officeSections(id).map((s) => s.key)).toEqual(nine);
    }
    expect(officeSections("noonday").map((s) => s.key)).toEqual(["opening"]);
    expect(officeSections("compline").map((s) => s.key)).toEqual(["opening"]);
    expect(officeSections("owe").map((s) => s.key)).toEqual([
      "opening",
      "selection-from-the-psalter",
      "bible-reading",
      "canticle",
      "prayers",
      "blessing-or-dismissal",
    ]);
  });

  test("per-office item counts are stable", () => {
    const counts: Record<(typeof OFFICE_IDS)[number], number> = {
      "morning-rite-one": 294,
      "evening-rite-one": 143,
      "morning-rite-two": 365,
      noonday: 68,
      owe: 71,
      "evening-rite-two": 150,
      compline: 116,
    };
    for (const id of OFFICE_IDS) {
      const total = officeSections(id).reduce((n, s) => n + s.items.length, 0);
      expect(total, id).toBe(counts[id]);
    }
  });

  test("the opening moves of Rite One morning parse with speakers", () => {
    const items = officeSection("morning-rite-one", "opening")?.items ?? [];
    expect(items[0]).toEqual({
      kind: "rubric",
      text: 'The Officiant begins the service with one or more of these sentences of Scripture, or with the versicle "O Lord, open thou our lips" on page 42.',
    });
    const advent = items.find(
      (i) => i.kind === "season" && i.text === "Advent",
    );
    expect(advent).toBeDefined();
    const watch = items.find((i) => i.text.startsWith("Watch ye,"));
    expect(watch).toMatchObject({
      kind: "text",
      citation: "Mark 13:35, 36",
    });
    expect(watch && "speaker" in watch).toBe(false);
  });

  test("Suffrages A alternate speakers", () => {
    const items = officeSection("morning-rite-one", "suffrages-a")?.items ?? [];
    expect(items.slice(0, 4)).toEqual([
      {
        kind: "text",
        text: "O Lord, show thy mercy upon us;",
        speaker: "officiant",
      },
      {
        kind: "text",
        text: "And grant us thy salvation.",
        speaker: "people",
      },
      {
        kind: "text",
        text: "Endue thy ministers with righteousness;",
        speaker: "officiant",
      },
      {
        kind: "text",
        text: "And make thy chosen people joyful.",
        speaker: "people",
      },
    ]);
  });

  test("the Creed and Confession are attributed to all", () => {
    const creed = officeSection("morning-rite-two", "creed")?.items.find(
      (i): i is TextItem =>
        i.kind === "text" && i.text.startsWith("I believe in God, the Father"),
    );
    expect(creed?.speaker).toBe("all");
    const confession = officeSection(
      "morning-rite-two",
      "confession",
    )?.items.find(
      (i): i is TextItem =>
        i.kind === "text" && i.text.startsWith("Most merciful God"),
    );
    expect(confession?.speaker).toBe("all");
  });

  test("embedded canticle headings carry book titles and latin", () => {
    const lessons1 = officeSection("morning-rite-one", "lessons")?.items ?? [];
    const first = lessons1.find((i) => i.kind === "heading");
    expect(first).toEqual({
      kind: "heading",
      text: "1 A Song of Creation Benedicite, omnia opera Domini",
      citation: "Song of the Three Young Men, 35-65",
    });
    const lessons2 = officeSection("morning-rite-two", "lessons")?.items ?? [];
    const praise = lessons2.find(
      (i) => i.kind === "heading" && i.text.startsWith("13 "),
    );
    expect(praise?.text).toBe("13 A Song of Praise Benedictus es, Domine");
    const zech = lessons2.find(
      (i): i is Extract<OfficeItem, { kind: "heading" }> =>
        i.kind === "heading" && i.text.startsWith("16 "),
    );
    expect(zech?.citation).toBe("Luke 1:68-79");
    const dox = lessons2.find(
      (i) => i.kind === "heading" && i.text.startsWith("6 "),
    );
    expect(dox).toBeUndefined();
  });

  test("the Lord's Prayer doxology follows only the daily offices", () => {
    for (const id of [
      "morning-rite-one",
      "evening-rite-one",
      "morning-rite-two",
      "evening-rite-two",
    ] as const) {
      const has = officeSections(id).some((s) =>
        s.items.some(
          (i) =>
            i.kind === "text" && i.text.startsWith("For thine is the kingdom"),
        ),
      );
      expect(has, id).toBe(true);
    }
    for (const id of ["noonday", "compline", "owe"] as const) {
      const has = officeSections(id).some((s) =>
        s.items.some(
          (i) =>
            i.kind === "text" && i.text.startsWith("For thine is the kingdom"),
        ),
      );
      expect(has, id).toBe(false);
    }
  });

  test("OWE alleluia response is a people text", () => {
    const owes = officeSections("owe")
      .flatMap((s) => s.items)
      .filter(
        (i): i is TextItem =>
          i.kind === "text" &&
          i.text === "Thanks be to God. Alleluia, alleluia.",
      );
    expect(owes.length).toBeGreaterThan(0);
    expect(owes[0]?.speaker).toBe("people");
  });

  test("transcription fixes are applied", () => {
    const all = Object.values(officeList()).flatMap((o) =>
      o.sections.flatMap((s) => s.items),
    );
    const texts = all.filter((i) => i.kind === "text").map((i) => i.text);
    const joined = texts.join(" ");
    expect(joined).toContain("forgive us our trespasses");
    expect(joined).not.toContain("tresspasses");
    expect(joined).toContain("men and women");
    expect(joined).toContain("the Pleiades and Orion");
    expect(joined).toContain("fulfill your statutes");
    expect(joined).toContain("Almighty God");
  });

  test("unknown offices yield undefined", () => {
    expect(officeExists("morning-rite-one")).toBe(true);
    expect(
      // @ts-expect-error - deliberately not an OfficeId
      officeExists("nones"),
    ).toBe(false);
    // @ts-expect-error - deliberately not an OfficeId
    expect(office("lauds")).toBeUndefined();
    // @ts-expect-error - deliberately not an OfficeId
    expect(officeSections("sext")).toEqual([]);
  });
});
