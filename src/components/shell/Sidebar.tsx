import type { ReactNode } from "react";
import {
  Pressable,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { IS_STANDALONE, IS_TAURI } from "../../lib/desktop";
import { CHROME_FONT } from "../../lib/fonts";
import { DISCORD_URL } from "../../lib/release";
import {
  defineThemedStyles,
  useThemedStyles,
  useThemeVar,
} from "../../lib/theme/themedStyles";
import { useAppVersion } from "../../lib/version";
import {
  BibleIcon,
  BookIcon,
  BookmarkIcon,
  CalendarIcon,
  ClockIcon,
  CrossIcon,
  CrownIcon,
  DiscordIcon,
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
  | "psalter"
  | "collects"
  | "offices"
  | "saints"
  | "proverbs"
  | "canticles"
  | "old-testament"
  | "new-testament"
  | "apocrypha";

export type ModalType = "install" | "settings" | "about" | "help" | "changelog";

// nav rows: dimmed icons beside short labels, in three blocks separated by a
// hairline; the trailing detail (season, countdown...) stays right
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
    // last in the reference block: the cycle reads as a companion to the
    // canonical Psalms index that opens the scripture block below it
    {
      id: "psalter",
      label: "30-Day Psalter",
      section: "reference",
      icon: <BookmarkIcon size={15} />,
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
    // last of the scripture block, the way an appendix goes last in a table
    // of contents. the label carries the distinction, so the row needs no
    // dimming or divider of its own: the row also carries active state
    {
      id: "apocrypha",
      label: "Apocrypha",
      section: "scripture",
      icon: <BibleIcon size={15} />,
    },
  ];

// group order; the blocks are separated by a hairline, not titled
const SECTIONS = ["", "reference", "scripture"] as const;

const noSelect = {
  userSelect: "none" as const,
  WebkitUserSelect: "none" as const,
};

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
  const styles = useThemedStyles(sidebarStyles);
  const v = useThemeVar();
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
          {children(hovered ? v("var(--text)") : v("var(--text-secondary)"))}
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

export type SidebarDetail = {
  text: string;
  // the detail is the day itself, not a countdown to it
  isToday?: boolean;
};

type SidebarProps = {
  active: PageId;
  onSelect: (id: PageId) => void;
  onHide: () => void;
  onOpenModal: (modal: ModalType) => void;
  // per-row trailing context (the season, countdown, office of the hour...);
  // rows without a detail keep today's single label
  detail?: Partial<Record<PageId, SidebarDetail>>;
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
  const styles = useThemedStyles(sidebarStyles);
  const v = useThemeVar();
  const version = useAppVersion();
  const sections = SECTIONS.map((id) => ({
    id,
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
            <SidebarIcon
              size={14}
              color={hovered ? v("var(--text)") : v("var(--text-secondary)")}
            />
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
          {sections.map(({ id, items }, idx) => (
            <View key={id || "main"} style={styles.section}>
              {id && idx > 0 ? <View style={styles.sectionDivider} /> : null}
              {items.map((item) => {
                const isActive = active === item.id;
                const itemDetail = detail?.[item.id];
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
                      hovered && styles.navItemHover,
                    ]}
                  >
                    <View style={styles.navLabel}>
                      <View
                        // SAFETY: the icon wrapper carries `color` (so the svg
                        // strokes inherit it via currentColor), which RN's
                        // ViewStyle type rejects; it is a plain ViewStyle at
                        // runtime, same as the settings rail's icon column.
                        style={
                          [
                            styles.navIcon,
                            isActive && styles.navIconActive,
                          ] as StyleProp<ViewStyle>
                        }
                      >
                        {item.icon}
                      </View>
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
                    {itemDetail ? (
                      <Text
                        style={[
                          styles.navDetail,
                          itemDetail.isToday && styles.navDetailToday,
                        ]}
                        numberOfLines={1}
                      >
                        {itemDetail.text}
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
          onPress={() => {
            window.open(DISCORD_URL, "_blank", "noreferrer");
          }}
          accessibilityLabel="Join the Discord community"
        >
          {(color) => <DiscordIcon size={14} color={color} />}
        </ToolButton>
        <ToolButton
          subtle
          footer
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
          onPress={() => onOpenModal("changelog")}
          accessibilityLabel="Changelog"
        >
          {(color) => <FileTextIcon size={14} color={color} />}
        </ToolButton>
        <ToolButton
          subtle
          footer
          onPress={() => onOpenModal("about")}
          accessibilityLabel="About"
        >
          {(color) => <InfoIcon size={14} color={color} />}
        </ToolButton>
      </View>
    </View>
  );
}

const sidebarStyles = defineThemedStyles({
  sidebar: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    borderRightWidth: 1,
    borderRightColor: "var(--border)",
    backgroundColor: "var(--bg)",
  },
  toolbar: {
    height: 30,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border)",
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
    borderColor: "var(--border)",
    backgroundColor: "var(--surface)",
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
    backgroundColor: "var(--control-hover)",
  },
  toolBtnText: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    fontWeight: "500",
    color: "var(--text-secondary)",
  },
  toolBtnTextHover: {
    color: "var(--text)",
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
    paddingBottom: 4,
  },
  // hairline between the nav blocks, tucked under the block above it: the
  // divider-owning block has no top padding, so the rule lands one step below
  // the last row and one step above the first
  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "var(--border-faint)",
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
    color: "var(--text-secondary)",
    // idle icons recede; the active row pops at full accent
    opacity: 0.6,
  },
  navIconActive: {
    color: "var(--accent)",
    opacity: 1,
  },
  navItemHover: {
    backgroundColor: "var(--control-hover)",
  },
  navText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 14,
    color: "var(--text-secondary)",
    // long labels ellipsize within the icon+label group rather than fight
    // the trailing detail
    flexShrink: 1,
  },
  navTextActive: {
    color: "var(--accent)",
    fontWeight: "600",
  },
  navDetail: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 11,
    color: "var(--text-secondary)",
    opacity: 0.7,
    // long details (feast names) ellipsize within the trailing space rather
    // than squeeze the row label
    flexShrink: 1,
  },
  // a feast that falls today stops counting down and reads as a live marker
  navDetailToday: {
    color: "var(--accent)",
    fontWeight: "700",
    textTransform: "capitalize",
    opacity: 1,
  },
  footer: {
    height: 24,
    flexShrink: 0,
    borderTopWidth: 1,
    borderTopColor: "var(--border)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 2,
  },
  footerText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 11,
    color: "var(--text-secondary)",
  },
});
