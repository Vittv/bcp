import { describe, expect, it } from "bun:test";
import {
  collectsForEdition,
  editionCollectPassage,
  firstCollectForEdition,
  searchEditionCollects,
} from "../collectsEdition";

describe("older-edition collects", () => {
  it("maps the 1662 and 1962 corpora onto the reference page sections", () => {
    expect(collectsForEdition("1662").length).toBe(99);
    expect(collectsForEdition("1962").length).toBe(107);
    for (const edition of ["1662", "1962"] as const) {
      const all = collectsForEdition(edition);
      expect(all.every((c) => c.title.length > 0 && c.text.length > 0)).toBe(
        true,
      );
      const first = firstCollectForEdition(edition);
      expect(
        editionCollectPassage(edition, first.section, first.title),
      ).toEqual(all[0]);
    }
  });

  it("keeps 1962 Canadian votive collects in the various-occasions section", () => {
    const hits = searchEditionCollects("1962", "For Peace in the World");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].title).toBe("For Peace in the World");
    expect(hits[0].section).toBe("various-occasions");
  });

  it("title-cases the printed 1962 headings without changing the other editions", () => {
    const titles = collectsForEdition("1962").map((c) => c.title);
    expect(titles.every((t) => t !== t.toUpperCase())).toBe(true);
    expect(titles).toContain("The Twenty-fourth Sunday after Trinity");
    expect(titles).toContain("Of the Church Overseas.");
    expect(titles).toContain("The Fruits of the Earth and the Labours of Men.");
    expect(collectsForEdition("1662")[0].title).toBe("First Sunday in Advent");
  });

  it("does not leak one edition's collects into another", () => {
    expect(
      editionCollectPassage(
        "1962",
        "various-occasions",
        "For Peace in the World",
      ),
    ).toBeDefined();
    expect(
      editionCollectPassage(
        "1662",
        "various-occasions",
        "For Peace in the World",
      ),
    ).toBeUndefined();
  });
});
