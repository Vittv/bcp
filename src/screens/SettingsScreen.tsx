import { type ReactNode, useState } from "react";
import {
  Pressable,
  ScrollView,
  type StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from "react-native";
import { HelpScreen } from "../components/shell/HelpScreen";
import {
  BibleIcon,
  BookIcon,
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
import { useOfficeSettings } from "../context/OfficeSettingsContext";
import {
  type FontMode,
  type ThemeMode,
  useTheme,
} from "../context/ThemeContext";
import { useTranslation } from "../context/TranslationContext";
import { IS_TAURI } from "../lib/desktop";
import { CHROME_FONT, HEADING_FONT } from "../lib/fonts";
import { filterSearch } from "../lib/search";
import { type SettingsSectionId, visibleSettings } from "../lib/settings";
import { TRANSLATION_OPTIONS } from "../lib/translations";
import { useUpdateStatus } from "../lib/updater";
import { AboutScreen } from "./AboutScreen";
import { InstallScreen } from "./InstallScreen";

const MONO = '"JetBrains Mono", monospace';

const HOVER_COLOR = "var(--text, #2c2020)";
const IDLE_COLOR = "var(--text-secondary, #7a6e64)";

const THEME_OPTIONS = [
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
// you type. phones swap the rail for a chip row since a fixed sidebar
// wastes a narrow screen. about, help, and install are the app's other
// chrome panels, hoisted into the same modal so every entry point shares
// one box and one rail.
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

const GROUPS: { title: string; categoryIds: SectionId[] }[] = [
  { title: "Look & feel", categoryIds: ["appearance", "typography"] },
  { title: "Reading", categoryIds: ["office", "bible"] },
  { title: "System", categoryIds: ["desktop"] },
  { title: "App", categoryIds: ["install", "help", "about"] },
];

// every sidebar entry point and palette run lands directly as its section;
// "settings" (and nothing) falls back to the first category. hidden sections
// (install on a desktop build, desktop in a browser tab) never appear as the
// initial selection
function initialSection(
  modal: ModalType | SettingsSectionId | undefined,
): SectionId {
  if (!modal || modal === "settings") return "appearance";
  return modal;
}

// the desktop category only holds tauri-shell settings (window controls,
// the updater), which don't exist in a browser tab; install only matters
// when the web app is not installed yet, mirroring the sidebar's button
const visibleCategories = () =>
  visibleSettings().map((s) => ({ ...s, icon: SECTION_ICONS[s.id] }));

type SettingsScreenProps = {
  // phones replace the rail with a chip row; the modal turns sheet-like
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
  const visible = visibleCategories();
  const [activeCategory, setActiveCategory] = useState<SectionId>(() => {
    const requestedSection = initialSection(requested);
    return visible.some((c) => c.id === requestedSection)
      ? requestedSection
      : "appearance";
  });
  const theme = useTheme();
  const { translation, setTranslation } = useTranslation();
  const office = useOfficeSettings();
  const updater = useUpdateStatus();
  const [query, setQuery] = useState("");

  const categories = filterSearch(query, visibleCategories());
  const groups = GROUPS.map((group) => ({
    ...group,
    categoryIds: group.categoryIds.filter((id) =>
      categories.some((c) => c.id === id),
    ),
  })).filter((group) => group.categoryIds.length > 0);

  const active =
    categories.find((c) => c.id === activeCategory) ?? categories[0];

  const content = (() => {
    switch (active?.id) {
      case "appearance":
        return <AppearanceSettings mode={theme.mode} setMode={theme.setMode} />;
      case "typography":
        return (
          <TypographySettings
            fontScale={theme.fontScale}
            setFontScale={theme.setFontScale}
            fontMode={theme.fontMode}
            setFontMode={theme.setFontMode}
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
  })();

  return (
    <View style={styles.frame}>
      <View style={mobile ? styles.chromeMobile : styles.chrome}>
        {mobile ? (
          <View style={styles.chipsRow}>
            {categories.map((c) => {
              const activeChip = active?.id === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setActiveCategory(c.id)}
                  style={({ hovered }) => [
                    styles.chip,
                    activeChip && styles.chipActive,
                    hovered && !activeChip && styles.chipHover,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      activeChip && styles.chipTextActive,
                    ]}
                  >
                    {c.railTitle ?? c.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.rail}>
            <View style={styles.railHead}>
              <SettingsSearch query={query} onChange={setQuery} />
            </View>
            <ScrollView style={styles.railScroll}>
              {groups.map((group) => (
                <View key={group.title}>
                  <Text style={styles.groupTitle}>{group.title}</Text>
                  {group.categoryIds.map((id) => {
                    const cat =
                      categories.find((c) => c.id === id) ?? categories[0];
                    const activeRow = active?.id === id;
                    return (
                      <Pressable
                        key={id}
                        onPress={() => setActiveCategory(id)}
                        style={({ hovered }) => [
                          styles.railRow,
                          activeRow && styles.railRowActive,
                          hovered && !activeRow && styles.railRowHover,
                        ]}
                      >
                        <View style={railIconStyle(activeRow)}>{cat.icon}</View>
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
        )}

        <View style={styles.pane}>
          <View style={styles.paneHead}>
            {mobile ? (
              <SettingsSearch query={query} onChange={setQuery} />
            ) : (
              <Text style={styles.eyebrow} numberOfLines={1}>
                {active ? (active.railTitle ?? active.title) : "Search"}
              </Text>
            )}
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
                  color={hovered ? HOVER_COLOR : IDLE_COLOR}
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
                {content}
              </>
            ) : (
              <Text style={styles.noMatches}>
                No settings match the search.
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

// the rail's mag-glass field filters the categories and chips as you type;
// the same token matcher behind it later feeds the global cmd+K palette
function SettingsSearch({
  query,
  onChange,
}: {
  query: string;
  onChange: (q: string) => void;
}) {
  return (
    <View style={styles.searchField} dataSet={{ settingsSearch: "" }}>
      <MagnifierIcon size={16} color="var(--text-secondary, #7a6e64)" />
      <TextInput
        value={query}
        onChangeText={onChange}
        placeholder="Search"
        placeholderTextColor="var(--text-secondary, #7a6e64)"
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
          <CloseIcon size={12} color="var(--text-secondary, #7a6e64)" />
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
};

function AppearanceSettings({ mode, setMode }: AppearanceSettingsProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>Theme</Text>
      <OptionChips options={THEME_OPTIONS} value={mode} onSelect={setMode} />
      <Text style={styles.settingDescription}>
        Light and dark modes, plus a system-following option.
      </Text>
    </View>
  );
}

type TypographySettingsProps = {
  fontScale: number;
  setFontScale: (scale: number) => void;
  fontMode: FontMode;
  setFontMode: (mode: FontMode) => void;
};

function TypographySettings({
  fontScale,
  setFontScale,
  fontMode,
  setFontMode,
}: TypographySettingsProps) {
  return (
    <>
      <View style={styles.section}>
        <Text style={styles.label}>Font</Text>
        <OptionChips
          options={[
            { id: "inter" as const, label: "Inter" },
            { id: "system" as const, label: "System default" },
          ]}
          value={fontMode}
          onSelect={setFontMode}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Font Size</Text>
        <Text style={styles.value}>{Math.round(fontScale * 100)}%</Text>
        <View style={styles.row}>
          <Text
            style={styles.option}
            onPress={() => setFontScale(fontScale - 0.05)}
          >
            A−
          </Text>
          <Text style={styles.option} onPress={() => setFontScale(1)}>
            Reset
          </Text>
          <Text
            style={styles.option}
            onPress={() => setFontScale(fontScale + 0.05)}
          >
            A+
          </Text>
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
  return (
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

// SAFETY: the rail icon wrapper carries `color` (so the svg strokes inherit
// it via currentColor), which RN's ViewStyle type rejects; it is a plain
// ViewStyle at runtime.
const railIconStyle = (active: boolean): StyleProp<ViewStyle> =>
  [styles.railIcon, active && styles.railIconActive] as StyleProp<ViewStyle>;

const styles = StyleSheet.create({
  // the modal's head is two seating bars split at the rail's right border:
  // the rail bar always says settings, and the pane bar carries the
  // section's small-caps title with the close X at its end
  frame: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
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
    borderRightColor: "var(--border, #c9c1b2)",
    backgroundColor: "var(--bg, #e0dbd0)",
  },
  railHead: {
    flexShrink: 0,
    height: 44,
    paddingHorizontal: 10,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "var(--border, #c9c1b2)",
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
    borderColor: "var(--border, #cbc5bb)",
    backgroundColor: "var(--surface, #d5cfc4)",
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 13,
    color: "var(--text, #2c2020)",
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
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  eyebrow: {
    fontFamily: CHROME_FONT,
    fontWeight: "600",
    fontSize: 11,
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: "var(--text-secondary, #7a6e64)",
  },
  railScroll: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 12,
  },
  groupTitle: {
    fontFamily: CHROME_FONT,
    fontWeight: "600",
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "var(--text-secondary, #7a6e64)",
    opacity: 0.6,
    paddingHorizontal: 8,
    paddingTop: 14,
    paddingBottom: 4,
  },
  railRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 4,
  },
  railRowActive: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  railRowHover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  railIcon: {
    width: 18,
    alignItems: "center",
    color: "var(--text-secondary, #7a6e64)",
    // idle rail icons recede exactly like the nav sidebar's
    opacity: 0.6,
  },
  railIconActive: {
    color: "var(--accent, #7a3040)",
    opacity: 1,
  },
  railRowLabel: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 14,
    color: "var(--text-secondary, #7a6e64)",
  },
  railRowLabelActive: {
    color: "var(--accent, #7a3040)",
    fontWeight: "600",
  },
  railFoot: {
    flexShrink: 0,
    height: 40,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: "var(--border, #c9c1b2)",
    justifyContent: "center",
  },
  railFootText: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    lineHeight: 16,
    color: "var(--text-secondary, #7a6e64)",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border, #c9c1b2)",
    flexShrink: 0,
    // the tab chips overflow sideways instead of wrapping, so the modal
    // keeps its height and the row scrolls on narrow screens
    overflowX: "auto",
  },
  chip: {
    flexShrink: 0,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "var(--border, #c9c1b2)",
    backgroundColor: "var(--surface, #d5cfc4)",
  },
  chipActive: {
    borderColor: "var(--accent, #7a3040)",
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  chipHover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  chipText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 13,
    color: "var(--text-secondary, #7a6e64)",
  },
  chipTextActive: {
    color: "var(--accent, #7a3040)",
    fontWeight: "600",
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
    borderBottomColor: "var(--border, #c9c1b2)",
  },
  paneCloseBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  paneCloseBtnHover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  paneTitle: {
    fontFamily: HEADING_FONT,
    fontWeight: "600",
    fontSize: 30,
    lineHeight: 38,
    color: "var(--text, #2c2020)",
    marginTop: 4,
  },
  paneDescription: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    lineHeight: 19,
    color: "var(--text-secondary, #7a6e64)",
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
    color: "var(--text-secondary, #7a6e64)",
    marginTop: 4,
  },
  // the page's fancy heading stays at the top of the pane scroll, under the
  // modal's slim bar; it scrolls with the settings instead of pinning above
  paneIntro: {
    paddingBottom: 18,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border, #c9c1b2)",
  },
  section: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border-content, #b5aa9e)",
  },
  label: {
    fontFamily: CHROME_FONT,
    fontSize: 16,
    fontWeight: "600",
    color: "var(--text, #2c2020)",
    marginBottom: 8,
  },
  value: {
    fontFamily: CHROME_FONT,
    fontWeight: "400",
    fontSize: 14,
    color: "var(--text-secondary, #7a6e64)",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  option: {
    fontFamily: CHROME_FONT,
    fontWeight: "400",
    fontSize: 15,
    color: "var(--text-secondary, #7a6e64)",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "var(--border, #d2cbbf)",
    backgroundColor: "var(--surface, #d5cfc4)",
    overflow: "hidden",
  },
  optionActive: {
    color: "var(--accent, #7a3040)",
    borderColor: "var(--accent, #7a3040)",
    fontWeight: "600",
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
    color: "#f6f1e8",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 4,
    backgroundColor: "var(--accent, #7a3040)",
    overflow: "hidden",
  },
  // the one-line description under any option control; same recipe as the
  // pane header's description so every setting reads uniformly
  settingDescription: {
    fontFamily: CHROME_FONT,
    fontWeight: "400",
    fontSize: 13,
    lineHeight: 19,
    color: "var(--text-secondary, #7a6e64)",
    marginTop: 8,
    maxWidth: 560,
  },
});
