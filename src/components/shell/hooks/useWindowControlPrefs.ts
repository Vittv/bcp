import { useCallback, useState } from "react";
import {
  loadWindowControlStyle,
  resolveWindowControlStyle,
  saveWindowControlStyle,
  type WindowControlStyleId,
} from "../../../lib/windowDecorations";
import { useWindowDecorations } from "../useWindowDecorations";

export function useWindowControlPrefs() {
  // stored window-control choice; "system" resolves to the host convention
  const [windowControlStyle, setWindowControlStyleRaw] = useState(
    loadWindowControlStyle,
  );
  const setWindowControlStyle = useCallback((style: WindowControlStyleId) => {
    setWindowControlStyleRaw(style);
    saveWindowControlStyle(style);
  }, []);
  const resolvedWindowControlStyle =
    resolveWindowControlStyle(windowControlStyle);
  useWindowDecorations(resolvedWindowControlStyle);

  return {
    windowControlStyle,
    setWindowControlStyle,
    resolvedWindowControlStyle,
  };
}
