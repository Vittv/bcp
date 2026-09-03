import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { BcpBridge } from "../../electron/ipc";
import { useTheme } from "../context/ThemeContext";
import { IS_DESKTOP } from "../lib/desktop";
import { CHROME_FONT } from "../lib/fonts";

const THEME_OPTIONS = [
  { id: "light" as const, label: "Light" },
  { id: "dark" as const, label: "Dark" },
  { id: "system" as const, label: "System" },
];

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

  function updater(): BcpBridge["updater"] | null {
    // SAFETY: window.bcp is injected only by the Electron preload; absent on
    // web/PWA builds it is undefined, so the chained access yields null
    return (window as unknown as { bcp?: BcpBridge }).bcp?.updater ?? null;
  }

  async function checkForUpdates() {
    setUpdateStatus("checking");
    setUpdateMessage("");
    try {
      const u = updater();
      if (!u) {
        setUpdateStatus("error");
        setUpdateMessage("Desktop-only.");
        return;
      }
      const update = await u.check();
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
      const u = updater();
      if (u) await u.download();
      // return the button to its prior state; the relaunch handler quits and
      // reinstalls, or a plain restart if nothing was downloaded
      setUpdateStatus("upToDate");
      await u?.relaunch();
    } catch (error) {
      setUpdateStatus("error");
      setUpdateMessage(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <View>
      <View style={styles.section}>
        <Text style={styles.label}>Theme</Text>
        <View style={styles.row}>
          {THEME_OPTIONS.map(({ id, label }) => (
            <Text
              key={id}
              style={[styles.option, mode === id && styles.optionActive]}
              onPress={() => setMode(id)}
            >
              {label}
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

      {IS_DESKTOP ? (
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
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border, #d2cbbf)",
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
    overflow: "hidden",
  },
  optionActive: {
    color: "var(--accent, #7a3040)",
    borderColor: "var(--accent, #7a3040)",
    fontWeight: "600",
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
  body: {
    fontFamily: CHROME_FONT,
    fontWeight: "400",
    fontSize: 15,
    color: "var(--text-secondary, #7a6e64)",
    lineHeight: 23,
    marginBottom: 8,
  },
  bodySpaced: {
    marginTop: 8,
    marginBottom: 0,
  },
});
