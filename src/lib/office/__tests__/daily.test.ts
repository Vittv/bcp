import { describe, expect, test } from "bun:test";
import { dailyOfficeId } from "../daily";

describe("dailyOfficeId", () => {
  test("morning follows the rite", () => {
    expect(dailyOfficeId("morning", "One")).toBe("morning-rite-one");
    expect(dailyOfficeId("morning", "Two")).toBe("morning-rite-two");
  });

  test("evening follows the rite", () => {
    expect(dailyOfficeId("evening", "One")).toBe("evening-rite-one");
    expect(dailyOfficeId("evening", "Two")).toBe("evening-rite-two");
  });

  test("noonday and compline ignore the rite", () => {
    expect(dailyOfficeId("noonday", "One")).toBe("noonday");
    expect(dailyOfficeId("noonday", "Two")).toBe("noonday");
    expect(dailyOfficeId("compline", "One")).toBe("compline");
    expect(dailyOfficeId("compline", "Two")).toBe("compline");
  });
});
