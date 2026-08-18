import { StyleSheet, Text, View } from "react-native";
import type { Color, DolSlot, Season } from "../../lib/calendar/types";
import { SeasonDot } from "./SeasonDot";

const SEASON_LABELS: Record<Season, string> = {
  advent: "Advent",
  christmas: "Christmas",
  epiphany: "Epiphany",
  lent: "Lent",
  "holy-week": "Holy Week",
  easter: "Easter",
  pentecost: "Pentecost",
  "after-pentecost": "After Pentecost",
};

function weekLabel(slot: DolSlot): string {
  const w = slot.week;
  switch (w.kind) {
    case "advent":
      return `Advent ${w.week}`;
    case "christmas-following":
      return "Christmas";
    case "epiphany-following":
      return "Epiphany";
    case "epiphany":
      return `Epiphany ${w.week}`;
    case "last-epiphany":
      return "Last Epiphany";
    case "lent":
      return `Lent ${w.week}`;
    case "holy-week":
      return "Holy Week";
    case "easter-week":
      return "Easter Week";
    case "easter":
      return `Easter ${w.week}`;
    case "pentecost":
      return "Pentecost";
    case "after-pentecost":
      return `Proper ${w.proper}`;
  }
}

type StatusBarProps = {
  season: Season;
  seasonColor: Color;
  slot: DolSlot;
  officeName: string;
  scrollPct: number;
};

const noSelect = {
  userSelect: "none" as const,
  WebkitUserSelect: "none" as const,
};

export function StatusBar({
  season,
  seasonColor,
  slot,
  officeName,
  scrollPct,
}: StatusBarProps) {
  return (
    <View style={[styles.bar, noSelect]}>
      <View style={styles.left}>
        <View style={styles.item}>
          <SeasonDot color={seasonColor} size={6} />
          <Text style={styles.text}>{SEASON_LABELS[season]}</Text>
        </View>
        <Text style={styles.sep}>·</Text>
        <Text style={styles.text}>Year {slot.year}</Text>
        <Text style={styles.sep}>·</Text>
        <Text style={styles.text}>{weekLabel(slot)}</Text>
        {slot.holyDay ? (
          <>
            <Text style={styles.sep}>·</Text>
            <Text style={styles.text}>{formatHolyDay(slot.holyDay)}</Text>
          </>
        ) : null}
      </View>
      <View style={styles.right}>
        <Text style={styles.text}>{officeName}</Text>
        <Text style={styles.sep}>·</Text>
        <Text style={styles.pct}>{String(scrollPct).padStart(3, " ")}%</Text>
      </View>
    </View>
  );
}

function formatHolyDay(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const styles = StyleSheet.create({
  bar: {
    height: 24,
    borderTopWidth: 1,
    borderTopColor: "var(--border, #d2cbbf)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    backgroundColor: "var(--bg, #e0dbd0)",
    flexShrink: 0,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  text: {
    fontFamily: "sans-serif",
    fontSize: 11,
    color: "var(--text-secondary, #7a6e64)",
  },
  pct: {
    fontFamily: "monospace",
    fontSize: 11,
    color: "var(--text-secondary, #7a6e64)",
    letterSpacing: 0.5,
  },
  sep: {
    fontSize: 11,
    color: "var(--text-secondary, #7a6e64)",
  },
});
