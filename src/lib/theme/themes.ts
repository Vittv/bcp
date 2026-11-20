import type { ResolvedTheme, ThemeTokens } from "./tokens";

// a theme is a family: one full palette for light and one for dark. the id is
// what gets persisted and picked in Appearance; the light/dark pair lets a
// single family skin every component whether the app follows the system or a
// pinned mode. `mode` (light/dark/system) stays a separate axis that chooses
// which variant of the selected family applies.
export type ThemeId =
  | "winchester"
  | "canterbury"
  | "oxford"
  | "salisbury"
  | "york"
  | "chester"
  | "lindisfarne"
  | "durham"
  | "iona"
  | "washington"
  | "st-pauls"
  | "st-patricks"
  | "vague";

export type ThemeDefinition = {
  id: ThemeId;
  label: string;
  light: ThemeTokens;
  dark: ThemeTokens;
};

import { THEME_LIST, THEMES } from "./themes.data";

export { THEME_LIST, THEMES };

// first run keeps the original wine-and-parchment palette under its new name
export const DEFAULT_THEME: ThemeId = "winchester";

// the palette for a family at a resolved mode. the indirection keeps callers
// (the context, the picker previews) off the token shape, so a family can add
// variants without touching them.
export function themeTokens(theme: ThemeId, mode: ResolvedTheme): ThemeTokens {
  return mode === "dark" ? THEMES[theme].dark : THEMES[theme].light;
}
