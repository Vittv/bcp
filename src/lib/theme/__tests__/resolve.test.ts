import { describe, expect, it } from "bun:test";
import { CHROME_FONT } from "../../fonts";
import { resolveString, resolveTokens } from "../resolve";
import { THEME_LIST, THEMES } from "../themes";
import { tokenVars } from "../tokens";

// the lookups the runtime hands the resolver: tokenVars output keyed by the
// css custom-property name, exactly like useThemedStyles builds.
const TOKENS = {
  "--accent": "#7a3040",
  "--text": "#2c2020",
  "--text-secondary": "#6b6159",
  "--border": "#cbc5bb",
};

describe("resolveString", () => {
  it("leaves a string without var() untouched", () => {
    expect(resolveString("plain #2c2020", TOKENS)).toBe("plain #2c2020");
  });

  it("replaces a known token", () => {
    expect(resolveString("var(--text)", TOKENS)).toBe("#2c2020");
  });

  it("prefers the token over a fallback", () => {
    expect(resolveString("var(--text, #ffffff)", TOKENS)).toBe("#2c2020");
  });

  it("uses the fallback when the token is missing", () => {
    expect(resolveString("var(--missing, #ffffff)", TOKENS)).toBe("#ffffff");
  });

  it("keeps the var reference when neither token nor fallback exists", () => {
    expect(resolveString("var(--missing)", TOKENS)).toBe("var(--missing)");
  });

  it("resolves a nested var() fallback", () => {
    expect(resolveString("var(--missing, var(--accent))", TOKENS)).toBe(
      "#7a3040",
    );
  });

  it("resolves several tokens inside one string", () => {
    expect(
      resolveString("1px solid var(--border) / var(--text-secondary)", TOKENS),
    ).toBe("1px solid #cbc5bb / #6b6159");
  });

  it("keeps text before and after a resolved token", () => {
    expect(resolveString("0 8px 24px var(--accent), 0 2px 4px", TOKENS)).toBe(
      "0 8px 24px #7a3040, 0 2px 4px",
    );
  });

  // CHROME_FONT is a var(--chrome-font, Inter Tight) reference. the font-mode
  // plumbing passes --chrome-font through the same lookup as the colors, so a
  // migrated style resolves the chrome face here instead of freezing on the
  // fallback and ignoring the user's system-font choice.
  it("resolves the chrome-font var from the lookup (font mode reaches styles)", () => {
    const vars = { ...TOKENS, "--chrome-font": '"Inter Tight", system-ui' };
    expect(resolveString(CHROME_FONT, vars)).toBe('"Inter Tight", system-ui');
  });
});

describe("resolveTokens", () => {
  it("walks nested style objects", () => {
    const out = resolveTokens(
      {
        row: { color: "var(--text)", backgroundColor: "var(--accent)" },
        bar: { borderBottomColor: "var(--border, #d2cbbf)" },
        plain: 14,
      },
      TOKENS,
    );
    expect(out).toEqual({
      row: { color: "#2c2020", backgroundColor: "#7a3040" },
      bar: { borderBottomColor: "#cbc5bb" },
      plain: 14,
    });
  });

  it("walks arrays and arrays of objects", () => {
    expect(resolveTokens(["var(--accent)", "#fff"], TOKENS)).toEqual([
      "#7a3040",
      "#fff",
    ]);
    expect(
      resolveTokens(
        [{ color: "var(--text)" }, { color: "var(--accent)" }],
        TOKENS,
      ),
    ).toEqual([{ color: "#2c2020" }, { color: "#7a3040" }]);
  });

  it("preserves non-string leaves", () => {
    const out = resolveTokens(
      { color: "var(--text)", weight: 700, visible: true, radius: null },
      TOKENS,
    );
    expect(out.weight).toBe(700);
    expect(out.visible).toBe(true);
    expect(out.radius).toBeNull();
  });

  it("does not mutate the input style object", () => {
    const input = { color: "var(--text)", nested: { border: "var(--border)" } };
    resolveTokens(input, TOKENS);
    expect(input).toEqual({
      color: "var(--text)",
      nested: { border: "var(--border)" },
    });
  });

  it("leaves scalar leaves alone", () => {
    expect(resolveTokens(12, TOKENS)).toBe(12);
    expect(resolveTokens(true, TOKENS)).toBe(true);
    expect(resolveTokens(undefined, TOKENS)).toBeUndefined();
  });
});

// the integration contract: every var(--token) a component writes resolves to
// a real color string, for every family and mode alike.
describe("theme round-trip", () => {
  it("resolves the token vocabulary back to the palette colors", () => {
    for (const family of THEME_LIST) {
      for (const tokens of [family.light, family.dark]) {
        const vars = tokenVars(tokens);
        for (const [name, color] of Object.entries(vars)) {
          expect(resolveString(`var(${name})`, vars)).toBe(color);
        }
      }
    }
  });

  it("every palette resolves the shared vocabulary without bare var() left over", () => {
    const names = Object.keys(tokenVars(THEMES.canterbury.light));
    for (const family of THEME_LIST) {
      for (const tokens of [family.light, family.dark]) {
        const vars = tokenVars(tokens);
        for (const name of names) {
          const resolved = resolveString(`var(${name})`, vars);
          expect(resolved).not.toContain("var(");
        }
      }
    }
  });
});
