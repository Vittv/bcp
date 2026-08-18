import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { addDays } from "../../lib/calendar";
import type { CalendarDate, Color } from "../../lib/calendar/types";
import { dayLabel } from "../../lib/office";
import { SeasonDot } from "./SeasonDot";

type TopBarProps = {
  date: CalendarDate;
  onDateChange: (date: CalendarDate) => void;
  onNavigateCalendar: () => void;
  seasonColor: Color;
};

const noSelect = {
  userSelect: "none" as const,
  WebkitUserSelect: "none" as const,
};

export function TopBar({
  date,
  onDateChange,
  onNavigateCalendar,
  seasonColor,
}: TopBarProps) {
  const { mode, setMode, fontScale, setFontScale } = useTheme();

  const pct = `${Math.round(fontScale * 100)}%`;

  return (
    <View style={[styles.bar, noSelect]}>
      <Text style={styles.brand}>Daily Office</Text>

      <View style={styles.dateNav}>
        <Pressable
          style={({ hovered }) => [
            styles.navBtn,
            hovered && styles.navBtnHover,
          ]}
          onPress={() => onDateChange(addDays(date, -1))}
        >
          <Text style={styles.navBtnText}>←</Text>
        </Pressable>
        <Pressable
          style={({ hovered }) => [
            styles.navBtn,
            hovered && styles.navBtnHover,
          ]}
          onPress={() => onDateChange(addDays(date, 1))}
        >
          <Text style={styles.navBtnText}>→</Text>
        </Pressable>
        <Pressable
          style={({ hovered }) => [
            styles.todayBtn,
            hovered && styles.navBtnHover,
          ]}
          onPress={onNavigateCalendar}
        >
          <SeasonDot color={seasonColor} size={6} />
          <Text style={styles.todayText}>{dayLabel(date)}</Text>
        </Pressable>
      </View>

      <View style={styles.controls}>
        <View style={styles.fontControl}>
          <Text style={styles.fontPct}>{pct}</Text>
          <Pressable
            style={({ hovered }) => [
              styles.fontBtn,
              hovered && styles.navBtnHover,
            ]}
            onPress={() => setFontScale(fontScale - 0.05)}
          >
            <Text style={styles.controlText}>A−</Text>
          </Pressable>
          <Pressable
            style={({ hovered }) => [
              styles.fontBtn,
              hovered && styles.navBtnHover,
            ]}
            onPress={() => setFontScale(fontScale + 0.05)}
          >
            <Text style={styles.controlText}>A+</Text>
          </Pressable>
        </View>

        <Pressable
          style={({ hovered }) => [
            styles.themeBtn,
            hovered && styles.navBtnHover,
          ]}
          onPress={() =>
            setMode(
              mode === "light" ? "dark" : mode === "dark" ? "system" : "light",
            )
          }
        >
          <Text style={styles.controlText}>
            {mode === "light" ? "☀" : mode === "dark" ? "☾" : "Auto"}
          </Text>
        </Pressable>
      </View>
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
    paddingHorizontal: 12,
    backgroundColor: "var(--bg, #e0dbd0)",
    flexShrink: 0,
  },
  brand: {
    fontFamily: "sans-serif",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: "var(--text, #2c2020)",
    marginRight: 16,
  },
  dateNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  navBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  navBtnHover: {
    backgroundColor: "var(--border, #d2cbbf)",
  },
  navBtnText: {
    fontSize: 14,
    color: "var(--text-secondary, #7a6e64)",
  },
  todayBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    height: 28,
    borderRadius: 4,
  },
  todayText: {
    fontFamily: "sans-serif",
    fontSize: 12,
    color: "var(--text, #2c2020)",
  },
  controls: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fontControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  fontPct: {
    fontFamily: "monospace",
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
});
