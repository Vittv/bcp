import { describe, expect, test } from "bun:test";
import { collectPassage } from "../../content/collects";
import { entryForEvening } from "../../content/lectionary";
import { holyDayCollectTitle } from "../../office/compose";
import { resolve } from "../dol";
import {
  eveForDate,
  SANCTORALE_ENTRIES,
  SANCTORALE_SLUGS,
  sanctoraleBySlug,
  sanctoraleDateLabel,
  sanctoraleForDate,
  sanctoraleNameVariants,
  sanctoraleTitle,
  tokenizeSanctoraleMentions,
  validateSanctorale,
} from "../sanctorale";

const FEASTS = SANCTORALE_ENTRIES.filter((e) => e.eveOf === undefined);
const EVES = SANCTORALE_ENTRIES.filter((e) => e.eveOf !== undefined);

describe("sanctorale table", () => {
  test("36 entries: 29 feasts and 7 eves", () => {
    expect(SANCTORALE_ENTRIES).toHaveLength(36);
    expect(FEASTS).toHaveLength(29);
    expect(EVES).toHaveLength(7);
  });

  test("validator stays clean", () => {
    expect(validateSanctorale()).toEqual([]);
  });

  test("every feast has a bio (even the eves anticipate a life)", () => {
    for (const entry of SANCTORALE_ENTRIES) {
      expect(entry.bio, `${entry.slug} is missing a bio`).toBeTruthy();
    }
  });

  test("every slug has a unique title and sorted dates", () => {
    const titles = new Set(SANCTORALE_ENTRIES.map((e) => e.title));
    expect(titles.size).toBe(SANCTORALE_ENTRIES.length);
    for (let i = 1; i < SANCTORALE_ENTRIES.length; i++) {
      const prev = SANCTORALE_ENTRIES[i - 1];
      const cur = SANCTORALE_ENTRIES[i];
      const prevAt = prev.month * 31 + prev.day;
      const curAt = cur.month * 31 + cur.day;
      expect(curAt).toBeGreaterThan(prevAt);
    }
  });

  test("SLUGS match ENTRIES 1:1", () => {
    expect(SANCTORALE_SLUGS).toHaveLength(SANCTORALE_ENTRIES.length);
    for (const e of SANCTORALE_ENTRIES) {
      expect(sanctoraleBySlug(e.slug)).toBe(e);
      expect(sanctoraleTitle(e.slug)).toBe(e.title);
    }
  });

  test("the 7 eves each anticipate the following day's feast", () => {
    const dates = new Map(EVES.map((e) => [`${e.month}-${e.day}`, e]));
    expect(dates.get("2-1")?.eveOf).toBe("presentation");
    expect(dates.get("3-24")?.eveOf).toBe("annunciation");
    expect(dates.get("5-30")?.eveOf).toBe("visitation");
    expect(dates.get("6-23")?.eveOf).toBe("nativity-of-st-john-the-baptist");
    expect(dates.get("8-5")?.eveOf).toBe("transfiguration");
    expect(dates.get("9-13")?.eveOf).toBe("holy-cross");
    expect(dates.get("10-31")?.eveOf).toBe("all-saints");
  });
});

describe("date resolution", () => {
  test("sanctoraleForDate finds every feast", () => {
    for (const feast of FEASTS) {
      const entry = sanctoraleForDate({
        year: 2026,
        month: feast.month,
        day: feast.day,
      });
      expect(entry?.slug).toBe(feast.slug);
    }
  });

  test("sanctoraleForDate is empty on eve dates and plain weekdays", () => {
    expect(sanctoraleForDate({ year: 2026, month: 2, day: 1 })).toBeUndefined();
    expect(sanctoraleForDate({ year: 2026, month: 7, day: 4 })).toBeUndefined();
  });

  test("eveForDate finds the 7 eves only", () => {
    for (const eve of EVES) {
      expect(
        eveForDate({ year: 2026, month: eve.month, day: eve.day })?.slug,
      ).toBe(eve.slug);
    }
    expect(eveForDate({ year: 2026, month: 2, day: 2 })).toBeUndefined();
    expect(eveForDate({ year: 2026, month: 11, day: 1 })).toBeUndefined();
  });
});

describe("resolve() sanctorale wiring", () => {
  test("feasts set slot.holyDay with the day slot; eves set only the evening", () => {
    // Transfiguration Aug 6 2025 falls on a Wednesday.
    const feast = resolve({ year: 2025, month: 8, day: 6 });
    expect(feast.holyDay).toBe("transfiguration");
    expect(feast.evening).toBeUndefined();

    // Eve of All Saints Oct 31 2025 is a Friday: morning stays ordinary.
    const eve = resolve({ year: 2025, month: 10, day: 31 });
    expect(eve.holyDay).toBeUndefined();
    expect(eve.day.kind).toBe("weekday");
    expect(eve.evening).toEqual({ kind: "special", name: "eve-of-all-saints" });
  });

  test("fixed feasts are surfaced even on a Sunday", () => {
    // Aug 6 2023 (Transfiguration) is a Sunday.
    const slot = resolve({ year: 2023, month: 8, day: 6 });
    expect(slot.holyDay).toBe("transfiguration");
    expect(slot.day).toEqual({ kind: "weekday", weekday: 0 });
  });

  test("no sanctorale influence outside the fixed dates", () => {
    const slot = resolve({ year: 2026, month: 2, day: 20 });
    expect(slot.holyDay).toBeUndefined();
    expect(slot.evening).toBeUndefined();
  });
});

describe("lectionary entry wiring", () => {
  test("eve evenings resolve to the vendored eve entry", () => {
    const date = { year: 2025, month: 10, day: 31 };
    const entry = entryForEvening(resolve(date));
    expect(entry?.title).toBe("Eve of All Saints");
    expect(entry?.psalms.evening?.length).toBeGreaterThan(0);
  });

  test("each eve's evening entry is the eve, not the feast", () => {
    for (const eve of EVES) {
      const date = { year: 2026, month: eve.month, day: eve.day };
      const entry = entryForEvening(resolve(date));
      expect(entry?.title).toBe(eve.title);
    }
  });
});

describe("collect coverage", () => {
  test("every sanctorale slug resolves to a collect in both rites", () => {
    for (const entry of SANCTORALE_ENTRIES) {
      const title = holyDayCollectTitle(entry.slug);
      expect(title, entry.slug).toBeTruthy();
      if (!title) throw new Error(`no collect title for ${entry.slug}`);
      expect(
        collectPassage("traditional", "holy-days", title),
        `${entry.slug} traditional`,
      ).toBeTruthy();
      expect(
        collectPassage("contemporary", "holy-days", title),
        `${entry.slug} contemporary`,
      ).toBeTruthy();
    }
  });

  test("an eve takes its feast's collect", () => {
    expect(holyDayCollectTitle("eve-of-all-saints")).toBe("All Saint's Day");
    expect(holyDayCollectTitle("eve-of-transfiguration")).toBe(
      "The Transfiguration",
    );
  });
});

describe("mention dictionary", () => {
  test("collect-relevant saint names surface as exact variants", () => {
    const variants = (slug: string) => {
      const entry = sanctoraleBySlug(slug);
      if (!entry) throw new Error(`missing entry ${slug}`);
      return sanctoraleNameVariants(entry);
    };
    expect(variants("conversion-of-st-paul")).toContain("Saint Paul");
    expect(variants("st-mark")).toContain("Saint Mark");
    expect(variants("peter-and-paul")).toContain("Saint Peter and Saint Paul");
    expect(variants("st-james-of-jerusalem")).toContain(
      "Saint James of Jerusalem",
    );
    expect(variants("st-james-of-jerusalem")).toContain("Saint James");
  });

  test("Noonday collect links Saint Paul to the Conversion", () => {
    const text =
      "Almighty Savior, who at noonday called your servant Saint Paul to be an apostle to the Gentiles";
    const runs = tokenizeSanctoraleMentions(text);
    const mentions = runs.filter((r) => r.entry !== undefined);
    expect(mentions).toHaveLength(1);
    expect(mentions[0].text).toBe("Saint Paul");
    expect(mentions[0].entry?.slug).toBe("conversion-of-st-paul");
  });

  test("tokenizer merges plain text into single runs", () => {
    const runs = tokenizeSanctoraleMentions(
      "The Bishop said Saint Paul and departed.",
    );
    expect(runs).toHaveLength(3);
    expect(runs[0]).toEqual({ text: "The Bishop said " });
    expect(runs[1].text).toBe("Saint Paul");
    expect(runs[2].text).toBe(" and departed.");
  });

  test("matching is case-exact and word-boundary safe", () => {
    expect(
      tokenizeSanctoraleMentions("she met saint paul at the agora"),
    ).toEqual([{ text: "she met saint paul at the agora" }]);
    expect(tokenizeSanctoraleMentions("Saint Paulson")).toEqual([
      { text: "Saint Paulson" },
    ]);
    const runs = tokenizeSanctoraleMentions("Saint Paul's epistles");
    expect(runs[0].entry?.slug).toBe("conversion-of-st-paul");
    expect(runs).toHaveLength(2);
  });

  test("longest surface wins: Saint James of Jerusalem never fragments", () => {
    const runs = tokenizeSanctoraleMentions(
      "Saint James of Jerusalem, Brother of Our Lord, wrote the epistle.",
    );
    const mentions = runs.filter((r) => r.entry !== undefined);
    expect(mentions).toHaveLength(1);
    expect(mentions[0].text).toBe("Saint James of Jerusalem");
    expect(mentions[0].entry?.slug).toBe("st-james-of-jerusalem");
  });

  test("bare 'Saint James' maps to the July feast", () => {
    const runs = tokenizeSanctoraleMentions("the festival of Saint James");
    const mention = runs.find((r) => r.entry !== undefined);
    expect(mention?.entry?.slug).toBe("st-james");
  });

  test("a compound title links as one mention", () => {
    const runs = tokenizeSanctoraleMentions(
      "On Saint Peter and Saint Paul, keep the feast.",
    );
    const mentions = runs.flatMap((r) =>
      r.entry ? [{ text: r.text, slug: r.entry.slug }] : [],
    );
    expect(mentions).toEqual([
      { text: "Saint Peter and Saint Paul", slug: "peter-and-paul" },
    ]);
  });

  test("separate saints in prose each link to their own feast", () => {
    const runs = tokenizeSanctoraleMentions(
      "Saint Peter, Saint Paul, and Saint Mark",
    );
    const mentions = runs.flatMap((r) =>
      r.entry ? [{ text: r.text, slug: r.entry.slug }] : [],
    );
    expect(mentions).toEqual([
      { text: "Saint Peter", slug: "confession-of-st-peter" },
      { text: "Saint Paul", slug: "conversion-of-st-paul" },
      { text: "Saint Mark", slug: "st-mark" },
    ]);
  });
});

describe("labels", () => {
  test("sanctoraleDateLabel renders full month names", () => {
    const allSaints = sanctoraleBySlug("all-saints");
    const stAndrew = sanctoraleBySlug("st-andrew");
    expect(allSaints).toBeTruthy();
    expect(stAndrew).toBeTruthy();
    if (!allSaints || !stAndrew) throw new Error("label fixtures missing");
    expect(sanctoraleDateLabel(allSaints)).toBe("November 1");
    expect(sanctoraleDateLabel(stAndrew)).toBe("November 30");
  });
});
