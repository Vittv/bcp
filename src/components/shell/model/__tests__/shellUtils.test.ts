import { describe, expect, test } from "bun:test";
import { officeForHour1962 } from "../officeForHour";

describe("officeForHour1962", () => {
  test("uses the full dayparts like the 1979 book", () => {
    expect(officeForHour1962(8)).toBe("morning");
    expect(officeForHour1962(12)).toBe("noonday");
    expect(officeForHour1962(13)).toBe("noonday");
    expect(officeForHour1962(17)).toBe("evening");
    expect(officeForHour1962(21)).toBe("compline");
  });

  test("keeps only morning and evening in devotions mode", () => {
    expect(officeForHour1962(8, true)).toBe("morning");
    expect(officeForHour1962(13, true)).toBe("evening");
    expect(officeForHour1962(22, true)).toBe("evening");
  });
});
