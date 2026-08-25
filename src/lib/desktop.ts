// desktop-shell detection and window-control preference. The
// preference persists in localStorage today; a ~/.config file can
// back it later without touching call sites.
export const IS_TAURI =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export const IS_MACOS_TAURI =
  IS_TAURI &&
  typeof navigator !== "undefined" &&
  /Macintosh|Mac OS X/i.test(navigator.userAgent);

// only Windows treats maximize as a real, queryable window state;
// Linux tiling compositors report tiled windows as "maximized", so
// the restore icon would lie
export const IS_WINDOWS_TAURI =
  IS_TAURI &&
  typeof navigator !== "undefined" &&
  /Windows/i.test(navigator.userAgent);

const WINDOW_CONTROLS_KEY = "windowControls";

export function loadWindowControls(): boolean {
  if (typeof localStorage === "undefined") return true;
  return localStorage.getItem(WINDOW_CONTROLS_KEY) !== "false";
}

export function saveWindowControls(show: boolean): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(WINDOW_CONTROLS_KEY, String(show));
}
