import { describe, expect, test } from "bun:test";
import {
  searchCollects,
  searchPalette,
  searchPsalms,
  searchSaints,
} from "../search";

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

describe("searchSaints", () => {
  test("empty query lists all 36 entries in calendar order", () => {
    const hits = searchSaints("");
    expect(hits).toHaveLength(36);
    expect(hits[0].slug).toBe("confession-of-st-peter"); // Jan 18
    expect(hits[0].snippet).toBeNull();
    expect(hits.find((h) => h.slug === "eve-of-all-saints")?.title).toBe(
      "Eve of All Saints",
    );
  });

  test("matches by proper title case-insensitively", () => {
    const hits = searchSaints("transfiguration");
    expect(hits).toHaveLength(2);
    expect(hits.map((h) => h.slug).sort()).toEqual([
      "eve-of-transfiguration",
      "transfiguration",
    ]);
  });

  test("matches by saint-name variant", () => {
    const hits = searchSaints("saint james");
    const slugs = new Set(hits.map((h) => h.slug));
    expect(slugs).toEqual(
      new Set(["st-james", "st-james-of-jerusalem", "philip-and-james"]),
    );
  });

  test("eve entries are searchable and carry eveOf", () => {
    const eve = searchSaints("eve of all saints")[0];
    expect(eve?.slug).toBe("eve-of-all-saints");
    expect(eve?.eveOf).toBe("all-saints");
  });

  test("unknown text yields no results", () => {
    expect(searchSaints("xyzzyplugh")).toHaveLength(0);
  });
});

describe("searchPalette", () => {
  test("empty or blank query is intentionally empty", () => {
    for (const q of ["", "   "]) {
      expect(searchPalette(q)).toEqual([]);
    }
  });

  test("matches psalms by number and by verse text", () => {
    const byNum = searchPalette("119");
    expect(
      byNum.some(
        (e) =>
          e.section === "psalms" &&
          e.run.kind === "psalm" &&
          e.run.psalm === 119,
      ),
    ).toBe(true);

    const byText = searchPalette("shepherd");
    expect(
      byText.some(
        (e) =>
          e.section === "psalms" &&
          e.run.kind === "psalm" &&
          e.run.psalm === 23,
      ),
    ).toBe(true);
    expect(byText[0].section).toBe("psalms");
  });

  test("lists proverbs chapters for a plain chapter number", () => {
    const hits = searchPalette("prov 3");
    const prov = hits.filter((e) => e.section === "proverbs");
    expect(prov.length).toBeGreaterThan(0);
    expect(prov.every((e) => e.run.kind === "proverb")).toBe(true);
    expect(
      prov.some((e) => e.run.kind === "proverb" && e.run.chapter === 3),
    ).toBe(true);
  });

  test("matches a canticle by title", () => {
    const hits = searchPalette("mary");
    const cants = hits.filter((e) => e.section === "canticles");
    expect(cants.some((e) => e.run.kind === "canticle")).toBe(true);
    expect(cants[0]?.label).toContain("Mary");
  });

  test("matches collects by title and by text", () => {
    const byTitle = searchPalette("for peace").filter(
      (e) => e.section === "collects",
    );
    expect(byTitle.some((e) => e.label.includes("Peace"))).toBe(true);

    const byText = searchPalette("cast away the works of darkness").filter(
      (e) => e.section === "collects",
    );
    expect(byText.length).toBeGreaterThan(0);
  });

  test("matches a saint by name variant", () => {
    const slugs = searchPalette("saint james").reduce<string[]>((acc, e) => {
      if (e.run.kind === "saint") acc.push(e.run.slug);
      return acc;
    }, []);
    expect(new Set(slugs)).toEqual(
      new Set(["philip-and-james", "st-james", "st-james-of-jerusalem"]),
    );
  });

  test("matches bible books by name and abbreviation", () => {
    const gen = searchPalette("gen").filter((e) => e.section === "bible");
    expect(gen.some((e) => e.label === "Genesis")).toBe(true);

    const byName = searchPalette("john").filter((e) => e.section === "bible");
    expect(byName.some((e) => e.label === "John")).toBe(true);
  });

  test("no results for unknown text", () => {
    expect(searchPalette("xyzzyplugh")).toEqual([]);
  });

  test("every section is reachable through its own vocabulary", () => {
    const probes: [string, string][] = [
      ["psalms", "shepherd"],
      ["proverbs", "prov"],
      ["canticles", "mary"],
      ["collects", "peace"],
      ["saints", "james"],
      ["bible", "gen"],
    ];
    for (const [section, query] of probes) {
      const hits = searchPalette(query).filter((e) => e.section === section);
      expect(hits.length).toBeGreaterThan(0);
    }
  });

  test("a bare section name expands to its full listing", () => {
    const psalms = searchPalette("psalm");
    expect(psalms).toHaveLength(150);
    expect(psalms.every((e) => e.section === "psalms")).toBe(true);
    expect(psalms[0].run.kind).toBe("psalm");
    const first = psalms[0].run;
    if (first.kind === "psalm") expect(first.psalm).toBe(1);
    const last = psalms[149].run;
    expect(last.kind).toBe("psalm");
    if (last.kind === "psalm") expect(last.psalm).toBe(150);

    const plural = searchPalette("PSALMS");
    expect(plural.map((e) => e.label)).toEqual(psalms.map((e) => e.label));

    expect(searchPalette("collects")).toHaveLength(142);
    expect(searchPalette("saints")).toHaveLength(36);
    expect(searchPalette("proverbs")).toHaveLength(31);
  });

  test("bible expands to every chapter, restricable to a testament", () => {
    const bible = searchPalette("bible");
    expect(bible.length).toBe(1189);
    expect(bible[0]).toMatchObject({
      section: "bible",
      label: "Genesis 1",
      run: { kind: "bible", book: "Gen", chapter: 1 },
    });

    const nt = searchPalette("new testament");
    expect(nt.length).toBe(260);
    expect(nt.every((e) => e.run.kind === "bible")).toBe(true);
    expect(nt.at(-1)).toMatchObject({ label: "Revelation 22" });

    const ot = searchPalette("old testament");
    expect(ot.length).toBe(929);
  });

  test("expansion keywords do not swallow specific queries", () => {
    // "psalm 20" stays an exact psalms match, not a 150-row dump
    const psalm20 = searchPalette("psalm 20");
    expect(
      psalm20.some((e) => e.run.kind === "psalm" && e.run.psalm === 20),
    ).toBe(true);
    expect(psalm20.length).toBeLessThan(150);

    // "prov 3" lists chapter 3, not all 31
    const prov3 = searchPalette("prov 3");
    expect(
      prov3.some((e) => e.run.kind === "proverb" && e.run.chapter === 3),
    ).toBe(true);
    expect(prov3.length).toBeLessThan(31);
  });
});
