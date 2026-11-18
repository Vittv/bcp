import { describe, expect, it } from "bun:test";
import { canonicalFeastSlug, feastsForEditionDate } from "../feastsByTradition";
import { dayInfo } from "../observances";
import { sanctoraleBySlug } from "../sanctorale";
import type { CalendarDate, CalendarEdition } from "../types";

const at = (value: string): CalendarDate => {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
};

const sharedFeasts: Array<[string, string, string]> = [
  ["conversion-of-st-paul", "1979-01-25", "1962-01-25"],
  ["presentation", "1979-02-02", "1962-02-02"],
  ["st-matthias", "1979-02-24", "1962-02-24"],
  ["annunciation", "1979-03-25", "1962-03-25"],
  ["st-mark", "1979-04-25", "1962-04-25"],
  ["philip-and-james", "1979-05-01", "1962-05-01"],
  ["st-barnabas", "1979-06-11", "1962-06-11"],
  ["nativity-of-st-john-the-baptist", "1979-06-24", "1962-06-24"],
  ["peter-and-paul", "1979-06-29", "1962-06-29"],
  ["st-james", "1979-07-25", "1962-07-25"],
  ["transfiguration", "1979-08-06", "1962-08-06"],
  ["st-bartholomew", "1979-08-24", "1962-08-24"],
  ["st-matthew", "1979-09-21", "1962-09-21"],
  ["st-michael-and-all-angels", "1979-09-29", "1962-09-29"],
  ["st-luke", "1979-10-18", "1962-10-18"],
  ["simon-and-jude", "1979-10-28", "1962-10-28"],
  ["all-saints", "1979-11-01", "1962-11-01"],
  ["st-andrew", "1979-11-30", "1962-11-30"],
  ["st-thomas", "1979-12-21", "1962-12-21"],
  ["st-stephen", "1979-12-26", "1962-12-26"],
  ["st-john", "1979-12-27", "1962-12-27"],
  ["holy-innocents", "1979-12-28", "1962-12-28"],
];

describe("canonical feast slugs", () => {
  it("maps edition names to shared identities", () => {
    expect(canonicalFeastSlug("The Conversion of St Paul")).toBe(
      "conversion-of-st-paul",
    );
    expect(canonicalFeastSlug("Purification of the Virgin Mary")).toBe(
      "presentation",
    );
    expect(canonicalFeastSlug("Visit: of ye. Bl. Virg. Marie.")).toBe(
      "visitation",
    );
    expect(canonicalFeastSlug("St James the Brother of the Lord")).toBe(
      "st-james-of-jerusalem",
    );
    expect(canonicalFeastSlug("The Octave Day of Christmas")).toBeUndefined();
  });
});

describe("shared major feast dates", () => {
  it("keeps the same date in 1979 and 1962", () => {
    for (const [slug, date79, date62] of sharedFeasts) {
      const a = sanctoraleBySlug(slug);
      expect(a, `1979 ${slug}`).toBeDefined();
      if (!a) continue;
      const a79 = at(date79);
      expect([a.month, a.day], slug).toEqual([a79.month, a79.day]);

      const b62 = at(date62);
      const feast62 = feastsForEditionDate(b62, "1962");
      expect(
        feast62.some((f) => f.canonical === slug),
        `1962 ${slug}`,
      ).toBe(true);
    }
  });

  it("moves the Visitation from May to July", () => {
    const visitation = sanctoraleBySlug("visitation");
    expect(visitation).toBeDefined();
    if (!visitation) return;
    expect([visitation.month, visitation.day]).toEqual([5, 31]);
    const may = feastsForEditionDate(at("1979-05-31"), "1962");
    expect(may.some((f) => f.canonical === "visitation")).toBe(false);
    const july = feastsForEditionDate(at("1962-07-02"), "1962");
    expect(july.some((f) => f.canonical === "visitation")).toBe(true);
  });

  it("places St James the Brother of the Lord on May 1 in 1962", () => {
    const feast = feastsForEditionDate(at("1962-05-01"), "1962");
    expect(feast.some((f) => f.canonical === "st-james-of-jerusalem")).toBe(
      true,
    );
  });
});

describe("dayInfo edition scoping", () => {
  it("shows TEC Lesser Feasts only under 1979", () => {
    const tecSlug = "aelred-of-rievaulx-monastic-and-theologian";
    const a = dayInfo(at("1979-01-12"), "1979");
    expect(a.observances.some((o) => o.lesserSlug === tecSlug)).toBe(true);
    const olderEditions: CalendarEdition[] = ["1662", "1962"];
    for (const edition of olderEditions) {
      const info = dayInfo(at("1979-01-12"), edition);
      expect(info.observances.some((o) => o.lesserSlug === tecSlug)).toBe(
        false,
      );
    }
  });

  it("uses the edition's own name for January 1", () => {
    const y1979 = dayInfo(at("1979-01-01"), "1979");
    expect(y1979.observances.some((o) => o.name.includes("Holy Name"))).toBe(
      true,
    );
    const y1962 = dayInfo(at("1962-01-01"), "1962");
    expect(y1962.observances.some((o) => o.name.includes("Circumcision"))).toBe(
      true,
    );
  });

  it("names Pentecost Whitsunday for 1962", () => {
    const info = dayInfo(at("2027-05-16"), "1962");
    expect(info.observances.some((o) => o.name === "Whitsunday")).toBe(true);
  });
});
