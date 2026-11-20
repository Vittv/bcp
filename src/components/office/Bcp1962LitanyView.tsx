import { Text, View } from "react-native";
import type { Bcp1962LitanyDoc } from "../../lib/content/bcp1962";
import {
  defineThemedStyles,
  useThemedStyles,
} from "../../lib/theme/themedStyles";
import { useSectionHeading, useSubheading } from "./contentHeadings";
import { OFFICE_EDITION_LABELS, OfficeHeader } from "./OfficeHeader";
import { officeDocumentStyles } from "./officeDocumentStyles";

const SPEAKERS: Record<string, string> = {
  minister: "Minister",
  priest: "Priest",
  people: "People",
  answer: "Answer",
  all: "All",
};

export function Bcp1962LitanyView({
  doc,
  showRubrics = true,
  showSpeakers = true,
}: {
  doc: Bcp1962LitanyDoc;
  showRubrics?: boolean;
  showSpeakers?: boolean;
}) {
  const styles = useThemedStyles(litanyStyles);
  const sectionHeading = useSectionHeading();
  const subheading = useSubheading();
  return (
    <View>
      <OfficeHeader
        officeName={doc.officeName}
        date={doc.date}
        editionLabel={OFFICE_EDITION_LABELS["1962"]}
      />
      {doc.nodes.map((node, i) => {
        if (node.kind === "rubric") {
          if (!showRubrics) return null;
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed liturgical text
            <Text key={i} style={styles.rubric}>
              {node.text}
            </Text>
          );
        }
        if (node.kind === "heading") {
          if (node.text === "Suffrages" || node.text === "Confession of Sin") {
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed liturgical text
              <Text key={i} style={sectionHeading}>
                {node.text}
              </Text>
            );
          }
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed liturgical text
            <Text key={i} style={subheading}>
              {node.text}
            </Text>
          );
        }
        const label = showSpeakers
          ? (SPEAKERS[node.speaker ?? ""] ?? null)
          : null;
        return (
          <Text
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed liturgical text
            key={i}
            style={[
              styles.text,
              node.lordsPrayerFirst && styles.lordsPrayerStart,
              node.lordsPrayerLast && styles.lordsPrayerEnd,
              showSpeakers &&
                (node.speaker === "people" || node.speaker === "all") &&
                styles.textPeople,
            ]}
          >
            {label ? <Text style={styles.speaker}>{label} </Text> : null}
            {node.text}
          </Text>
        );
      })}
    </View>
  );
}

const litanyStyles = defineThemedStyles({
  text: { ...officeDocumentStyles.text, marginTop: 4 },
  lordsPrayerStart: { marginTop: 4 },
  lordsPrayerEnd: { marginBottom: 8 },
  textPeople: officeDocumentStyles.textPeople,
  rubric: officeDocumentStyles.rubric,
  speaker: officeDocumentStyles.speaker,
});
