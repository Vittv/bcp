import { Platform } from "react-native";
import {
  DEFAULT_HEADING_FONT,
  DEFAULT_INTERFACE_FONT,
  DEFAULT_READING_FONT,
  DEFAULT_SUBHEADING_FONT,
  FACES,
  type FaceDef,
  type FaceRole,
  faceById,
  faceHasRole,
  faceStack,
  readingStack,
} from "../typography/faces";
import { ensureFace, ensureReadingFace } from "../typography/loader";
import type { ResolvedTheme, ThemeTokens } from "./tokens";
import { tokenVars } from "./tokens";

// paint the current theme into the document. every token becomes a css
// custom property on the root (--bg, --text-secondary, ...), so component
// styles that write var(--token) and the chrome-only rules below all resolve
// against the same vocabulary, and the tokens object stays the single source
// of truth for a theme.
export function applyTokens(tokens: ThemeTokens, resolved: ResolvedTheme) {
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
    ::selection { background: color-mix(in srgb, var(--accent) 35%, transparent); color: var(--text); }
    /* links read as links by default; the underline clears on hover so the
       two states stay distinct without losing the resting affordance */
    a[data-external-link] { text-decoration-line: underline; }
    a[data-external-link]:hover { text-decoration-line: none; }
    /* the Ko-fi row is inline-flex, so its text is a flex item and does not
       inherit the anchor's decoration; give that span its own pair of rules */
    a[data-external-link] [data-external-text] { text-decoration-line: underline; }
    a[data-external-link]:hover [data-external-text] { text-decoration-line: none; }
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
    /* the slider drags horizontally: the nib overhangs the thin track, so the
       hit layer owns the horizontal-resize cursor for the whole control */
    [data-bcp-slider] { cursor: ew-resize; }
  `;
}

// resolve a face id against the bundled registry, keeping the role honest: a
// reading face selected as the interface falls back rather than silently
// changing what the chrome face means
function resolveFace(id: string, role: FaceRole, fallback: FaceDef): FaceDef {
  const base = faceById(id);
  if (base && faceHasRole(base, role)) return base;
  return fallback;
}

// the font vars a style may reference: the interface face, the heading face, the
// subheading face, and the reading face's three registers, each a full font-family
// stack. one source for both the css custom properties (applyFonts) and the js
// resolver, so the two cannot drift.
export function fontVarsFor(
  interfaceFont: string,
  headingFont: string,
  subheadingFont: string,
  readingFont: string,
): Record<string, string> {
  const iface = resolveFace(
    interfaceFont,
    "interface",
    FACES[DEFAULT_INTERFACE_FONT],
  );
  const heading = resolveFace(
    headingFont,
    "heading",
    FACES[DEFAULT_HEADING_FONT],
  );
  const subheading = resolveFace(
    subheadingFont,
    "subheading",
    FACES[DEFAULT_SUBHEADING_FONT],
  );
  const reading = resolveFace(
    readingFont,
    "reading",
    FACES[DEFAULT_READING_FONT],
  );
  return {
    "--chrome-font": faceStack(iface, "body"),
    "--heading-font": faceStack(heading, "body"),
    "--subheading-font": faceStack(subheading, "semibold"),
    "--reading-font": readingStack(reading, "body"),
    "--reading-font-semibold": readingStack(reading, "semibold"),
    "--reading-font-italic": readingStack(reading, "italic"),
  };
}

// paint the font vars on the root and register the injected faces: the bundled
// interface face, the heading and subheading faces, and the reading face under
// its scaled alias. useFonts registers the same files at startup but declares no
// weight, so a variable heading face is registered here too to expose its weight
// axis.
export function applyFonts(
  interfaceFont: string,
  headingFont: string,
  subheadingFont: string,
  readingFont: string,
) {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  const iface = resolveFace(
    interfaceFont,
    "interface",
    FACES[DEFAULT_INTERFACE_FONT],
  );
  if (!iface.system) ensureFace(iface);
  const heading = resolveFace(
    headingFont,
    "heading",
    FACES[DEFAULT_HEADING_FONT],
  );
  if (!heading.system) ensureFace(heading);
  const subheading = resolveFace(
    subheadingFont,
    "subheading",
    FACES[DEFAULT_SUBHEADING_FONT],
  );
  if (!subheading.system) ensureFace(subheading);
  const reading = resolveFace(
    readingFont,
    "reading",
    FACES[DEFAULT_READING_FONT],
  );
  if (!reading.system) ensureReadingFace(reading);
  const r = document.documentElement.style;
  for (const [name, value] of Object.entries(
    fontVarsFor(interfaceFont, headingFont, subheadingFont, readingFont),
  )) {
    r.setProperty(name, value);
  }
}
