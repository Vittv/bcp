import { Text, View } from "react-native";
import type {
  Bcp1662ComposedOffice,
  Bcp1662OfficeNode,
} from "../../lib/content/bcp1662";
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
import { useSectionHeading, useSubheading } from "./contentHeadings";
import { ScriptureView } from "./ScriptureView";

function NodeView({ node }: { node: Bcp1662OfficeNode }) {
  const styles = useThemedStyles(bcp1662Styles);
  const subheading = useSubheading();
  switch (node.kind) {
    case "heading":
      return <Text style={subheading}>{node.text}</Text>;
    case "rubric":
      return <Text style={styles.rubric}>{node.text}</Text>;
    case "text":
      return (
        <View>
          {node.text.split("\n").map((line, i) => (
            // fixed liturgical text
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed liturgical text
            <Text key={i} style={styles.text}>
              {line}
            </Text>
          ))}
        </View>
      );
    case "psalm":
      return (
        <View style={styles.block}>
          <Text style={styles.label}>
            {node.refs.join(", ")}
            <Text style={styles.muted}>
              {" "}
              (
              {node.source === "proper"
                ? "Proper Psalms"
                : "Thirty Day Psalm Cycle"}
              )
            </Text>
          </Text>
        </View>
      );
    case "lesson":
      return (
        <View style={styles.lessonBlock}>
          <Text style={styles.lessonRef}>
            <Text style={styles.accent}>{node.label}: </Text>
            {node.ref ?? node.normalized ?? "Lesson"}
          </Text>
          {node.error ? <Text style={styles.rubric}>{node.error}</Text> : null}
          {node.passages.map((p) => {
            const first = p.verses[0]?.number;
            const last = p.verses[p.verses.length - 1]?.number;
            return (
              <ScriptureView
                key={`${p.book}-${p.chapter}-${first ?? "x"}-${last ?? "x"}`}
                passage={p}
              />
            );
          })}
          {node.passages.length === 0 && !node.error ? (
            <Text style={styles.rubric}>Reading text not available.</Text>
          ) : null}
        </View>
      );
    case "placeholder":
      return <Text style={styles.placeholder}>{node.text}</Text>;
  }
}

export function Bcp1662OfficeView({ doc }: { doc: Bcp1662ComposedOffice }) {
  const styles = useThemedStyles(bcp1662Styles);
  const sectionHeading = useSectionHeading();
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.officeName}>{doc.officeName}</Text>
        <Text style={styles.dateLabel}>{dayLabel(doc.date)}</Text>
        {doc.title ? <Text style={styles.entryTitle}>{doc.title}</Text> : null}
        <Text style={styles.editionLabel}>1662 Book of Common Prayer</Text>
      </View>
      {doc.sections.map((section) => (
        <View key={section.key} style={styles.section}>
          <Text style={sectionHeading}>{section.heading}</Text>
          {section.nodes.map((node, i) => (
            // nodes are composed in order without stable ids
            // biome-ignore lint/suspicious/noArrayIndexKey: composed office content
            <NodeView key={`${section.key}-${node.kind}-${i}`} node={node} />
          ))}
        </View>
      ))}
      {doc.notes.length > 0 ? (
        <View style={styles.notes}>
          {doc.notes.map((note, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: note list
            <Text key={i} style={styles.noteText}>
              {note}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const bcp1662Styles = defineThemedStyles({
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
  section: {
    marginBottom: 20,
  },
  block: {
    marginTop: 8,
    marginBottom: 8,
  },
  lessonBlock: {
    marginTop: 12,
    marginBottom: 12,
  },
  text: {
    fontFamily: SERIF_FONT,
    fontSize: 18,
    lineHeight: 30,
    color: "var(--text)",
    marginTop: 4,
  },
  rubric: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 15,
    lineHeight: 25,
    color: "var(--text-secondary)",
    marginTop: 4,
    marginBottom: 4,
  },
  placeholder: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 14,
    lineHeight: 22,
    color: "var(--text-secondary)",
    opacity: 0.8,
    marginTop: 4,
    marginBottom: 4,
  },
  label: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 16,
    lineHeight: 26,
    color: "var(--text)",
  },
  muted: {
    color: "var(--text-secondary)",
  },
  lessonRef: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 15,
    color: "var(--text-secondary)",
    marginBottom: 4,
  },
  accent: {
    color: "var(--accent)",
  },
  notes: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "var(--border-content)",
  },
  noteText: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 13,
    lineHeight: 20,
    color: "var(--text-secondary)",
    marginTop: 2,
  },
});
