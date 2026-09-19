import { Pressable, StyleSheet, Text, View } from "react-native";
import { IS_STANDALONE, IS_TAURI } from "../../lib/desktop";
import { CHROME_FONT } from "../../lib/fonts";
import { useAppVersion } from "../../lib/version";
import {
  DownloadIcon,
  GithubIcon,
  HelpIcon,
  InfoIcon,
  SettingsIcon,
  SidebarIcon,
} from "./Icon";
import { UpdateBanner } from "./UpdateBanner";

export const REPO_URL = "https://github.com/Vittv/bcp";

export type PageId =
  | "today"
  | "calendar"
  | "lectionary"
  | "psalms"
  | "collects"
  | "offices"
  | "saints"
  | "proverbs"
  | "canticles"
  | "old-testament"
  | "new-testament";

export type ModalType = "install" | "settings" | "about" | "help";

const NAV: { id: PageId; label: string; section?: string }[] = [
  { id: "today", label: "Daily Office" },
  { id: "calendar", label: "Calendar" },
  { id: "lectionary", label: "Lectionary" },
  { id: "offices", label: "Offices" },
  { id: "canticles", label: "Canticles", section: "reference" },
  { id: "collects", label: "Collects", section: "reference" },
  { id: "saints", label: "Holy Days", section: "reference" },
  { id: "psalms", label: "Psalms", section: "scripture" },
  { id: "proverbs", label: "Proverbs", section: "scripture" },
  { id: "old-testament", label: "Old Testament", section: "scripture" },
  { id: "new-testament", label: "New Testament", section: "scripture" },
];

const noSelect = {
  userSelect: "none" as const,
  WebkitUserSelect: "none" as const,
};

const HOVER_COLOR = "var(--text, #2c2020)";
const IDLE_COLOR = "var(--text-secondary, #7a6e64)";

const SECTION_ORDER = ["", "reference", "scripture"] as const;

type SidebarProps = {
  active: PageId;
  onSelect: (id: PageId) => void;
  onHide: () => void;
  onOpenModal: (modal: ModalType) => void;
  // per-row trailing context (the season, countdown, office of the hour...);
  // rows without a detail keep today's single label
  detail?: Partial<Record<PageId, string>>;
  // true while a drawer drag tracks the finger; a drag released over a row
  // is a gesture, not a tap, so it must not navigate on release
  dragging?: boolean;
};

export function Sidebar({
  active,
  onSelect,
  onHide,
  onOpenModal,
  detail,
  dragging,
}: SidebarProps) {
  const version = useAppVersion();
  const sections = SECTION_ORDER.map((section) => ({
    section,
    items: NAV.filter((item) => (item.section ?? "") === section),
  }));

  return (
    <View style={[styles.sidebar, noSelect]}>
      <View style={styles.toolbar}>
        <Pressable
          dataSet={{ bcpBtn: "" }}
          style={({ hovered, pressed }) => [
            styles.toolBtn,
            hovered && !pressed && styles.toolBtnHover,
            pressed && styles.toolBtnPressed,
          ]}
          onPress={onHide}
          accessibilityLabel="Hide sidebar"
          accessibilityRole="button"
        >
          {({ hovered }) => (
            <SidebarIcon size={14} color={hovered ? HOVER_COLOR : IDLE_COLOR} />
          )}
        </Pressable>
        <View style={styles.toolbarSpacer} />
        {!IS_TAURI && !IS_STANDALONE ? (
          <Pressable
            dataSet={{ bcpBtn: "" }}
            style={({ hovered, pressed }) => [
              styles.toolBtn,
              hovered && !pressed && styles.toolBtnHover,
              pressed && styles.toolBtnPressed,
            ]}
            onPress={() => onOpenModal("install")}
            accessibilityLabel="Install"
            accessibilityRole="button"
          >
            {({ hovered }) => (
              <DownloadIcon
                size={14}
                color={hovered ? HOVER_COLOR : IDLE_COLOR}
              />
            )}
          </Pressable>
        ) : null}
        <Pressable
          dataSet={{ bcpBtn: "" }}
          style={({ hovered, pressed }) => [
            styles.toolBtn,
            hovered && !pressed && styles.toolBtnHover,
            pressed && styles.toolBtnPressed,
          ]}
          onPress={() => onOpenModal("settings")}
          accessibilityLabel="Settings"
          accessibilityRole="button"
        >
          {({ hovered }) => (
            <SettingsIcon
              size={14}
              color={hovered ? HOVER_COLOR : IDLE_COLOR}
            />
          )}
        </Pressable>
        <Pressable
          dataSet={{ bcpBtn: "" }}
          style={({ hovered, pressed }) => [
            styles.toolBtn,
            hovered && !pressed && styles.toolBtnHover,
            pressed && styles.toolBtnPressed,
          ]}
          onPress={() => onOpenModal("help")}
          accessibilityLabel="Help and shortcuts"
          accessibilityRole="button"
        >
          {({ hovered }) => (
            <HelpIcon size={14} color={hovered ? HOVER_COLOR : IDLE_COLOR} />
          )}
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
                    dataSet={{ bcpNav: "" }}
                    accessibilityRole="link"
                    onPress={() => {
                      if (dragging) return;
                      onSelect(item.id);
                    }}
                    style={({ hovered, pressed }) => [
                      styles.navItem,
                      hovered && !pressed && styles.navItemHover,
                      pressed && styles.navItemPressed,
                    ]}
                  >
                    <Text
                      style={[styles.navText, isActive && styles.navTextActive]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                    {detail?.[item.id] ? (
                      <Text style={styles.navDetail} numberOfLines={1}>
                        {detail[item.id]}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>
      <UpdateBanner />
      <View style={styles.footer}>
        <Text style={styles.footerText} numberOfLines={1}>
          {`bcp · v${version}`}
        </Text>
        <View style={styles.toolbarSpacer} />
        <Pressable
          dataSet={{ bcpBtn: "" }}
          style={({ hovered, pressed }) => [
            styles.aboutBtn,
            hovered && !pressed && styles.aboutBtnHover,
            pressed && styles.toolBtnPressed,
          ]}
          accessibilityLabel="Visit the repository on GitHub"
          accessibilityRole="link"
          onPress={() => {
            window.open(REPO_URL, "_blank", "noreferrer");
          }}
        >
          <GithubIcon size={14} color={IDLE_COLOR} />
        </Pressable>
        <Pressable
          dataSet={{ bcpBtn: "" }}
          style={({ hovered, pressed }) => [
            styles.aboutBtn,
            hovered && !pressed && styles.aboutBtnHover,
            pressed && styles.toolBtnPressed,
          ]}
          onPress={() => onOpenModal("about")}
          accessibilityLabel="About"
          accessibilityRole="button"
        >
          {({ hovered }) => (
            <InfoIcon size={14} color={hovered ? HOVER_COLOR : IDLE_COLOR} />
          )}
        </Pressable>
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
    gap: 4,
    paddingHorizontal: 6,
  },
  toolbarSpacer: {
    flex: 1,
  },
  toolBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "var(--border-content, #b5aa9e)",
  },
  toolBtnHover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  toolBtnPressed: {
    backgroundColor: "var(--selected-bg, #ece7dd)",
  },
  // nav items: the active row is marked by accent text alone, while hover
  // keeps the control-hover fill
  scroll: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
  },
  nav: {
    paddingVertical: 4,
  },
  section: {
    paddingVertical: 4,
  },
  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "var(--border-faint, rgba(44, 32, 32, 0.09))",
    marginHorizontal: 10,
    marginBottom: 4,
  },
  navItem: {
    paddingVertical: 9,
    paddingHorizontal: 10,
    marginHorizontal: 8,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  navItemHover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  navItemPressed: {
    backgroundColor: "var(--selected-bg, #ece7dd)",
  },
  navText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 14,
    color: "var(--text-secondary, #7a6e64)",
    flexShrink: 0,
  },
  navTextActive: {
    color: "var(--accent, #7a3040)",
    fontWeight: "600",
  },
  navDetail: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 11,
    color: "var(--text-secondary, #7a6e64)",
    opacity: 0.7,
    // long details (feast names) ellipsize within the trailing space rather
    // than squeeze the row label
    flexShrink: 1,
  },
  footer: {
    height: 24,
    flexShrink: 0,
    borderTopWidth: 1,
    borderTopColor: "var(--border, #d2cbbf)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 2,
  },
  footerText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 11,
    color: "var(--text-secondary, #7a6e64)",
  },
  aboutBtn: {
    width: 24,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  aboutBtnHover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
});
