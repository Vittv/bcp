import { describe, expect, test } from "bun:test";
import { searchCollects, searchPsalms } from "../search";

describe("searchPsalms", () => {
  test("empty query lists every psalm without snippets", () => {
    const hits = searchPsalms("");
    expect(hits).toHaveLength(150);
    expect(hits[0]).toEqual({
      psalm: 1,
      incipit: hits[0].incipit,
      verses: hits[0].verses,
      snippet: null,
    });
    expect(hits[0].incipit.length).toBeGreaterThan(0);
    expect(hits[0].verses).toBe(6);
    const ps119 = searchPsalms("").find((h) => h.psalm === 119);
    expect(ps119?.verses).toBe(176);
  });

  test("matches by verse text, case-insensitively", () => {
    const hits = searchPsalms("shepherd");
    const numbers = hits.map((h) => h.psalm);
    expect(numbers).toContain(23);
    const psalm23 = hits.find((h) => h.psalm === 23);
    expect(psalm23?.snippet?.toLowerCase()).toContain("shepherd");
  });

  test("matching query case does not affect results", () => {
    expect(searchPsalms("SHEPHERD").map((h) => h.psalm)).toEqual(
      searchPsalms("shepherd").map((h) => h.psalm),
    );
  });

  test("matches by number", () => {
    const hits = searchPsalms("119");
    expect(hits.some((h) => h.psalm === 119)).toBe(true);
    // number matches carry no snippet
    expect(hits.find((h) => h.psalm === 119)?.snippet).toBeNull();
  });

  test("parses a leading psalm/ps prefix as an exact number", () => {
    for (const q of ["Psalm 20", "psalm 20", "Ps 20", "ps 20", "Psalms 20"]) {
      const hits = searchPsalms(q);
      expect(hits).toHaveLength(1);
      expect(hits[0].psalm).toBe(20);
    }
  });

  test("unknown text yields no results", () => {
    expect(searchPsalms("xyzzyplugh")).toHaveLength(0);
  });

  test("snippet is excerpted around the match", () => {
    const hits = searchPsalms("merciful");
    for (const hit of hits) {
      if (hit.snippet) {
        expect(hit.snippet.toLowerCase()).toContain("merciful");
      }
    }
  });
});

describe("searchCollects", () => {
  test("empty query lists every collect exactly once, in printed order", () => {
    const hits = searchCollects("");
    expect(hits).toHaveLength(142);
    // sections appear in printed order; rites are no longer separate
    // rows since both variants share a title and render together
    expect([...new Set(hits.map((h) => h.section))]).toEqual([
      "church-year",
      "holy-days",
      "common-of-saints",
      "various-occasions",
    ]);
    expect(new Set(hits.map((h) => `${h.section}:${h.title}`)).size).toBe(142);
  });

  test("matches by title", () => {
    const hits = searchCollects("for peace");
    expect(hits.some((h) => h.title.includes("Peace"))).toBe(true);
  });

  test("matches traditional text", () => {
    const hits = searchCollects("cast away the works of darkness");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].snippet?.toLowerCase()).toContain(
      "cast away the works of darkness",
    );
  });

  test("matches contemporary-only phrasing too", () => {
    // "armor of light" appears only in the contemporary Advent collect
    const hits = searchCollects("armor of light");
    expect(hits.some((h) => h.title.includes("Advent"))).toBe(true);
  });

  test("unknown text yields no results", () => {
    expect(searchCollects("xyzzyplugh")).toHaveLength(0);
  });
});
