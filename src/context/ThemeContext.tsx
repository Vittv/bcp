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
import { INTER, INTER_TIGHT, SYSTEM_UI } from "../lib/fonts";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";
export type FontMode = "inter" | "system";

type ThemeContextValue = {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  fontScale: number;
  fontMode: FontMode;
  setMode: (mode: ThemeMode) => void;
  setFontScale: (scale: number) => void;
  setFontMode: (mode: FontMode) => void;
};

const STORAGE_KEY_THEME = "bcp-theme-mode";
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

const LightPalette = {
  bg: "#e0dbd0",
  bgRaised: "#ece7dd",
  inputBg: "#ece7dd",
  border: "#cbc5bb",
  borderContent: "#a59d92",
  borderFaint: "rgba(44, 32, 32, 0.09)",
  rowHover: "rgba(44, 32, 32, 0.06)",
  text: "#2c2020",
  textSecondary: "#6b6159",
  accent: "#7a3040",
  scrollbar: "#a09589",
  todayBg: "rgba(122, 48, 64, 0.16)",
  selectedBg: "rgba(44, 32, 32, 0.09)",
  controlHover: "#d2cbbf",
};

const DarkPalette = {
  bg: "#1b191a",
  bgRaised: "#262425",
  inputBg: "#1f1d1f",
  border: "#333034",
  borderContent: "#545053",
  borderFaint: "rgba(255, 255, 255, 0.07)",
  rowHover: "rgba(255, 255, 255, 0.06)",
  text: "#d4d0d3",
  textSecondary: "#8d8985",
  accent: "#c85f8b",
  scrollbar: "#5a5759",
  todayBg: "rgba(200, 95, 139, 0.30)",
  selectedBg: "rgba(212, 208, 211, 0.12)",
  controlHover: "#282628",
};

// literal popover surface colors, keyed by resolved theme. applied as an
// inline style (not a stylesheet class) so the sheet can never end up
// unpainted — class-based backgrounds were reported showing content
// through the dropdowns
export const SHEET_BG: Record<ResolvedTheme, string> = {
  light: LightPalette.bg,
  dark: DarkPalette.bg,
};

function applyPalette(theme: ResolvedTheme) {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  const p = theme === "dark" ? DarkPalette : LightPalette;
  const r = document.documentElement.style;
  r.setProperty("--bg", p.bg);
  r.setProperty("--bg-raised", p.bgRaised);
  r.setProperty("--input-bg", p.inputBg);
  r.setProperty("--border", p.border);
  r.setProperty("--border-content", p.borderContent);
  r.setProperty("--border-faint", p.borderFaint);
  r.setProperty("--row-hover", p.rowHover);
  r.setProperty("--text", p.text);
  r.setProperty("--text-secondary", p.textSecondary);
  r.setProperty("--accent", p.accent);
  r.setProperty("--bg-page", p.bg);
  r.setProperty("--scrollbar", p.scrollbar);
  r.setProperty("--today-bg", p.todayBg);
  r.setProperty("--selected-bg", p.selectedBg);
  r.setProperty("--control-hover", p.controlHover);

  const id = "scrollbar-style";
  // SAFETY: we only create <style> elements with this id in applyPalette.
  let el = document.getElementById(id) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = `
    * { scrollbar-width: thin; scrollbar-color: ${p.scrollbar} transparent; }
    *::-webkit-scrollbar { width: 6px; height: 6px; }
    *::-webkit-scrollbar-track { background: transparent; }
    *::-webkit-scrollbar-thumb { background: ${p.scrollbar}; border-radius: 3px; }
    *::-webkit-scrollbar-thumb:hover { background: ${p.textSecondary}; }
  `;
}

export const INTER_FACES = [
  { weight: 400, file: "inter-latin-400-normal.woff2" },
  { weight: 500, file: "inter-latin-500-normal.woff2" },
  { weight: 600, file: "inter-latin-600-normal.woff2" },
  { weight: 700, file: "inter-latin-700-normal.woff2" },
] as const;

function ensureInterFont() {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  const id = "chrome-font-face";
  // SAFETY: we only create <style> elements with this id here.
  if (document.getElementById(id)) return;
  const faces = [
    {
      weight: 400,
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      uri: assetUri(require("../../assets/fonts/inter-latin-400-normal.woff2")),
    },
    {
      weight: 500,
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      uri: assetUri(require("../../assets/fonts/inter-latin-500-normal.woff2")),
    },
    {
      weight: 600,
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      uri: assetUri(require("../../assets/fonts/inter-latin-600-normal.woff2")),
    },
    {
      weight: 700,
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      uri: assetUri(require("../../assets/fonts/inter-latin-700-normal.woff2")),
    },
  ];
  const rules = faces
    .filter((f) => Boolean(f.uri))
    .map(
      (f) =>
        `@font-face{font-family:${JSON.stringify(INTER)};font-style:normal;font-weight:${f.weight};font-display:swap;src:url(${JSON.stringify(
          f.uri,
        )}) format("woff2")}`,
    );
  if (rules.length === 0) return;
  const el = document.createElement("style");
  el.id = id;
  el.textContent = rules.join("\n");
  document.head.appendChild(el);

  // Inter Tight is a variable font: one woff2 carries every weight, so a
  // single @font-face with a weight range replaces the per-weight Inter
  // faces. declared in its own style element so it can't be confused with
  // the static Inter faces above.
  const tightId = "chrome-font-tight-face";
  // SAFETY: we only create <style> elements with this id here.
  if (document.getElementById(tightId)) return;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const tightUri = assetUri(
    require("../../assets/fonts/inter-tight-latin-var.woff2"),
  );
  if (!tightUri) return;
  const tightEl = document.createElement("style");
  tightEl.id = tightId;
  tightEl.textContent = `@font-face{font-family:${JSON.stringify(
    INTER_TIGHT,
  )};font-style:normal;font-weight:100 900;font-display:swap;src:url(${JSON.stringify(
    tightUri,
  )}) format("woff2")}`;
  document.head.appendChild(tightEl);
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

function applyFontMode(mode: FontMode) {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  ensureInterFont();
  const r = document.documentElement.style;
  r.setProperty(
    "--chrome-font",
    mode === "inter" ? `"${INTER_TIGHT}", ${INTER}, ${SYSTEM_UI}` : SYSTEM_UI,
  );
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "system",
  resolved: "light",
  fontScale: 1,
  fontMode: "inter",
  setMode: () => {},
  setFontScale: () => {},
  setFontMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(loadThemeMode);
  const [fontScale, setFontScaleState] = useState<number>(loadFontScale);
  const [fontMode, setFontModeState] = useState<FontMode>(loadFontMode);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  const resolved: ResolvedTheme = mode === "system" ? systemTheme : mode;

  useEffect(() => {
    applyPalette(resolved);
  }, [resolved]);

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
      fontScale,
      fontMode,
      setMode,
      setFontScale,
      setFontMode,
    }),
    [mode, resolved, fontScale, fontMode, setMode, setFontScale, setFontMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
