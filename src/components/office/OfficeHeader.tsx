import { StyleSheet, Text, View } from "react-native";
import { CHROME_FONT, HEADING_FONT } from "../../lib/fonts";
import { dayLabel } from "../../lib/office";
import type { OfficeDocument } from "../../lib/office/types";

// the masthead above every composed office; the Today page and the
// reference offices page share it verbatim so the two read identically
export function OfficeHeader({ document }: { document: OfficeDocument }) {
  return (
    <View style={styles.header}>
      <Text style={styles.officeName}>{document.officeName}</Text>
      <Text style={styles.dateLabel}>{dayLabel(document.date)}</Text>
      {document.entryTitle ? (
        <Text style={styles.entryTitle}>{document.entryTitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 28,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border-content, #b5aa9e)",
  },
  officeName: {
    fontFamily: HEADING_FONT,
    fontWeight: "700",
    fontSize: 28,
    lineHeight: 36,
    color: "var(--text, #2c2020)",
    letterSpacing: -0.3,
  },
  dateLabel: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 13,
    color: "var(--text-secondary, #7a6e64)",
    marginTop: 4,
  },
  entryTitle: {
    fontFamily: CHROME_FONT,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "var(--accent, #7a3040)",
    marginTop: 8,
  },
});
