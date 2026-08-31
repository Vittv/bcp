import { StyleSheet, Text, View } from "react-native";
import { CHROME_FONT } from "../../lib/fonts";

export const SHORTCUTS: {
  group: string;
  rows: { keys: string[]; label: string }[];
}[] = [
  {
    group: "Go to (press g, then a key)",
    rows: [
      { keys: ["g", "t"], label: "Today" },
      { keys: ["g", "c"], label: "Calendar" },
      { keys: ["g", "p"], label: "Psalms" },
      { keys: ["g", "a"], label: "Canticles" },
      { keys: ["g", "w"], label: "Proverbs" },
      { keys: ["g", "s"], label: "Saints" },
      { keys: ["g", "o"], label: "Offices" },
      { keys: ["g", "b"], label: "Old Testament" },
      { keys: ["g", "n"], label: "New Testament" },
    ],
  },
  {
    group: "Days",
    rows: [
      { keys: ["n"], label: "Next day" },
      { keys: ["p"], label: "Previous day" },
    ],
  },
  {
    group: "Reading",
    rows: [
      { keys: ["j", "↓"], label: "Scroll down" },
      { keys: ["k", "↑"], label: "Scroll up" },
      { keys: ["Home"], label: "Top of page" },
      { keys: ["End"], label: "Bottom of page" },
    ],
  },
  {
    group: "Shortcuts & windows",
    rows: [
      { keys: ["?"], label: "Help & shortcuts" },
      { keys: ["Esc"], label: "Close modal" },
    ],
  },
];

function Key({ label }: { label: string }) {
  return <Text style={styles.key}>{label}</Text>;
}

export function HelpScreen() {
  return (
    <View>
      <Text style={styles.lead}>
        Global keyboard shortcuts, active whenever the app window is focused.
        Press the marked keys to move through the Daily Office without the
        mouse.
      </Text>
      {SHORTCUTS.map((group) => (
        <View key={group.group} style={styles.section}>
          <Text style={styles.group}>{group.group}</Text>
          {group.rows.map((row) => (
            <View key={row.keys.join("+")} style={styles.row}>
              <View style={styles.keys}>
                {row.keys.map((k) => (
                  <Key key={k} label={k} />
                ))}
              </View>
              <Text style={styles.label}>{row.label}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  lead: {
    fontFamily: CHROME_FONT,
    fontWeight: "400",
    fontSize: 16,
    lineHeight: 24,
    color: "var(--text-secondary, #7a6e64)",
    marginBottom: 20,
  },
  section: {
    marginBottom: 22,
  },
  group: {
    fontFamily: CHROME_FONT,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "var(--accent, #7a3040)",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  keys: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 96,
  },
  key: {
    fontFamily: '"JetBrains Mono", monospace',
    fontWeight: "500",
    fontSize: 13,
    color: "var(--text, #2c2020)",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "var(--border-content, #b5aa9e)",
    backgroundColor: "var(--bg-raised, #ece7dd)",
    fontVariant: ["tabular-nums"],
  },
  label: {
    fontFamily: CHROME_FONT,
    fontWeight: "400",
    fontSize: 16,
    color: "var(--text-secondary, #7a6e64)",
  },
});
