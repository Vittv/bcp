import { Text, View } from "react-native";
import type { Bcp1962LitanyDoc } from "../../lib/content/bcp1962";
import {
  CHROME_FONT,
  HEADING_FONT,
  SERIF_FONT,
  SERIF_ITALIC_FONT,
} from "../../lib/fonts";
import { dayLabel } from "../../lib/office";
import {
  defineThemedStyles,
  useThemedStyles,
} from "../../lib/theme/themedStyles";

const SPEAKERS: Record<string, string> = {
  minister: "Minister",
  people: "People",
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
      <Text style={styles.header}>{doc.officeName}</Text>
      <Text style={styles.date}>{dayLabel(doc.date)}</Text>
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
  header: {
    fontFamily: HEADING_FONT,
    fontSize: 26,
    color: "var(--text)",
    marginBottom: 4,
  },
  date: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    color: "var(--text-secondary)",
    marginBottom: 18,
  },
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
