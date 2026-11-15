import { Platform } from "react-native";
import { getLocalStorage } from "../storage";
import {
  DEFAULT_HEADING_FONT,
  DEFAULT_INTERFACE_FONT,
  DEFAULT_READING_FONT,
  DEFAULT_SUBHEADING_FONT,
} from "../typography/faces";
import {
  BASE_FONT_PX,
  DEFAULT_FONT_PX,
  fontPxToScale,
} from "../typography/sizes";
import { clampUiScale, DEFAULT_UI_SCALE, snapUiScale } from "../uiScale";
import type { ThemeId } from "./themes";
import { DEFAULT_THEME, THEMES } from "./themes";
import type { ResolvedTheme, ThemeMode } from "./tokens";

export const STORAGE_KEY_THEME = "bcp-theme-mode";
export const STORAGE_KEY_THEME_FAMILY = "bcp-theme-family";
export const STORAGE_KEY_FONT = "bcp-font-scale";
export const STORAGE_KEY_UI_SCALE = "bcp-ui-scale";
export const STORAGE_KEY_INTERFACE_FONT = "bcp-font-interface";
export const STORAGE_KEY_HEADING_FONT = "bcp-font-heading";
export const STORAGE_KEY_SUBHEADING_FONT = "bcp-font-subheading";
export const STORAGE_KEY_READING_FONT = "bcp-font-reading";
// the retired single font-mode key, read once so an existing chrome-face
// choice carries over to the interface-font key
export const LEGACY_STORAGE_KEY_FONT_MODE = "bcp-font-mode";

export function getSystemTheme(): ResolvedTheme {
  if (Platform.OS !== "web") return "light";
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function webStorage(): Storage | null {
  if (Platform.OS !== "web") return null;
  return getLocalStorage();
}

export function loadThemeMode(): ThemeMode {
  const storage = webStorage();
  if (storage) {
    const v = storage.getItem(STORAGE_KEY_THEME);
    if (v === "light" || v === "dark" || v === "system") return v;
  }
  return "system";
}

export function loadFontScale(): number {
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

export function loadUiScale(): number {
  // CSS zoom has no native equivalent, so native keeps the original size
  if (Platform.OS !== "web") return DEFAULT_UI_SCALE;
  const storage = webStorage();
  if (storage) {
    const v = storage.getItem(STORAGE_KEY_UI_SCALE);
    if (v) {
      const n = Number.parseFloat(v);
      if (!Number.isNaN(n)) return snapUiScale(clampUiScale(n));
    }
  }
  // first run: the original size
  return DEFAULT_UI_SCALE;
}

export function persistThemeMode(mode: ThemeMode) {
  try {
    webStorage()?.setItem(STORAGE_KEY_THEME, mode);
  } catch {}
}

export function loadThemeFamily(): ThemeId {
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

export function persistThemeFamily(theme: ThemeId) {
  try {
    webStorage()?.setItem(STORAGE_KEY_THEME_FAMILY, theme);
  } catch {}
}

export function persistFontScale(scale: number) {
  try {
    webStorage()?.setItem(STORAGE_KEY_FONT, String(scale));
  } catch {}
}

export function persistUiScale(scale: number) {
  try {
    webStorage()?.setItem(STORAGE_KEY_UI_SCALE, String(scale));
  } catch {}
}

export function persistFont(key: string, id: string) {
  try {
    webStorage()?.setItem(key, id);
  } catch {}
}

// a selection is stored as-is, so a system id keeps working across reloads.
// the resolver falls back to the role's default when the id no longer names a
// face, so a stale or hand-edited value cannot break rendering.
export function loadInterfaceFont(): string {
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

export function loadReadingFont(): string {
  const stored = webStorage()?.getItem(STORAGE_KEY_READING_FONT);
  return stored && stored.length > 0 ? stored : DEFAULT_READING_FONT;
}

export function loadHeadingFont(): string {
  const stored = webStorage()?.getItem(STORAGE_KEY_HEADING_FONT);
  return stored && stored.length > 0 ? stored : DEFAULT_HEADING_FONT;
}

export function loadSubheadingFont(): string {
  const stored = webStorage()?.getItem(STORAGE_KEY_SUBHEADING_FONT);
  return stored && stored.length > 0 ? stored : DEFAULT_SUBHEADING_FONT;
}
