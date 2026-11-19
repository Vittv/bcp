import { describe, expect, it } from "bun:test";
import { resolve } from "../../calendar";
import { collectForDate } from "../compose/collects";

describe("collect appointment reasons in offices", () => {
  it("names the feast when a holy day appoints the collect", () => {
    const date = { year: 2026, month: 11, day: 30 };
    const found = collectForDate(date, resolve(date));
    expect(found?.section).toBe("holy-days");
    expect(found?.appointment).toBe("Saint Andrew the Apostle");
  });

  it("names the special day when one appoints the collect", () => {
    const date = { year: 2026, month: 12, day: 24 };
    const found = collectForDate(date, resolve(date));
    expect(found?.appointment).toBe("Dec 24");
  });

  it("leaves ordinary weekdays without a rubric", () => {
    const date = { year: 2026, month: 11, day: 18 };
    expect(collectForDate(date, resolve(date))?.appointment).toBeUndefined();
  });
});
