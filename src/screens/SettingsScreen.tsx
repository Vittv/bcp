import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { IS_TAURI } from "../lib/desktop";
import { CHROME_FONT } from "../lib/fonts";

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
  const { mode, setMode, fontScale, setFontScale, fontMode, setFontMode } =
    useTheme();
  const [updateStatus, setUpdateStatus] = useState<
    "checking" | "upToDate" | "available" | "error" | "installing" | "idle"
  >("idle");
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [updateMessage, setUpdateMessage] = useState("");

  async function checkForUpdates() {
    setUpdateStatus("checking");
    setUpdateMessage("");
    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();
      if (!update) {
        setUpdateStatus("upToDate");
        return;
      }
      setUpdateVersion(update.version);
      setUpdateStatus("available");
    } catch (error) {
      setUpdateStatus("error");
      setUpdateMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function installUpdate() {
    setUpdateStatus("installing");
    setUpdateMessage("");
    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();
      if (!update) {
        setUpdateStatus("upToDate");
        return;
      }
      await update.downloadAndInstall();
      const { relaunch } = await import("@tauri-apps/plugin-process");
      await relaunch();
    } catch (error) {
      setUpdateStatus("error");
      setUpdateMessage(error instanceof Error ? error.message : String(error));
    }
  }

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
        <Text style={styles.label}>Font</Text>
        <View style={styles.row}>
          {(
            [
              ["inter", "Inter"],
              ["system", "System default"],
            ] as const
          ).map(([value, label]) => (
            <Text
              key={value}
              style={[styles.option, fontMode === value && styles.optionActive]}
              onPress={() => setFontMode(value)}
            >
              {label}
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

      {IS_TAURI ? (
        <View style={styles.section}>
          <Text style={styles.label}>Updates</Text>
          {updateStatus === "idle" || updateStatus === "upToDate" ? (
            <View style={styles.row}>
              <Text style={styles.actionBtn} onPress={checkForUpdates}>
                Check for Updates
              </Text>
            </View>
          ) : null}
          {updateStatus === "checking" ? (
            <Text style={styles.value}>Checking for updates…</Text>
          ) : null}
          {updateStatus === "installing" ? (
            <Text style={styles.value}>Downloading and installing…</Text>
          ) : null}
          {updateStatus === "upToDate" ? (
            <Text style={styles.value}>You are on the latest version.</Text>
          ) : null}
          {updateStatus === "available" ? (
            <View style={styles.row}>
              <Text style={styles.actionBtn} onPress={installUpdate}>
                Install update {updateVersion}
              </Text>
            </View>
          ) : null}
          {updateStatus === "error" ? (
            <Text style={[styles.body, styles.bodySpaced]}>
              Could not check for updates: {updateMessage}
            </Text>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontFamily: CHROME_FONT,
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
    fontFamily: CHROME_FONT,
    fontSize: 13,
    fontWeight: "600",
    color: "var(--text, #2c2020)",
    marginBottom: 8,
  },
  value: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 12,
    color: "var(--text-secondary, #7a6e64)",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  option: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
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
  actionBtn: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    fontWeight: "600",
    color: "#f6f1e8",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 4,
    backgroundColor: "var(--accent, #7a3040)",
    overflow: "hidden",
  },
  body: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
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
