// desktop-shell detection and window-control preference. The
// preference persists in localStorage today; a ~/.config file can
// back it later without touching call sites.
//
// The desktop app is packaged with Electron. It exposes a tiny preload
// bridge as `window.bcp` (see electron/preload.ts); the plain web/PWA build
// has no such global, so these flags are false there and every shell-only
// feature (window controls, updater) stays invisible on the internet build.
type BcpBridge = {
  window: {
    minimize: () => Promise<void>;
    toggleMaximize: () => Promise<void>;
    close: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
    positionAndSize: () => Promise<{
      x: number;
      y: number;
      width: number;
      height: number;
    }>;
    monitor: () => Promise<{
      x: number;
      y: number;
      width: number;
      height: number;
    } | null>;
  };
  updater: {
    check: () => Promise<{ version: string } | null>;
    download: () => Promise<void>;
    relaunch: () => Promise<void>;
  };
};

// the packaged Electron shell (custom titlebar + updater). True only for the
// desktop app, never the web/PWA build.
export const IS_DESKTOP =
  typeof window !== "undefined" &&
  // SAFETY: the preload bridge is only ever exposed as window.bcp by the
  // Electron preload; probing it here is the intended detection mechanism
  (typeof (window as unknown as { bcp?: BcpBridge }).bcp === "object"
    ? true
    : navigator.userAgent.includes("Electron"));

// more explicit alias; some call sites prefer naming the shell directly
export const IS_ELECTRON = IS_DESKTOP;

// the browser is running the installed PWA in standalone mode (not a regular
// browser tab). Mirrors the logic in useInstallPrompt but as a synchronous
// snapshot so it can gate UI elements at render time.
export const IS_STANDALONE =
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    ("standalone" in navigator &&
      (navigator as { standalone?: boolean }).standalone === true));

export const IS_MACOS =
  IS_DESKTOP &&
  typeof navigator !== "undefined" &&
  /Macintosh|Mac OS X/i.test(navigator.userAgent);

// only Windows treats maximize as a real, queryable window state; Linux
// tiling compositors report tiled windows as "maximized", so the restore
// icon would lie
export const IS_WINDOWS =
  IS_DESKTOP &&
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
