import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import type { Season } from "../../lib/calendar/types";

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
};

const noSelect = {
  userSelect: "none" as const,
  WebkitUserSelect: "none" as const,
};

export function TopBar({ season, daysUntilNext, nextSeason }: TopBarProps) {
  const { mode, setMode, fontScale, setFontScale } = useTheme();

  const pct = `${Math.round(fontScale * 100)}%`;

  return (
    <View style={[styles.bar, noSelect]}>
      <Text style={styles.brand}>Daily Office</Text>

      <View style={styles.seasonLabel}>
        <Text style={styles.seasonText}>{SEASON_LABEL[season]}</Text>
        {daysUntilNext > 0 && (
          <Text style={styles.countdown}>
            {" "}
            · {daysUntilNext}d to {nextSeason}
          </Text>
        )}
      </View>

      <View style={styles.controls}>
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
  seasonLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 4,
  },
  seasonText: {
    fontFamily: "sans-serif",
    fontSize: 12,
    color: "var(--text-secondary, #7a6e64)",
  },
  countdown: {
    fontFamily: "sans-serif",
    fontSize: 11,
    color: "var(--text-secondary, #7a6e64)",
    opacity: 0.7,
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
  hover: {
    backgroundColor: "var(--border, #d2cbbf)",
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
