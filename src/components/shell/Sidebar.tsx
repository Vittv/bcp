import { Pressable, StyleSheet, Text, View } from "react-native";
import { Chevron } from "./Chevron";

export type PageId =
  | "today"
  | "calendar"
  | "psalms"
  | "collects"
  | "offices"
  | "old-testament"
  | "new-testament"
  | "settings"
  | "about";

const NAV: { id: PageId; label: string; section?: string }[] = [
  { id: "today", label: "Today" },
  { id: "calendar", label: "Calendar" },
  { id: "psalms", label: "Psalms" },
  { id: "collects", label: "Collects" },
  { id: "offices", label: "Offices" },
  { id: "old-testament", label: "Old Testament", section: "scripture" },
  { id: "new-testament", label: "New Testament", section: "scripture" },
  { id: "settings", label: "Settings", section: "settings" },
  { id: "about", label: "About", section: "settings" },
];

const noSelect = {
  userSelect: "none" as const,
  WebkitUserSelect: "none" as const,
};

const SECTION_ORDER = ["", "scripture", "settings"] as const;

type SidebarProps = {
  active: PageId;
  onSelect: (id: PageId) => void;
  onHide: () => void;
};

export function Sidebar({ active, onSelect, onHide }: SidebarProps) {
  const sections = SECTION_ORDER.map((section) => ({
    section,
    items: NAV.filter((item) => (item.section ?? "") === section),
  }));

  return (
    <View style={[styles.sidebar, noSelect]}>
      <View style={styles.toolbar}>
        <Pressable
          style={({ hovered }) => [
            styles.toolBtn,
            hovered && styles.toolBtnHover,
          ]}
          onPress={onHide}
          accessibilityLabel="Hide sidebar"
          accessibilityRole="button"
        >
          <Chevron direction="left" size={6} />
        </Pressable>
      </View>
      <View style={styles.scroll}>
        <View style={styles.nav}>
          {sections.map(({ section, items }, idx) => (
            <View key={section || "main"} style={styles.section}>
              {section && idx > 0 && <View style={styles.sectionDivider} />}
              {items.map((item) => {
                const isActive = active === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => onSelect(item.id)}
                    style={({ hovered }) => [
                      styles.navItem,
                      isActive && styles.navItemActive,
                      hovered && !isActive && styles.navItemHover,
                    ]}
                  >
                    <Text
                      style={[styles.navText, isActive && styles.navTextActive]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText} numberOfLines={1}>
          bcp · v0.1.0
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    borderRightWidth: 1,
    borderRightColor: "var(--border, #d2cbbf)",
    backgroundColor: "var(--bg, #e0dbd0)",
  },
  toolbar: {
    height: 30,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border, #d2cbbf)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  toolBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "var(--border-content, #b5aa9e)",
  },
  toolBtnHover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  // nav items are full-width bands; active and hover share the same
  // control-hover fill as every other chrome surface
  scroll: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
  },
  nav: {
    paddingBottom: 8,
  },
  section: {
    paddingBottom: 4,
  },
  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "var(--border-faint, rgba(44, 32, 32, 0.09))",
    marginHorizontal: 14,
    marginBottom: 4,
  },
  navItem: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    marginHorizontal: 8,
    marginVertical: 3,
    borderRadius: 4,
  },
  navItemActive: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  navItemHover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  navText: {
    fontFamily: "sans-serif",
    fontSize: 14,
    color: "var(--text-secondary, #7a6e64)",
  },
  navTextActive: {
    color: "var(--accent, #7a3040)",
    fontWeight: "600",
  },
  footer: {
    height: 24,
    flexShrink: 0,
    borderTopWidth: 1,
    borderTopColor: "var(--border, #d2cbbf)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  footerText: {
    fontFamily: "sans-serif",
    fontSize: 11,
    color: "var(--text-secondary, #7a6e64)",
  },
});
