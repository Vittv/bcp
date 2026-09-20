import { type ReactNode, useState } from "react";
import {
  Pressable,
  ScrollView,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import {
  BookIcon,
  BookmarkIcon,
  DesktopIcon,
  SunIcon,
} from "../components/shell/Icon";
import { useOfficeSettings } from "../context/OfficeSettingsContext";
import {
  type FontMode,
  type ThemeMode,
  useTheme,
} from "../context/ThemeContext";
import { useTranslation } from "../context/TranslationContext";
import { IS_TAURI } from "../lib/desktop";
import { CHROME_FONT, HEADING_FONT } from "../lib/fonts";
import { TRANSLATION_OPTIONS } from "../lib/translations";
import { useUpdateStatus } from "../lib/updater";

const MONO = '"JetBrains Mono", monospace';

const THEME_OPTIONS = [
  { id: "light" as const, label: "Light" },
  { id: "dark" as const, label: "Dark" },
  { id: "system" as const, label: "System" },
];

const ON_OFF = [
  { id: true as const, label: "On" },
  { id: false as const, label: "Off" },
];

type CategoryId = "appearance" | "office" | "bible" | "desktop";

// the settings rail is a grouped sidebar of small stroke icons, a category
// header over the pane, and a done button; phones swap the rail for a chip
// row since a fixed sidebar wastes a narrow screen
const CATEGORIES: {
  id: CategoryId;
  title: string;
  description: string;
  icon: ReactNode;
}[] = [
  {
    id: "appearance",
    title: "Appearance",
    description: "Theme mode, fonts, and text size for the whole app.",
    icon: <SunIcon size={15} />,
  },
  {
    id: "office",
    title: "Office",
    description:
      "How the daily office reads: rubrics, speakers, and the devotions mode.",
    icon: <BookIcon size={15} />,
  },
  {
    id: "bible",
    title: "Bible",
    description: "Which Bible translation the daily readings use.",
    icon: <BookmarkIcon size={15} />,
  },
  {
    id: "desktop",
    title: "Desktop",
    description: "Window chrome and app updates in the desktop app.",
    icon: <DesktopIcon size={15} />,
  },
];

const GROUPS: { title: string; categoryIds: CategoryId[] }[] = [
  { title: "Look & feel", categoryIds: ["appearance"] },
  { title: "Reading", categoryIds: ["office", "bible"] },
  { title: "System", categoryIds: ["desktop"] },
];

type SettingsScreenProps = {
  // phones replace the rail with a chip row; the modal turns sheet-like
  mobile?: boolean;
  onClose: () => void;
  // only meaningful inside the desktop shell on win/linux
  showWindowControls?: boolean;
  windowControls?: boolean;
  onWindowControlsChange?: (show: boolean) => void;
};

export function SettingsScreen({
  mobile = false,
  onClose,
  showWindowControls = false,
  windowControls = true,
  onWindowControlsChange,
}: SettingsScreenProps) {
  const [activeCategory, setActiveCategory] =
    useState<CategoryId>("appearance");
  const theme = useTheme();
  const { translation, setTranslation } = useTranslation();
  const office = useOfficeSettings();
  const updater = useUpdateStatus();

  // the desktop category only holds tauri-shell settings (window controls,
  // the updater), which don't exist in a browser tab, so drop it there
  const categories = IS_TAURI
    ? CATEGORIES
    : CATEGORIES.filter((c) => c.id !== "desktop");
  const groups = GROUPS.map((group) => ({
    ...group,
    categoryIds: group.categoryIds.filter((id) =>
      categories.some((c) => c.id === id),
    ),
  })).filter((group) => group.categoryIds.length > 0);

  const active =
    categories.find((c) => c.id === activeCategory) ?? categories[0];

  const content = (() => {
    switch (activeCategory) {
      case "appearance":
        return (
          <AppearanceSettings
            mode={theme.mode}
            setMode={theme.setMode}
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
    }
  })();

  return (
    <View style={mobile ? styles.chromeMobile : styles.chrome}>
      {mobile ? (
        <View style={styles.chipsRow}>
          {categories.map((c) => {
            const activeChip = activeCategory === c.id;
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
                  style={[styles.chipText, activeChip && styles.chipTextActive]}
                >
                  {c.title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={styles.rail}>
          <View style={styles.railHead}>
            <Text style={styles.eyebrow}>Settings</Text>
          </View>
          <ScrollView style={styles.railScroll}>
            {groups.map((group) => (
              <View key={group.title}>
                <Text style={styles.groupTitle}>{group.title}</Text>
                {group.categoryIds.map((id) => {
                  const cat =
                    categories.find((c) => c.id === id) ?? categories[0];
                  const activeRow = activeCategory === id;
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
                      >
                        {cat.title}
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
        <View style={styles.paneHeader}>
          <View style={styles.paneHeaderText}>
            <Text style={styles.eyebrow}>{active.title}</Text>
            <Text style={styles.paneTitle}>{active.title}</Text>
            <Text style={styles.paneDescription}>{active.description}</Text>
          </View>
          <Pressable
            onPress={onClose}
            style={({ hovered }) => [
              styles.doneBtn,
              hovered && styles.doneBtnHover,
            ]}
          >
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </View>
        <ScrollView
          style={styles.paneScroll}
          contentContainerStyle={styles.paneScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      </View>
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
  fontScale: number;
  setFontScale: (scale: number) => void;
  fontMode: FontMode;
  setFontMode: (mode: FontMode) => void;
};

function AppearanceSettings({
  mode,
  setMode,
  fontScale,
  setFontScale,
  fontMode,
  setFontMode,
}: AppearanceSettingsProps) {
  return (
    <>
      <View style={styles.section}>
        <Text style={styles.label}>Theme</Text>
        <OptionChips options={THEME_OPTIONS} value={mode} onSelect={setMode} />
      </View>

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
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border, #c9c1b2)",
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
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "var(--text-secondary, #7a6e64)",
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
  },
  railIconActive: {
    color: "var(--accent, #7a3040)",
  },
  railRowLabel: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 14,
    color: "var(--text, #2c2020)",
  },
  railRowLabelActive: {
    color: "var(--accent, #7a3040)",
    fontWeight: "600",
  },
  railFoot: {
    flexShrink: 0,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "var(--border, #c9c1b2)",
  },
  railFootText: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    lineHeight: 16,
    color: "var(--text-secondary, #7a6e64)",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border, #c9c1b2)",
    flexShrink: 0,
  },
  chip: {
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
  paneHeader: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    paddingHorizontal: 28,
    paddingTop: 22,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border, #c9c1b2)",
  },
  paneHeaderText: {
    flex: 1,
    minWidth: 0,
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
  doneBtn: {
    flexShrink: 0,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "var(--accent, #7a3040)",
    backgroundColor: "var(--surface, #d5cfc4)",
  },
  doneBtnHover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  doneText: {
    fontFamily: CHROME_FONT,
    fontWeight: "600",
    fontSize: 13,
    color: "var(--accent, #7a3040)",
  },
  paneScroll: {
    flex: 1,
    minHeight: 0,
  },
  paneScrollContent: {
    paddingHorizontal: 28,
    paddingVertical: 24,
    paddingBottom: 40,
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
