import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";

type SettingsScreenProps = {
  // only meaningful inside the desktop shell on win/linux
  showWindowControls?: boolean;
  windowControls?: boolean;
  onWindowControlsChange?: (show: boolean) => void;
};

export function SettingsScreen({
  showWindowControls = false,
  windowControls = true,
  onWindowControlsChange,
}: SettingsScreenProps) {
  const { mode, setMode, fontScale, setFontScale } = useTheme();

  return (
    <ScrollView>
      <Text style={styles.heading}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Theme</Text>
        <View style={styles.row}>
          {(["light", "dark", "system"] as const).map((m) => (
            <Text
              key={m}
              style={[styles.option, mode === m && styles.optionActive]}
              onPress={() => setMode(m)}
            >
              {m === "light" ? "Light" : m === "dark" ? "Dark" : "System"}
            </Text>
          ))}
        </View>
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

      {showWindowControls ? (
        <View style={styles.section}>
          <Text style={styles.label}>Window Controls</Text>
          <View style={styles.row}>
            {([true, false] as const).map((v) => (
              <Text
                key={String(v)}
                style={[
                  styles.option,
                  windowControls === v && styles.optionActive,
                ]}
                onPress={() => onWindowControlsChange?.(v)}
              >
                {v ? "Show" : "Hide"}
              </Text>
            ))}
          </View>
          <Text style={[styles.body, styles.bodySpaced]}>
            Minimize, maximize, and close buttons in the title bar.
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontFamily: "sans-serif",
    fontSize: 20,
    fontWeight: "700",
    color: "var(--text, #2c2020)",
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border, #d2cbbf)",
  },
  label: {
    fontFamily: "sans-serif",
    fontSize: 13,
    fontWeight: "600",
    color: "var(--text, #2c2020)",
    marginBottom: 8,
  },
  value: {
    fontFamily: "sans-serif",
    fontSize: 12,
    color: "var(--text-secondary, #7a6e64)",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  option: {
    fontFamily: "sans-serif",
    fontSize: 13,
    color: "var(--text-secondary, #7a6e64)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "var(--border, #d2cbbf)",
    overflow: "hidden",
  },
  optionActive: {
    color: "var(--accent, #7a3040)",
    borderColor: "var(--accent, #7a3040)",
    fontWeight: "600",
  },
  body: {
    fontFamily: "sans-serif",
    fontSize: 13,
    color: "var(--text-secondary, #7a6e64)",
    lineHeight: 20,
    marginBottom: 8,
  },
  bodySpaced: {
    marginTop: 8,
    marginBottom: 0,
  },
});
