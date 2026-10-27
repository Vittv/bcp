import type { Window } from "@tauri-apps/api/window";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { IS_WINDOWS_TAURI } from "../../lib/desktop";
import {
  defineThemedStyles,
  useThemedStyles,
  useThemeVar,
} from "../../lib/theme/themedStyles";
import type { ResolvedWindowControlStyle } from "../../lib/windowDecorations";

// fixed platform fills; the traffic-light colors do not follow the app palette
const MAC_CLOSE = "#ff5c60";
const MAC_MINIMIZE = "#fac800";
const MAC_MAXIMIZE = "#35c759";
// each light has a darker rim of its own fill, independent of theme
const MAC_CLOSE_BORDER = "#e24b41";
const MAC_MINIMIZE_BORDER = "#e1a73e";
const MAC_MAXIMIZE_BORDER = "#2dac2f";
const MAC_CLOSE_GLYPH = "rgba(81, 8, 7, 0.8)";
const MAC_MINIMIZE_GLYPH = "rgba(117, 72, 0, 0.85)";
const MAC_MAXIMIZE_GLYPH = "rgba(19, 82, 21, 0.85)";
const WINDOWS_CLOSE_HOVER = "#c42b1c";
const LINUX_CLOSE_HOVER = "#c01c28";
const CLOSE_GLYPH = "#ffffff";

function MinimizeGlyph({
  color,
  width = 10,
}: {
  color: string;
  width?: number;
}) {
  const styles = useThemedStyles(windowControlStyles);
  return <View style={[styles.bar, { width, backgroundColor: color }]} />;
}

function MaximizeGlyph({ color, size = 10 }: { color: string; size?: number }) {
  const styles = useThemedStyles(windowControlStyles);
  return (
    <View
      style={[styles.box, { width: size, height: size, borderColor: color }]}
    />
  );
}

function RestoreGlyph({ color, size = 10 }: { color: string; size?: number }) {
  const styles = useThemedStyles(windowControlStyles);
  const v = useThemeVar();
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.box,
          styles.restoreBack,
          { width: size, height: size, borderColor: color },
        ]}
      />
      <View
        style={[
          styles.box,
          styles.restoreFront,
          {
            width: size,
            height: size,
            borderColor: color,
            backgroundColor: v("var(--bg)"),
          },
        ]}
      />
    </View>
  );
}

function CloseGlyph({ color, size = 10 }: { color: string; size?: number }) {
  const styles = useThemedStyles(windowControlStyles);
  return (
    <View style={[styles.closeWrap, { width: size, height: size }]}>
      <View
        style={[
          styles.bar,
          styles.closeBarA,
          { width: size, backgroundColor: color },
        ]}
      />
      <View
        style={[
          styles.bar,
          styles.closeBarB,
          { width: size, backgroundColor: color },
        ]}
      />
    </View>
  );
}

// two opposing right triangles form the zoom mark
function MacZoomGlyph({ color, size = 7 }: { color: string; size?: number }) {
  const styles = useThemedStyles(windowControlStyles);
  const edge = size - 1.5;
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.zoomTriangle,
          styles.zoomTopRight,
          {
            borderTopWidth: edge,
            borderLeftWidth: edge,
            borderTopColor: color,
            borderLeftColor: "transparent",
          },
        ]}
      />
      <View
        style={[
          styles.zoomTriangle,
          styles.zoomBottomLeft,
          {
            borderBottomWidth: edge,
            borderRightWidth: edge,
            borderBottomColor: color,
            borderRightColor: "transparent",
          },
        ]}
      />
    </View>
  );
}

type WindowActions = {
  ready: boolean;
  maximized: boolean;
  minimize: () => void;
  toggle: () => void;
  close: () => void;
};

// infer maximize from monitor coverage; tiling compositors report tiles as
// maximized and the reported flag is unreliable.
function useWindowActions(): WindowActions {
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

// flat titlebar button: full-height, square edges, red close hover
function FlatControlButton({
  label,
  close = false,
  round = false,
  disabled,
  onPress,
  children,
}: {
  label: string;
  close?: boolean;
  round?: boolean;
  disabled: boolean;
  onPress: () => void;
  children: (color: string) => ReactNode;
}) {
  const styles = useThemedStyles(windowControlStyles);
  const v = useThemeVar();
  const [hovered, setHovered] = useState(false);
  const color = close && hovered ? CLOSE_GLYPH : v("var(--text-secondary)");
  const base = round ? styles.roundButton : styles.flatButton;
  const hover = round
    ? close
      ? styles.roundCloseHover
      : styles.roundHover
    : close
      ? styles.flatCloseHover
      : styles.flatHover;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[base, hovered && hover]}
    >
      {children(color)}
    </Pressable>
  );
}

function WindowsControls({ actions }: { actions: WindowActions }) {
  const styles = useThemedStyles(windowControlStyles);
  return (
    <View style={styles.flatRow}>
      <FlatControlButton
        label="Minimize"
        disabled={!actions.ready}
        onPress={actions.minimize}
      >
        {(color) => <MinimizeGlyph color={color} />}
      </FlatControlButton>
      <FlatControlButton
        label={actions.maximized ? "Restore" : "Maximize"}
        disabled={!actions.ready}
        onPress={actions.toggle}
      >
        {(color) =>
          actions.maximized ? (
            <RestoreGlyph color={color} />
          ) : (
            <MaximizeGlyph color={color} />
          )
        }
      </FlatControlButton>
      <FlatControlButton
        label="Close"
        close
        disabled={!actions.ready}
        onPress={actions.close}
      >
        {(color) => <CloseGlyph color={color} />}
      </FlatControlButton>
    </View>
  );
}

function LinuxControls({ actions }: { actions: WindowActions }) {
  const styles = useThemedStyles(windowControlStyles);
  return (
    <View style={styles.roundRow}>
      <FlatControlButton
        label="Minimize"
        round
        disabled={!actions.ready}
        onPress={actions.minimize}
      >
        {(color) => <MinimizeGlyph color={color} width={9} />}
      </FlatControlButton>
      <FlatControlButton
        label={actions.maximized ? "Restore" : "Maximize"}
        round
        disabled={!actions.ready}
        onPress={actions.toggle}
      >
        {(color) =>
          actions.maximized ? (
            <RestoreGlyph color={color} size={9} />
          ) : (
            <MaximizeGlyph color={color} size={9} />
          )
        }
      </FlatControlButton>
      <FlatControlButton
        label="Close"
        close
        round
        disabled={!actions.ready}
        onPress={actions.close}
      >
        {(color) => <CloseGlyph color={color} size={9} />}
      </FlatControlButton>
    </View>
  );
}

function MacControlButton({
  label,
  color,
  borderColor,
  disabled,
  showGlyph,
  onHoverIn,
  onHoverOut,
  onPress,
  children,
}: {
  label: string;
  color: string;
  borderColor: string;
  disabled: boolean;
  showGlyph: boolean;
  onHoverIn: () => void;
  onHoverOut: () => void;
  onPress: () => void;
  children: ReactNode;
}) {
  const styles = useThemedStyles(windowControlStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={({ pressed }) => [
        styles.macButton,
        pressed && !disabled && styles.macButtonPressed,
      ]}
    >
      <View style={[styles.macLight, { backgroundColor: color, borderColor }]}>
        {showGlyph ? children : null}
      </View>
    </Pressable>
  );
}

function MacControls({ actions }: { actions: WindowActions }) {
  const styles = useThemedStyles(windowControlStyles);
  // reveal all glyphs over the cluster; the short delay bridges gaps between buttons
  const [hovered, setHovered] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    [],
  );
  const showGlyphs = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    setHovered(true);
  };
  const hideGlyphs = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      setHovered(false);
      hideTimer.current = null;
    }, 60);
  };
  return (
    <View style={styles.macRow}>
      <MacControlButton
        label="Close"
        color={MAC_CLOSE}
        borderColor={MAC_CLOSE_BORDER}
        disabled={!actions.ready}
        showGlyph={hovered}
        onHoverIn={showGlyphs}
        onHoverOut={hideGlyphs}
        onPress={actions.close}
      >
        <CloseGlyph color={MAC_CLOSE_GLYPH} size={7} />
      </MacControlButton>
      <MacControlButton
        label="Minimize"
        color={MAC_MINIMIZE}
        borderColor={MAC_MINIMIZE_BORDER}
        disabled={!actions.ready}
        showGlyph={hovered}
        onHoverIn={showGlyphs}
        onHoverOut={hideGlyphs}
        onPress={actions.minimize}
      >
        <MinimizeGlyph color={MAC_MINIMIZE_GLYPH} width={7} />
      </MacControlButton>
      <MacControlButton
        label={actions.maximized ? "Restore" : "Maximize"}
        color={MAC_MAXIMIZE}
        borderColor={MAC_MAXIMIZE_BORDER}
        disabled={!actions.ready}
        showGlyph={hovered}
        onHoverIn={showGlyphs}
        onHoverOut={hideGlyphs}
        onPress={actions.toggle}
      >
        <MacZoomGlyph color={MAC_MAXIMIZE_GLYPH} size={7} />
      </MacControlButton>
    </View>
  );
}

// custom titlebar cluster; the style picks the edge and glyph convention
export function WindowControls({
  style,
}: {
  style: ResolvedWindowControlStyle;
}) {
  const actions = useWindowActions();
  switch (style) {
    case "macos":
      return <MacControls actions={actions} />;
    case "linux":
      return <LinuxControls actions={actions} />;
    case "windows":
      return <WindowsControls actions={actions} />;
    default:
      return null;
  }
}

const windowControlStyles = defineThemedStyles({
  flatRow: {
    flexDirection: "row",
    flexShrink: 0,
  },
  flatButton: {
    // 46px is the standard titlebar button width
    width: 46,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  flatHover: {
    backgroundColor: "var(--control-hover)",
  },
  flatCloseHover: {
    backgroundColor: WINDOWS_CLOSE_HOVER,
  },
  roundRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingRight: 6,
    flexShrink: 0,
  },
  roundButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  roundHover: {
    backgroundColor: "var(--control-hover)",
  },
  roundCloseHover: {
    backgroundColor: LINUX_CLOSE_HOVER,
  },
  macRow: {
    flexDirection: "row",
    alignItems: "center",
    // 14px lights in 23px buttons, with trailing padding before the season label
    paddingRight: 13,
    flexShrink: 0,
  },
  macButton: {
    width: 23,
    height: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  macButtonPressed: {
    opacity: 0.65,
  },
  macLight: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 0.5,
    alignItems: "center",
    justifyContent: "center",
  },
  bar: {
    height: 1.5,
    borderRadius: 1,
  },
  box: {
    borderWidth: 1.2,
    borderRadius: 1,
  },
  restoreBack: {
    position: "absolute",
    top: -2,
    right: -2,
  },
  restoreFront: {
    position: "absolute",
    left: 0,
    bottom: 0,
  },
  closeWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  closeBarA: {
    position: "absolute",
    transform: [{ rotate: "45deg" }],
  },
  closeBarB: {
    position: "absolute",
    transform: [{ rotate: "-45deg" }],
  },
  zoomTriangle: {
    width: 0,
    height: 0,
    borderColor: "transparent",
  },
  zoomTopRight: {
    position: "absolute",
    top: 0,
    right: 0,
  },
  zoomBottomLeft: {
    position: "absolute",
    bottom: 0,
    left: 0,
  },
});
