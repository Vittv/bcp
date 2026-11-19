import { Text, View } from "react-native";
import type {
  Bcp1962ComposedOffice,
  Bcp1962OfficeNode,
} from "../../lib/content/bcp1962";
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
import { PsalmText } from "./PsalmText";
import { ScriptureView } from "./ScriptureView";

const SPEAKERS: Record<string, string> = {
  minister: "Minister",
  priest: "Priest",
  people: "People",
  all: "All",
};

function NodeView({
  node,
  showRubrics,
  showSpeakers,
}: {
  node: Bcp1962OfficeNode;
  showRubrics: boolean;
  showSpeakers: boolean;
}) {
  const styles = useThemedStyles(bcp1962Styles);
  const subheading = useSubheading();
  switch (node.kind) {
    case "heading":
      return <Text style={subheading}>{node.text}</Text>;
    case "rubric":
      if (!showRubrics) return null;
      return <Text style={styles.rubric}>{node.text}</Text>;
    case "text": {
      const label = showSpeakers
        ? (SPEAKERS[node.speaker ?? ""] ?? null)
        : null;
      return (
        <Text
          style={[
            styles.text,
            showSpeakers && node.speaker === "people" && styles.textPeople,
          ]}
        >
          {label ? <Text style={styles.speaker}>{label} </Text> : null}
          {node.text}
        </Text>
      );
    }
    case "psalm":
      return (
        <View style={styles.block}>
          {node.passages.length > 0 ? (
            node.passages.map(({ ref, passage }) => (
              <View key={ref} style={styles.psalmBlock}>
                <Text style={styles.psalmTitle}>
                  {ref.startsWith("Psalm") ? ref : `Psalm ${ref}`}
                </Text>
                <PsalmText passage={passage} />
              </View>
            ))
          ) : (
            <Text style={styles.label}>{node.refs.join(", ")}</Text>
          )}
        </View>
      );
    case "lesson":
      return (
        <View style={styles.lessonBlock}>
          <Text style={styles.lessonRef}>
            <Text style={styles.accent}>{node.label}: </Text>
            {node.ref ?? node.normalized ?? "Lesson"}
          </Text>
          {node.error && showRubrics ? (
            <Text style={styles.rubric}>{node.error}</Text>
          ) : null}
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
    case "canticle":
      return (
        <View style={styles.lessonBlock}>
          {node.rubric && showRubrics ? (
            <Text style={styles.rubric}>{node.rubric}</Text>
          ) : null}
          <Text style={[subheading, styles.canticleTitle]}>
            {node.title}
            {node.suggested ? " (appointed)" : ""}
          </Text>
          {node.text.split("\n").map((line, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed liturgical text
            <Text key={i} style={styles.text}>
              {line}
            </Text>
          ))}
        </View>
      );
    case "creed":
      return (
        <View style={styles.lessonBlock}>
          <Text style={subheading}>{node.title}</Text>
          {node.rubric && showRubrics ? (
            <Text style={styles.rubric}>{node.rubric}</Text>
          ) : null}
          <Text style={styles.text}>{node.text}</Text>
        </View>
      );
    case "occasional":
      return (
        <View style={styles.lessonBlock}>
          <Text style={subheading}>{node.title}</Text>
          <Text style={styles.text}>{node.text}</Text>
        </View>
      );
  }
}

export function Bcp1962OfficeView({
  doc,
  showRubrics = true,
  showSpeakers = true,
}: {
  doc: Bcp1962ComposedOffice;
  showRubrics?: boolean;
  showSpeakers?: boolean;
}) {
  const styles = useThemedStyles(bcp1962Styles);
  const sectionHeading = useSectionHeading();
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.officeName}>{doc.officeName}</Text>
        <Text style={styles.dateLabel}>{dayLabel(doc.date)}</Text>
        {doc.title ? <Text style={styles.entryTitle}>{doc.title}</Text> : null}
        <Text style={styles.editionLabel}>
          1962 - Canadian Book of Common Prayer
        </Text>
      </View>
      {doc.sections.map((section) => (
        <View key={section.key} style={styles.section}>
          {section.heading ? (
            <Text style={[sectionHeading, styles.headingText]}>
              {section.heading}
            </Text>
          ) : null}
          {section.nodes.map((node, i) => (
            <NodeView
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed liturgical text
              key={i}
              node={node}
              showRubrics={showRubrics}
              showSpeakers={showSpeakers}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const bcp1962Styles = defineThemedStyles({
  header: { marginBottom: 18 },
  officeName: {
    fontFamily: HEADING_FONT,
    fontSize: 26,
    color: "var(--text)",
    marginBottom: 4,
  },
  dateLabel: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    color: "var(--text-secondary)",
    marginBottom: 6,
  },
  entryTitle: {
    fontFamily: HEADING_FONT,
    fontSize: 18,
    color: "var(--text)",
    marginBottom: 4,
  },
  editionLabel: {
    fontFamily: CHROME_FONT,
    fontSize: 12,
    color: "var(--text-secondary)",
  },
  section: { marginBottom: 14 },
  headingText: { marginBottom: 8, marginTop: 10 },
  block: { marginBottom: 8 },
  psalmBlock: { marginBottom: 10 },
  lessonBlock: { marginBottom: 12 },
  canticleTitle: { marginBottom: 6 },
  accent: { fontWeight: "600" },
  label: { fontFamily: SERIF_FONT, fontSize: 15, color: "var(--text)" },
  psalmTitle: {
    fontFamily: HEADING_FONT,
    fontSize: 15,
    color: "var(--text)",
    marginBottom: 4,
  },
  lessonRef: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    color: "var(--text-secondary)",
    marginBottom: 4,
  },
  rubric: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 14,
    lineHeight: 21,
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
  textPeople: { fontWeight: "600" },
  speaker: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    color: "var(--text-secondary)",
    textTransform: "uppercase",
  },
});
