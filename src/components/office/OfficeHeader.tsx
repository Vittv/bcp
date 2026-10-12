import { Text, View } from "react-native";
import { CHROME_FONT, HEADING_FONT } from "../../lib/fonts";
import { dayLabel } from "../../lib/office";
import type { OfficeDocument } from "../../lib/office/types";
import {
  defineThemedStyles,
  useThemedStyles,
} from "../../lib/theme/themedStyles";

// the masthead above every composed office; the Today page and the
// reference offices page share it verbatim so the two read identically
export function OfficeHeader({ document }: { document: OfficeDocument }) {
  const styles = useThemedStyles(officeHeaderStyles);
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

const officeHeaderStyles = defineThemedStyles({
  header: {
    marginBottom: 28,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border-content)",
  },
  officeName: {
    fontFamily: HEADING_FONT,
    fontWeight: "700",
    fontSize: 28,
    lineHeight: 36,
    color: "var(--text)",
    letterSpacing: -0.3,
  },
  dateLabel: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 13,
    color: "var(--text-secondary)",
    marginTop: 4,
  },
  entryTitle: {
    fontFamily: CHROME_FONT,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "var(--accent)",
    marginTop: 8,
  },
});
