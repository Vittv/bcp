// window-control appearance; "system" follows the host, explicit ids keep their look.
import { IS_LINUX_TAURI, IS_MACOS_TAURI, IS_WINDOWS_TAURI } from "./desktop";

export type WindowControlStyleId =
  | "system"
  | "macos"
  | "windows"
  | "linux"
  | "none";

export type ResolvedWindowControlStyle = Exclude<
  WindowControlStyleId,
  "system"
>;

export type WindowHost = "macos" | "windows" | "linux";

export type WindowDecoration = {
  id: ResolvedWindowControlStyle;
  label: string;
  // which edge of the title bar holds the cluster; null hides it
  side: "left" | "right" | null;
};

export const WINDOW_DECORATIONS: Record<
  ResolvedWindowControlStyle,
  WindowDecoration
> = {
  macos: {
    id: "macos",
    label: "macOS",
    side: "left",
  },
  windows: {
    id: "windows",
    label: "Windows",
    side: "right",
  },
  linux: {
    id: "linux",
    label: "Linux",
    side: "right",
  },
  none: {
    id: "none",
    label: "Hidden",
    side: null,
  },
};

export const WINDOW_CONTROL_OPTIONS: readonly {
  id: WindowControlStyleId;
  label: string;
}[] = [
  {
    id: "system",
    label: "System",
  },
  WINDOW_DECORATIONS.macos,
  WINDOW_DECORATIONS.windows,
  WINDOW_DECORATIONS.linux,
  WINDOW_DECORATIONS.none,
];

export function decorationFor(
  style: ResolvedWindowControlStyle,
): WindowDecoration {
  return WINDOW_DECORATIONS[style];
}

// host convention for "system", with a user-agent fallback before tauri loads.
export function hostWindow(): WindowHost {
  if (IS_MACOS_TAURI) return "macos";
  if (IS_WINDOWS_TAURI) return "windows";
  if (IS_LINUX_TAURI) return "linux";
  if (typeof navigator !== "undefined") {
    const ua = navigator.userAgent;
    if (/Macintosh|Mac OS X/i.test(ua)) return "macos";
    if (/Windows/i.test(ua)) return "windows";
    if (/Linux/i.test(ua)) return "linux";
  }
  return "windows";
}

export function resolveWindowControlStyle(
  style: WindowControlStyleId,
  host: WindowHost = hostWindow(),
): ResolvedWindowControlStyle {
  if (style !== "system") return style;
  return host;
}

const WINDOW_CONTROL_STYLE_KEY = "windowControlStyle";
// legacy show/hide key, read when no style is stored
const LEGACY_WINDOW_CONTROLS_KEY = "windowControls";

const STYLE_IDS = new Set<string>([
  "system",
  "macos",
  "windows",
  "linux",
  "none",
]);

function webStorage(): Storage | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage;
}

export function loadWindowControlStyle(): WindowControlStyleId {
  const storage = webStorage();
  if (!storage) return "system";
  const stored = storage.getItem(WINDOW_CONTROL_STYLE_KEY);
  if (stored && STYLE_IDS.has(stored)) {
    // SAFETY: the id set is the union of every WindowControlStyleId member.
    return stored as WindowControlStyleId;
  }
  return storage.getItem(LEGACY_WINDOW_CONTROLS_KEY) === "false"
    ? "none"
    : "system";
}

export function saveWindowControlStyle(style: WindowControlStyleId): void {
  const storage = webStorage();
  if (!storage) return;
  try {
    storage.setItem(WINDOW_CONTROL_STYLE_KEY, style);
    storage.removeItem(LEGACY_WINDOW_CONTROLS_KEY);
  } catch {}
}
