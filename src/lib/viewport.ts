import { useEffect, useState } from "react";
import { Platform, useWindowDimensions } from "react-native";

// the app's responsiveness vocabulary: one measured viewport plus the shared
// breakpoints, so no component re-invents one. layout follows width; input
// affordances follow the pointer type.

// the sidebar/drawer switch: below this the persistent pane becomes a drawer
export const WIDTH_MOBILE = 740;
// the bars start dropping their least informative segments below this
export const WIDTH_COMPACT = 560;
// below this the keyboard-hint caps stop earning their space
export const WIDTH_HOTKEY_CAP = 700;
// below this the top bar drops the font-size readout, keeping the A−/A+ buttons
export const WIDTH_FONT_LABEL = 440;

export type Viewport = {
  width: number;
  height: number;
  // narrow enough to stack (drawer chrome) rather than sit side by side
  isMobile: boolean;
  // narrow enough that the bars shed their optional segments
  compact: boolean;
};

// the live viewport size: useWindowDimensions already subscribes to resize on
// both platforms, so no second listener is needed
export function useViewport(): Viewport {
  const { width, height } = useWindowDimensions();
  return {
    width,
    height,
    isMobile: width < WIDTH_MOBILE,
    compact: width < WIDTH_COMPACT,
  };
}

// the primary pointer type, watched live: it decides input affordances, never
// layout, so a touchscreen laptop flips as the active pointer changes
export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(() => {
    if (Platform.OS !== "web") return true;
    if (typeof window === "undefined") return false;
    return window.matchMedia("(pointer: coarse)").matches;
  });
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const mq = window.matchMedia("(pointer: coarse)");
    const onChange = (e: MediaQueryListEvent) => setCoarse(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return coarse;
}

// whether to show a keyboard-shortcut cap: only where the user has a fine
// pointer and the bar is wide enough to spare the room
export function useShowHotkeyCap(): boolean {
  const coarse = useCoarsePointer();
  const { width } = useViewport();
  return !coarse && width >= WIDTH_HOTKEY_CAP;
}
