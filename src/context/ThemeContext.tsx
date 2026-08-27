import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  fontScale: number;
  setMode: (mode: ThemeMode) => void;
  setFontScale: (scale: number) => void;
};

const STORAGE_KEY_THEME = "bcp-theme-mode";
const STORAGE_KEY_FONT = "bcp-font-scale";

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

const LightPalette = {
  bg: "#e0dbd0",
  bgRaised: "#ece7dd",
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

const ThemeContext = createContext<ThemeContextValue>({
  mode: "system",
  resolved: "light",
  fontScale: 1,
  setMode: () => {},
  setFontScale: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(loadThemeMode);
  const [fontScale, setFontScaleState] = useState<number>(loadFontScale);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  const resolved: ResolvedTheme = mode === "system" ? systemTheme : mode;

  useEffect(() => {
    applyPalette(resolved);
  }, [resolved]);

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

  const value = useMemo(
    () => ({ mode, resolved, fontScale, setMode, setFontScale }),
    [mode, resolved, fontScale, setMode, setFontScale],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
