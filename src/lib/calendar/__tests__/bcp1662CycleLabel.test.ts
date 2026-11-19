import { describe, expect, it } from "bun:test";
import { bcp1662CycleLabel, bcp1662ShortCycleLabel } from "../bcp1662";

describe("bcp1662ShortCycleLabel", () => {
  it("keeps the Trinity count without the long Sunday wording", () => {
    expect(bcp1662ShortCycleLabel({ year: 2026, month: 11, day: 17 })).toBe(
      "Trinity 24",
    );
  });
});

describe("bcp1662CycleLabel", () => {
  it("counts Sundays after Trinity in the green season", () => {
    expect(bcp1662CycleLabel({ year: 2026, month: 11, day: 17 })).toBe(
      "Twenty-fourth Sunday after Trinity",
    );
    expect(bcp1662CycleLabel({ year: 2026, month: 11, day: 15 })).toBe(
      "Twenty-fourth Sunday after Trinity",
    );
  });

  it("names Trinity Sunday itself", () => {
    expect(bcp1662CycleLabel({ year: 2026, month: 5, day: 31 })).toBe(
      "Trinity Sunday",
    );
  });

  it("has no cycle label outside the Trinity season", () => {
    expect(bcp1662CycleLabel({ year: 2026, month: 12, day: 25 })).toBeNull();
    expect(bcp1662CycleLabel({ year: 2026, month: 3, day: 10 })).toBeNull();
  });
});
