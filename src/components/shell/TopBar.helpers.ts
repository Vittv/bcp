import { useEffect, useState } from "react";

import type { Season } from "../../lib/calendar/types";

// forwarded by react-native-web as data-tauri-drag-region; tauri's
// injected script turns mousedown/double-click on it into window
// dragging and maximize toggling
export const DRAG_DATA = { tauriDragRegion: "" };

// forwarded as data-bcp-wco / data-wco-no-drag; ThemeContext injects a
// stylesheet that turns the top bar into the pwa's draggable titlebar and
// keeps the interactive controls clickable beside the overlaid buttons
export const WCO_DATA = { wco: "" };
export const WCO_STOP = { wcoNoDrag: "" };

// true while the installed pwa runs inside window-controls-overlay (chromium
// only). the browser merges the overlay into the app surface and sets visible
// as soon as the user toggles the "Hide title bar" button
export function useWindowControlsOverlay(): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    // SAFETY: probes the experimental windowControlsOverlay API on Navigator,
    // guarded by the in-existence check below and never used on native or
    // non-chromium webviews where it is absent
    const wco = (
      navigator as Navigator & {
        windowControlsOverlay?: {
          visible: boolean;
          addEventListener(type: "geometrychange", cb: () => void): void;
          removeEventListener(type: "geometrychange", cb: () => void): void;
        };
      }
    ).windowControlsOverlay;
    if (!wco) return;
    const update = () => setVisible(wco.visible);
    update();
    wco.addEventListener("geometrychange", update);
    return () => wco.removeEventListener("geometrychange", update);
  }, []);
  return visible;
}

export const SEASON_LABEL: Record<Season, string> = {
  advent: "Advent",
  christmas: "Christmas",
  epiphany: "Epiphany",
  lent: "Lent",
  "holy-week": "Holy Week",
  easter: "Easter",
  pentecost: "Pentecost",
  "after-pentecost": "After Pentecost",
};

// fallback for feast slugs unknown to the sanctorale table
export function formatHolyDay(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
