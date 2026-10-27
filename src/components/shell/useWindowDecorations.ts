import { useEffect } from "react";
import { IS_MACOS_TAURI, IS_TAURI } from "../../lib/desktop";
import type { ResolvedWindowControlStyle } from "../../lib/windowDecorations";

// windows and linux stay borderless; macOS toggles native traffic lights by style.
export function useWindowDecorations(style: ResolvedWindowControlStyle): void {
  useEffect(() => {
    if (!IS_TAURI || !IS_MACOS_TAURI) return;
    let active = true;
    void import("@tauri-apps/api/window")
      .then(async ({ getCurrentWindow }) => {
        if (!active) return;
        const win = getCurrentWindow();
        try {
          const native = style === "macos";
          await win.setDecorations(native);
          if (native) await win.setTitleBarStyle("overlay");
        } catch {}
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [style]);
}
