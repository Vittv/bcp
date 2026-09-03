import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import type { BcpBridge } from "../../../electron/ipc";
import { IS_DESKTOP, IS_WINDOWS } from "../../lib/desktop";

const GLYPH_COLOR = "var(--text-secondary, #7a6e64)";

function MinimizeGlyph({ color }: { color: string }) {
  return <View style={[styles.bar, { backgroundColor: color }]} />;
}

function MaximizeGlyph({ color }: { color: string }) {
  return <View style={[styles.box, { borderColor: color }]} />;
}

function RestoreGlyph({ color }: { color: string }) {
  return (
    <View style={styles.restoreWrap}>
      <View style={[styles.box, styles.restoreBack, { borderColor: color }]} />
      <View
        style={[
          styles.box,
          styles.restoreFront,
          { borderColor: color, backgroundColor: "var(--bg, #e0dbd0)" },
        ]}
      />
    </View>
  );
}

function CloseGlyph({ color }: { color: string }) {
  return (
    <View style={styles.closeWrap}>
      <View
        style={[styles.bar, styles.closeBarA, { backgroundColor: color }]}
      />
      <View
        style={[styles.bar, styles.closeBarB, { backgroundColor: color }]}
      />
    </View>
  );
}

function ControlButton({
  label,
  danger,
  disabled,
  onPress,
  children,
}: {
  label: string;
  danger?: boolean;
  disabled: boolean;
  onPress: () => void;
  children: (color: string) => ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const color = danger && hovered ? "#ffffff" : GLYPH_COLOR;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        styles.button,
        hovered && (danger ? styles.dangerBg : styles.hoverBg),
      ]}
    >
      {children(color)}
    </Pressable>
  );
}

// min/max/close buttons for the custom titlebar (Linux/Windows builds,
// where decorations are disabled); macOS keeps its native traffic lights
export function WindowControls() {
  const [win, setWin] = useState<BcpBridge["window"] | null>(null);
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!IS_DESKTOP) return;
    // lazy so PWA/native bundles never execute electron ipc code paths
    // SAFETY: window.bcp is injected only by the Electron preload; absent on
    // web/PWA builds it is simply undefined and short-circuits to null
    const w = (window as unknown as { bcp?: BcpBridge }).bcp?.window;
    if (!w) return;
    setWin(w);

    let unsubscribe: (() => void) | undefined;

    // use the renderer-incoming maximize/unmaximize events when available and
    // trustworthy (win/linux native windows); linux tiling compositors mark
    // ordinary tiles as maximized, so there (and for any gap) fall back to
    // inferring from actual monitor coverage
    const refresh = async () => {
      try {
        if (IS_WINDOWS) {
          setMaximized(await w.isMaximized());
          return;
        }
        // monitor coverage: true maximize fills the monitor on every desktop
        // environment, gtk or qt alike
        const [pos, mon] = await Promise.all([
          w.positionAndSize(),
          w.monitor(),
        ]);
        if (!mon) {
          setMaximized(false);
          return;
        }
        // positionAndSize and monitor rect are all physical pixels, so they
        // compare directly
        const xOverlap =
          Math.min(pos.x + pos.width, mon.x + mon.width) -
          Math.max(pos.x, mon.x);
        const yOverlap =
          Math.min(pos.y + pos.height, mon.y + mon.height) -
          Math.max(pos.y, mon.y);
        const covered = Math.max(0, xOverlap) * Math.max(0, yOverlap);
        const total = mon.width * mon.height;
        setMaximized(covered >= 0.9 * total);
      } catch {
        // transient mid-resize query failures: keep last state
      }
    };

    void refresh();
    unsubscribe = w.onChange(({ maximized }) => {
      // on linux the bridge's resize signal still reports the native flag,
      // which we already deemed unreliable, so only trust Windows there;
      // the monitor-coverage path re-runs on any change
      if (IS_WINDOWS) setMaximized(maximized);
      else void refresh();
    });
    return () => {
      unsubscribe?.();
    };
  }, []);

  return (
    // never hintable: Close/Minimize/Maximize must not be reached through a
    // link-hint key (typing one would actually close or resize the window)
    <View style={styles.row} dataSet={{ vimHintSkip: "", "no-drag": "" }}>
      <ControlButton
        label="Minimize"
        disabled={!win}
        onPress={() => win?.minimize()}
      >
        {(c) => <MinimizeGlyph color={c} />}
      </ControlButton>
      <ControlButton
        label={maximized ? "Restore" : "Maximize"}
        disabled={!win}
        onPress={() => win?.toggleMaximize()}
      >
        {(c) =>
          maximized ? <RestoreGlyph color={c} /> : <MaximizeGlyph color={c} />
        }
      </ControlButton>
      <ControlButton
        label="Close"
        danger
        disabled={!win}
        onPress={() => win?.close()}
      >
        {(c) => <CloseGlyph color={c} />}
      </ControlButton>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexShrink: 0,
  },
  button: {
    width: 30,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  hoverBg: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  dangerBg: {
    backgroundColor: "#e81123",
  },
  bar: {
    width: 9,
    height: 1.4,
    borderRadius: 1,
  },
  box: {
    width: 8,
    height: 8,
    borderWidth: 1.2,
    borderRadius: 1,
  },
  restoreWrap: {
    width: 8,
    height: 8,
  },
  restoreBack: {
    position: "absolute",
    top: -2.5,
    right: -2.5,
  },
  restoreFront: {
    position: "absolute",
    left: 0,
    bottom: 0,
  },
  closeWrap: {
    width: 10,
    height: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  closeBarA: {
    position: "absolute",
    transform: [{ rotate: "45deg" }],
  },
  closeBarB: {
    position: "absolute",
    transform: [{ rotate: "-45deg" }],
  },
});
