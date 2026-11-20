import { describe, expect, test } from "bun:test";
import { resolveStoredThemeFamily } from "../themeFamilyMigration";

describe("resolveStoredThemeFamily", () => {
  test("carries the old canterbury pick over to Winchester once", () => {
    expect(resolveStoredThemeFamily("canterbury", false)).toEqual({
      id: "winchester",
      rewrite: true,
    });
  });

  test("leaves a deliberate choice of the new Canterbury alone", () => {
    expect(resolveStoredThemeFamily("canterbury", true)).toEqual({
      id: "canterbury",
      rewrite: false,
    });
  });

  test("keeps other families and falls back for a missing or stale value", () => {
    expect(resolveStoredThemeFamily("oxford", false)).toEqual({
      id: "oxford",
      rewrite: false,
    });
    expect(resolveStoredThemeFamily(null, false).id).toBe("winchester");
    expect(resolveStoredThemeFamily("nonesuch", true).id).toBe("winchester");
  });
});
