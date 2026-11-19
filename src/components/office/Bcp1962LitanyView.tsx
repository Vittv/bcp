import { Text, View } from "react-native";
import type { Bcp1962LitanyDoc } from "../../lib/content/bcp1962";
import {
  CHROME_FONT,
  HEADING_FONT,
  SERIF_FONT,
  SERIF_ITALIC_FONT,
} from "../../lib/fonts";
import {
  defineThemedStyles,
  useThemedStyles,
} from "../../lib/theme/themedStyles";
import { OFFICE_EDITION_LABELS, OfficeHeader } from "./OfficeHeader";

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
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed liturgical text
            <Text key={i} style={styles.heading}>
              {node.text}
            </Text>
          );
        }
        const label =
          showSpeakers && node.speaker ? SPEAKERS[node.speaker] : null;
        return (
          <Text
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed liturgical text
            key={i}
            style={[
              styles.text,
              showSpeakers && node.speaker === "people" && styles.people,
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
  heading: {
    fontFamily: HEADING_FONT,
    fontSize: 18,
    color: "var(--text)",
    marginTop: 18,
    marginBottom: 8,
  },
  rubric: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 14,
    lineHeight: 22,
    color: "var(--text-secondary)",
    marginTop: 8,
    marginBottom: 8,
  },
  text: {
    fontFamily: SERIF_FONT,
    fontSize: 17,
    lineHeight: 28,
    color: "var(--text)",
    marginBottom: 8,
  },
  people: { fontWeight: "600" },
  speaker: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    color: "var(--text-secondary)",
    textTransform: "uppercase",
  },
});
