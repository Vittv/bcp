import { describe, expect, it } from "bun:test";
import { calendarFor, calendarForEdition } from "../calendarProvider";
import {
  allFeasts,
  canonicalFeastSlug,
  feastMonthDayLabel,
  feastsByCanonical,
  feastsForDate,
  firstLesserFeastForTradition,
  holyDayBySlugForTradition,
  lesserFeastBySlugForTradition,
  lesserFeastForTraditionDate,
  searchLesserFeastsForTradition,
} from "../feastsByTradition";
import { dayInfo } from "../observances";
import { traditionForEdition } from "../tradition";
import type { CalendarDate } from "../types";

const at = (value: string): CalendarDate => {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
};

describe("edition to tradition", () => {
  it("maps every edition to its church", () => {
    expect(traditionForEdition("1979")).toBe("tec");
    expect(traditionForEdition("1662")).toBe("coe");
    expect(traditionForEdition("1962")).toBe("acc");
  });

  it("resolves the same date through a provider and an edition", () => {
    const date = at("2026-11-18");
    expect(calendarFor("acc").resolve(date)).toEqual(
      calendarForEdition("1962").resolve(date),
    );
  });
});

describe("feasts per church", () => {
  it("gives each tradition its own fixed feast table", () => {
    expect(allFeasts("tec").length).toBe(284);
    expect(allFeasts("coe").length).toBeGreaterThan(80);
    expect(allFeasts("acc").length).toBe(155);
    for (const tradition of ["tec", "coe", "acc"] as const) {
      expect(allFeasts(tradition).every((f) => f.tradition === tradition)).toBe(
        true,
      );
    }
  });

  it("places the Visitation on different dates in different churches", () => {
    const tecVisitation = feastsByCanonical("visitation", "tec").find(
      (f) => !f.slug.startsWith("eve-"),
    );
    expect(tecVisitation).toMatchObject({ month: 5, day: 31 });
    expect(feastsByCanonical("visitation", "coe")[0]).toMatchObject({
      month: 7,
      day: 2,
    });
    expect(feastsByCanonical("visitation", "acc")[0]).toMatchObject({
      month: 7,
      day: 2,
    });
  });

  it("places St James of Jerusalem on May 1 in the ACC calendar", () => {
    expect(feastsByCanonical("st-james-of-jerusalem", "tec")[0]).toMatchObject({
      month: 10,
      day: 23,
    });
    expect(feastsByCanonical("st-james-of-jerusalem", "acc")[0]).toMatchObject({
      month: 5,
      day: 1,
    });
  });

  it("keeps TEC lesser feast slugs out of the older churches", () => {
    const jan4 = at("2026-01-04");
    const tecSlugs = feastsForDate(jan4, "tec")
      .filter((f) => f.rank === "lesser")
      .map((f) => f.slug);
    expect(tecSlugs).toContain(
      "elizabeth-ann-seton-vowed-religious-and-educator",
    );
    for (const tradition of ["coe", "acc"] as const) {
      const slugs = feastsForDate(jan4, tradition).map((f) => f.slug);
      expect(slugs).not.toContain(
        "elizabeth-ann-seton-vowed-religious-and-educator",
      );
    }
  });

  it("recognizes the same feast through the shared slug map", () => {
    expect(canonicalFeastSlug("The Conversion of St Paul")).toBe(
      "conversion-of-st-paul",
    );
    expect(canonicalFeastSlug("Visit: of ye. Bl. Virg. Marie.")).toBe(
      "visitation",
    );
  });
});

describe("holy day navigation per church", () => {
  it("keeps distinct entries distinct even when they share a canonical identity", () => {
    const saints = holyDayBySlugForTradition("all-saints", "acc");
    const octave = holyDayBySlugForTradition(
      "the-octave-day-of-all-saints-the-founders-benefactors-and-missionaries-of-the-church-in-canada",
      "acc",
    );
    expect(saints?.canonical).toBe("all-saints");
    expect(octave?.canonical).toBe("all-saints");
    expect([saints?.month, saints?.day]).toEqual([11, 1]);
    expect([octave?.month, octave?.day]).toEqual([11, 8]);
    expect(saints?.slug).not.toBe(octave?.slug);
  });

  it("resolves a calendar click to the same feast and date in that church", () => {
    const cases = [
      {
        edition: "1962" as const,
        tradition: "acc" as const,
        month: 11,
        day: 8,
      },
      { edition: "1962" as const, tradition: "acc" as const, month: 7, day: 2 },
      { edition: "1662" as const, tradition: "coe" as const, month: 7, day: 2 },
    ];
    for (const c of cases) {
      const obs = dayInfo(
        at(
          `2026-${String(c.month).padStart(2, "0")}-${String(c.day).padStart(2, "0")}`,
        ),
        c.edition,
      ).observances.find((o) => o.slug);
      if (!obs?.slug) throw new Error(`no holy day on ${c.month}/${c.day}`);
      const page = holyDayBySlugForTradition(obs.slug, c.tradition);
      expect(page?.name).toBe(obs.name);
      expect([page?.month, page?.day]).toEqual([c.month, c.day]);
    }
  });
});

describe("lesser feast reference data per church", () => {
  it("resolves each church's default feast and date", () => {
    const expected: Record<string, { slug: string; date: string }> = {
      tec: {
        slug: "elizabeth-ann-seton-vowed-religious-and-educator",
        date: "January 4",
      },
      coe: { slug: "lucian-pr-mart", date: "January 8" },
      acc: { slug: "agnes-virgin-and-martyr-rome-c-304", date: "January 21" },
    };
    const dates = {
      tec: at("2026-01-04"),
      coe: at("2026-01-08"),
      acc: at("2026-01-21"),
    };
    for (const tradition of ["tec", "coe", "acc"] as const) {
      const fromDate = lesserFeastForTraditionDate(dates[tradition], tradition);
      if (!fromDate) throw new Error(`missing lesser feast for ${tradition}`);
      expect(fromDate.slug).toBe(expected[tradition].slug);
      expect(feastMonthDayLabel(fromDate.month, fromDate.day)).toBe(
        expected[tradition].date,
      );
      expect(
        lesserFeastBySlugForTradition(fromDate.slug, tradition)?.name,
      ).toBe(fromDate.name);
    }
  });

  it("indexes each church's own lesser feasts", () => {
    expect(searchLesserFeastsForTradition("", "tec").length).toBe(247);
    expect(searchLesserFeastsForTradition("", "coe").length).toBeGreaterThan(
      50,
    );
    expect(searchLesserFeastsForTradition("", "acc").length).toBe(108);
    expect(firstLesserFeastForTradition("coe").name).toContain("Lucian");
  });

  it("ranks only ACC major feasts as holy days", () => {
    const acc = allFeasts("acc");
    expect(
      acc.find((f) => f.name.includes("Octave Day of Christmas"))?.rank,
    ).toBe("holy-day");
    expect(acc.find((f) => f.name.includes("William Laud"))?.rank).toBe(
      "lesser",
    );
    expect(acc.filter((f) => f.rank === "holy-day").length).toBeLessThan(50);
  });

  it("uses each church's own date for the same day", () => {
    expect(
      lesserFeastForTraditionDate(at("2026-07-02"), "tec")?.name,
    ).toContain("Moses the Black");
    expect(
      lesserFeastForTraditionDate(at("2026-07-02"), "coe"),
    ).toBeUndefined();
  });
});

describe("provider season labels", () => {
  it("names the long season by church", () => {
    expect(calendarFor("tec").seasonLabel("after-pentecost")).toBe(
      "After Pentecost",
    );
    expect(calendarFor("coe").seasonLabel("after-pentecost")).toBe(
      "After Trinity",
    );
    expect(calendarFor("acc").seasonLabel("after-pentecost")).toBe(
      "After Trinity",
    );
  });
});
