import { Platform, Pressable, Text, View } from "react-native";
import { Slider } from "../../components/settings/Slider";
import type { ThemeMode } from "../../context/ThemeContext";
import { useThemedStyles } from "../../lib/theme/themedStyles";
import { THEME_LIST, type ThemeId, themeTokens } from "../../lib/theme/themes";
import type { ResolvedTheme } from "../../lib/theme/tokens";
import {
  DEFAULT_UI_SCALE,
  percentToUiScale,
  UI_SCALE_PERCENTAGES,
  uiScaleToPercent,
} from "../../lib/uiScale";
import { OptionChips, ThemePreview } from "./SettingsUi";
import { settingsStyles } from "./settingsStyles";

const MODE_OPTIONS = [
  { id: "light" as const, label: "Light" },
  { id: "dark" as const, label: "Dark" },
  { id: "system" as const, label: "System" },
];

type AppearanceSettingsProps = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  resolved: ResolvedTheme;
  uiScale: number;
  setUiScale: (scale: number) => void;
};

export function AppearanceSettings({
  mode,
  setMode,
  theme,
  setTheme,
  resolved,
  uiScale,
  setUiScale,
}: AppearanceSettingsProps) {
  const styles = useThemedStyles(settingsStyles);
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
              onPress={() => setUiScale(DEFAULT_UI_SCALE)}
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
              formatTick={(pct) => `${pct}%`}
            />
          </View>
          <Text style={styles.settingDescription}>
            Scales the whole interface. 100% is the default.
          </Text>
        </View>
      ) : null}
    </>
  );
}
