import { describe, expect, it } from "bun:test";
import { THEME_LIST, THEMES, themeTokens } from "../themes";
import { tokenVars } from "../tokens";

// the css custom-property spelling of the scalar tokens, as the injected
// web stylesheet and the js resolver read them. pinning the spelling here
// means a token rename cannot silently drift from the var(--name) strings
// components write.
describe("tokenVars", () => {
  it("kebab-cases every scalar token into its css custom property", () => {
    const vars = tokenVars(THEMES.canterbury.light);
    expect(vars["--bg"]).toBe("#e0dbd0");
    expect(vars["--bg-raised"]).toBe("#ece7dd");
    expect(vars["--input-bg"]).toBe("#ece7dd");
    expect(vars["--control-hover"]).toBe("#d2cbbf");
    expect(vars["--selected-bg"]).toBe("#ece7dd");
    expect(vars["--key-bg"]).toBe("rgba(44, 32, 32, 0.09)");
    expect(vars["--today-bg"]).toBe("rgba(122, 48, 64, 0.16)");
    expect(vars["--border-content"]).toBe("#a59d92");
    expect(vars["--border-faint"]).toBe("rgba(44, 32, 32, 0.09)");
    expect(vars["--text-secondary"]).toBe("#6b6159");
    expect(vars["--on-accent"]).toBe("#f6f1e8");
    expect(vars["--panel-shadow"]).toBe("rgba(20, 15, 15, 0.18)");
    expect(vars["--danger-text"]).toBe("#ffffff");
  });

  it("skips the nested season map but keeps the scalar season-ring", () => {
    const vars = tokenVars(THEMES.canterbury.light);
    expect(vars["--season"]).toBeUndefined();
    expect(vars["--season-ring"]).toBe("rgba(44, 32, 32, 0.35)");
  });

  it("names every scalar token, not just a sample", () => {
    const vars = tokenVars(THEMES.canterbury.light);
    for (const [key, value] of Object.entries(THEMES.canterbury.light)) {
      if (typeof value !== "string") continue;
      const expectedName = `--${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
      expect(vars[expectedName]).toBe(value);
    }
  });

  it("paints every scalar token with a non-empty color for every family and mode", () => {
    for (const family of THEME_LIST) {
      for (const tokens of [family.light, family.dark]) {
        const vars = tokenVars(tokens);
        for (const value of Object.values(vars)) {
          expect(value.length).toBeGreaterThan(0);
        }
      }
    }
  });
});

// every palette stays the same vocabulary: a token added to one family or mode
// but not another would resolve to nothing on native.
describe("themeTokens", () => {
  it("gives every family and mode a palette with identical token keys", () => {
    const reference = Object.keys(tokenVars(THEMES.canterbury.light)).sort();
    for (const family of THEME_LIST) {
      for (const tokens of [family.light, family.dark]) {
        expect(Object.keys(tokenVars(tokens)).sort()).toEqual(reference);
      }
    }
  });

  it("selects the family's variant for the resolved mode", () => {
    expect(themeTokens("canterbury", "light")).toBe(THEMES.canterbury.light);
    expect(themeTokens("canterbury", "dark")).toBe(THEMES.canterbury.dark);
    expect(themeTokens("oxford", "light")).toBe(THEMES.oxford.light);
    expect(themeTokens("oxford", "dark")).toBe(THEMES.oxford.dark);
    expect(themeTokens("vague", "light")).toBe(THEMES.vague.light);
    expect(themeTokens("vague", "dark")).toBe(THEMES.vague.dark);
    expect(themeTokens("salisbury", "light")).toBe(THEMES.salisbury.light);
    expect(themeTokens("salisbury", "dark")).toBe(THEMES.salisbury.dark);
    expect(themeTokens("york", "light")).toBe(THEMES.york.light);
    expect(themeTokens("york", "dark")).toBe(THEMES.york.dark);
    expect(themeTokens("chester", "light")).toBe(THEMES.chester.light);
    expect(themeTokens("chester", "dark")).toBe(THEMES.chester.dark);
    expect(themeTokens("lindisfarne", "light")).toBe(THEMES.lindisfarne.light);
    expect(themeTokens("lindisfarne", "dark")).toBe(THEMES.lindisfarne.dark);
    expect(themeTokens("durham", "light")).toBe(THEMES.durham.light);
    expect(themeTokens("durham", "dark")).toBe(THEMES.durham.dark);
    expect(themeTokens("iona", "light")).toBe(THEMES.iona.light);
    expect(themeTokens("iona", "dark")).toBe(THEMES.iona.dark);
    expect(themeTokens("washington", "light")).toBe(THEMES.washington.light);
    expect(themeTokens("washington", "dark")).toBe(THEMES.washington.dark);
  });
});
