import { type ReactNode, useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { HelpScreen } from "../components/shell/HelpScreen";
import {
  BibleIcon,
  BookIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  DesktopIcon,
  DownloadIcon,
  HelpIcon,
  InfoIcon,
  SunIcon,
  TypographyIcon,
} from "../components/shell/Icon";
import type { ModalType } from "../components/shell/Sidebar";
import { useOfficeSettings } from "../context/OfficeSettingsContext";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "../context/TranslationContext";
import { filterSearch } from "../lib/search";
import { type SettingsSectionId, visibleSettings } from "../lib/settings";
import { useThemedStyles, useThemeVar } from "../lib/theme/themedStyles";
import { useUpdateStatus } from "../lib/updater";
import type { WindowControlStyleId } from "../lib/windowDecorations";
import { AboutScreen } from "./AboutScreen";
import { InstallScreen } from "./InstallScreen";
import { AppearanceSettings } from "./settings/AppearanceSettings";
import { BibleSettingsPanel } from "./settings/BibleSettings";
import { DesktopSettingsPanel } from "./settings/DesktopSettings";
import { OfficeSettingsPanel } from "./settings/OfficeSettings";
import { SettingsSearch } from "./settings/SettingsUi";
import { settingsStyles as styleDef } from "./settings/settingsStyles";
import { TypographySettings } from "./settings/TypographySettings";

type SectionId = SettingsSectionId;

// the settings modal is a slim bar with the active section's eyebrow title
// and the close X over a rail of grouped small stroke icons beside the
// section's pane; the rail head's mag-glass field filters the categories as
// you type. phones trade the rail for a settings list that drills into each
// section the way a system settings app does: rows carry icon, label, and
// chevron, and the section page slides in with a back button where the rail
// search sat. about, help, and install are the app's other chrome panels,
// hoisted into the same modal so every entry point shares one box.
const SECTION_ICONS: Record<SectionId, ReactNode> = {
  appearance: <SunIcon size={15} />,
  typography: <TypographyIcon size={15} />,
  office: <BookIcon size={15} />,
  bible: <BibleIcon size={15} />,
  desktop: <DesktopIcon size={15} />,
  install: <DownloadIcon size={15} />,
  about: <InfoIcon size={15} />,
  help: <HelpIcon size={15} />,
};

// section order, split into blocks that a hairline separates. the blocks
// carry no titles, matching the nav sidebar's dividers
const SECTION_BLOCKS: SectionId[][] = [
  ["appearance", "typography"],
  ["office", "bible"],
  ["desktop"],
  ["install", "help", "about"],
];

// every sidebar entry point and palette run lands directly as its section;
// the bare settings button returns null so phones start on the section list
// and desktop falls back to the first category. hidden sections (install on
// a desktop build, desktop in a browser tab) never appear as a landing spot
function initialSection(
  modal: ModalType | SettingsSectionId | undefined,
): SectionId | null {
  // settings and changelog are shell modals, not settings sections, so they
  // land on the default (null) instead of a nonexistent row
  if (!modal || modal === "settings" || modal === "changelog") return null;
  return modal;
}

// the section the user last opened, so a bare reopen lands there instead of
// the first category. session-only: it lives and dies with the tab, no device
// preference to keep
const LAST_SECTION_KEY = "bcp-settings-section";

function loadLastSection(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    return sessionStorage.getItem(LAST_SECTION_KEY);
  } catch {
    return null;
  }
}

function persistLastSection(id: SectionId) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(LAST_SECTION_KEY, id);
  } catch {}
}

// the desktop category only holds tauri-shell settings (window controls,
// the updater), which don't exist in a browser tab; install only matters
// when the web app is not installed yet, mirroring the sidebar's button
const visibleCategories = () =>
  visibleSettings().map((s) => ({ ...s, icon: SECTION_ICONS[s.id] }));

type SettingsScreenProps = {
  // phones replace the rail with a settings list that drills into sections;
  // the modal turns sheet-like
  mobile?: boolean;
  onClose: () => void;
  // the sidebar button or global palette that opened the modal lands on
  // this section
  initialSection?: ModalType | SettingsSectionId;
  // window controls are a tauri-shell setting, hidden in a browser tab
  showWindowControls?: boolean;
  windowControlStyle?: WindowControlStyleId;
  onWindowControlStyleChange?: (style: WindowControlStyleId) => void;
};

export function SettingsScreen({
  mobile = false,
  onClose,
  initialSection: requested,
  showWindowControls = false,
  windowControlStyle = "system",
  onWindowControlStyleChange,
}: SettingsScreenProps) {
  const styles = useThemedStyles(styleDef);
  const v = useThemeVar();
  const visible = visibleCategories();
  const [activeCategory, setActiveCategory] = useState<SectionId | null>(() => {
    const requestedSection = initialSection(requested);
    if (requestedSection !== null) {
      return visible.some((c) => c.id === requestedSection)
        ? requestedSection
        : "appearance";
    }
    // no explicit target: reopen where the user last was this session. a
    // stored id that no longer names a visible section is ignored
    const last = loadLastSection();
    const recalled = last ? visible.find((c) => c.id === last) : undefined;
    if (recalled) return recalled.id;
    // otherwise phones land on the section list; desktop on the first category
    return mobile ? null : "appearance";
  });

  const theme = useTheme();
  const { translation, setTranslation } = useTranslation();
  const office = useOfficeSettings();
  const updater = useUpdateStatus();
  const [query, setQuery] = useState("");

  const categories = filterSearch(query, visibleCategories());
  const blocks = SECTION_BLOCKS.map((ids) =>
    ids.filter((id) => categories.some((c) => c.id === id)),
  ).filter((ids) => ids.length > 0);

  const active =
    categories.find((c) => c.id === activeCategory) ?? categories[0];

  // remember the open section for the rest of the session, so a bare reopen
  // lands where the user left; backing out to the phone list keeps the last one
  useEffect(() => {
    if (activeCategory) persistLastSection(activeCategory);
  }, [activeCategory]);

  const contentFor = (id: SectionId | undefined): ReactNode => {
    switch (id) {
      case "appearance":
        return (
          <AppearanceSettings
            mode={theme.mode}
            setMode={theme.setMode}
            theme={theme.theme}
            setTheme={theme.setTheme}
            resolved={theme.resolved}
            uiScale={theme.uiScale}
            setUiScale={theme.setUiScale}
          />
        );
      case "typography":
        return (
          <TypographySettings
            fontPx={theme.fontPx}
            setFontPx={theme.setFontPx}
            interfaceFont={theme.interfaceFont}
            setInterfaceFont={theme.setInterfaceFont}
            headingFont={theme.headingFont}
            setHeadingFont={theme.setHeadingFont}
            subheadingFont={theme.subheadingFont}
            setSubheadingFont={theme.setSubheadingFont}
            readingFont={theme.readingFont}
            setReadingFont={theme.setReadingFont}
            interfaceFaces={theme.interfaceFaces}
            headingFaces={theme.headingFaces}
            subheadingFaces={theme.subheadingFaces}
            readingFaces={theme.readingFaces}
            onResetFonts={() => {
              theme.resetInterfaceFont();
              theme.resetHeadingFont();
              theme.resetSubheadingFont();
              theme.resetReadingFont();
            }}
          />
        );
      case "office":
        return (
          <OfficeSettingsPanel
            showRubrics={office.showRubrics}
            setShowRubrics={office.setShowRubrics}
            showSpeakers={office.showSpeakers}
            setShowSpeakers={office.setShowSpeakers}
            devotions={office.devotions}
            setDevotions={office.setDevotions}
            rite={office.rite}
            setRite={office.setRite}
          />
        );
      case "bible":
        return (
          <BibleSettingsPanel
            translation={translation}
            setTranslation={setTranslation}
          />
        );
      case "desktop":
        return (
          <DesktopSettingsPanel
            showWindowControls={showWindowControls}
            windowControlStyle={windowControlStyle}
            onWindowControlStyleChange={onWindowControlStyleChange}
            status={updater.status}
            version={updater.version}
            message={updater.message}
            check={updater.check}
            install={updater.install}
          />
        );
      case "install":
        return <InstallScreen />;
      case "about":
        return <AboutScreen />;
      case "help":
        return <HelpScreen />;
    }
    return null;
  };

  // phones only reach this branch with a section open, so the active
  // category is always a real section
  const mobileActive =
    visible.find((c) => c.id === activeCategory) ?? visible[0];

  // SAFETY: the rail icon wrapper carries `color` (so the svg strokes inherit
  // it via currentColor), which RN's ViewStyle type rejects; it is a plain
  // ViewStyle at runtime.
  const railIconStyle = (active: boolean): StyleProp<ViewStyle> =>
    [styles.railIcon, active && styles.railIconActive] as StyleProp<ViewStyle>;

  return (
    <View style={styles.frame}>
      <View style={mobile ? styles.chromeMobile : styles.chrome}>
        {mobile ? (
          activeCategory === null ? (
            <>
              <View style={styles.mobileHead}>
                <View style={styles.mobileHeadSearch}>
                  <SettingsSearch query={query} onChange={setQuery} />
                </View>
                <Pressable
                  onPress={onClose}
                  style={({ hovered }) => [
                    styles.paneCloseBtn,
                    hovered && styles.paneCloseBtnHover,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Close settings"
                >
                  {({ hovered }) => (
                    <CloseIcon
                      size={16}
                      color={
                        hovered ? v("var(--text)") : v("var(--text-secondary)")
                      }
                    />
                  )}
                </Pressable>
              </View>
              {blocks.length > 0 ? (
                <ScrollView
                  style={styles.mobileList}
                  showsVerticalScrollIndicator={false}
                >
                  {blocks.map((ids, blockIdx) => (
                    <View key={ids.join("-")}>
                      {blockIdx > 0 ? (
                        <View style={styles.mobileDivider} />
                      ) : null}
                      {ids.map((id) => {
                        const cat =
                          categories.find((c) => c.id === id) ?? categories[0];
                        return (
                          <Pressable
                            key={id}
                            onPress={() => setActiveCategory(id)}
                            style={({ hovered }) => [
                              styles.mobileRow,
                              hovered && styles.mobileRowHover,
                            ]}
                          >
                            <View style={railIconStyle(false)}>{cat.icon}</View>
                            <Text
                              style={styles.mobileRowLabel}
                              numberOfLines={1}
                            >
                              {cat.railTitle ?? cat.title}
                            </Text>
                            <ChevronRightIcon
                              size={14}
                              color={v("var(--text-secondary)")}
                            />
                          </Pressable>
                        );
                      })}
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.mobileEmpty}>
                  No settings match the search.
                </Text>
              )}
            </>
          ) : (
            <>
              <View style={styles.mobileHead}>
                <Pressable
                  onPress={() => setActiveCategory(null)}
                  style={({ hovered }) => [
                    styles.backButton,
                    hovered && styles.backButtonHover,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Back to settings"
                >
                  {({ hovered }) => (
                    <>
                      <ChevronLeftIcon
                        size={14}
                        color={
                          hovered
                            ? v("var(--text)")
                            : v("var(--text-secondary)")
                        }
                      />
                      <Text
                        style={[
                          styles.backText,
                          hovered && styles.backTextHover,
                        ]}
                      >
                        Settings
                      </Text>
                    </>
                  )}
                </Pressable>
                <Text style={styles.mobileHeadTitle} numberOfLines={1}>
                  {mobileActive.railTitle ?? mobileActive.title}
                </Text>
                <Pressable
                  onPress={onClose}
                  style={({ hovered }) => [
                    styles.paneCloseBtn,
                    hovered && styles.paneCloseBtnHover,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Close settings"
                >
                  {({ hovered }) => (
                    <CloseIcon
                      size={16}
                      color={
                        hovered ? v("var(--text)") : v("var(--text-secondary)")
                      }
                    />
                  )}
                </Pressable>
              </View>
              <ScrollView
                style={styles.paneScroll}
                contentContainerStyle={styles.mobilePaneScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.paneIntro}>
                  <Text style={styles.paneTitle}>{mobileActive.title}</Text>
                  <Text style={styles.paneDescription}>
                    {mobileActive.description}
                  </Text>
                </View>
                {contentFor(mobileActive.id)}
              </ScrollView>
            </>
          )
        ) : (
          <>
            <View style={styles.rail}>
              <View style={styles.railHead}>
                <SettingsSearch query={query} onChange={setQuery} />
              </View>
              <ScrollView style={styles.railScroll}>
                {blocks.map((ids, blockIdx) => (
                  <View key={ids.join("-")}>
                    {blockIdx > 0 ? <View style={styles.railDivider} /> : null}
                    {ids.map((id) => {
                      const cat =
                        categories.find((c) => c.id === id) ?? categories[0];
                      const activeRow = active?.id === id;
                      return (
                        <Pressable
                          key={id}
                          onPress={() => setActiveCategory(id)}
                          style={({ hovered }) => [
                            styles.railRow,
                            hovered && styles.railRowHover,
                          ]}
                        >
                          <View style={railIconStyle(activeRow)}>
                            {cat.icon}
                          </View>
                          <Text
                            style={[
                              styles.railRowLabel,
                              activeRow && styles.railRowLabelActive,
                            ]}
                            numberOfLines={1}
                          >
                            {cat.railTitle ?? cat.title}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </ScrollView>
              <View style={styles.railFoot}>
                <Text style={styles.railFootText}>
                  Settings save automatically on this device.
                </Text>
              </View>
            </View>

            <View style={styles.pane}>
              <View style={styles.paneHead}>
                <Text style={styles.eyebrow} numberOfLines={1}>
                  {active ? (active.railTitle ?? active.title) : "Search"}
                </Text>
                <Pressable
                  onPress={onClose}
                  style={({ hovered }) => [
                    styles.paneCloseBtn,
                    hovered && styles.paneCloseBtnHover,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Close settings"
                >
                  {({ hovered }) => (
                    <CloseIcon
                      size={16}
                      color={
                        hovered ? v("var(--text)") : v("var(--text-secondary)")
                      }
                    />
                  )}
                </Pressable>
              </View>
              <ScrollView
                style={styles.paneScroll}
                contentContainerStyle={styles.paneScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {active ? (
                  <>
                    <View style={styles.paneIntro}>
                      <Text style={styles.paneTitle}>{active.title}</Text>
                      <Text style={styles.paneDescription}>
                        {active.description}
                      </Text>
                    </View>
                    {contentFor(active?.id)}
                  </>
                ) : (
                  <Text style={styles.noMatches}>
                    No settings match the search.
                  </Text>
                )}
              </ScrollView>
            </View>
          </>
        )}
      </View>
    </View>
  );
}
