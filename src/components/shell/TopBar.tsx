import { Image, Pressable, Text, View } from "react-native";

import { usePalette } from "../../context/PaletteContext";
import { useTheme } from "../../context/ThemeContext";
import { sanctoraleTitle } from "../../lib/calendar/sanctorale";
import type { Season } from "../../lib/calendar/types";
import { IS_MACOS_TAURI, IS_TAURI } from "../../lib/desktop";
import { useThemedStyles, useThemeVar } from "../../lib/theme/themedStyles";
import {
  MAX_FONT_PX,
  MIN_FONT_PX,
  stepFontSize,
} from "../../lib/typography/sizes";
import { useShowHotkeyCap, useViewport } from "../../lib/viewport";
import {
  decorationFor,
  type ResolvedWindowControlStyle,
} from "../../lib/windowDecorations";
import { HOTKEY_MOD, KeyCap } from "../../screens/reference/shared";
import { useSaintPopover } from "../office/SaintPopover";
import { MagnifierIcon, MoonIcon, SunIcon, SystemIcon } from "./Icon";
import {
  DRAG_DATA,
  formatHolyDay,
  SEASON_LABEL,
  useWindowControlsOverlay,
  WCO_DATA,
  WCO_STOP,
} from "./TopBar.helpers";
import { CROSS_ICON, noSelect, topBarStyles } from "./TopBar.styles";
import { WindowControls } from "./WindowControls";

type TopBarProps = {
  season: Season;
  daysUntilNext: number;
  nextSeason: string;
  // the day's holy-day slug, if any; on such a day the countdown is
  // replaced by the feast name so the feasts can be seen at a glance
  // (clicking opens the saint modal)
  holyDay?: string | null;
  // resolved window-control style; undefined until the shell loads the choice
  windowControlStyle?: ResolvedWindowControlStyle;
};

export function TopBar({
  season,
  daysUntilNext,
  nextSeason,
  holyDay,
  windowControlStyle = "none",
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

  // the bar sheds segments by measured width, widest first, so a narrow
  // desktop collapses like a phone: cap, then countdown. the size readout
  // stays put: it is the only feedback for what A−/A+ just did.
  const { compact } = useViewport();
  const showHotkeyCap = useShowHotkeyCap();
  const showSearchLabel = !compact;

  const showingControls = IS_TAURI && !wco && windowControlStyle !== "none";
  const decoration = decorationFor(windowControlStyle);
  const nativeMac = IS_MACOS_TAURI && windowControlStyle === "macos";
  const showCustomControls = showingControls && !nativeMac;
  const controlsOnLeft = decoration.side === "left";

  // on a feast of a saint, the countdown gives way to the feast name so
  // the day's observance is visible at a glance; it's a single source of
  // truth (the office data), rendered nowhere else in the chrome
  const holyDayLabel = holyDay
    ? (sanctoraleTitle(holyDay) ?? formatHolyDay(holyDay))
    : null;

  return (
    <View
      style={[
        styles.bar,
        noSelect,
        showCustomControls && controlsOnLeft && styles.barCustomLeft,
      ]}
      dataSet={wco ? WCO_DATA : IS_TAURI ? DRAG_DATA : undefined}
    >
      {nativeMac && (
        <View style={styles.macGap} dataSet={wco ? WCO_STOP : undefined} />
      )}
      {showCustomControls && controlsOnLeft ? (
        <WindowControls style={windowControlStyle} />
      ) : null}

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
          {showSearchLabel ? (
            <Text style={styles.searchText}>Search</Text>
          ) : null}
          {showHotkeyCap ? <KeyCap label={`${HOTKEY_MOD} K`} /> : null}
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

      {showCustomControls && !controlsOnLeft ? (
        <WindowControls style={windowControlStyle} />
      ) : null}
    </View>
  );
}
