import { Pressable, StyleSheet, Text, View } from "react-native";
import { Chevron } from "./Chevron";

export type PageId =
  | "today"
  | "calendar"
  | "psalms"
  | "collects"
  | "offices"
  | "settings"
  | "about";

const NAV: { id: PageId; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "calendar", label: "Calendar" },
  { id: "psalms", label: "Psalms" },
  { id: "collects", label: "Collects" },
  { id: "offices", label: "Offices" },
  { id: "settings", label: "Settings" },
  { id: "about", label: "About" },
];

const noSelect = {
  userSelect: "none" as const,
  WebkitUserSelect: "none" as const,
};

type SidebarProps = {
  active: PageId;
  onSelect: (id: PageId) => void;
  onHide: () => void;
};

export function Sidebar({ active, onSelect, onHide }: SidebarProps) {
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
      <View style={styles.nav}>
        {NAV.map((item) => {
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
              <Text style={[styles.navText, isActive && styles.navTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: "100%",
    height: "100%",
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
  nav: {
    paddingBottom: 8,
  },
  navItem: {
    paddingVertical: 7,
    paddingHorizontal: 14,
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
});
