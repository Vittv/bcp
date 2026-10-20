import { useEffect, useState } from "react";
import { Platform, useWindowDimensions } from "react-native";
import { useTheme } from "../context/ThemeContext";

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
  // the window before the UI zoom is divided out
  rawWidth: number;
  rawHeight: number;
  // narrow enough to stack (drawer chrome) rather than sit side by side
  isMobile: boolean;
  // narrow enough that the bars shed their optional segments
  compact: boolean;
};

// the live viewport, with the UI zoom divided out on web so breakpoints follow
// the space the layout actually has. useWindowDimensions owns the resize
// subscription; native does not zoom, so it keeps the raw size.
export function useViewport(): Viewport {
  const { width, height } = useWindowDimensions();
  const { uiScale } = useTheme();
  const zoom = Platform.OS === "web" ? uiScale : 1;
  const effectiveWidth = width / zoom;
  const effectiveHeight = height / zoom;
  return {
    width: effectiveWidth,
    height: effectiveHeight,
    rawWidth: width,
    rawHeight: height,
    isMobile: effectiveWidth < WIDTH_MOBILE,
    compact: effectiveWidth < WIDTH_COMPACT,
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
