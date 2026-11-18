import { type ReactNode, useEffect, useState } from "react";
import {
  Pressable,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import { type BcpEdition, useEdition } from "../../context/EditionContext";
import { IS_STANDALONE, IS_TAURI } from "../../lib/desktop";
import { DISCORD_URL } from "../../lib/release";
import { useThemedStyles, useThemeVar } from "../../lib/theme/themedStyles";
import { useAppVersion } from "../../lib/version";
import { registerEsc } from "./AppModal";
import { Chevron } from "./Chevron";
import {
  DiscordIcon,
  DownloadIcon,
  FileTextIcon,
  GithubIcon,
  HelpIcon,
  InfoIcon,
  SettingsIcon,
  SidebarIcon,
} from "./Icon";
import {
  type ModalType,
  NAV,
  noSelect,
  type PageId,
  REPO_URL,
  SECTIONS,
  type SidebarDetail,
} from "./Sidebar.model";
import { sidebarStyles } from "./Sidebar.styles";

export type { ModalType, PageId, SidebarDetail };
export { REPO_URL };

const EDITION_OPTIONS: readonly { id: BcpEdition; label: string }[] = [
  { id: "1979", label: "1979 - The Episcopal Church BCP" },
  { id: "1662", label: "1662 - Book of Common Prayer" },
  { id: "1962", label: "1962 - Anglican Church of Canada BCP" },
];

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
  const { edition, setEdition } = useEdition();
  const [editionOpen, setEditionOpen] = useState(false);
  const [hoveredEdition, setHoveredEdition] = useState<string | null>(null);
  useEffect(() => {
    if (!editionOpen) {
      setHoveredEdition(null);
      return;
    }
    return registerEsc(() => setEditionOpen(false));
  }, [editionOpen]);
  const sections = SECTIONS.map((id) => ({
    id,
    items: NAV.filter((item) => (item.section ?? "") === id),
  }));
  const currentEditionLabel =
    EDITION_OPTIONS.find((o) => o.id === edition)?.label ?? edition;

  return (
    <View style={[styles.sidebar, noSelect]}>
      {editionOpen ? (
        <Pressable
          style={styles.editionBackdrop}
          onPress={() => setEditionOpen(false)}
          accessibilityLabel="Close edition picker"
          accessibilityRole="button"
        />
      ) : null}
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
      <View style={styles.editionWrap}>
        {editionOpen ? (
          <View style={styles.editionList}>
            {EDITION_OPTIONS.filter((o) => o.id !== edition).map((o) => {
              const [year, sep, ...rest] = o.label.split(" ");
              return (
                <Pressable
                  key={o.id}
                  style={({ hovered }) => [
                    styles.editionItem,
                    hovered && styles.editionItemActive,
                  ]}
                  onHoverIn={() => setHoveredEdition(o.id)}
                  onHoverOut={() =>
                    setHoveredEdition((current) =>
                      current === o.id ? null : current,
                    )
                  }
                  onPress={() => {
                    setEdition(o.id);
                    setEditionOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={o.label}
                >
                  <Text style={styles.editionItemText} numberOfLines={1}>
                    <Text style={styles.editionYearAccent}>{year}</Text>
                    {sep === "•" || sep === "-" ? (
                      <>
                        {" "}
                        {sep === "•" ? (
                          <Text style={styles.editionBullet}>•</Text>
                        ) : (
                          "-"
                        )}
                        {rest.length ? ` ${rest.join(" ")}` : ""}
                      </>
                    ) : (
                      ` ${[sep, ...rest].filter(Boolean).join(" ")}`
                    )}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        <Pressable
          style={({ hovered }) => [
            styles.editionTrigger,
            (hovered || (editionOpen && !hoveredEdition)) &&
              styles.editionItemActive,
          ]}
          onPress={() => setEditionOpen((v) => !v)}
          accessibilityRole="button"
          accessibilityState={{ expanded: editionOpen }}
          accessibilityLabel={`Prayer book edition: ${currentEditionLabel}`}
        >
          <Text style={styles.editionTriggerText} numberOfLines={1}>
            {(() => {
              const [year, sep, ...rest] = currentEditionLabel.split(" ");
              return (
                <>
                  <Text style={styles.editionYearAccent}>{year}</Text>
                  {sep === "•" || sep === "-" ? (
                    <>
                      {" "}
                      {sep === "•" ? (
                        <Text style={styles.editionBullet}>•</Text>
                      ) : (
                        "-"
                      )}
                      {rest.length ? ` ${rest.join(" ")}` : ""}
                    </>
                  ) : (
                    ` ${[sep, ...rest].filter(Boolean).join(" ")}`
                  )}
                </>
              );
            })()}
          </Text>
          <Chevron direction={editionOpen ? "down" : "up"} size={5} />
        </Pressable>
      </View>
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
