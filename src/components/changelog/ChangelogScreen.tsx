import { Pressable, ScrollView, Text, View } from "react-native";
import { CHROME_FONT } from "../../lib/fonts";
import {
  defineThemedStyles,
  useThemedStyles,
} from "../../lib/theme/themedStyles";
import { MarkdownView } from "./MarkdownView";

// the changelog's own modal body, shown after an update and from the
// sidebar button. the notes markdown scrolls; a pinned footer holds the
// don't-show-again toggle and the Done button.
type ChangelogScreenProps = {
  markdown: string;
  suppress: boolean;
  onToggleSuppress: (suppress: boolean) => void;
  onDone: () => void;
};

// the changelog's own modal body, shown after an update and from the
// sidebar button. the notes markdown scrolls; a pinned footer holds the
// don't-show-again toggle and the Done button. the header shows the title,
// so the body never renders the notes' `# ` first line.
export function ChangelogScreen({
  markdown,
  suppress,
  onToggleSuppress,
  onDone,
}: ChangelogScreenProps) {
  const styles = useThemedStyles(changelogStyles);
  return (
    <View style={styles.frame}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <MarkdownView markdown={markdown} />
      </ScrollView>
      <View style={styles.footer}>
        <Pressable
          onPress={() => onToggleSuppress(!suppress)}
          style={({ hovered }) => [
            styles.toggle,
            hovered && styles.toggleHover,
          ]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: suppress }}
          accessibilityLabel="Don't show again after updates"
        >
          <View style={[styles.checkbox, suppress && styles.checkboxOn]}>
            {suppress ? <Text style={styles.checkMark}>✓</Text> : null}
          </View>
          <Text style={[styles.toggleLabel, suppress && styles.toggleLabelOn]}>
            Don&apos;t show again
          </Text>
        </Pressable>
        <Pressable
          onPress={onDone}
          style={({ hovered }) => [
            styles.doneBtn,
            hovered && styles.doneBtnHover,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Close the changelog"
        >
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </View>
    </View>
  );
}

const changelogStyles = defineThemedStyles({
  frame: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  footer: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "var(--border)",
    backgroundColor: "var(--bg)",
  },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  toggleHover: {
    backgroundColor: "var(--control-hover)",
  },
  checkbox: {
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "var(--border-content)",
    borderRadius: 3,
  },
  checkboxOn: {
    backgroundColor: "var(--input-bg)",
  },
  checkMark: {
    fontFamily: CHROME_FONT,
    fontWeight: "700",
    fontSize: 10,
    lineHeight: 12,
    color: "var(--accent)",
  },
  toggleLabel: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 13,
    color: "var(--text-secondary)",
  },
  toggleLabelOn: {
    color: "var(--accent)",
  },
  doneBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "var(--border-content)",
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  doneBtnHover: {
    backgroundColor: "var(--control-hover)",
  },
  doneText: {
    fontFamily: CHROME_FONT,
    fontWeight: "600",
    fontSize: 14,
    color: "var(--text)",
  },
});
