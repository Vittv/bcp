import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { OfficeView } from "../components/office/OfficeView";
import type { CalendarDate } from "../lib/calendar/types";
import type { OfficeId } from "../lib/content/types";
import { composeOffice, dayLabel } from "../lib/office";
import { DEFAULT_PREFS } from "../lib/office/types";

type TabId = "morning" | "noonday" | "evening" | "compline";

const TABS: { id: TabId; label: string }[] = [
  { id: "morning", label: "Morning" },
  { id: "noonday", label: "Noonday" },
  { id: "evening", label: "Evening" },
  { id: "compline", label: "Compline" },
];

const OFFICES: Record<TabId, OfficeId> = {
  morning: "morning-rite-two",
  noonday: "noonday",
  evening: "evening-rite-two",
  compline: "compline",
};

function officeForHour(hour: number): TabId {
  if (hour < 12) return "morning";
  if (hour < 17) return "noonday";
  if (hour < 21) return "evening";
  return "compline";
}

function today(): CalendarDate {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
}

export function TodayScreen({ date }: { date?: CalendarDate }) {
  const [tab, setTab] = useState<TabId>(() =>
    officeForHour(new Date().getHours()),
  );
  const day = date ?? today();
  const document = composeOffice(day, OFFICES[tab], DEFAULT_PREFS);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.day}>{dayLabel(day)}</Text>
        <Text style={styles.officeName}>{document.officeName}</Text>
        {document.entryTitle ? (
          <Text style={styles.entryTitle}>{document.entryTitle}</Text>
        ) : null}
      </View>

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setTab(t.id)}
            style={[styles.tab, tab === t.id && styles.tabActive]}
          >
            <Text
              style={[styles.tabText, tab === t.id && styles.tabTextActive]}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <OfficeView document={document} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#faf8f2",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 64,
    maxWidth: 640,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    marginBottom: 20,
  },
  day: {
    fontFamily: "serif",
    fontSize: 26,
    fontWeight: "600",
    color: "#1c1c1c",
  },
  officeName: {
    fontFamily: "serif",
    fontSize: 18,
    fontStyle: "italic",
    color: "#444",
    marginTop: 2,
  },
  entryTitle: {
    fontFamily: "sans-serif",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "#7a5c3a",
    marginTop: 8,
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e3dcc8",
    marginBottom: 20,
    gap: 4,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#7a5c3a",
  },
  tabText: {
    fontFamily: "sans-serif",
    fontSize: 14,
    color: "#888",
  },
  tabTextActive: {
    color: "#7a5c3a",
    fontWeight: "700",
  },
});
