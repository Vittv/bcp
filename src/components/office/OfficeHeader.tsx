import { StyleSheet, Text, View } from "react-native";
import { dayLabel } from "../../lib/office";
import type { OfficeDocument } from "../../lib/office/types";

const SERIF = '"Crimson Text", Georgia, "Times New Roman", serif';
const SANS =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

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
    fontFamily: SERIF,
    fontSize: 28,
    fontWeight: "600",
    color: "var(--text, #2c2020)",
    letterSpacing: -0.3,
  },
  dateLabel: {
    fontFamily: SANS,
    fontSize: 13,
    color: "var(--text-secondary, #7a6e64)",
    marginTop: 4,
  },
  entryTitle: {
    fontFamily: SANS,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "var(--accent, #7a3040)",
    marginTop: 8,
  },
});
