import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";

import { applyFonts, applyTokens, fontVarsFor } from "../lib/theme/themeDom";
import {
  getSystemTheme,
  loadFontScale,
  loadHeadingFont,
  loadInterfaceFont,
  loadReadingFont,
  loadSubheadingFont,
  loadThemeFamily,
  loadThemeMode,
  loadUiScale,
  persistFont,
  persistFontScale,
  persistThemeFamily,
  persistThemeMode,
  persistUiScale,
  STORAGE_KEY_HEADING_FONT,
  STORAGE_KEY_INTERFACE_FONT,
  STORAGE_KEY_READING_FONT,
  STORAGE_KEY_SUBHEADING_FONT,
} from "../lib/theme/themePreferences";
import type { ThemeId } from "../lib/theme/themes";
import { DEFAULT_THEME, themeTokens } from "../lib/theme/themes";
import type {
  ResolvedTheme,
  ThemeMode,
  ThemeTokens,
} from "../lib/theme/tokens";
import {
  DEFAULT_HEADING_FONT,
  DEFAULT_INTERFACE_FONT,
  DEFAULT_READING_FONT,
  DEFAULT_SUBHEADING_FONT,
  type FaceDef,
  HEADING_FACES,
  INTERFACE_FACES,
  READING_FACES,
  SUBHEADING_FACES,
} from "../lib/typography/faces";
import {
  BASE_FONT_PX,
  DEFAULT_FONT_PX,
  fontPxToScale,
  scaleToFontPx,
} from "../lib/typography/sizes";
import { clampUiScale, DEFAULT_UI_SCALE, snapUiScale } from "../lib/uiScale";

export type { ResolvedTheme, ThemeMode };

type ThemeContextValue = {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  tokens: ThemeTokens;
  /**
   * the selected theme family. its light/dark pair supplies `tokens` for the
   * resolved mode, so picking a family re-skins the whole app without touching
   * the mode axis.
   */
  theme: ThemeId;
  /**
   * the font custom properties a style may reference: `--chrome-font` for the
   * interface face, `--heading-font` for the page-title face, `--subheading-font`
   * for the block-title face, and the reading face's three registers. the
   * resolver swaps var() for these values so a face follows the choice on web
   * and native alike, matching the css custom properties applyFonts paints on
   * the root.
   */
  fontVars: Record<string, string>;
  fontScale: number;
  /**
   * the reader body's current pixel size, always one of the ladder values in
   * `src/lib/typography/sizes.ts`. `fontScale` is its `px / BASE_FONT_PX`
   * projection, which the zoomed panes consume. `setFontPx` snaps onto the
   * ladder, so the slider and the A−/A+ buttons share one source of truth.
   */
  fontPx: number;
  /**
   * the UI scale factor (1 = the original app size, shown as 100%). desktops
   * default to 1, small screens to a larger step; applied as a whole-app zoom.
   */
  uiScale: number;
  /**
   * the interface, heading, subheading, and reading face ids, separate axes so
   * the chrome face, the page-title face, the block-title face, and the reader
   * face are chosen independently. plain strings so a stored id survives a
   * reload; the resolver falls back to the role's default.
   */
  interfaceFont: string;
  headingFont: string;
  subheadingFont: string;
  readingFont: string;
  /** the faces each role picker offers. */
  interfaceFaces: FaceDef[];
  headingFaces: FaceDef[];
  subheadingFaces: FaceDef[];
  readingFaces: FaceDef[];
  setMode: (mode: ThemeMode) => void;
  setTheme: (theme: ThemeId) => void;
  setFontPx: (px: number) => void;
  setInterfaceFont: (id: string) => void;
  setHeadingFont: (id: string) => void;
  setSubheadingFont: (id: string) => void;
  setReadingFont: (id: string) => void;
  setUiScale: (scale: number) => void;
  /** return one role to its default face. */
  resetInterfaceFont: () => void;
  resetHeadingFont: () => void;
  resetSubheadingFont: () => void;
  resetReadingFont: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: "system",
  resolved: "light",
  tokens: themeTokens(DEFAULT_THEME, "light"),
  theme: DEFAULT_THEME,
  fontVars: fontVarsFor(
    DEFAULT_INTERFACE_FONT,
    DEFAULT_HEADING_FONT,
    DEFAULT_SUBHEADING_FONT,
    DEFAULT_READING_FONT,
  ),
  fontScale: 1,
  fontPx: DEFAULT_FONT_PX,
  uiScale: DEFAULT_UI_SCALE,
  interfaceFont: DEFAULT_INTERFACE_FONT,
  headingFont: DEFAULT_HEADING_FONT,
  subheadingFont: DEFAULT_SUBHEADING_FONT,
  readingFont: DEFAULT_READING_FONT,
  interfaceFaces: INTERFACE_FACES,
  headingFaces: HEADING_FACES,
  subheadingFaces: SUBHEADING_FACES,
  readingFaces: READING_FACES,
  setMode: () => {},
  setTheme: () => {},
  setFontPx: () => {},
  setInterfaceFont: () => {},
  setHeadingFont: () => {},
  setSubheadingFont: () => {},
  setReadingFont: () => {},
  setUiScale: () => {},
  resetInterfaceFont: () => {},
  resetHeadingFont: () => {},
  resetSubheadingFont: () => {},
  resetReadingFont: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(loadThemeMode);
  const [theme, setThemeState] = useState<ThemeId>(loadThemeFamily);
  const [fontScale, setFontScaleState] = useState<number>(loadFontScale);
  const [uiScale, setUiScaleState] = useState<number>(loadUiScale);
  const [interfaceFont, setInterfaceFontState] =
    useState<string>(loadInterfaceFont);
  const [headingFont, setHeadingFontState] = useState<string>(loadHeadingFont);
  const [subheadingFont, setSubheadingFontState] =
    useState<string>(loadSubheadingFont);
  const [readingFont, setReadingFontState] = useState<string>(loadReadingFont);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  const resolved: ResolvedTheme = mode === "system" ? systemTheme : mode;
  const tokens = themeTokens(theme, resolved);
  const fontVars = useMemo(
    () => fontVarsFor(interfaceFont, headingFont, subheadingFont, readingFont),
    [interfaceFont, headingFont, subheadingFont, readingFont],
  );

  useEffect(() => {
    applyTokens(tokens, resolved);
  }, [tokens, resolved]);

  useEffect(() => {
    applyFonts(interfaceFont, headingFont, subheadingFont, readingFont);
  }, [interfaceFont, headingFont, subheadingFont, readingFont]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) =>
      setSystemTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    persistThemeMode(m);
  }, []);

  const setTheme = useCallback((t: ThemeId) => {
    setThemeState(t);
    persistThemeFamily(t);
  }, []);

  // the size is always a ladder entry: the setter snaps onto the ladder, so
  // the slider, the A−/A+ buttons, and the reader can never disagree
  const setFontScale = useCallback((s: number) => {
    const snapped = fontPxToScale(s * BASE_FONT_PX);
    setFontScaleState(snapped);
    persistFontScale(snapped);
  }, []);

  const setFontPx = useCallback(
    (px: number) => setFontScale(px / BASE_FONT_PX),
    [setFontScale],
  );

  const fontPx = scaleToFontPx(fontScale);

  const setUiScale = useCallback((scale: number) => {
    // always store a ladder entry, the same rule the font size follows
    const snapped = snapUiScale(clampUiScale(scale));
    setUiScaleState(snapped);
    persistUiScale(snapped);
  }, []);

  const setInterfaceFont = useCallback((id: string) => {
    setInterfaceFontState(id);
    persistFont(STORAGE_KEY_INTERFACE_FONT, id);
  }, []);

  const setHeadingFont = useCallback((id: string) => {
    setHeadingFontState(id);
    persistFont(STORAGE_KEY_HEADING_FONT, id);
  }, []);

  const setSubheadingFont = useCallback((id: string) => {
    setSubheadingFontState(id);
    persistFont(STORAGE_KEY_SUBHEADING_FONT, id);
  }, []);

  const setReadingFont = useCallback((id: string) => {
    setReadingFontState(id);
    persistFont(STORAGE_KEY_READING_FONT, id);
  }, []);

  const resetInterfaceFont = useCallback(() => {
    setInterfaceFontState(DEFAULT_INTERFACE_FONT);
    persistFont(STORAGE_KEY_INTERFACE_FONT, DEFAULT_INTERFACE_FONT);
  }, []);

  const resetHeadingFont = useCallback(() => {
    setHeadingFontState(DEFAULT_HEADING_FONT);
    persistFont(STORAGE_KEY_HEADING_FONT, DEFAULT_HEADING_FONT);
  }, []);

  const resetSubheadingFont = useCallback(() => {
    setSubheadingFontState(DEFAULT_SUBHEADING_FONT);
    persistFont(STORAGE_KEY_SUBHEADING_FONT, DEFAULT_SUBHEADING_FONT);
  }, []);

  const resetReadingFont = useCallback(() => {
    setReadingFontState(DEFAULT_READING_FONT);
    persistFont(STORAGE_KEY_READING_FONT, DEFAULT_READING_FONT);
  }, []);

  const value = useMemo(
    () => ({
      mode,
      resolved,
      tokens,
      theme,
      fontVars,
      fontScale,
      fontPx,
      uiScale,
      interfaceFont,
      headingFont,
      subheadingFont,
      readingFont,
      interfaceFaces: INTERFACE_FACES,
      headingFaces: HEADING_FACES,
      subheadingFaces: SUBHEADING_FACES,
      readingFaces: READING_FACES,
      setMode,
      setTheme,
      setFontPx,
      setInterfaceFont,
      setHeadingFont,
      setSubheadingFont,
      setReadingFont,
      setUiScale,
      resetInterfaceFont,
      resetHeadingFont,
      resetSubheadingFont,
      resetReadingFont,
    }),
    [
      mode,
      resolved,
      tokens,
      theme,
      fontVars,
      fontScale,
      fontPx,
      uiScale,
      interfaceFont,
      headingFont,
      subheadingFont,
      readingFont,
      setMode,
      setTheme,
      setFontPx,
      setInterfaceFont,
      setHeadingFont,
      setSubheadingFont,
      setReadingFont,
      setUiScale,
      resetInterfaceFont,
      resetHeadingFont,
      resetSubheadingFont,
      resetReadingFont,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
