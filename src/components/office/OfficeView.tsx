import { StyleSheet, Text, View } from "react-native";
import type { OfficeSpeaker } from "../../lib/content/types";
import type {
  ComposedNode,
  ComposedSection,
  OfficeDocument,
} from "../../lib/office/types";
import { PsalmText } from "./PsalmText";

const SPEAKER_LABEL: Record<OfficeSpeaker, string> = {
  officiant: "Officiant",
  people: "People",
  all: "All",
};

function SpeakerLabel({ speaker }: { speaker: OfficeSpeaker }) {
  return <Text style={styles.speaker}>{SPEAKER_LABEL[speaker]} </Text>;
}

function NodeView({ node }: { node: ComposedNode }) {
  switch (node.kind) {
    case "heading":
      return <Text style={styles.heading}>{node.text}</Text>;
    case "rubric":
      return <Text style={styles.rubric}>{node.text}</Text>;
    case "text":
      return (
        <Text style={styles.text}>
          {node.speaker ? <SpeakerLabel speaker={node.speaker} /> : null}
          {node.text}
        </Text>
      );
    case "psalm": {
      const parts = node.citation.split(":");
      const title =
        parts.length > 1
          ? `Psalm ${parts[0]}:${parts[1]}`
          : `Psalm ${node.citation}`;
      return (
        <View style={styles.psalmBlock}>
          <Text style={styles.psalmTitle}>
            {title}
            {node.optional ? "  (optional)" : ""}
          </Text>
          <PsalmText passage={node.passage} />
        </View>
      );
    }
    case "lessons":
      return (
        <View style={styles.lessonBlock}>
          {node.lessons.map((lesson) => (
            <View
              key={`${lesson.ref}-${lesson.label}`}
              style={styles.lessonRow}
            >
              <Text style={styles.lessonLabel}>{lesson.label}</Text>
              <Text style={styles.lessonRef}>{lesson.ref}</Text>
            </View>
          ))}
        </View>
      );
    case "collect":
      return (
        <View style={styles.collectBlock}>
          <Text style={styles.collectTitle}>{node.passage.title}</Text>
          <Text style={styles.text}>{node.passage.text}</Text>
        </View>
      );
  }
}

function nodeKey(node: ComposedNode): string {
  switch (node.kind) {
    case "psalm":
      return `${node.kind}:${node.citation}`;
    case "lessons":
      return `${node.kind}:${node.lessons.map((l) => l.ref).join(",")}`;
    case "collect":
      return `${node.kind}:${node.passage.title}`;
    case "heading":
    case "rubric":
    case "text":
      return `${node.kind}:${node.text}`;
  }
}

// duplicate text (e.g. the doxology after every canticle, repeated "Amen.")
// would collide as React keys and corrupt reconciliation across tab switches;
// disambiguate with an occurrence count.
function sectionKeys(nodes: ComposedNode[]): string[] {
  const seen = new Map<string, number>();
  return nodes.map((node) => {
    const base = nodeKey(node);
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return `${base}#${count}`;
  });
}

function SectionView({ section }: { section: ComposedSection }) {
  if (section.nodes.length === 0) return null;
  const keys = sectionKeys(section.nodes);
  return (
    <View style={styles.section}>
      {section.heading ? (
        <Text style={styles.sectionHeading}>{section.heading}</Text>
      ) : null}
      {section.nodes.map((node, i) => (
        <NodeView key={keys[i]} node={node} />
      ))}
    </View>
  );
}

export function OfficeView({ document }: { document: OfficeDocument }) {
  return (
    <View>
      {document.sections.map((section) => (
        <SectionView key={section.key} section={section} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontFamily: "sans-serif",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#7a5c3a",
    marginBottom: 10,
    marginTop: 4,
  },
  heading: {
    fontFamily: "serif",
    fontSize: 20,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 6,
    color: "#1c1c1c",
  },
  rubric: {
    fontFamily: "serif",
    fontStyle: "italic",
    fontSize: 15,
    lineHeight: 23,
    color: "#6f6f6f",
    marginTop: 4,
    marginBottom: 4,
  },
  text: {
    fontFamily: "serif",
    fontSize: 17,
    lineHeight: 27,
    color: "#1c1c1c",
    marginTop: 4,
  },
  speaker: {
    fontFamily: "sans-serif",
    fontWeight: "700",
    fontSize: 12,
    color: "#7a5c3a",
  },
  psalmBlock: {
    marginTop: 6,
  },
  psalmTitle: {
    fontFamily: "serif",
    fontSize: 15,
    fontStyle: "italic",
    color: "#444",
    marginBottom: 2,
  },
  lessonBlock: {
    marginTop: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#d8c8a8",
    paddingLeft: 12,
    paddingVertical: 4,
  },
  lessonRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 6,
    gap: 10,
  },
  lessonLabel: {
    fontFamily: "sans-serif",
    fontSize: 12,
    fontWeight: "700",
    color: "#7a5c3a",
    minWidth: 96,
  },
  lessonRef: {
    fontFamily: "serif",
    fontSize: 17,
    color: "#1c1c1c",
  },
  collectBlock: {
    marginTop: 6,
    marginBottom: 6,
  },
  collectTitle: {
    fontFamily: "sans-serif",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: "#7a5c3a",
    marginBottom: 4,
  },
});
