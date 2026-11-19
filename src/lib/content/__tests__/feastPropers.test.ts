import { describe, expect, it } from "bun:test";
import { allFeasts } from "../../calendar/feastsByTradition";
import { propersForFeast } from "../feastPropers";

const andrew = (tradition: "tec" | "coe" | "acc") => {
  const feast = allFeasts(tradition).find(
    (f) => f.canonical === "st-andrew" && f.month === 11 && f.day === 30,
  );
  if (!feast) throw new Error(`missing Saint Andrew for ${tradition}`);
  return feast;
};

describe("single-feast propers by church", () => {
  it("gives each church its own collect for a shared feast", () => {
    const tec = propersForFeast(andrew("tec"), "tec");
    const coe = propersForFeast(andrew("coe"), "coe");
    const acc = propersForFeast(andrew("acc"), "acc");
    expect(tec.collect?.title).toBe("Saint Andrew");
    expect(coe.collect?.title).toBe("St. Andrew");
    expect(acc.collect?.title).toContain("SAINT ANDREW");
    expect(
      new Set([tec.collect?.text, coe.collect?.text, acc.collect?.text]).size,
    ).toBe(3);
  });

  it("uses each church's own psalms and lessons", () => {
    expect(propersForFeast(andrew("tec"), "tec").psalms).toEqual([
      "34",
      "96",
      "100",
    ]);
    expect(propersForFeast(andrew("tec"), "tec").readings).toHaveLength(4);
    expect(
      propersForFeast(andrew("coe"), "coe").readings.length,
    ).toBeGreaterThan(0);
    expect(propersForFeast(andrew("acc"), "acc").psalms).toHaveLength(2);
  });

  it("gives lesser feasts no liturgy sections", () => {
    const lesser = allFeasts("tec").find((f) => f.rank === "lesser");
    if (!lesser) throw new Error("missing lesser feast");
    const propers = propersForFeast(lesser, "tec");
    expect(propers.psalms).toEqual([]);
    expect(propers.readings).toEqual([]);
    expect(propers.collect).toBeUndefined();
  });
});
