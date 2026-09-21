import type { ReactNode } from "react";
import {
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { IS_STANDALONE, IS_TAURI } from "../../lib/desktop";
import { CHROME_FONT } from "../../lib/fonts";
import { useAppVersion } from "../../lib/version";
import {
  BibleIcon,
  BookIcon,
  BookmarkIcon,
  CalendarIcon,
  ClockIcon,
  CrossIcon,
  CrownIcon,
  DownloadIcon,
  FileTextIcon,
  GithubIcon,
  HelpIcon,
  InfoIcon,
  ListIcon,
  MusicIcon,
  SettingsIcon,
  SidebarIcon,
  StarIcon,
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

export type ModalType = "install" | "settings" | "about" | "help" | "changelog";

// nav rows: dimmed icons beside short labels, grouped under the small-caps
// section titles; the trailing detail (season, countdown...) stays right
const NAV: { id: PageId; label: string; section?: string; icon: ReactNode }[] =
  [
    { id: "today", label: "Daily Office", icon: <BookIcon size={15} /> },
    { id: "calendar", label: "Calendar", icon: <CalendarIcon size={15} /> },
    { id: "lectionary", label: "Lectionary", icon: <ListIcon size={15} /> },
    { id: "offices", label: "Offices", icon: <ClockIcon size={15} /> },
    {
      id: "canticles",
      label: "Canticles",
      section: "reference",
      icon: <MusicIcon size={15} />,
    },
    {
      id: "collects",
      label: "Collects",
      section: "reference",
      icon: <CrossIcon size={15} />,
    },
    {
      id: "saints",
      label: "Holy Days",
      section: "reference",
      icon: <StarIcon size={15} />,
    },
    {
      id: "psalms",
      label: "Psalms",
      section: "scripture",
      icon: <BookmarkIcon size={15} />,
    },
    {
      id: "proverbs",
      label: "Proverbs",
      section: "scripture",
      icon: <CrownIcon size={15} />,
    },
    {
      id: "old-testament",
      label: "Old Testament",
      section: "scripture",
      icon: <BibleIcon size={15} />,
    },
    {
      id: "new-testament",
      label: "New Testament",
      section: "scripture",
      icon: <BibleIcon size={15} />,
    },
  ];

// small-caps section headers, flush with the icon column
const SECTIONS = [
  { id: "", title: "Prayer" },
  { id: "reference", title: "Reference" },
  { id: "scripture", title: "Scripture" },
] as const;

const noSelect = {
  userSelect: "none" as const,
  WebkitUserSelect: "none" as const,
};

const HOVER_COLOR = "var(--text, #2c2020)";
const IDLE_COLOR = "var(--text-secondary, #7a6e64)";

// a toolbar pill: bordered, icon plus optional label, hover fill, no pressed
// state; `subtle` drops border and plate while keeping the pill anatomy
function ToolButton({
  label,
  onPress,
  accessibilityLabel,
  subtle = false,
  footer = false,
  children,
}: {
  label?: string;
  onPress: () => void;
  accessibilityLabel: string;
  subtle?: boolean;
  footer?: boolean;
  children: (color: string) => ReactNode;
}) {
  return (
    <Pressable
      dataSet={{ bcpBtn: "" }}
      style={({ hovered }) => [
        styles.toolBtn,
        subtle && styles.toolBtnSubtle,
        label ? styles.toolBtnLabeled : null,
        footer && styles.toolBtnFooter,
        hovered && styles.toolBtnHover,
      ]}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      {({ hovered }) => (
        <>
          {children(hovered ? HOVER_COLOR : IDLE_COLOR)}
          {label ? (
            <Text
              style={[styles.toolBtnText, hovered && styles.toolBtnTextHover]}
              numberOfLines={1}
            >
              {label}
            </Text>
          ) : null}
        </>
      )}
    </Pressable>
  );
}

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
  // true when the toolbar has room for icon+label pills (the desktop pane
  // above ~272px); narrow panes and native keep icon-only squares
  showLabels?: boolean;
};

export function Sidebar({
  active,
  onSelect,
  onHide,
  onOpenModal,
  detail,
  dragging,
  showLabels = true,
}: SidebarProps) {
  const version = useAppVersion();
  const sections = SECTIONS.map(({ id, title }) => ({
    id,
    title,
    items: NAV.filter((item) => (item.section ?? "") === id),
  }));

  return (
    <View style={[styles.sidebar, noSelect]}>
      <View style={styles.toolbar}>
        <Pressable
          dataSet={{ bcpBtn: "" }}
          style={({ hovered }) => [
            styles.toolBtn,
            hovered && styles.toolBtnHover,
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
          <ToolButton
            label={showLabels ? "Install" : undefined}
            onPress={() => onOpenModal("install")}
            accessibilityLabel="Install"
          >
            {(color) => <DownloadIcon size={14} color={color} />}
          </ToolButton>
        ) : null}
        <ToolButton
          label={showLabels ? "Settings" : undefined}
          onPress={() => onOpenModal("settings")}
          accessibilityLabel="Settings"
        >
          {(color) => <SettingsIcon size={14} color={color} />}
        </ToolButton>
        <ToolButton
          label={showLabels ? "Help" : undefined}
          onPress={() => onOpenModal("help")}
          accessibilityLabel="Help and shortcuts"
        >
          {(color) => <HelpIcon size={14} color={color} />}
        </ToolButton>
      </View>
      <View style={styles.scroll}>
        <View style={styles.nav}>
          {sections.map(({ id, title, items }) => (
            <View key={id || "main"} style={styles.section}>
              <Text style={styles.sectionTitle} numberOfLines={1}>
                {title}
              </Text>
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
                    style={({ hovered }) => [
                      styles.navItem,
                      isActive && styles.navItemActive,
                      hovered && styles.navItemHover,
                    ]}
                  >
                    <View style={styles.navLabel}>
                      <View style={navIconStyle(isActive)}>{item.icon}</View>
                      <Text
                        style={[
                          styles.navText,
                          isActive && styles.navTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>
                    </View>
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
          {`BCP · v${version}`}
        </Text>
        <View style={styles.toolbarSpacer} />
        <ToolButton
          subtle
          footer
          label={showLabels ? "Source" : undefined}
          onPress={() => {
            window.open(REPO_URL, "_blank", "noreferrer");
          }}
          accessibilityLabel="Visit the repository on GitHub"
        >
          {(color) => <GithubIcon size={14} color={color} />}
        </ToolButton>
        <ToolButton
          subtle
          footer
          label={showLabels ? "Changelog" : undefined}
          onPress={() => onOpenModal("changelog")}
          accessibilityLabel="Changelog"
        >
          {(color) => <FileTextIcon size={14} color={color} />}
        </ToolButton>
        <ToolButton
          subtle
          footer
          label={showLabels ? "About" : undefined}
          onPress={() => onOpenModal("about")}
          accessibilityLabel="About"
        >
          {(color) => <InfoIcon size={14} color={color} />}
        </ToolButton>
      </View>
    </View>
  );
}

// SAFETY: the icon wrapper carries `color` (so the svg strokes inherit it via
// currentColor), which RN's ViewStyle type rejects; it is a plain ViewStyle at
// runtime, same as the settings rail's icon column.
const navIconStyle = (active: boolean): StyleProp<ViewStyle> =>
  [styles.navIcon, active && styles.navIconActive] as StyleProp<ViewStyle>;

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
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "var(--border, #cbc5bb)",
    backgroundColor: "var(--surface, #d5cfc4)",
  },
  toolBtnSubtle: {
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  // labeled pills keep the 24px row height, widening only for the label so
  // icon-only and labeled buttons stay flush with the bar chips
  toolBtnLabeled: {
    paddingHorizontal: 8,
  },
  // footer pills sit at 20px so their hover leaves breathing room inside
  // the 24px footer strip instead of filling it edge to edge
  toolBtnFooter: {
    height: 20,
    paddingHorizontal: 6,
  },
  toolBtnHover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  toolBtnText: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    fontWeight: "500",
    color: "var(--text-secondary, #7a6e64)",
  },
  toolBtnTextHover: {
    color: "var(--text, #2c2020)",
  },
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
  // small-caps group header, flush with the rows' label column
  sectionTitle: {
    fontFamily: CHROME_FONT,
    fontWeight: "600",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "var(--text-secondary, #7a6e64)",
    opacity: 0.6,
    marginHorizontal: 8,
    paddingHorizontal: 10,
    marginTop: 6,
    marginBottom: 2,
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
  navLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
  },
  navIcon: {
    width: 18,
    alignItems: "center",
    color: "var(--text-secondary, #7a6e64)",
    // idle icons recede; the active row pops at full accent
    opacity: 0.6,
  },
  navIconActive: {
    color: "var(--accent, #7a3040)",
    opacity: 1,
  },
  navItemHover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  navItemActive: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  navText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 14,
    color: "var(--text-secondary, #7a6e64)",
    // long labels ellipsize within the icon+label group rather than fight
    // the trailing detail
    flexShrink: 1,
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
});
