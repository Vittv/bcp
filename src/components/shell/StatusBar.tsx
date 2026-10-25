import { useState } from "react";
import { type LayoutChangeEvent, Text, View } from "react-native";
import type { Color, DolSlot, Season } from "../../lib/calendar/types";
import { CHROME_FONT } from "../../lib/fonts";
import {
  defineThemedStyles,
  useThemedStyles,
} from "../../lib/theme/themedStyles";
import { useViewport } from "../../lib/viewport";
import { SeasonDot } from "./SeasonDot";

// bundled via expo-font; system monospace is the fallback on native
const MONO = '"JetBrains Mono", monospace';

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
  // label of the reference document currently open (e.g. "Psalm 23");
  // replaces the office name while set
  reading?: string | null;
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
  reading,
}: StatusBarProps) {
  const styles = useThemedStyles(statusBarStyles);
  const { width: viewportWidth } = useViewport();
  // the window width overstates the bar once the sidebar takes its column, so
  // measure the bar itself and shed the year, week, and season before they
  // clip the reading name
  const [barWidth, setBarWidth] = useState(0);
  const compact = (barWidth || viewportWidth) < 480;
  // the season label and its dot leave together; the name and percent stay
  const veryCompact = (barWidth || viewportWidth) < 340;
  return (
    <View
      style={[styles.bar, noSelect]}
      onLayout={(e: LayoutChangeEvent) =>
        setBarWidth(e.nativeEvent.layout.width)
      }
    >
      <View style={styles.left}>
        {!veryCompact && (
          <View style={styles.item}>
            <SeasonDot color={seasonColor} size={6} />
            <Text style={styles.text} numberOfLines={1}>
              {SEASON_LABELS[season]}
            </Text>
          </View>
        )}
        {!compact && (
          <>
            <Text style={styles.sep}>·</Text>
            <Text style={styles.text}>Year {slot.year}</Text>
            <Text style={styles.sep}>·</Text>
            <Text style={styles.text} numberOfLines={1}>
              {weekLabel(slot)}
            </Text>
          </>
        )}
      </View>
      <View style={styles.right}>
        <Text style={[styles.text, styles.rightText]} numberOfLines={1}>
          {reading ?? officeName}
        </Text>
        <Text style={styles.pct}>{scrollPct}%</Text>
      </View>
    </View>
  );
}

const statusBarStyles = defineThemedStyles({
  bar: {
    height: 24,
    overflow: "hidden",
    borderTopWidth: 1,
    borderTopColor: "var(--border)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    backgroundColor: "var(--bg)",
    flexShrink: 0,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
    minWidth: 0,
    overflow: "hidden",
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
    minWidth: 0,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  text: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 11,
    color: "var(--text-secondary)",
  },
  // lets a long reading/office name truncate instead of pushing the
  // percentage out of the bar
  rightText: {
    flexShrink: 1,
    minWidth: 0,
  },
  pct: {
    fontFamily: MONO,
    fontWeight: "500",
    fontSize: 11,
    color: "var(--text-secondary)",
    // reserve room for the widest value ("100%") and right-align so the
    // number never shifts the layout as it grows. 26px barely clips "100%"
    // at 11px JetBrains Mono, which then pushes the reading/left content;
    // 30px always fits it.
    minWidth: 30,
    textAlign: "right",
  },
  sep: {
    fontSize: 11,
    color: "var(--text-secondary)",
  },
});
