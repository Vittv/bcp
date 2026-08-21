import { StyleSheet, Text, View } from "react-native";
import type { OfficeSpeaker } from "../../lib/content/types";
import type {
  ComposedNode,
  ComposedSection,
  OfficeDocument,
} from "../../lib/office/types";
import { PsalmText } from "./PsalmText";

const SERIF = '"Crimson Text", Georgia, "Times New Roman", serif';
const SANS =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const SPEAKER_LABEL: Record<OfficeSpeaker, string> = {
  officiant: "Officiant",
  people: "People",
  all: "All",
};

type NodeViewProps = {
  node: ComposedNode;
  showRubrics: boolean;
  showSpeakers: boolean;
};

function SpeakerLabel({ speaker }: { speaker: OfficeSpeaker }) {
  return <Text style={styles.speaker}>{SPEAKER_LABEL[speaker]} </Text>;
}

function NodeView({ node, showRubrics, showSpeakers }: NodeViewProps) {
  switch (node.kind) {
    case "heading":
      return <Text style={styles.heading}>{node.text}</Text>;
    case "rubric":
      if (!showRubrics) return null;
      return <Text style={styles.rubric}>{node.text}</Text>;
    case "text":
      return (
        <Text style={styles.text}>
          {node.speaker && showSpeakers ? (
            <SpeakerLabel speaker={node.speaker} />
          ) : null}
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
          {node.lessons.map((l) => (
            <Text key={l.ref} style={styles.lessonRef}>
              {l.label}: {l.ref}
              {l.optional ? "  (optional)" : ""}
            </Text>
          ))}
        </View>
      );
    case "collect":
      return (
        <View style={styles.collectBlock}>
          <Text style={styles.collectTitle}>A Collect</Text>
          <Text style={styles.text}>{node.passage.text}</Text>
        </View>
      );
  }
}

function sectionKeys(nodes: readonly ComposedNode[]) {
  const seen = new Map<string, number>();
  return nodes.map((node) => {
    const base = nodeKey(node);
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return `${base}#${count}`;
  });
}

function SectionView({
  section,
  showRubrics,
  showSpeakers,
}: {
  section: ComposedSection;
  showRubrics: boolean;
  showSpeakers: boolean;
}) {
  if (section.nodes.length === 0) return null;
  const keys = sectionKeys(section.nodes);
  return (
    <View style={styles.section}>
      {section.heading ? (
        <Text style={styles.sectionHeading}>{section.heading}</Text>
      ) : null}
      {section.nodes.map((node, i) => (
        <NodeView
          key={keys[i]}
          node={node}
          showRubrics={showRubrics}
          showSpeakers={showSpeakers}
        />
      ))}
    </View>
  );
}

export function OfficeView({
  document,
  showRubrics,
  showSpeakers,
}: {
  document: OfficeDocument;
  showRubrics: boolean;
  showSpeakers: boolean;
}) {
  return (
    <View>
      {document.sections.map((section) => (
        <SectionView
          key={section.key}
          section={section}
          showRubrics={showRubrics}
          showSpeakers={showSpeakers}
        />
      ))}
    </View>
  );
}

function nodeKey(node: ComposedNode): string {
  switch (node.kind) {
    case "heading":
      return `h:${node.text}`;
    case "rubric":
      return `r:${node.text}`;
    case "text":
      return `t:${node.speaker ?? ""}:${node.text}`;
    case "psalm":
      return `p:${node.citation}`;
    case "lessons":
      return `l:${node.lessons.map((l) => l.ref).join("|")}`;
    case "collect":
      return `c:${node.passage.text}`;
  }
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontFamily: SANS,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "var(--accent, #7a3040)",
    marginBottom: 12,
    marginTop: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border-content, #b5aa9e)",
  },
  heading: {
    fontFamily: SERIF,
    fontSize: 22,
    fontWeight: "600",
    marginTop: 28,
    marginBottom: 8,
    color: "var(--text, #2c2020)",
  },
  rubric: {
    fontFamily: SERIF,
    fontStyle: "italic",
    fontSize: 15,
    lineHeight: 25,
    color: "var(--text-secondary, #7a6e64)",
    marginTop: 4,
    marginBottom: 4,
  },
  text: {
    fontFamily: SERIF,
    fontSize: 18,
    lineHeight: 30,
    color: "var(--text, #2c2020)",
    marginTop: 8,
  },
  speaker: {
    fontFamily: SANS,
    fontWeight: "600",
    fontSize: 11,
    letterSpacing: 0.4,
    color: "var(--accent, #7a3040)",
  },
  psalmBlock: {
    marginTop: 10,
    marginBottom: 4,
    paddingLeft: 4,
  },
  psalmTitle: {
    fontFamily: SERIF,
    fontSize: 15,
    fontStyle: "italic",
    color: "var(--text-secondary, #7a6e64)",
    marginBottom: 6,
  },
  lessonBlock: {
    marginTop: 10,
    marginBottom: 4,
    borderLeftWidth: 2,
    borderLeftColor: "var(--accent, #7a3040)",
    paddingLeft: 14,
    paddingVertical: 6,
  },
  lessonRef: {
    fontFamily: SERIF,
    fontSize: 18,
    color: "var(--text, #2c2020)",
  },
  collectBlock: {
    marginTop: 10,
    marginBottom: 10,
  },
  collectTitle: {
    fontFamily: SANS,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "var(--accent, #7a3040)",
    marginBottom: 6,
  },
});
