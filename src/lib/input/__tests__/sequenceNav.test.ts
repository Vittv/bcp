import { describe, expect, it } from "bun:test";
import {
  type PageStepper,
  registerPageStepper,
  stepIndexed,
  stepLinear,
  stepPageSequence,
} from "../sequenceNav";

describe("stepLinear", () => {
  it("steps within the range", () => {
    expect(stepLinear(5, 1, 10, 1)).toBe(6);
    expect(stepLinear(5, 1, 10, -1)).toBe(4);
  });
  it("returns null past the bounds", () => {
    expect(stepLinear(10, 1, 10, 1)).toBeNull();
    expect(stepLinear(1, 1, 10, -1)).toBeNull();
  });
});

describe("stepIndexed", () => {
  const items = ["a", "b", "c"];
  const eq = (a: string, b: string) => a === b;
  it("steps by position from the matching item", () => {
    expect(stepIndexed(items, "a", 1, eq)).toBe("b");
    expect(stepIndexed(items, "c", -1, eq)).toBe("b");
  });
  it("returns null past the ends or for a missing item", () => {
    expect(stepIndexed(items, "c", 1, eq)).toBeNull();
    expect(stepIndexed(items, "a", -1, eq)).toBeNull();
    expect(stepIndexed(items, "z", 1, eq)).toBeNull();
  });
});

describe("page stepper registry", () => {
  it("routes by page id and forwards the delta", () => {
    const calls: number[] = [];
    const step: PageStepper = (delta) => {
      calls.push(delta);
      return true;
    };
    registerPageStepper("psalms", step);
    expect(stepPageSequence("psalms", 1)).toBe(true);
    expect(stepPageSequence("psalms", -1)).toBe(true);
    expect(calls).toEqual([1, -1]);
    registerPageStepper("psalms", null);
  });
  it("ignores pages without a registered stepper", () => {
    const step: PageStepper = () => true;
    expect(stepPageSequence("proverbs", 1)).toBe(false);
    registerPageStepper("saints", step);
    expect(stepPageSequence("proverbs", 1)).toBe(false);
    registerPageStepper("saints", null);
    expect(stepPageSequence("saints", 1)).toBe(false);
  });
  it("reports false when the stepper does not move", () => {
    const step: PageStepper = () => false;
    registerPageStepper("saints", step);
    expect(stepPageSequence("saints", 1)).toBe(false);
    registerPageStepper("saints", null);
  });
});
