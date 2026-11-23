import { Text, View } from "react-native";
import type { BcpEdition } from "../../context/EditionContext";
import { CHROME_FONT, HEADING_FONT, SUBHEADING_FONT } from "../../lib/fonts";
import { dayLabel } from "../../lib/office";
import {
  defineThemedStyles,
  useThemedStyles,
} from "../../lib/theme/themedStyles";

// the masthead above every composed office; Today and the reference offices
// page share it verbatim, and each edition supplies only its own label
export const OFFICE_EDITION_LABELS: Record<BcpEdition, string> = {
  "1979": "1979 - The Episcopal Church BCP",
  "1662": "1662 - Church of England BCP",
  "1962": "1962 - Anglican Church of Canada BCP",
};

export function OfficeHeader({
  officeName,
  date,
  title,
  editionLabel,
  titleBelowEdition = false,
}: {
  officeName: string;
  date: Parameters<typeof dayLabel>[0];
  title?: string | null;
  editionLabel: string;
  titleBelowEdition?: boolean;
}) {
  const styles = useThemedStyles(officeHeaderStyles);
  const titleNode = title ? (
    <Text
      style={titleBelowEdition ? styles.subheadingTitle : styles.entryTitle}
    >
      {title}
    </Text>
  ) : null;
  return (
    <View style={styles.header}>
      <Text style={styles.officeName}>{officeName}</Text>
      <Text style={styles.dateLabel}>{dayLabel(date)}</Text>
      {titleBelowEdition ? null : titleNode}
      <Text style={styles.editionLabel}>{editionLabel}</Text>
      {titleBelowEdition ? titleNode : null}
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
    fontWeight: "500",
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
  editionLabel: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    fontWeight: "500",
    color: "var(--text-secondary)",
    marginTop: 6,
  },
  subheadingTitle: {
    fontFamily: SUBHEADING_FONT,
    fontSize: 20,
    lineHeight: 27,
    fontWeight: "600",
    color: "var(--accent)",
    marginTop: 6,
  },
});
