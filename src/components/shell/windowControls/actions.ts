import type { Window } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";

import { IS_WINDOWS_TAURI } from "../../../lib/desktop";

export type WindowActions = {
  ready: boolean;
  maximized: boolean;
  minimize: () => void;
  toggle: () => void;
  close: () => void;
};

// infer maximize from monitor coverage; tiling compositors report tiles as
// maximized and the reported flag is unreliable.
export function useWindowActions(): WindowActions {
  const [win, setWin] = useState<Window | null>(null);
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    let active = true;
    let unlisten: (() => void) | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // lazy so PWA/native bundles never execute tauri ipc code paths
    import("@tauri-apps/api/window").then(
      ({ getCurrentWindow, currentMonitor }) => {
        if (!active) return;
        const w = getCurrentWindow();
        setWin(w);

        const refresh = async () => {
          try {
            if (IS_WINDOWS_TAURI) {
              setMaximized(await w.isMaximized());
              return;
            }
            const [pos, size, mon] = await Promise.all([
              w.outerPosition(),
              w.outerSize(),
              currentMonitor(),
            ]);
            if (!mon) {
              setMaximized(false);
              return;
            }
            // outerPosition/outerSize and Monitor.size are all physical
            // pixels, so they compare directly
            const xOverlap =
              Math.min(pos.x + size.width, mon.position.x + mon.size.width) -
              Math.max(pos.x, mon.position.x);
            const yOverlap =
              Math.min(pos.y + size.height, mon.position.y + mon.size.height) -
              Math.max(pos.y, mon.position.y);
            const covered = Math.max(0, xOverlap) * Math.max(0, yOverlap);
            const total = mon.size.width * mon.size.height;
            setMaximized(covered >= 0.9 * total);
          } catch {
            // transient mid-resize query failures: keep last state
          }
        };

        void refresh();
        void w
          .onResized(() => {
            clearTimeout(timer);
            timer = setTimeout(refresh, 80);
          })
          .then((fn) => {
            if (active) {
              unlisten = fn;
            } else {
              fn();
            }
          });
      },
    );
    return () => {
      active = false;
      clearTimeout(timer);
      unlisten?.();
    };
  }, []);

  return {
    ready: win !== null,
    maximized,
    minimize: () => void win?.minimize(),
    toggle: () => void win?.toggleMaximize(),
    close: () => void win?.close(),
  };
}
