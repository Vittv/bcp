import type { Window } from "@tauri-apps/api/window";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { IS_WINDOWS_TAURI } from "../../lib/desktop";
import {
  defineThemedStyles,
  useThemedStyles,
  useThemeVar,
} from "../../lib/theme/themedStyles";

function MinimizeGlyph({ color }: { color: string }) {
  const styles = useThemedStyles(windowControlStyles);
  return <View style={[styles.bar, { backgroundColor: color }]} />;
}

function MaximizeGlyph({ color }: { color: string }) {
  const styles = useThemedStyles(windowControlStyles);
  return <View style={[styles.box, { borderColor: color }]} />;
}

function RestoreGlyph({ color }: { color: string }) {
  const styles = useThemedStyles(windowControlStyles);
  const v = useThemeVar();
  return (
    <View style={styles.restoreWrap}>
      <View style={[styles.box, styles.restoreBack, { borderColor: color }]} />
      <View
        style={[
          styles.box,
          styles.restoreFront,
          { borderColor: color, backgroundColor: v("var(--bg)") },
        ]}
      />
    </View>
  );
}

function CloseGlyph({ color }: { color: string }) {
  const styles = useThemedStyles(windowControlStyles);
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
  const styles = useThemedStyles(windowControlStyles);
  const v = useThemeVar();
  const [hovered, setHovered] = useState(false);
  const color =
    danger && hovered ? v("var(--danger-text)") : v("var(--text-secondary)");
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
  const styles = useThemedStyles(windowControlStyles);
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
            // on linux the reported maximize flag is unreliable (tiling
            // compositors mark ordinary tiles as maximized), so infer
            // from actual monitor coverage: true maximize fills the
            // monitor on every desktop environment, gtk or qt alike
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

  return (
    <View style={styles.row}>
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

const windowControlStyles = defineThemedStyles({
  row: {
    flexDirection: "row",
    flexShrink: 0,
  },
  button: {
    // 40px per button is the standard desktop convention for custom
    // titlebars; anything tighter makes the group feel cramped
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  hoverBg: {
    backgroundColor: "var(--control-hover)",
  },
  dangerBg: {
    backgroundColor: "var(--danger)",
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
