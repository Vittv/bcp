// the app's color vocabulary. every painted surface names a token here, so a
// theme is just one of these objects and components never hold a raw color.
// tokens are plain color strings (never var() references) so the same object
// themes the web build and the native build alike.

export type ResolvedTheme = "light" | "dark";
export type ThemeMode = "light" | "dark" | "system";

// the seven liturgical colors a season or feast can carry, plus the ring drawn
// around a season dot to seat it on either background.
export type SeasonColor =
  | "blue"
  | "purple"
  | "white"
  | "gold"
  | "green"
  | "red"
  | "black";

export type ThemeTokens = {
  // surfaces
  bg: string;
  bgRaised: string;
  inputBg: string;
  surface: string;
  controlHover: string;
  selectedBg: string;
  keyBg: string;
  todayBg: string;

  // rules
  border: string;
  borderContent: string;
  borderFaint: string;

  // type
  text: string;
  textSecondary: string;
  onAccent: string;

  // accent
  accent: string;

  // link-hint chip
  hintBg: string;
  hintText: string;

  // native chrome we do not paint ourselves
  scrollbar: string;

  // overlays and depth
  scrim: string;
  shadowColor: string;
  shadowSoft: string;
  shadowStrong: string;
  panelShadow: string;

  // window-controls danger state
  danger: string;
  dangerText: string;

  // liturgical palette
  season: Record<SeasonColor, string>;
  seasonRing: string;
};

// the css custom-property name for each scalar token, so the injected web
// stylesheet and the js resolver read the exact same vocabulary.
export function tokenVars(tokens: ThemeTokens): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(tokens)) {
    if (typeof value !== "string") continue;
    out[`--${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`] = value;
  }
  return out;
}
