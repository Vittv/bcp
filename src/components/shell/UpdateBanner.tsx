import { Pressable, StyleSheet, Text, View } from "react-native";
import { requestOpenChangelog } from "../../lib/changelogPrefs";
import { IS_TAURI } from "../../lib/desktop";
import { CHROME_FONT } from "../../lib/fonts";
import { useUpdateStatus } from "../../lib/updater";

// launch-time notice that a newer desktop build exists, drawn as a thin
// band at the bottom of the sidebar, just above the footer. runs the
// shared updater flow on press and relaunches on success.
export function UpdateBanner() {
  const { status, version, body, install } = useUpdateStatus(true);

  if (!IS_TAURI) return null;
  if (status !== "available" && status !== "installing") return null;

  const installing = status === "installing";
  // the pending version is always set when a build is available; the fallback
  // keeps this branch's strict string props honest for the typechecker
  const nextVersion = version ?? "";

  return (
    <View style={styles.banner}>
      {installing ? (
        <Text style={styles.text}>Downloading and installing…</Text>
      ) : (
        <>
          <Text style={styles.text} numberOfLines={1}>
            version {nextVersion} available
          </Text>
          {body ? (
            <Pressable
              style={({ hovered }) => [
                styles.changelogBtn,
                hovered && styles.changelogBtnHover,
              ]}
              onPress={() =>
                requestOpenChangelog({ markdown: body, version: nextVersion })
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
            accessibilityLabel={`Update to version ${nextVersion}`}
          >
            <Text style={styles.updateText}>Update</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    height: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    flexShrink: 0,
    backgroundColor: "var(--control-hover, #d2cbbf)",
    borderTopWidth: 1,
    borderTopColor: "var(--border, #d2cbbf)",
  },
  text: {
    fontFamily: CHROME_FONT,
    fontWeight: "600",
    fontSize: 12,
    color: "var(--text-secondary, #7a6e64)",
    flexShrink: 1,
  },
  updateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "var(--border-content, #b5aa9e)",
    overflow: "hidden",
    marginLeft: "auto",
  },
  updateBtnHover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
    borderColor: "var(--accent, #7a3040)",
  },
  updateText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 12,
    color: "var(--accent, #7a3040)",
  },
  changelogBtn: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: 0,
  },
  changelogBtnHover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  changelogText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 12,
    color: "var(--accent, #7a3040)",
    textDecorationLine: "underline",
  },
});
