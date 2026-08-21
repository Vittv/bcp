import { Pressable, StyleSheet, Text, View } from "react-native";
import type { OfficeId } from "../../lib/content/types";

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

const TABS: { id: TabId; label: string }[] = [
  { id: "morning", label: "Morning" },
  { id: "noonday", label: "Noonday" },
  { id: "evening", label: "Evening" },
  { id: "compline", label: "Compline" },
];

type OfficeTabsProps = {
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
  active,
  onSelect,
  showRubrics,
  onToggleRubrics,
  showSpeakers,
  onToggleSpeakers,
  devotions,
  onToggleDevotions,
}: OfficeTabsProps) {
  return (
    <View style={styles.bar}>
      <View style={styles.tabsLeft}>
        {TABS.map((t) => {
          const isActive = active === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => onSelect(t.id)}
              style={({ hovered }) => [
                styles.tab,
                isActive && styles.tabActive,
                hovered && !isActive && styles.tabHover,
              ]}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.togglesRight}>
        <Pressable
          style={({ hovered }) => [
            styles.toggle,
            showRubrics && styles.toggleOn,
            hovered && styles.tabHover,
          ]}
          onPress={onToggleRubrics}
        >
          <Text style={[styles.toggleText, showRubrics && styles.toggleTextOn]}>
            Rubrics
          </Text>
        </Pressable>
        <Pressable
          style={({ hovered }) => [
            styles.toggle,
            showSpeakers && styles.toggleOn,
            hovered && styles.tabHover,
          ]}
          onPress={onToggleSpeakers}
        >
          <Text
            style={[styles.toggleText, showSpeakers && styles.toggleTextOn]}
          >
            Speakers
          </Text>
        </Pressable>
        <Pressable
          style={({ hovered }) => [
            styles.toggle,
            devotions && styles.toggleOn,
            hovered && styles.tabHover,
          ]}
          onPress={onToggleDevotions}
        >
          <Text style={[styles.toggleText, devotions && styles.toggleTextOn]}>
            Devotions
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export type { TabId };

const styles = StyleSheet.create({
  bar: {
    height: 30,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border, #d2cbbf)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    backgroundColor: "var(--bg, #e0dbd0)",
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
    gap: 6,
  },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tabActive: {
    backgroundColor: "var(--border, #d2cbbf)",
  },
  tabHover: {
    backgroundColor: "var(--border, #d2cbbf)",
  },
  tabText: {
    fontFamily: "sans-serif",
    fontSize: 11,
    color: "var(--text-secondary, #7a6e64)",
  },
  tabTextActive: {
    color: "var(--accent, #7a3040)",
    fontWeight: "700",
  },
  toggle: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  toggleOn: {
    backgroundColor: "var(--border, #d2cbbf)",
  },
  toggleText: {
    fontFamily: "sans-serif",
    fontSize: 11,
    color: "var(--text-secondary, #7a6e64)",
  },
  toggleTextOn: {
    color: "var(--accent, #7a3040)",
    fontWeight: "700",
  },
});
