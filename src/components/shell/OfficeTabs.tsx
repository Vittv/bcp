import { type ReactNode, useState } from "react";
import { type LayoutChangeEvent, Pressable, Text, View } from "react-native";
import type { OfficeId } from "../../lib/content/types";
import { CHROME_FONT } from "../../lib/fonts";
import {
  defineThemedStyles,
  useThemedStyles,
} from "../../lib/theme/themedStyles";
import { useViewport } from "../../lib/viewport";

const noSelect = {
  userSelect: "none" as const,
  WebkitUserSelect: "none" as const,
};

type TabId = "morning" | "noonday" | "evening" | "compline";

export const OFFICES: Record<TabId, OfficeId> = {
  morning: "morning-rite-two",
  noonday: "noonday",
  evening: "evening-rite-two",
  compline: "compline",
};

// daily devotions (BCP pp. 136-140) replace each office in devotions mode.
export const DEVOTIONS: Record<TabId, OfficeId> = {
  morning: "devotions-morning",
  noonday: "devotions-noon",
  evening: "devotions-evening",
  compline: "devotions-close",
};

const TABS: { id: TabId; label: string; short: string }[] = [
  { id: "morning", label: "Morning", short: "Morn" },
  { id: "noonday", label: "Noonday", short: "Noon" },
  { id: "evening", label: "Evening", short: "Eve" },
  { id: "compline", label: "Compline", short: "Comp" },
];

// a toggle label that may bold on activate without reflowing the bar: an
// invisible bold twin reserves the widest metrics while the visible text
// floats above it, so nothing beside the chip moves when it flips
function SteadyToggleText({ text, on }: { text: string; on: boolean }) {
  const styles = useThemedStyles(officeBarStyles);
  return (
    <View style={styles.steadyText}>
      <Text style={[styles.toggleText, styles.steadyTextGhost]}>{text}</Text>
      <Text
        style={[
          styles.toggleText,
          styles.steadyTextLabel,
          on && styles.toggleTextOn,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

type OfficeTabsProps = {
  leading?: ReactNode;
  active: TabId;
  onSelect: (id: TabId) => void;
  showRubrics: boolean;
  onToggleRubrics: () => void;
  showSpeakers: boolean;
  onToggleSpeakers: () => void;
  devotions: boolean;
  onToggleDevotions: () => void;
};

export function OfficeTabs({
  leading,
  active,
  onSelect,
  showRubrics,
  onToggleRubrics,
  showSpeakers,
  onToggleSpeakers,
  devotions,
  onToggleDevotions,
}: OfficeTabsProps) {
  const styles = useThemedStyles(officeBarStyles);
  const { width: viewportWidth } = useViewport();
  // the bar's own width, since the sidebar and the UI scale both shrink it
  // well below the window; the effective viewport is the first paint
  const [barWidth, setBarWidth] = useState(0);
  const width = barWidth || viewportWidth;
  // abbreviated names kick in before phone widths; tighter chrome later
  const shortLabels = width < 640;
  const compact = width < 500;
  // below this even abbreviated tabs and the secondary toggles cannot share a
  // row; rubrics and speakers also live in Settings -> Office, so drop them
  const hideToggles = width < 380;
  return (
    <View
      style={[styles.bar, noSelect]}
      onLayout={(e: LayoutChangeEvent) =>
        setBarWidth(e.nativeEvent.layout.width)
      }
    >
      <View style={[styles.tabsLeft, compact && styles.groupCompact]}>
        {leading}
        <Pressable
          style={({ hovered }) => [
            styles.toggle,
            styles.modeToggle,
            compact && styles.itemCompact,
            hovered && styles.tabHover,
            devotions && styles.modeToggleOn,
          ]}
          onPress={onToggleDevotions}
          accessibilityRole="button"
          accessibilityState={{ selected: devotions }}
          accessibilityLabel="Daily Devotions"
        >
          <SteadyToggleText
            text={shortLabels ? "Devotions" : "Daily Devotions"}
            on={devotions}
          />
        </Pressable>
        {TABS.map((t) => {
          const isActive = active === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => onSelect(t.id)}
              style={({ hovered }) => [
                styles.tab,
                compact && styles.itemCompact,
                hovered && styles.tabHover,
              ]}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {shortLabels ? t.short : t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {hideToggles ? null : (
        <View style={[styles.togglesRight, compact && styles.groupCompact]}>
          <Pressable
            style={({ hovered }) => [
              styles.toggle,
              compact && styles.itemCompact,
              hovered && styles.tabHover,
            ]}
            onPress={onToggleRubrics}
          >
            <SteadyToggleText text="Rubrics" on={showRubrics} />
          </Pressable>
          <Pressable
            style={({ hovered }) => [
              styles.toggle,
              compact && styles.itemCompact,
              hovered && styles.tabHover,
            ]}
            onPress={onToggleSpeakers}
          >
            <SteadyToggleText text="Speakers" on={showSpeakers} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

export type { TabId };

// exported so the reference offices bar derives its chrome from these
// exact tokens instead of retyping them and drifting apart. the object stays
// a themed definition (var(--token) strings); every consumer resolves it
// with useThemedStyles so it paints correctly on web and native alike.
export const officeBarStyles = defineThemedStyles({
  bar: {
    height: 30,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // matches the sidebar toolbar and the reference bars
    paddingHorizontal: 6,
    backgroundColor: "var(--bg)",
    flexShrink: 0,
  },
  tabsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  togglesRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tabHover: {
    backgroundColor: "var(--control-hover)",
  },
  tabText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 11,
    color: "var(--text-secondary)",
  },
  tabTextActive: {
    color: "var(--accent)",
    fontWeight: "700",
  },
  toggle: {
    // every bar chip (picker, arrows, toggles, dropdown) is a fixed 24px
    // so they line up across the bar
    height: 24,
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  // the mode switch (Daily Devotions) reads as a primary control: a bordered
  // chip in the left group, accent border while active
  modeToggle: {
    borderWidth: 1,
    borderColor: "var(--border)",
    borderRadius: 4,
    backgroundColor: "var(--surface)",
  },
  modeToggleOn: {
    borderColor: "var(--accent)",
  },
  toggleText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 11,
    color: "var(--text-secondary)",
  },
  toggleTextOn: {
    color: "var(--accent)",
    fontWeight: "700",
  },
  // invisible bold twin reserves the widest metrics so the visible label
  // can switch weight without reflowing the row
  steadyText: {
    position: "relative",
    alignSelf: "center",
  },
  steadyTextGhost: {
    opacity: 0,
    fontWeight: "700",
  },
  steadyTextLabel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    textAlign: "center",
  },
  groupCompact: {
    gap: 2,
  },
  itemCompact: {
    paddingHorizontal: 5,
  },
});
