import { Text, View } from "react-native";
import { IS_TAURI } from "../../lib/desktop";
import { useThemedStyles } from "../../lib/theme/themedStyles";
import type { useUpdateStatus } from "../../lib/updater";
import {
  WINDOW_CONTROL_OPTIONS,
  type WindowControlStyleId,
} from "../../lib/windowDecorations";
import { OptionChips } from "./SettingsUi";
import { settingsStyles } from "./settingsStyles";

type DesktopSettingsProps = {
  showWindowControls: boolean;
  windowControlStyle: WindowControlStyleId;
  onWindowControlStyleChange?: (style: WindowControlStyleId) => void;
  status: ReturnType<typeof useUpdateStatus>["status"];
  version: ReturnType<typeof useUpdateStatus>["version"];
  message: ReturnType<typeof useUpdateStatus>["message"];
  check: ReturnType<typeof useUpdateStatus>["check"];
  install: ReturnType<typeof useUpdateStatus>["install"];
};

export function DesktopSettingsPanel({
  showWindowControls,
  windowControlStyle,
  onWindowControlStyleChange,
  status,
  version,
  message,
  check,
  install,
}: DesktopSettingsProps) {
  const styles = useThemedStyles(settingsStyles);
  return (
    <>
      {showWindowControls ? (
        <View style={styles.section}>
          <Text style={styles.label}>Window Controls</Text>
          <OptionChips
            options={WINDOW_CONTROL_OPTIONS}
            value={windowControlStyle}
            onSelect={(style) => onWindowControlStyleChange?.(style)}
            wrap
          />
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
