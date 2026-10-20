import { type ReactNode, useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  type StyleProp,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type ViewStyle,
} from "react-native";
import { FontPicker } from "../components/settings/FontPicker";
import { Slider } from "../components/settings/Slider";
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
  MagnifierIcon,
  SunIcon,
  TypographyIcon,
} from "../components/shell/Icon";
import type { ModalType } from "../components/shell/Sidebar";
import {
  ALL_BOOKS,
  clearSavedPositions,
  savedPositions,
  TESTAMENTS,
} from "../context/BibleContext";
import { useOfficeSettings } from "../context/OfficeSettingsContext";
import { type ThemeMode, useTheme } from "../context/ThemeContext";
import { useTranslation } from "../context/TranslationContext";
import { clearProgress, getAllProgress } from "../lib/content/bibleProgress";
import { IS_TAURI } from "../lib/desktop";
import {
  CHROME_FONT,
  HEADING_FONT,
  SERIF_FONT,
  SERIF_ITALIC_FONT,
  SUBHEADING_FONT,
} from "../lib/fonts";
import { filterSearch } from "../lib/search";
import { type SettingsSectionId, visibleSettings } from "../lib/settings";
import {
  defineThemedStyles,
  useThemedStyles,
  useThemeVar,
} from "../lib/theme/themedStyles";
import { THEME_LIST, type ThemeId, themeTokens } from "../lib/theme/themes";
import type { ResolvedTheme, ThemeTokens } from "../lib/theme/tokens";
import { TRANSLATION_OPTIONS } from "../lib/translations";
import type { FaceDef } from "../lib/typography/faces";
import {
  BASE_FONT_PX,
  DEFAULT_FONT_PX,
  FONT_SIZES,
  MAX_FONT_PX,
  MIN_FONT_PX,
} from "../lib/typography/sizes";
import {
  defaultUiScalePercent,
  MOBILE_DEFAULT_UI_SCALE_PERCENT,
  percentToUiScale,
  UI_SCALE_PERCENTAGES,
  uiScaleToPercent,
} from "../lib/uiScale";
import { useUpdateStatus } from "../lib/updater";
import { WIDTH_MOBILE } from "../lib/viewport";
import { AboutScreen } from "./AboutScreen";
import { InstallScreen } from "./InstallScreen";

const MONO = '"JetBrains Mono", monospace';

const MODE_OPTIONS = [
  { id: "light" as const, label: "Light" },
  { id: "dark" as const, label: "Dark" },
  { id: "system" as const, label: "System" },
];

const ON_OFF = [
  { id: true as const, label: "On" },
  { id: false as const, label: "Off" },
];

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
  // only meaningful inside the desktop shell on win/linux
  showWindowControls?: boolean;
  windowControls?: boolean;
  onWindowControlsChange?: (show: boolean) => void;
};

export function SettingsScreen({
  mobile = false,
  onClose,
  initialSection: requested,
  showWindowControls = false,
  windowControls = true,
  onWindowControlsChange,
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
          <OfficeSettings
            showRubrics={office.showRubrics}
            setShowRubrics={office.setShowRubrics}
            showSpeakers={office.showSpeakers}
            setShowSpeakers={office.setShowSpeakers}
            devotions={office.devotions}
            setDevotions={office.setDevotions}
          />
        );
      case "bible":
        return (
          <BibleSettings
            translation={translation}
            setTranslation={setTranslation}
          />
        );
      case "desktop":
        return (
          <DesktopSettings
            showWindowControls={showWindowControls}
            windowControls={windowControls}
            onWindowControlsChange={onWindowControlsChange}
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

// the mag-glass field filters the rail categories on desktop and the settings
// list on phones as you type; the same token matcher behind it feeds the
// global cmd+K palette
function SettingsSearch({
  query,
  onChange,
}: {
  query: string;
  onChange: (q: string) => void;
}) {
  const styles = useThemedStyles(styleDef);
  const v = useThemeVar();
  return (
    <View style={styles.searchField} dataSet={{ settingsSearch: "" }}>
      <MagnifierIcon size={16} color={v("var(--text-secondary)")} />
      <TextInput
        value={query}
        onChangeText={onChange}
        placeholder="Search"
        placeholderTextColor={v("var(--text-secondary)")}
        accessibilityLabel="Search settings"
        style={styles.searchInput}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {query ? (
        <Pressable
          onPress={() => onChange("")}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          style={({ hovered }) => [
            styles.searchClear,
            hovered && styles.searchClearHover,
          ]}
        >
          <CloseIcon size={12} color={v("var(--text-secondary)")} />
        </Pressable>
      ) : null}
    </View>
  );
}

// a row of pressable option chips with the active one highlighted; one
// control for every option-style setting
function OptionChips<T extends string | boolean = string>({
  options,
  value,
  onSelect,
  mono = false,
}: {
  options: readonly { id: T; label: string }[];
  value: T;
  onSelect: (id: T) => void;
  mono?: boolean;
}) {
  const styles = useThemedStyles(styleDef);
  return (
    <View style={styles.row}>
      {options.map(({ id, label }) => (
        <Text
          key={String(id)}
          style={[
            styles.option,
            mono && styles.optionMono,
            value === id && styles.optionActive,
          ]}
          onPress={() => onSelect(id)}
        >
          {label}
        </Text>
      ))}
    </View>
  );
}

// an on/off setting: label, On/Off chips, and a one-line description
function ToggleRow({
  label,
  value,
  onChange,
  description,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  description: string;
}) {
  const styles = useThemedStyles(styleDef);
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      <OptionChips options={ON_OFF} value={value} onSelect={onChange} />
      <Text style={styles.settingDescription}>{description}</Text>
    </View>
  );
}

type AppearanceSettingsProps = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  resolved: ResolvedTheme;
  uiScale: number;
  setUiScale: (scale: number) => void;
};

function AppearanceSettings({
  mode,
  setMode,
  theme,
  setTheme,
  resolved,
  uiScale,
  setUiScale,
}: AppearanceSettingsProps) {
  const styles = useThemedStyles(styleDef);
  // reset to the first-run default: 120% on small screens, 100% elsewhere
  const { width } = useWindowDimensions();
  const smallScreen = Platform.OS !== "web" || width < WIDTH_MOBILE;
  return (
    <>
      <View style={styles.section}>
        <Text style={styles.label}>Mode</Text>
        <OptionChips options={MODE_OPTIONS} value={mode} onSelect={setMode} />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Theme</Text>
        <View style={styles.themeGrid}>
          {THEME_LIST.map((t) => (
            <ThemePreview
              key={t.id}
              label={t.label}
              tokens={themeTokens(t.id, resolved)}
              selected={t.id === theme}
              onSelect={() => setTheme(t.id)}
            />
          ))}
        </View>
      </View>

      {Platform.OS === "web" ? (
        <View style={styles.section}>
          <View style={styles.groupRow}>
            <View style={styles.groupLabelRow}>
              <Text style={styles.groupLabel}>UI Scale</Text>
              <Text
                style={styles.value}
              >{`${uiScaleToPercent(uiScale)}%`}</Text>
            </View>
            <Pressable
              onPress={() =>
                setUiScale(percentToUiScale(defaultUiScalePercent(smallScreen)))
              }
              style={({ hovered }) => [
                styles.reset,
                hovered && styles.resetHover,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Reset UI scale"
            >
              <Text style={styles.resetText}>Reset</Text>
            </Pressable>
          </View>
          <View style={styles.sliderWrap}>
            <Slider
              value={uiScaleToPercent(uiScale)}
              onChange={(pct) => setUiScale(percentToUiScale(pct))}
              steps={UI_SCALE_PERCENTAGES}
              thumb="round"
              formatTick={(pct) => `${pct}%`}
            />
          </View>
          <Text style={styles.settingDescription}>
            {`Scales the whole interface. 100% as default; mobile at ${MOBILE_DEFAULT_UI_SCALE_PERCENT}% for readability.`}
          </Text>
        </View>
      ) : null}
    </>
  );
}

// a miniature of the app painted with a family's own tokens, so the picker
// shows the palette instead of describing it. it takes the resolved tokens,
// not the family, so switching Mode re-tints every preview to the variant the
// user would actually get.
function ThemePreview({
  label,
  tokens,
  selected,
  onSelect,
}: {
  label: string;
  tokens: ThemeTokens;
  selected: boolean;
  onSelect: () => void;
}) {
  const styles = useThemedStyles(styleDef);
  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label} theme`}
      style={styles.themeOption}
    >
      <View
        style={[
          styles.themeCard,
          { backgroundColor: tokens.bg, borderColor: tokens.border },
          selected && styles.themeCardActive,
        ]}
      >
        <View style={[styles.themePanel, { backgroundColor: tokens.bgRaised }]}>
          <View style={[styles.themeLine, { backgroundColor: tokens.text }]} />
          <View
            style={[
              styles.themeLineShort,
              { backgroundColor: tokens.textSecondary },
            ]}
          />
          <View style={styles.themeRow}>
            <View
              style={[styles.themeDot, { backgroundColor: tokens.accent }]}
            />
            <View
              style={[
                styles.themeChip,
                { backgroundColor: tokens.controlHover },
              ]}
            />
          </View>
        </View>
      </View>
      <Text style={[styles.themeLabel, selected && styles.themeLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

// the in-situ page mock's copy: a passage from the Daily Office, carried by
// the same chrome line, heading, body, and rubric the reader shows
const MOCK_CHROME = "The Order for Morning Prayer";
const MOCK_HEADING = "Daily Morning Prayer";
const MOCK_SUBHEADING = "The First Song of Isaiah";
const MOCK_PASSAGE =
  "Our Father, who art in heaven, hallowed be thy Name, thy kingdom come, thy will be done, on earth as it is in heaven. Give us this day our daily bread. And forgive us our trespasses, as we forgive those who trespass against us.";
const MOCK_RUBRIC = "The People stand or kneel";

type TypographySettingsProps = {
  fontPx: number;
  setFontPx: (px: number) => void;
  interfaceFont: string;
  setInterfaceFont: (id: string) => void;
  headingFont: string;
  setHeadingFont: (id: string) => void;
  subheadingFont: string;
  setSubheadingFont: (id: string) => void;
  readingFont: string;
  setReadingFont: (id: string) => void;
  interfaceFaces: FaceDef[];
  headingFaces: FaceDef[];
  subheadingFaces: FaceDef[];
  readingFaces: FaceDef[];
  // return every role to its default face
  onResetFonts: () => void;
};

function TypographySettings({
  fontPx,
  setFontPx,
  interfaceFont,
  setInterfaceFont,
  headingFont,
  setHeadingFont,
  subheadingFont,
  setSubheadingFont,
  readingFont,
  setReadingFont,
  interfaceFaces,
  headingFaces,
  subheadingFaces,
  readingFaces,
  onResetFonts,
}: TypographySettingsProps) {
  const styles = useThemedStyles(styleDef);
  // the specimen rides the reader's scale, so a size change is legible here
  const fontScale = fontPx / BASE_FONT_PX;
  const scaled = (size: number, lineHeight: number) => ({
    fontSize: size * fontScale,
    lineHeight: lineHeight * fontScale,
  });

  return (
    <>
      <View style={[styles.section, styles.sectionRaised, styles.sectionFlush]}>
        <View style={styles.groupRow}>
          <Text style={styles.groupLabel}>Font Family</Text>
          <Pressable
            onPress={onResetFonts}
            style={({ hovered }) => [
              styles.reset,
              hovered && styles.resetHover,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Reset font family"
          >
            <Text style={styles.resetText}>Default</Text>
          </Pressable>
        </View>
        {/* one field holds all three roles, the rows split by hairlines the
            way a system settings group reads */}
        <View style={styles.fontGroup}>
          <FontPicker
            label="UI Font"
            value={interfaceFont}
            options={interfaceFaces}
            onChange={setInterfaceFont}
            compact
            description="Buttons, menus, and chrome"
          />
          <View style={styles.fontGroupDivider} />
          <FontPicker
            label="Heading Font"
            value={headingFont}
            options={headingFaces}
            onChange={setHeadingFont}
            compact
            description="Page titles"
          />
          <View style={styles.fontGroupDivider} />
          <FontPicker
            label="Subheading Font"
            value={subheadingFont}
            options={subheadingFaces}
            onChange={setSubheadingFont}
            compact
            description="Block and section titles"
          />
          <View style={styles.fontGroupDivider} />
          <FontPicker
            label="Body Font"
            value={readingFont}
            options={readingFaces}
            onChange={setReadingFont}
            compact
            description="Main reading text"
          />
        </View>
      </View>

      <View style={styles.section}>
        {/* the family field's own frame already closes that group, so the size
            block needs no rule above it */}
        <View style={styles.groupRow}>
          <Text style={styles.groupLabel}>Font Size</Text>
          <Pressable
            onPress={() => setFontPx(DEFAULT_FONT_PX)}
            style={({ hovered }) => [
              styles.reset,
              hovered && styles.resetHover,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Reset font size"
          >
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
        </View>
        <View style={styles.sliderWrap}>
          <Slider
            value={fontPx}
            onChange={setFontPx}
            steps={FONT_SIZES}
            min={MIN_FONT_PX}
            max={MAX_FONT_PX}
          />
        </View>
        {/* the specimen under the size control: a page as the reader sets it,
            chrome, heading, prayer and rubric all at the chosen scale */}
        <View style={styles.preview}>
          <Text style={[styles.mockChrome, scaled(12, 18)]}>{MOCK_CHROME}</Text>
          <Text style={[styles.mockHeading, scaled(18, 24)]}>
            {MOCK_HEADING}
          </Text>
          <Text style={[styles.mockSubheading, scaled(16, 22)]}>
            {MOCK_SUBHEADING}
          </Text>
          <Text style={[styles.mockBody, scaled(16, 26)]}>{MOCK_PASSAGE}</Text>
          <Text style={[styles.mockRubric, scaled(14, 22)]}>{MOCK_RUBRIC}</Text>
        </View>
      </View>
    </>
  );
}

type OfficeSettingsProps = {
  showRubrics: boolean;
  setShowRubrics: (update: boolean | ((prev: boolean) => boolean)) => void;
  showSpeakers: boolean;
  setShowSpeakers: (update: boolean | ((prev: boolean) => boolean)) => void;
  devotions: boolean;
  setDevotions: (v: boolean) => void;
};

function OfficeSettings({
  showRubrics,
  setShowRubrics,
  showSpeakers,
  setShowSpeakers,
  devotions,
  setDevotions,
}: OfficeSettingsProps) {
  return (
    <>
      <ToggleRow
        label="Rubrics"
        value={showRubrics}
        onChange={setShowRubrics}
        description="The service's instructions, shown in italics as the prayer book prints them."
      />
      <ToggleRow
        label="Speakers"
        value={showSpeakers}
        onChange={setShowSpeakers}
        description="Who speaks each part: Officiant, People, or All."
      />
      <ToggleRow
        label="Daily Devotions"
        value={devotions}
        onChange={setDevotions}
        description="Replace each office with the shorter Daily Devotions prayers."
      />
    </>
  );
}

type BibleSettingsProps = {
  translation: "kjv" | "web";
  setTranslation: (t: "kjv" | "web") => void;
};

function BibleSettings({ translation, setTranslation }: BibleSettingsProps) {
  const styles = useThemedStyles(styleDef);
  // storage is the source of truth; the counter is only ever bumped, so the
  // reset forces a fresh read below rather than caching a stale answer
  const [, reread] = useState(0);
  const marks = getAllProgress();
  // every chapter the reader can open, deuterocanonical included: reaching
  // Sirach 40 is reading progress, so it counts toward the same aggregate
  const books = [...ALL_BOOKS.OT, ...ALL_BOOKS.NT, ...ALL_BOOKS.DC];
  const total = books.reduce((n, b) => n + b.chapters, 0);
  // clamped, so a stale mark can never push the total past a full bible
  const reached = books.reduce(
    (n, b) => n + Math.min(marks[b.abbrev] ?? 0, b.chapters),
    0,
  );
  // a position with no mark is an upgrading reader, so the reset stays live
  const saved = savedPositions();
  const hasProgress = reached > 0 || TESTAMENTS.some((t) => saved[t] !== null);
  const reset = () => {
    clearProgress();
    clearSavedPositions();
    reread((v) => v + 1);
  };

  return (
    <>
      <View style={styles.section}>
        <Text style={styles.label}>Bible Translation</Text>
        <OptionChips
          options={TRANSLATION_OPTIONS}
          value={translation}
          onSelect={setTranslation}
          mono
        />
        <Text style={styles.settingDescription}>
          {TRANSLATION_OPTIONS.find((o) => o.id === translation)?.description}
        </Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Reading Progress</Text>
        <Text style={styles.value}>
          {`${Math.round((reached / total) * 100)}% · ${reached} of ${total} chapters reached`}
        </Text>
        <Text
          style={[
            styles.option,
            styles.resetBtn,
            !hasProgress && styles.optionDisabled,
          ]}
          onPress={reset}
          aria-disabled={!hasProgress}
        >
          Reset
        </Text>
        <Text style={styles.settingDescription}>
          Forgets which chapters you have reached and where you left off, so
          both start over.
        </Text>
      </View>
    </>
  );
}

type DesktopSettingsProps = {
  showWindowControls: boolean;
  windowControls: boolean;
  onWindowControlsChange?: (show: boolean) => void;
  status: ReturnType<typeof useUpdateStatus>["status"];
  version: ReturnType<typeof useUpdateStatus>["version"];
  message: ReturnType<typeof useUpdateStatus>["message"];
  check: ReturnType<typeof useUpdateStatus>["check"];
  install: ReturnType<typeof useUpdateStatus>["install"];
};

function DesktopSettings({
  showWindowControls,
  windowControls,
  onWindowControlsChange,
  status,
  version,
  message,
  check,
  install,
}: DesktopSettingsProps) {
  const styles = useThemedStyles(styleDef);
  return (
    <>
      {showWindowControls ? (
        <View style={styles.section}>
          <Text style={styles.label}>Window Controls</Text>
          <OptionChips
            options={[
              { id: true as const, label: "Show" },
              { id: false as const, label: "Hide" },
            ]}
            value={windowControls}
            onSelect={(v) => onWindowControlsChange?.(v)}
          />
          <Text style={styles.settingDescription}>
            Minimize, maximize, and close buttons in the title bar.
          </Text>
        </View>
      ) : null}

      {IS_TAURI ? (
        <View style={styles.section}>
          <Text style={styles.label}>Updates</Text>
          {status === "idle" ||
          status === "checking" ||
          status === "upToDate" ? (
            <View style={styles.row}>
              <Text
                style={[
                  styles.option,
                  status === "checking" && styles.optionActive,
                ]}
                onPress={check}
              >
                Check for Updates
              </Text>
            </View>
          ) : null}
          {status === "checking" ? (
            <Text style={styles.value}>Checking for updates…</Text>
          ) : null}
          {status === "installing" ? (
            <Text style={styles.value}>Downloading and installing…</Text>
          ) : null}
          {status === "upToDate" ? (
            <Text style={styles.value}>You are on the latest version.</Text>
          ) : null}
          {status === "available" ? (
            <View style={styles.row}>
              <Text style={styles.actionBtn} onPress={install}>
                Install update {version}
              </Text>
            </View>
          ) : null}
          {status === "error" ? (
            <Text style={styles.settingDescription}>
              Could not check for updates: {message}
            </Text>
          ) : null}
        </View>
      ) : null}
    </>
  );
}

const styleDef = defineThemedStyles({
  // the modal's head is two seating bars split at the rail's right border:
  // the rail bar always says settings, and the pane bar carries the
  // section's small-caps title with the close X at its end
  frame: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    // drags in the modal should move the eye, not highlight chrome; the
    // search field overrides this with userSelect: text
    userSelect: "none",
  },
  chrome: {
    flex: 1,
    flexDirection: "row",
    minHeight: 0,
  },
  chromeMobile: {
    flex: 1,
    minHeight: 0,
  },
  rail: {
    width: 224,
    flexShrink: 0,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    borderRightWidth: 1,
    borderRightColor: "var(--border)",
    backgroundColor: "var(--bg)",
  },
  railHead: {
    flexShrink: 0,
    height: 44,
    paddingHorizontal: 10,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "var(--border)",
  },
  // the mag-glass field uses the global search trigger's surface fill so
  // both search controls read as the same kind of control
  searchField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "var(--border)",
    backgroundColor: "var(--surface)",
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 13,
    color: "var(--text)",
    padding: 0,
    // the field is real text, so the caret can land and text can be selected
    userSelect: "text",
  },
  searchClear: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  searchClearHover: {
    backgroundColor: "var(--control-hover)",
  },
  eyebrow: {
    fontFamily: CHROME_FONT,
    fontWeight: "600",
    fontSize: 11,
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: "var(--text-secondary)",
  },
  railScroll: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 12,
  },
  // hairline between the rail's blocks, inset to the row edges; the first
  // block has none, so the list does not open on a rule
  railDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "var(--border-faint)",
    marginHorizontal: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  railRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 4,
  },
  railRowHover: {
    backgroundColor: "var(--control-hover)",
  },
  railIcon: {
    width: 18,
    alignItems: "center",
    color: "var(--text-secondary)",
    // idle rail icons recede exactly like the nav sidebar's
    opacity: 0.6,
  },
  railIconActive: {
    color: "var(--accent)",
    opacity: 1,
  },
  railRowLabel: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 14,
    color: "var(--text-secondary)",
  },
  railRowLabelActive: {
    color: "var(--accent)",
    fontWeight: "600",
  },
  railFoot: {
    flexShrink: 0,
    height: 40,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: "var(--border)",
    justifyContent: "center",
  },
  railFootText: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    lineHeight: 16,
    color: "var(--text-secondary)",
  },
  // the phone layout's 44px head: search (or back + section title) with the
  // close X, exactly the height of the desktop seats
  mobileHead: {
    flexShrink: 0,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border)",
  },
  mobileHeadSearch: {
    flex: 1,
    minWidth: 0,
  },
  mobileHeadTitle: {
    flex: 1,
    minWidth: 0,
    fontFamily: CHROME_FONT,
    fontWeight: "600",
    fontSize: 11,
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: "var(--text-secondary)",
    textAlign: "center",
  },
  // the detail page's back control: chevron plus the previous screen's name,
  // the same recipe the system settings list uses
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    height: 34,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  backButtonHover: {
    backgroundColor: "var(--control-hover)",
  },
  backText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 13,
    color: "var(--text-secondary)",
  },
  backTextHover: {
    color: "var(--text)",
  },
  mobileList: {
    flex: 1,
    minHeight: 0,
  },
  // the phone list's block rule, inset to the rows' text column
  mobileDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "var(--border-faint)",
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 4,
  },
  // a tappable system-settings row: icon, label, and the trailing chevron
  // that marks the drill-down
  mobileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 40,
    marginHorizontal: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  mobileRowHover: {
    backgroundColor: "var(--control-hover)",
  },
  mobileRowLabel: {
    flex: 1,
    minWidth: 0,
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 14,
    color: "var(--text-secondary)",
  },
  mobileEmpty: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    color: "var(--text-secondary)",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  mobilePaneScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },
  pane: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
  },
  paneHead: {
    flexShrink: 0,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 28,
    paddingRight: 10,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border)",
  },
  paneCloseBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  paneCloseBtnHover: {
    backgroundColor: "var(--control-hover)",
  },
  paneTitle: {
    fontFamily: HEADING_FONT,
    fontWeight: "500",
    fontSize: 30,
    lineHeight: 38,
    color: "var(--text)",
    marginTop: 4,
  },
  paneDescription: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    lineHeight: 19,
    color: "var(--text-secondary)",
    marginTop: 6,
    maxWidth: 560,
  },
  paneScroll: {
    flex: 1,
    minHeight: 0,
  },
  paneScrollContent: {
    paddingHorizontal: 28,
    paddingTop: 14,
    paddingBottom: 40,
  },
  noMatches: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    color: "var(--text-secondary)",
    marginTop: 4,
  },
  // the page's fancy heading stays at the top of the pane scroll, under the
  // modal's slim bar; it scrolls with the settings instead of pinning above
  paneIntro: {
    paddingBottom: 18,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border)",
  },
  section: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border)",
  },
  // the font pickers float a menu past their own box, and every View is its own
  // stacking context (RNW gives them z-index:0), so the section holding them
  // must out-rank the sections that follow it; otherwise the later content
  // paints over the open menu and makes it look transparent
  sectionRaised: {
    zIndex: 1,
  },
  // the font family pickers and the size group below read as one block: this
  // section draws no rule of its own, and the field's frame closes the group,
  // so only a gap separates it from the size block
  sectionFlush: {
    borderBottomWidth: 0,
    paddingBottom: 0,
    marginBottom: 28,
  },
  // the sample's paper panel, raised off the page so the specimen reads as its
  // own object instead of as more settings content
  preview: {
    overflow: "hidden",
    backgroundColor: "var(--bg-raised)",
    borderWidth: 1,
    borderColor: "var(--border)",
    borderRadius: 6,
    padding: 16,
    marginBottom: 20,
  },
  // the specimen under the size control: a page as the reader sets it, a chrome
  // line, a page title, a block title, a prayer, and a rubric, the faces together
  mockChrome: {
    fontFamily: CHROME_FONT,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.4,
    color: "var(--text-secondary)",
  },
  mockHeading: {
    fontFamily: HEADING_FONT,
    fontWeight: "500",
    fontSize: 18,
    lineHeight: 24,
    color: "var(--text)",
    marginTop: 6,
  },
  mockSubheading: {
    fontFamily: SUBHEADING_FONT,
    fontWeight: "600",
    fontSize: 16,
    lineHeight: 22,
    color: "var(--text)",
    marginTop: 8,
  },
  mockBody: {
    fontFamily: SERIF_FONT,
    fontSize: 16,
    lineHeight: 26,
    color: "var(--text)",
    marginTop: 8,
  },
  mockRubric: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 14,
    lineHeight: 22,
    color: "var(--text-secondary)",
    marginTop: 8,
  },
  // the font pickers share one field: a hairline frame and rounding group the
  // three rows, and each row's own surface-filled control stays the only
  // tinted thing, so the dropdown still reads as the interactive element. no
  // overflow clip here: the pickers' menus float past the group's bottom edge
  fontGroup: {
    borderWidth: 1,
    borderColor: "var(--border)",
    borderRadius: 8,
  },
  fontGroupDivider: {
    height: 1,
    backgroundColor: "var(--border)",
  },
  label: {
    fontFamily: CHROME_FONT,
    fontSize: 16,
    fontWeight: "600",
    color: "var(--text)",
    marginBottom: 8,
  },
  value: {
    fontFamily: CHROME_FONT,
    fontWeight: "400",
    fontSize: 14,
    color: "var(--text-secondary)",
  },
  groupRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  groupLabelRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  groupLabel: {
    fontFamily: CHROME_FONT,
    fontSize: 16,
    fontWeight: "600",
    color: "var(--text)",
  },
  reset: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "var(--border)",
  },
  resetHover: {
    backgroundColor: "var(--control-hover)",
  },
  resetText: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    color: "var(--text-secondary)",
  },
  sliderWrap: {
    marginTop: 30,
    marginBottom: 30,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  option: {
    fontFamily: CHROME_FONT,
    fontWeight: "400",
    fontSize: 15,
    color: "var(--text-secondary)",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "var(--border)",
    backgroundColor: "var(--surface)",
    overflow: "hidden",
  },
  optionActive: {
    color: "var(--accent)",
    borderColor: "var(--accent)",
    fontWeight: "600",
  },
  // a standalone option-plate button; neutral, as forgetting is not a primary action
  resetBtn: {
    alignSelf: "flex-start",
    fontWeight: "500",
    backgroundColor: "transparent",
  },
  // a control with nothing left to do
  optionDisabled: {
    opacity: 0.4,
  },
  // translation abbreviations read as technical tokens, so they use the
  // app's mono face like keycaps and status text
  optionMono: {
    fontFamily: MONO,
  },
  actionBtn: {
    fontFamily: CHROME_FONT,
    fontSize: 15,
    fontWeight: "600",
    color: "var(--on-accent)",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 4,
    backgroundColor: "var(--accent)",
    overflow: "hidden",
  },
  // the one-line description under any option control; same recipe as the
  // pane header's description so every setting reads uniformly
  settingDescription: {
    fontFamily: CHROME_FONT,
    fontWeight: "400",
    fontSize: 13,
    lineHeight: 19,
    color: "var(--text-secondary)",
    marginTop: 8,
    maxWidth: 560,
  },
  // the theme picker: a wrapping row of miniature palette cards
  themeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  themeOption: {
    alignItems: "center",
    gap: 8,
  },
  // the frame carries the family's page background; the inner panel stands in
  // for a raised surface so the two tones read apart at a glance
  themeCard: {
    width: 136,
    height: 92,
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    overflow: "hidden",
  },
  // selection wears the live accent, so it reads even before the card's own
  // palette has been applied
  themeCardActive: {
    borderWidth: 1,
    borderColor: "var(--accent)",
  },
  themePanel: {
    flex: 1,
    borderRadius: 5,
    paddingHorizontal: 9,
    paddingVertical: 8,
    justifyContent: "center",
    gap: 6,
  },
  themeLine: {
    height: 5,
    borderRadius: 3,
    width: "72%",
  },
  themeLineShort: {
    height: 4,
    borderRadius: 2,
    width: "46%",
  },
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  themeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  themeChip: {
    height: 8,
    borderRadius: 4,
    flex: 1,
  },
  themeLabel: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    color: "var(--text-secondary)",
  },
  themeLabelActive: {
    color: "var(--text)",
    fontWeight: "600",
  },
});
