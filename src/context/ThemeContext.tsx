import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";
import type { ThemeId } from "../lib/theme/themes";
import { DEFAULT_THEME, THEMES, themeTokens } from "../lib/theme/themes";
import type {
  ResolvedTheme,
  ThemeMode,
  ThemeTokens,
} from "../lib/theme/tokens";
import { tokenVars } from "../lib/theme/tokens";
import {
  DEFAULT_HEADING_FONT,
  DEFAULT_INTERFACE_FONT,
  DEFAULT_READING_FONT,
  FACES,
  type FaceDef,
  type FaceRole,
  faceById,
  faceHasRole,
  faceStack,
  HEADING_FACES,
  INTERFACE_FACES,
  READING_FACES,
} from "../lib/typography/faces";
import { ensureFace } from "../lib/typography/loader";
import {
  BASE_FONT_PX,
  DEFAULT_FONT_PX,
  fontPxToScale,
  scaleToFontPx,
} from "../lib/typography/sizes";
import {
  listSystemFonts,
  type SystemFontsState,
  systemFaceDef,
  systemFamilyFromId,
  systemFontsSupported,
} from "../lib/typography/systemFonts";

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
   * interface face, `--heading-font` for the heading face, and the reading
   * face's three registers. the resolver swaps var() for these values so a face
   * follows the choice on web and native alike, matching the css custom
   * properties applyFonts paints on the root.
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
   * the interface, heading, and reading face ids, separate axes so the chrome
   * face, the display face, and the reader face are chosen independently. plain
   * strings so a system face can join the list; the resolver falls back to the
   * role's default.
   */
  interfaceFont: string;
  headingFont: string;
  readingFont: string;
  /** the faces each role picker offers: bundled faces then the machine's. */
  interfaceFaces: FaceDef[];
  headingFaces: FaceDef[];
  readingFaces: FaceDef[];
  /**
   * whether the machine's own fonts are offered yet. `idle` until a picker
   * first opens, because enumerating them is a request the shell or the
   * browser only answers on demand.
   */
  systemFontsState: SystemFontsState;
  setMode: (mode: ThemeMode) => void;
  setTheme: (theme: ThemeId) => void;
  setFontPx: (px: number) => void;
  setInterfaceFont: (id: string) => void;
  setHeadingFont: (id: string) => void;
  setReadingFont: (id: string) => void;
  /** ask for the machine's fonts; safe to call on every picker open. */
  ensureSystemFonts: () => void;
};

const STORAGE_KEY_THEME = "bcp-theme-mode";
const STORAGE_KEY_THEME_FAMILY = "bcp-theme-family";
const STORAGE_KEY_FONT = "bcp-font-scale";
const STORAGE_KEY_INTERFACE_FONT = "bcp-font-interface";
const STORAGE_KEY_HEADING_FONT = "bcp-font-heading";
const STORAGE_KEY_READING_FONT = "bcp-font-reading";
// the retired single font-mode key, read once so an existing chrome-face
// choice carries over to the interface-font key
const LEGACY_STORAGE_KEY_FONT_MODE = "bcp-font-mode";

function getSystemTheme(): ResolvedTheme {
  if (Platform.OS !== "web") return "light";
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function webStorage(): Storage | null {
  if (Platform.OS !== "web") return null;
  if (typeof localStorage === "undefined") return null;
  return localStorage;
}

function loadThemeMode(): ThemeMode {
  const storage = webStorage();
  if (storage) {
    const v = storage.getItem(STORAGE_KEY_THEME);
    if (v === "light" || v === "dark" || v === "system") return v;
  }
  return "system";
}

function loadFontScale(): number {
  const storage = webStorage();
  if (storage) {
    const v = storage.getItem(STORAGE_KEY_FONT);
    if (v) {
      const n = Number.parseFloat(v);
      // snap a stored value onto the ladder, so an arbitrary scale from an
      // older build still lands on a real size
      if (!Number.isNaN(n)) return fontPxToScale(n * BASE_FONT_PX);
    }
  }
  return fontPxToScale(DEFAULT_FONT_PX);
}

function persistThemeMode(mode: ThemeMode) {
  try {
    webStorage()?.setItem(STORAGE_KEY_THEME, mode);
  } catch {}
}

function loadThemeFamily(): ThemeId {
  const storage = webStorage();
  if (storage) {
    const v = storage.getItem(STORAGE_KEY_THEME_FAMILY);
    if (v && v in THEMES) {
      // SAFETY: the `in` guard proves the stored string names a family.
      return v as ThemeId;
    }
  }
  return DEFAULT_THEME;
}

function persistThemeFamily(theme: ThemeId) {
  try {
    webStorage()?.setItem(STORAGE_KEY_THEME_FAMILY, theme);
  } catch {}
}

function persistFontScale(scale: number) {
  try {
    webStorage()?.setItem(STORAGE_KEY_FONT, String(scale));
  } catch {}
}

// a selection is stored as-is, so a system id keeps working across reloads.
// the resolver falls back to the role's default when the id no longer names a
// face, so a stale or hand-edited value cannot break rendering.
function loadInterfaceFont(): string {
  const storage = webStorage();
  if (storage) {
    const stored = storage.getItem(STORAGE_KEY_INTERFACE_FONT);
    if (stored) return stored;
    // seed the interface-font key from the retired font-mode value, once
    const legacy = storage.getItem(LEGACY_STORAGE_KEY_FONT_MODE);
    if (legacy === "inter" || legacy === "system") {
      persistFont(STORAGE_KEY_INTERFACE_FONT, legacy);
      return legacy;
    }
  }
  return DEFAULT_INTERFACE_FONT;
}

function loadReadingFont(): string {
  const stored = webStorage()?.getItem(STORAGE_KEY_READING_FONT);
  return stored && stored.length > 0 ? stored : DEFAULT_READING_FONT;
}

function loadHeadingFont(): string {
  const stored = webStorage()?.getItem(STORAGE_KEY_HEADING_FONT);
  return stored && stored.length > 0 ? stored : DEFAULT_HEADING_FONT;
}

function persistFont(key: string, id: string) {
  try {
    webStorage()?.setItem(key, id);
  } catch {}
}

// the faint border at a fraction of its opacity, for textures that should read
// as paper rather than structure. every theme's faint border is rgba(...)
function fade(color: string, factor: number): string {
  const match = color.match(/rgba?\(([^)]+)\)/);
  if (!match) return color;
  const [r, g, b, a] = match[1].split(",").map((part) => Number(part.trim()));
  if (![r, g, b].every(Number.isFinite)) return color;
  const alpha = Number.isFinite(a) ? a : 1;
  return `rgba(${r}, ${g}, ${b}, ${Number((alpha * factor).toFixed(3))})`;
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
  // the specimen's paper is a texture, not a structure: half the faint border,
  // so the grid sits behind the type instead of competing with it
  r.setProperty("--grid-line", fade(tokens.borderFaint, 0.5));
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
    /* the font preview sits on faint graph paper: a token grid the theme
       repaints, at half the faint border's strength so it reads as paper
       rather than structure. only the web build paints a background-image */
    [data-font-preview] {
      background-image:
        linear-gradient(to right, var(--grid-line) 1px, transparent 1px),
        linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px);
      background-size: 20px 20px;
    }
    /* the slider drags horizontally: the nib overhangs the thin track, so the
       hit layer owns the horizontal-resize cursor for the whole control */
    [data-bcp-slider] { cursor: ew-resize; }
  `;
}

// resolve a face id against the bundled registry and the machine's faces,
// keeping the role honest: a reading face selected as the interface falls back
// rather than silently changing what the chrome face means. a `sys:` id names a
// family the machine already has, so it is synthesized directly and needs no
// enumeration to survive a reload.
function resolveFace(id: string, role: FaceRole, fallback: FaceDef): FaceDef {
  const family = systemFamilyFromId(id);
  if (family !== null) return systemFaceDef(family);
  const base = faceById(id);
  if (base && faceHasRole(base, role)) return base;
  return fallback;
}

// the font vars a style may reference: the interface face, the heading face, and
// the reading face's three registers, each a full font-family stack. one source
// for both the css custom properties (applyFonts) and the js resolver, so the two
// cannot drift.
function fontVarsFor(
  interfaceFont: string,
  headingFont: string,
  readingFont: string,
): Record<string, string> {
  const iface = resolveFace(interfaceFont, "interface", FACES.inter);
  const heading = resolveFace(
    headingFont,
    "heading",
    FACES["playfair-display"],
  );
  const reading = resolveFace(readingFont, "reading", FACES["crimson-pro"]);
  return {
    "--chrome-font": faceStack(iface, "body"),
    "--heading-font": faceStack(heading, "body"),
    "--reading-font": faceStack(reading, "body"),
    "--reading-font-semibold": faceStack(reading, "semibold"),
    "--reading-font-italic": faceStack(reading, "italic"),
  };
}

// paint the font vars on the root and register the interface face. the heading
// and reading faces load through useFonts in App.tsx at startup, so only a
// bundled interface face is injected here.
function applyFonts(
  interfaceFont: string,
  headingFont: string,
  readingFont: string,
) {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  const iface = resolveFace(interfaceFont, "interface", FACES.inter);
  if (!iface.system) ensureFace(iface);
  const r = document.documentElement.style;
  for (const [name, value] of Object.entries(
    fontVarsFor(interfaceFont, headingFont, readingFont),
  )) {
    r.setProperty(name, value);
  }
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "system",
  resolved: "light",
  tokens: THEMES[DEFAULT_THEME].light,
  theme: DEFAULT_THEME,
  fontVars: fontVarsFor(
    DEFAULT_INTERFACE_FONT,
    DEFAULT_HEADING_FONT,
    DEFAULT_READING_FONT,
  ),
  fontScale: 1,
  fontPx: DEFAULT_FONT_PX,
  interfaceFont: DEFAULT_INTERFACE_FONT,
  headingFont: DEFAULT_HEADING_FONT,
  readingFont: DEFAULT_READING_FONT,
  interfaceFaces: INTERFACE_FACES,
  headingFaces: HEADING_FACES,
  readingFaces: READING_FACES,
  systemFontsState: "unavailable",
  setMode: () => {},
  setTheme: () => {},
  setFontPx: () => {},
  setInterfaceFont: () => {},
  setHeadingFont: () => {},
  setReadingFont: () => {},
  ensureSystemFonts: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(loadThemeMode);
  const [theme, setThemeState] = useState<ThemeId>(loadThemeFamily);
  const [fontScale, setFontScaleState] = useState<number>(loadFontScale);
  const [interfaceFont, setInterfaceFontState] =
    useState<string>(loadInterfaceFont);
  const [headingFont, setHeadingFontState] = useState<string>(loadHeadingFont);
  const [readingFont, setReadingFontState] = useState<string>(loadReadingFont);
  const [systemFonts, setSystemFonts] = useState<string[]>([]);
  const [systemFontsState, setSystemFontsState] = useState<SystemFontsState>(
    systemFontsSupported() ? "idle" : "unavailable",
  );
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);
  // a picker may open many times; the request runs once and the cache in the
  // provider module backs the repeat calls.
  const systemRequested = useRef(false);

  // the machine's fonts join the bundled pool: a face with no bytes, resolved by
  // the renderer, offered to both role pickers.
  const systemFaces = useMemo(
    () => systemFonts.map(systemFaceDef),
    [systemFonts],
  );
  const interfaceFaces = useMemo(
    () => [
      ...INTERFACE_FACES,
      ...systemFaces.filter((face) => faceHasRole(face, "interface")),
    ],
    [systemFaces],
  );
  const headingFaces = useMemo(
    () => [
      ...HEADING_FACES,
      ...systemFaces.filter((face) => faceHasRole(face, "heading")),
    ],
    [systemFaces],
  );
  const readingFaces = useMemo(
    () => [
      ...READING_FACES,
      ...systemFaces.filter((face) => faceHasRole(face, "reading")),
    ],
    [systemFaces],
  );

  const resolved: ResolvedTheme = mode === "system" ? systemTheme : mode;
  const tokens = themeTokens(theme, resolved);
  const fontVars = useMemo(
    () => fontVarsFor(interfaceFont, headingFont, readingFont),
    [interfaceFont, headingFont, readingFont],
  );

  useEffect(() => {
    applyTokens(tokens, resolved);
  }, [tokens, resolved]);

  useEffect(() => {
    applyFonts(interfaceFont, headingFont, readingFont);
  }, [interfaceFont, headingFont, readingFont]);

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

  const setInterfaceFont = useCallback((id: string) => {
    setInterfaceFontState(id);
    persistFont(STORAGE_KEY_INTERFACE_FONT, id);
  }, []);

  const setHeadingFont = useCallback((id: string) => {
    setHeadingFontState(id);
    persistFont(STORAGE_KEY_HEADING_FONT, id);
  }, []);

  const setReadingFont = useCallback((id: string) => {
    setReadingFontState(id);
    persistFont(STORAGE_KEY_READING_FONT, id);
  }, []);

  // enumerate the machine's fonts on first use. nothing loads at startup: the
  // list is only wanted when a picker is open, and on web the browser prompts
  // for the local-font permission from a user gesture such as that open.
  const ensureSystemFonts = useCallback(() => {
    if (systemRequested.current) return;
    systemRequested.current = true;
    if (!systemFontsSupported()) {
      setSystemFontsState("unavailable");
      return;
    }
    setSystemFontsState("loading");
    void listSystemFonts().then((names) => {
      setSystemFonts(names);
      setSystemFontsState(names.length > 0 ? "ready" : "unavailable");
    });
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
      interfaceFont,
      headingFont,
      readingFont,
      interfaceFaces,
      headingFaces,
      readingFaces,
      systemFontsState,
      setMode,
      setTheme,
      setFontPx,
      setInterfaceFont,
      setHeadingFont,
      setReadingFont,
      ensureSystemFonts,
    }),
    [
      mode,
      resolved,
      tokens,
      theme,
      fontVars,
      fontScale,
      fontPx,
      interfaceFont,
      headingFont,
      readingFont,
      interfaceFaces,
      headingFaces,
      readingFaces,
      systemFontsState,
      setMode,
      setTheme,
      setFontPx,
      setInterfaceFont,
      setHeadingFont,
      setReadingFont,
      ensureSystemFonts,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
