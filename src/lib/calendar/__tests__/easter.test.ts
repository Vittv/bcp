import { describe, expect, test } from "bun:test";
import { gregorianEaster } from "../easter";

describe("gregorianEaster", () => {
  const cases: Array<[number, string]> = [
    [1818, "1818-03-22"], // earliest possible
    [1970, "1970-03-29"],
    [1976, "1976-04-18"],
    [2000, "2000-04-23"],
    [2019, "2019-04-21"],
    [2024, "2024-03-31"],
    [2025, "2025-04-20"],
    [2026, "2026-04-05"],
    [2027, "2027-03-28"],
    [2028, "2028-04-16"],
    [2038, "2038-04-25"], // latest possible
  ];

  for (const [year, iso] of cases) {
    test(`${year} -> ${iso}`, () => {
      expect(gregorianEaster(year)).toEqual(parseIso(iso));
    });
  }
});

function parseIso(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month, day };
}
