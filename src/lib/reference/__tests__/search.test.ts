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
  test("empty query lists collects in printed order across both rites", () => {
    const hits = searchCollects("");
    expect(hits.length).toBeGreaterThan(50);
    const firstContemporary = hits.findIndex((h) => h.rite === "contemporary");
    expect(firstContemporary).toBeGreaterThan(0);
    // traditional collects all precede contemporary ones
    expect(
      hits.slice(firstContemporary).every((h) => h.rite === "contemporary"),
    ).toBe(true);
  });

  test("matches by title", () => {
    const hits = searchCollects("for peace");
    expect(hits.some((h) => h.title.includes("Peace"))).toBe(true);
  });

  test("matches by collect text", () => {
    const hits = searchCollects("cast away the works of darkness");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].snippet?.toLowerCase()).toContain(
      "cast away the works of darkness",
    );
  });

  test("unknown text yields no results", () => {
    expect(searchCollects("xyzzyplugh")).toHaveLength(0);
  });
});
