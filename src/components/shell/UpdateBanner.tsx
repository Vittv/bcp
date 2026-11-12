import { Pressable, Text, View } from "react-native";
import { requestOpenChangelog } from "../../lib/changelogPrefs";
import { IS_TAURI } from "../../lib/desktop";
import { CHROME_FONT } from "../../lib/fonts";
import {
  defineThemedStyles,
  useThemedStyles,
} from "../../lib/theme/themedStyles";
import { useUpdateStatus } from "../../lib/updater";

// notice that a newer build exists, drawn as a thin band above the status bar.
// tauri installs and relaunches; the web build reloads into the new deploy.
export function UpdateBanner() {
  const styles = useThemedStyles(updateBannerStyles);
  const { status, version, body, install } = useUpdateStatus(true);

  if (status !== "available" && status !== "installing") return null;

  const installing = status === "installing";
  const label = version
    ? `BCP ${version} available`
    : IS_TAURI
      ? "A new version of BCP is available"
      : "New version available";

  return (
    <View style={styles.banner}>
      {installing ? (
        <Text style={styles.text}>
          {IS_TAURI ? "Downloading and installing…" : "Refreshing…"}
        </Text>
      ) : (
        <>
          <Text style={styles.text} numberOfLines={1}>
            {label}
          </Text>
          {body ? (
            <Pressable
              style={({ hovered }) => [
                styles.changelogBtn,
                hovered && styles.changelogBtnHover,
              ]}
              onPress={() =>
                requestOpenChangelog({ markdown: body, version: version ?? "" })
              }
              accessibilityRole="button"
              accessibilityLabel="Read what changed in this version"
            >
              <Text style={styles.changelogText}>Changelog</Text>
            </Pressable>
          ) : null}
          <Pressable
            style={({ hovered }) => [
              styles.updateBtn,
              hovered && styles.updateBtnHover,
            ]}
            onPress={install}
            accessibilityRole="button"
            accessibilityLabel={
              IS_TAURI
                ? `Update BCP to ${version ?? "the latest version"}`
                : "Refresh to load the latest version of BCP"
            }
          >
            <Text style={styles.updateText}>
              {IS_TAURI ? "Update" : "Refresh"}
            </Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const updateBannerStyles = defineThemedStyles({
  banner: {
    height: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    flexShrink: 0,
    backgroundColor: "var(--control-hover)",
    borderTopWidth: 1,
    borderTopColor: "var(--border)",
  },
  text: {
    fontFamily: CHROME_FONT,
    fontWeight: "600",
    fontSize: 12,
    color: "var(--text-secondary)",
    flexShrink: 1,
  },
  updateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "var(--border-content)",
    overflow: "hidden",
    marginLeft: "auto",
  },
  updateBtnHover: {
    backgroundColor: "var(--control-hover)",
    borderColor: "var(--accent)",
  },
  updateText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 12,
    color: "var(--accent)",
  },
  changelogBtn: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: 0,
  },
  changelogBtnHover: {
    backgroundColor: "var(--control-hover)",
  },
  changelogText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 12,
    color: "var(--accent)",
    textDecorationLine: "underline",
  },
});
