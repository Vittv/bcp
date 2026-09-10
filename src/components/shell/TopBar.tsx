import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { usePalette } from "../../context/PaletteContext";
import { useTheme } from "../../context/ThemeContext";
import { sanctoraleTitle } from "../../lib/calendar/sanctorale";
import type { Season } from "../../lib/calendar/types";
import { IS_MACOS_TAURI, IS_TAURI } from "../../lib/desktop";
import { CHROME_FONT } from "../../lib/fonts";
import {
  COARSE_POINTER,
  HOTKEY_MOD,
  KeyCap,
  SHOW_HOTKEY_CAP,
} from "../../screens/reference/shared";
import { useSaintPopover } from "../office/SaintPopover";
import {
  MagnifierIcon,
  MoonIcon,
  SunIcon,
  SystemIcon,
} from "./Icon";
import { WindowControls } from "./WindowControls";

// transparent-background cross glyphs, one per theme, so the in-app mark
// follows the resolved theme instead of being tinted by CSS filters
const ICON_LIGHT = require("../../../assets/app_icons/cross_light_192.png");
const ICON_DARK = require("../../../assets/app_icons/cross_dark_192.png");

// bundled via expo-font; system monospace is the fallback on native
const MONO = '"JetBrains Mono", monospace';

// forwarded by react-native-web as data-tauri-drag-region; tauri's
// injected script turns mousedown/double-click on it into window
// dragging and maximize toggling
const DRAG_DATA = { tauriDragRegion: "" };

// forwarded as data-bcp-wco / data-wco-no-drag; ThemeContext injects a
// stylesheet that turns the top bar into the pwa's draggable titlebar and
// keeps the interactive controls clickable beside the overlaid buttons
const WCO_DATA = { wco: "" };
const WCO_STOP = { wcoNoDrag: "" };

// true while the installed pwa runs inside window-controls-overlay (chromium
// only). the browser merges the overlay into the app surface and sets visible
// as soon as the user toggles the "Hide title bar" button
function useWindowControlsOverlay(): boolean {
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

// fallback for feast slugs unknown to the sanctorale table
function formatHolyDay(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type TopBarProps = {
  season: Season;
  daysUntilNext: number;
  nextSeason: string;
  // the day's holy-day slug, if any; on such a day the countdown is
  // replaced by the feast name so the feasts can be seen at a glance
  // (clicking opens the saint modal)
  holyDay?: string | null;
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
  holyDay,
  windowControls = false,
  compact = false,
}: TopBarProps) {
  const { mode, setMode, fontScale, setFontScale, resolved } = useTheme();
  const { openSaint } = useSaintPopover();
  const palette = usePalette();
  const wco = useWindowControlsOverlay();

  const pct = `${Math.round(fontScale * 100)}%`;

  const showingControls = IS_TAURI && !IS_MACOS_TAURI && windowControls;

  // on a feast of a saint, the countdown gives way to the feast name so
  // the day's observance is visible at a glance; it's a single source of
  // truth (the office data), rendered nowhere else in the chrome
  const holyDayLabel = holyDay
    ? (sanctoraleTitle(holyDay) ?? formatHolyDay(holyDay))
    : null;

  return (
    <View
      style={[styles.bar, noSelect]}
      dataSet={wco ? WCO_DATA : IS_TAURI ? DRAG_DATA : undefined}
    >
      {IS_MACOS_TAURI && (
        <View style={styles.macGap} dataSet={wco ? WCO_STOP : undefined} />
      )}

      <View
        style={styles.seasonLabel}
        dataSet={IS_TAURI ? DRAG_DATA : undefined}
      >
        <Image
          source={resolved === "dark" ? ICON_DARK : ICON_LIGHT}
          style={styles.appIcon}
          resizeMode="contain"
          accessibilityLabel="bcp"
        />
        <Text
          style={styles.seasonText}
          numberOfLines={1}
          dataSet={IS_TAURI ? DRAG_DATA : undefined}
        >
          {SEASON_LABEL[season]}
        </Text>
        {!compact && (holyDayLabel || daysUntilNext > 0) && (
          <>
            <Text style={styles.countdownSep}>·</Text>
            {holyDayLabel ? (
              <Pressable
                style={({ hovered }) => [
                  styles.countdown,
                  hovered && styles.countdownHover,
                ]}
                onPress={() => holyDay && openSaint(holyDay)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${holyDayLabel} in Saints`}
                dataSet={wco ? WCO_STOP : IS_TAURI ? DRAG_DATA : undefined}
              >
                <Text
                  style={styles.countdownText}
                  numberOfLines={1}
                  dataSet={wco ? WCO_STOP : IS_TAURI ? DRAG_DATA : undefined}
                >
                  {holyDayLabel}
                </Text>
              </Pressable>
            ) : (
              <Text
                style={styles.countdownText}
                dataSet={IS_TAURI ? DRAG_DATA : undefined}
              >
                {daysUntilNext}d to {nextSeason}
              </Text>
            )}
          </>
        )}
      </View>

      <View
        style={styles.controls}
        dataSet={wco ? WCO_STOP : IS_TAURI ? DRAG_DATA : undefined}
      >
        <Pressable
          style={({ hovered }) => [
            styles.searchTrigger,
            hovered && styles.searchTriggerHover,
          ]}
          onPress={() => palette.open("search")}
          accessibilityRole="button"
          accessibilityLabel="Search the whole prayer book"
        >
          <MagnifierIcon size={13} color="var(--text-secondary, #7a6e64)" />
          {COARSE_POINTER ? null : (
            <Text style={styles.searchText}>Search</Text>
          )}
          {SHOW_HOTKEY_CAP ? <KeyCap label={`${HOTKEY_MOD} K`} /> : null}
        </Pressable>

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

      {showingControls && !wco && <WindowControls />}
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
  },
  appIcon: {
    width: 18,
    height: 18,
    marginRight: 6,
  },
  seasonText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 12,
    color: "var(--text-secondary, #7a6e64)",
  },
  countdown: {
    borderRadius: 4,
  },
  countdownHover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  // the bullet separating the season title from the countdown/saint-day
  // label; a fixed, always-spaced item that is never part of the label's
  // hoverable area
  countdownSep: {
    fontSize: 11,
    color: "var(--text-secondary, #7a6e64)",
    opacity: 0.7,
    marginHorizontal: 6,
  },
  countdownText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 11,
    color: "var(--text-secondary, #7a6e64)",
    opacity: 0.7,
  },
  fontControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
    marginRight: -4,
  },
  fontPct: {
    fontFamily: MONO,
    fontWeight: "500",
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
  // the global-search trigger: a fuller descendant of aetheryte's cmd
  // trigger, stretching the top bar's full 40px so search reads as a
  // control of the chrome rather than a chip of the page beneath
  searchTrigger: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    gap: 6,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "var(--border-content, #b5aa9e)",
  },
  searchTriggerHover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  searchText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 12,
    color: "var(--text-secondary, #7a6e64)",
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
