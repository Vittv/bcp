import { describe, expect, test } from "bun:test";
import {
  collectExists,
  collectPassage,
  collectSections,
  collectsBySection,
  collectText,
  counterpartCollect,
} from "../collects";

const NATIVITY = "The Nativity of Our Lord:  Christmas Day";

describe("collects", () => {
  test("every section of both rites is present", () => {
    for (const rite of ["traditional", "contemporary"] as const) {
      expect(collectSections(rite)).toEqual([
        "church-year",
        "holy-days",
        "common-of-saints",
        "various-occasions",
      ]);
    }
  });

  test("per-rite totals match the printed 142 collects", () => {
    for (const rite of ["traditional", "contemporary"] as const) {
      const total = collectSections(rite).reduce(
        (n, section) => n + collectsBySection(rite, section).length,
        0,
      );
      expect(total).toBe(142);
    }
  });

  test("section sizes are stable", () => {
    expect(collectsBySection("traditional", "church-year")).toHaveLength(76);
    expect(collectsBySection("traditional", "holy-days")).toHaveLength(31);
    expect(collectsBySection("traditional", "common-of-saints")).toHaveLength(
      6,
    );
    expect(collectsBySection("traditional", "various-occasions")).toHaveLength(
      29,
    );
  });

  test("Advent collect resolves", () => {
    const text = collectText(
      "traditional",
      "church-year",
      "First Sunday of Advent",
    );
    expect(text).toContain("cast away the works of darkness");
    expect(text).toContain("armor of light");
  });

  test("Maundy Thursday carries the printed doxology", () => {
    const text = collectText("traditional", "church-year", "Maundy Thursday");
    expect(text).toContain("with thee and the Holy Spirit ever, one God");
    expect(text).toEndWith("world without end. Amen.");
  });

  test("double-space titles resolve", () => {
    expect(collectText("traditional", "church-year", NATIVITY)).toStartWith(
      "O God, who makest us glad with the yearly remembrance",
    );
  });

  test("inserted collects are present", () => {
    expect(collectText("contemporary", "holy-days", "Saint Andrew")).toContain(
      "called by your Holy Word",
    );
    expect(
      collectText("traditional", "common-of-saints", "Of a Martyr"),
    ).toStartWith("O Almighty God, who didst give to thy servant N.");
  });

  test("apostrophe titles resolve", () => {
    expect(
      collectText("contemporary", "holy-days", "All Saint's Day"),
    ).toContain("you have knit together your elect");
  });

  test("line-break artifacts are resolved", () => {
    const text = collectText(
      "contemporary",
      "various-occasions",
      "22. For Social Service",
    );
    expect(text).toContain(
      "the friendless, and the needy; for the love of him",
    );
    expect(text).not.toContain("needy-");
  });

  test("collectPassage returns a renderable shape", () => {
    const passage = collectPassage("traditional", "holy-days", "Saint Andrew");
    expect(passage).toEqual({
      rite: "traditional",
      section: "holy-days",
      title: "Saint Andrew",
      text: expect.stringContaining("obeyed the call"),
      notes: null,
    });
  });

  test("unknown collects yield undefined", () => {
    expect(collectExists("traditional", "church-year", "Not a Collect")).toBe(
      false,
    );
    expect(
      collectText("contemporary", "holy-days", "Saint Nobody"),
    ).toBeUndefined();
    expect(
      collectPassage("traditional", "various-occasions", "99. Nope"),
    ).toBeUndefined();
  });
});

describe("counterpartCollect", () => {
  test("pairs across rites by the same title", () => {
    const other = counterpartCollect(
      "traditional",
      "holy-days",
      "Saint Andrew",
    );
    expect(other?.rite).toBe("contemporary");
    expect(other?.title).toBe("Saint Andrew");
    expect(other?.text.length).toBeGreaterThan(0);
  });

  test("every collect in both rites has an exact-title counterpart", () => {
    for (const section of collectSections("traditional")) {
      for (const c of collectsBySection("traditional", section)) {
        const other = counterpartCollect("traditional", section, c.title);
        expect(other?.title ?? `${section}:${c.title} missing`).toBe(c.title);
      }
      for (const c of collectsBySection("contemporary", section)) {
        const other = counterpartCollect("contemporary", section, c.title);
        expect(other?.title ?? `${section}:${c.title} missing`).toBe(c.title);
      }
    }
  });

  test("unknown references yield null", () => {
    expect(
      counterpartCollect("traditional", "church-year", "Not a Collect"),
    ).toBeNull();
  });
});
