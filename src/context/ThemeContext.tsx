import { Asset } from "expo-asset";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";
import { INTER_TIGHT, SYSTEM_UI } from "../lib/fonts";
import type { ThemeId } from "../lib/theme/themes";
import { DEFAULT_THEME, THEMES, themeTokens } from "../lib/theme/themes";
import type {
  ResolvedTheme,
  ThemeMode,
  ThemeTokens,
} from "../lib/theme/tokens";
import { tokenVars } from "../lib/theme/tokens";

export type { ResolvedTheme, ThemeMode };
export type FontMode = "inter" | "system";

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
   * the font custom properties a style may reference (today just
   * `--chrome-font`). the resolver swaps var() for these values so the chrome
   * face follows the font-mode choice on web and native alike, matching the
   * css custom property applyFontMode paints on the root.
   */
  fontVars: Record<string, string>;
  fontScale: number;
  fontMode: FontMode;
  setMode: (mode: ThemeMode) => void;
  setTheme: (theme: ThemeId) => void;
  setFontScale: (scale: number) => void;
  setFontMode: (mode: FontMode) => void;
};

const STORAGE_KEY_THEME = "bcp-theme-mode";
const STORAGE_KEY_THEME_FAMILY = "bcp-theme-family";
const STORAGE_KEY_FONT = "bcp-font-scale";
const STORAGE_KEY_FONT_MODE = "bcp-font-mode";

const MIN_FONT = 0.85;
const MAX_FONT = 1.3;

function getSystemTheme(): ResolvedTheme {
  if (Platform.OS !== "web") return "light";
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function loadThemeMode(): ThemeMode {
  try {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      const v = localStorage.getItem(STORAGE_KEY_THEME);
      if (v === "light" || v === "dark" || v === "system") return v;
    }
  } catch {}
  return "system";
}

function loadFontScale(): number {
  try {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      const v = localStorage.getItem(STORAGE_KEY_FONT);
      if (v) {
        const n = Number.parseFloat(v);
        if (!Number.isNaN(n)) return Math.min(MAX_FONT, Math.max(MIN_FONT, n));
      }
    }
  } catch {}
  return 1;
}

function persistThemeMode(mode: ThemeMode) {
  try {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY_THEME, mode);
    }
  } catch {}
}

function loadThemeFamily(): ThemeId {
  try {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      const v = localStorage.getItem(STORAGE_KEY_THEME_FAMILY);
      if (v && v in THEMES) {
        // SAFETY: the `in` guard proves the stored string names a family.
        return v as ThemeId;
      }
    }
  } catch {}
  return DEFAULT_THEME;
}

function persistThemeFamily(theme: ThemeId) {
  try {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY_THEME_FAMILY, theme);
    }
  } catch {}
}

function persistFontScale(scale: number) {
  try {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY_FONT, String(scale));
    }
  } catch {}
}

function loadFontMode(): FontMode {
  try {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      const v = localStorage.getItem(STORAGE_KEY_FONT_MODE);
      if (v === "inter" || v === "system") return v;
    }
  } catch {}
  return "inter";
}

function persistFontMode(mode: FontMode) {
  try {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY_FONT_MODE, mode);
    }
  } catch {}
}

// paint the current theme into the document. every token becomes a css
// custom property on the root (--bg, --text-secondary, ...), so component
// styles that write var(--token) and the chrome-only rules below all resolve
// against the same vocabulary, and the tokens object stays the single source
// of truth for a theme.
function applyTokens(tokens: ThemeTokens, resolved: ResolvedTheme) {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  const r = document.documentElement.style;
  for (const [name, value] of Object.entries(tokenVars(tokens))) {
    r.setProperty(name, value);
  }
  // trust the color-scheme for native chrome we do not paint: the wco
  // window-controls overlay glyphs, scrollbars, and form controls. without
  // it chromium keeps the overlay light even while the app runs dark
  r.setProperty("color-scheme", resolved === "dark" ? "dark" : "light");

  // drive the installed pwa's window chrome from the app palette instead of
  // the static light value in public/index.html. chromium re-reads this meta
  // at runtime and repaints the app window title bar
  const themeMeta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"][id="theme-color"]',
  );
  if (themeMeta) themeMeta.content = tokens.bg;

  const id = "scrollbar-style";
  // SAFETY: we only create <style> elements with this id in applyTokens.
  let el = document.getElementById(id) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = id;
    document.head.appendChild(el);
  }
  // the chrome rules read --vars off the root rather than interpolating a
  // color, so the injected stylesheet and the theme can never drift
  el.textContent = `
    * { scrollbar-width: thin; scrollbar-color: var(--scrollbar) transparent; }
    /* webkitgtk smooths subpixel fonts poorly; force grayscale antialiasing */
    html, body {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }
    *::-webkit-scrollbar { width: 4px; height: 4px; }
    *::-webkit-scrollbar-track { background: transparent; }
    *::-webkit-scrollbar-thumb { background: var(--scrollbar); border-radius: 4px; }
    *::-webkit-scrollbar-thumb:hover { background: var(--text-secondary); }
    ::selection { background: var(--control-hover); color: var(--text); }
    :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    [data-picker-search]:focus-visible { outline: none; }
    /* the settings search lights up as one block: the focusing input pulls
       the accent ring around the whole pill (mag glass, field, clear), like
       the desktop chat's search, instead of ringing the input in isolation */
    [data-settings-search]:focus-within {
      outline: 2px solid var(--accent);
      outline-offset: 1px;
    }
    [data-settings-search] :focus-visible { outline: none; }
    /* installed pwa in window-controls-overlay: the top bar becomes the
       draggable titlebar, padded clear of the overlaid window buttons.
       env() is only defined while the overlay is genuinely active, so every
       declaration carries a no-overlay fallback and nothing shifts in a
       plain tab or non-wco pwa */
    [data-bcp-wco] {
      -webkit-app-region: drag;
      app-region: drag;
      height: env(titlebar-area-height, 40px) !important;
      padding-left: calc(env(titlebar-area-x, 0px) + 12px) !important;
      padding-right: calc(100% - env(titlebar-area-width) + 12px) !important;
    }
    [data-bcp-wco] [data-wco-no-drag] {
      -webkit-app-region: no-drag;
      app-region: no-drag;
    }
  `;
}

// Inter Tight is a variable font: one woff2 carries every weight, so a single
// @font-face with a weight range serves the whole chrome.
function ensureInterFont() {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  const id = "chrome-font-tight-face";
  // SAFETY: we only create <style> elements with this id here.
  if (document.getElementById(id)) return;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const tightUri = assetUri(
    require("../../assets/fonts/inter-tight-latin-var.woff2"),
  );
  if (!tightUri) return;
  const te = document.createElement("style");
  te.id = id;
  te.textContent = `@font-face{font-family:${JSON.stringify(
    INTER_TIGHT,
  )};font-style:normal;font-weight:100 900;font-display:swap;src:url(${JSON.stringify(
    tightUri,
  )}) format("woff2")}`;
  document.head.appendChild(te);
}

type FontSource = string | number | { uri?: string; localUri?: string };

function assetUri(face: FontSource): string {
  if (typeof face === "string") return face;
  if (typeof face === "object" && face !== null) {
    return face.uri ?? face.localUri ?? "";
  }
  // SAFETY: the only remaining branch is the metro module id number, which
  // expo-asset resolves to a usable asset URI.
  return Asset.fromModule(face).uri;
}

// the chrome face for a font mode: Inter Tight over the system stack, or the
// system stack alone. one source for both the css custom property (applyFontMode)
// and the js resolver's fontVars lookup, so the two can never drift.
function chromeFontStack(mode: FontMode): string {
  return mode === "inter" ? `"${INTER_TIGHT}", ${SYSTEM_UI}` : SYSTEM_UI;
}

function applyFontMode(mode: FontMode) {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  ensureInterFont();
  const r = document.documentElement.style;
  r.setProperty("--chrome-font", chromeFontStack(mode));
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "system",
  resolved: "light",
  tokens: THEMES[DEFAULT_THEME].light,
  theme: DEFAULT_THEME,
  fontVars: { "--chrome-font": chromeFontStack("inter") },
  fontScale: 1,
  fontMode: "inter",
  setMode: () => {},
  setTheme: () => {},
  setFontScale: () => {},
  setFontMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(loadThemeMode);
  const [theme, setThemeState] = useState<ThemeId>(loadThemeFamily);
  const [fontScale, setFontScaleState] = useState<number>(loadFontScale);
  const [fontMode, setFontModeState] = useState<FontMode>(loadFontMode);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  const resolved: ResolvedTheme = mode === "system" ? systemTheme : mode;
  const tokens = themeTokens(theme, resolved);
  const fontVars = useMemo(
    () => ({ "--chrome-font": chromeFontStack(fontMode) }),
    [fontMode],
  );

  useEffect(() => {
    applyTokens(tokens, resolved);
  }, [tokens, resolved]);

  useEffect(() => {
    applyFontMode(fontMode);
  }, [fontMode]);

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

  const setFontScale = useCallback((s: number) => {
    const clamped = Math.min(MAX_FONT, Math.max(MIN_FONT, s));
    setFontScaleState(clamped);
    persistFontScale(clamped);
  }, []);

  const setFontMode = useCallback((m: FontMode) => {
    setFontModeState(m);
    persistFontMode(m);
  }, []);

  const value = useMemo(
    () => ({
      mode,
      resolved,
      tokens,
      theme,
      fontVars,
      fontScale,
      fontMode,
      setMode,
      setTheme,
      setFontScale,
      setFontMode,
    }),
    [
      mode,
      resolved,
      tokens,
      theme,
      fontVars,
      fontScale,
      fontMode,
      setMode,
      setTheme,
      setFontScale,
      setFontMode,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
