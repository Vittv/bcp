import { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { usePalette } from "../../context/PaletteContext";
import { useTheme } from "../../context/ThemeContext";
import { sanctoraleTitle } from "../../lib/calendar/sanctorale";
import type { Season } from "../../lib/calendar/types";
import { IS_MACOS_TAURI, IS_TAURI } from "../../lib/desktop";
import { CHROME_FONT } from "../../lib/fonts";
import {
  defineThemedStyles,
  useThemedStyles,
  useThemeVar,
} from "../../lib/theme/themedStyles";
import {
  MAX_FONT_PX,
  MIN_FONT_PX,
  stepFontSize,
} from "../../lib/typography/sizes";
import {
  COARSE_POINTER,
  HOTKEY_MOD,
  KeyCap,
  SHOW_HOTKEY_CAP,
} from "../../screens/reference/shared";
import { useSaintPopover } from "../office/SaintPopover";
import { MagnifierIcon, MoonIcon, SunIcon, SystemIcon } from "./Icon";
import { WindowControls } from "./WindowControls";

// transparent-background cross glyph, rendered as an alpha mask and tinted
// with the active theme's secondary text token so the in-app mark follows the
// selected family and mode instead of a baked-in per-mode color
const CROSS_ICON = require("../../../assets/app_icons/cross_light_192.png");

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
  const { mode, setMode, fontPx, setFontPx, tokens } = useTheme();
  const styles = useThemedStyles(topBarStyles);
  const v = useThemeVar();
  const { openSaint } = useSaintPopover();
  const palette = usePalette();
  const wco = useWindowControlsOverlay();

  // the same ladder the Settings slider steps through, shown in px
  const sizeLabel = `${fontPx}px`;
  const atMinSize = fontPx <= MIN_FONT_PX;
  const atMaxSize = fontPx >= MAX_FONT_PX;

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
          source={CROSS_ICON}
          tintColor={tokens.textSecondary}
          style={styles.appIcon}
          resizeMode="contain"
          accessibilityLabel="BCP"
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
                accessibilityLabel={`Open ${holyDayLabel} in Holy Days`}
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
          dataSet={{ bcpBtn: "" }}
          style={({ hovered, pressed }) => [
            styles.searchTrigger,
            hovered && !pressed && styles.searchTriggerHover,
            pressed && styles.searchTriggerPressed,
          ]}
          onPress={() => palette.open("search")}
          accessibilityRole="button"
          accessibilityLabel="Search the whole prayer book"
        >
          <MagnifierIcon size={13} color={v("var(--text-secondary)")} />
          {COARSE_POINTER ? null : (
            <Text style={styles.searchText}>Search</Text>
          )}
          {SHOW_HOTKEY_CAP ? <KeyCap label={`${HOTKEY_MOD} K`} /> : null}
        </Pressable>

        <View style={styles.fontControl}>
          <Text style={styles.fontSizeLabel}>{sizeLabel}</Text>
          <Pressable
            dataSet={{ bcpBtn: "" }}
            style={({ hovered, pressed }) => [
              styles.fontBtn,
              hovered && !pressed && styles.hover,
              pressed && styles.pressed,
              atMinSize && styles.fontBtnDisabled,
            ]}
            onPress={() => setFontPx(stepFontSize(fontPx, -1))}
            disabled={atMinSize}
            accessibilityRole="button"
            accessibilityLabel="Decrease text size"
            accessibilityState={{ disabled: atMinSize }}
          >
            <Text style={styles.controlText}>A−</Text>
          </Pressable>
          <Pressable
            dataSet={{ bcpBtn: "" }}
            style={({ hovered, pressed }) => [
              styles.fontBtn,
              hovered && !pressed && styles.hover,
              pressed && styles.pressed,
              atMaxSize && styles.fontBtnDisabled,
            ]}
            onPress={() => setFontPx(stepFontSize(fontPx, 1))}
            disabled={atMaxSize}
            accessibilityRole="button"
            accessibilityLabel="Increase text size"
            accessibilityState={{ disabled: atMaxSize }}
          >
            <Text style={styles.controlText}>A+</Text>
          </Pressable>
        </View>

        <Pressable
          dataSet={{ bcpBtn: "" }}
          style={({ hovered, pressed }) => [
            styles.themeBtn,
            hovered && !pressed && styles.hover,
            pressed && styles.pressed,
          ]}
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
                color={hovered ? v("var(--text)") : v("var(--text-secondary)")}
              />
            ) : mode === "dark" ? (
              <MoonIcon
                size={16}
                color={hovered ? v("var(--text)") : v("var(--text-secondary)")}
              />
            ) : (
              <SystemIcon
                size={16}
                color={hovered ? v("var(--text)") : v("var(--text-secondary)")}
              />
            )
          }
        </Pressable>
      </View>

      {showingControls && !wco && <WindowControls />}
    </View>
  );
}

const topBarStyles = defineThemedStyles({
  bar: {
    height: 40,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border)",
    flexDirection: "row",
    alignItems: "center",
    // left-only: the window-control cluster must sit flush against
    // the right edge
    paddingLeft: 12,
    flexShrink: 0,
    backgroundColor: "var(--bg)",
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
    color: "var(--text-secondary)",
  },
  countdown: {
    borderRadius: 4,
  },
  countdownHover: {
    backgroundColor: "var(--control-hover)",
  },
  // the bullet separating the season title from the countdown/saint-day
  // label; a fixed, always-spaced item that is never part of the label's
  // hoverable area
  countdownSep: {
    fontSize: 11,
    color: "var(--text-secondary)",
    opacity: 0.7,
    marginHorizontal: 6,
  },
  countdownText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 11,
    color: "var(--text-secondary)",
    opacity: 0.7,
  },
  fontControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
    marginRight: -4,
  },
  fontSizeLabel: {
    fontFamily: MONO,
    fontWeight: "500",
    fontSize: 11,
    color: "var(--text-secondary)",
    minWidth: 32,
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
  fontBtnDisabled: {
    opacity: 0.4,
  },
  hover: {
    backgroundColor: "var(--control-hover)",
  },
  pressed: {
    backgroundColor: "var(--selected-bg)",
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
    borderColor: "var(--border)",
    backgroundColor: "var(--surface)",
  },
  searchTriggerHover: {
    backgroundColor: "var(--control-hover)",
  },
  searchTriggerPressed: {
    backgroundColor: "var(--selected-bg)",
  },
  searchText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 12,
    color: "var(--text-secondary)",
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
    color: "var(--text-secondary)",
  },
  // keeps the brand clear of macOS's overlaid traffic lights
  macGap: {
    width: 78,
    flexShrink: 0,
  },
});
