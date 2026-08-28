import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import type { Season } from "../../lib/calendar/types";
import { IS_MACOS_TAURI, IS_TAURI } from "../../lib/desktop";
import { CHROME_FONT } from "../../lib/fonts";
import { MoonIcon, SunIcon, SystemIcon } from "./Icon";
import { WindowControls } from "./WindowControls";

// bundled via expo-font; system monospace is the fallback on native
const MONO = '"JetBrains Mono", monospace';

// forwarded by react-native-web as data-tauri-drag-region; tauri's
// injected script turns mousedown/double-click on it into window
// dragging and maximize toggling
const DRAG_DATA = { tauriDragRegion: "" };

const SEASON_LABEL: Record<Season, string> = {
  advent: "Advent",
  christmas: "Christmas",
  epiphany: "Epiphany",
  lent: "Lent",
  "holy-week": "Holy Week",
  easter: "Easter",
  pentecost: "Pentecost",
  "after-pentecost": "After Pentecost",
};

type TopBarProps = {
  season: Season;
  daysUntilNext: number;
  nextSeason: string;
  // resolved window-control visibility (auto-detected + setting);
  // undefined while the shell is still resolving
  windowControls?: boolean;
  // narrow layout: keep the edge-anchored items, drop the
  // informational extras (countdown, font percentage)
  compact?: boolean;
};

const noSelect = {
  userSelect: "none" as const,
  WebkitUserSelect: "none" as const,
};

export function TopBar({
  season,
  daysUntilNext,
  nextSeason,
  windowControls = false,
  compact = false,
}: TopBarProps) {
  const { mode, setMode, fontScale, setFontScale } = useTheme();

  const pct = `${Math.round(fontScale * 100)}%`;

  const showingControls = IS_TAURI && !IS_MACOS_TAURI && windowControls;

  return (
    <View
      style={[styles.bar, noSelect]}
      dataSet={IS_TAURI ? DRAG_DATA : undefined}
    >
      {IS_MACOS_TAURI && <View style={styles.macGap} />}

      <View
        style={styles.seasonLabel}
        dataSet={IS_TAURI ? DRAG_DATA : undefined}
      >
        <Text
          style={styles.seasonText}
          numberOfLines={1}
          dataSet={IS_TAURI ? DRAG_DATA : undefined}
        >
          {SEASON_LABEL[season]}
        </Text>
        {!compact && daysUntilNext > 0 && (
          <Text
            style={styles.countdown}
            dataSet={IS_TAURI ? DRAG_DATA : undefined}
          >
            {" "}
            · {daysUntilNext}d to {nextSeason}
          </Text>
        )}
      </View>

      <View style={styles.controls} dataSet={IS_TAURI ? DRAG_DATA : undefined}>
        <View style={styles.fontControl}>
          <Text style={styles.fontPct}>{pct}</Text>
          <Pressable
            style={({ hovered }) => [styles.fontBtn, hovered && styles.hover]}
            onPress={() => setFontScale(fontScale - 0.05)}
          >
            <Text style={styles.controlText}>A−</Text>
          </Pressable>
          <Pressable
            style={({ hovered }) => [styles.fontBtn, hovered && styles.hover]}
            onPress={() => setFontScale(fontScale + 0.05)}
          >
            <Text style={styles.controlText}>A+</Text>
          </Pressable>
        </View>

        <Pressable
          style={({ hovered }) => [styles.themeBtn, hovered && styles.hover]}
          onPress={() =>
            setMode(
              mode === "light" ? "dark" : mode === "dark" ? "system" : "light",
            )
          }
          accessibilityRole="button"
          accessibilityLabel={`Theme: ${mode}. Switch theme`}
        >
          {({ hovered }) =>
            mode === "light" ? (
              <SunIcon
                size={16}
                color={
                  hovered
                    ? "var(--text, #2c2020)"
                    : "var(--text-secondary, #7a6e64)"
                }
              />
            ) : mode === "dark" ? (
              <MoonIcon
                size={16}
                color={
                  hovered
                    ? "var(--text, #2c2020)"
                    : "var(--text-secondary, #7a6e64)"
                }
              />
            ) : (
              <SystemIcon
                size={16}
                color={
                  hovered
                    ? "var(--text, #2c2020)"
                    : "var(--text-secondary, #7a6e64)"
                }
              />
            )
          }
        </Pressable>
      </View>

      {showingControls && <WindowControls />}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 40,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border, #d2cbbf)",
    flexDirection: "row",
    alignItems: "center",
    // left-only: the window-control cluster must sit flush against
    // the right edge
    paddingLeft: 12,
    flexShrink: 0,
    backgroundColor: "var(--bg, #e0dbd0)",
    overflow: "hidden",
  },
  controls: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    // breathing room before the window-control cluster; when that
    // cluster is hidden this doubles as the bar's right padding
    marginRight: 12,
  },
  seasonLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  seasonText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 12,
    color: "var(--text-secondary, #7a6e64)",
  },
  countdown: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 11,
    color: "var(--text-secondary, #7a6e64)",
    opacity: 0.7,
  },
  fontControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  fontPct: {
    fontFamily: MONO,
    fontSize: 11,
    color: "var(--text-secondary, #7a6e64)",
    minWidth: 28,
    textAlign: "right",
    marginRight: 2,
  },
  fontBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  hover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  themeBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  controlText: {
    fontSize: 12,
    color: "var(--text-secondary, #7a6e64)",
  },
  // keeps the brand clear of macOS's overlaid traffic lights
  macGap: {
    width: 78,
    flexShrink: 0,
  },
});
