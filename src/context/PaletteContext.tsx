import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { registerOpenPalette } from "../lib/modalBridge";

// the floating picker modal. exactly one scope is open at a time (or
// none); the bars open by scope and the single PaletteHost at the shell
// root renders the matching index. closing clears the scope so the next
// open always starts from a fresh search.
export type PaletteScope =
  | "psalms"
  | "psalter"
  | "canticles"
  | "collects"
  | "saints"
  | "lesser-feasts"
  | "proverbs"
  | "bible"
  | "bible-chapter"
  | "search";

type PaletteState = {
  scope: PaletteScope | null;
  open: (scope: PaletteScope) => void;
  close: () => void;
};

const Ctx = createContext<PaletteState | null>(null);

// the shell's global keydown handler lives outside the provider tree, so
// it learns whether the picker is open through this flag (same module
// pattern as AppModal's escape registry): letters and shortcuts must not
// fire behind the modal while it is mounted
let paletteActive = false;
function setPaletteActive(v: boolean): void {
  paletteActive = v;
}
export function isPaletteActive(): boolean {
  return paletteActive;
}

export function PaletteProvider({ children }: { children: ReactNode }) {
  const [scope, setScope] = useState<PaletteScope | null>(null);
  const open = useCallback((s: PaletteScope) => setScope(s), []);
  const close = useCallback(() => setScope(null), []);

  useEffect(() => {
    setPaletteActive(scope !== null);
    return () => setPaletteActive(false);
  }, [scope]);

  // hand the hotkey bridge the live open() so shell keydown has somewhere
  // to route Ctrl+/ and Cmd+K
  useEffect(() => {
    registerOpenPalette(open);
    return () => {
      registerOpenPalette(null);
    };
  }, [open]);

  return <Ctx.Provider value={{ scope, open, close }}>{children}</Ctx.Provider>;
}

export function usePalette(): PaletteState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePalette outside PaletteProvider");
  return ctx;
}
