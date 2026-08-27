import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  getKjvPassageFromDolRef,
  parseDolLessonRef,
} from "../../lib/content/kjv";
import type { KjvPassage, OfficeSpeaker } from "../../lib/content/types";
import type {
  ComposedLesson,
  ComposedNode,
  ComposedSection,
  OfficeDocument,
} from "../../lib/office/types";
import { PsalmText } from "./PsalmText";
import { ScriptureView } from "./ScriptureView";

const SERIF = '"Crimson Pro", Georgia, "Times New Roman", serif';
// expo-font registers each face as its own single-face family
const SERIF_SEMI =
  '"Crimson Pro SemiBold", "Crimson Pro", Georgia, "Times New Roman", serif';
const SERIF_ITALIC =
  '"Crimson Pro Italic", "Crimson Pro", Georgia, "Times New Roman", serif';
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

async function loadLessonPassages(ref: string): Promise<KjvPassage[]> {
  // split into semicolon groups, then comma-separated ranges within each
  const groups = ref.split(";").map((s) => s.trim());
  if (groups.length === 0) return [];

  // extract book name from the first group
  const firstParsed = parseDolLessonRef(groups[0]);
  if (!firstParsed) return [];
  const book = firstParsed.book;

  const results: KjvPassage[] = [];
  let lastChapter = firstParsed.chapter;

  for (const group of groups) {
    // split group on commas, each piece is a range like "16:16–22" or "1, 13–16"
    const ranges = group.split(",").map((s) => s.trim());
    for (const range of ranges) {
      // ranges with a colon have an explicit chapter; verse-only ranges inherit lastChapter
      if (/:/.test(range)) {
        const parsed = parseDolLessonRef(`${book} ${range}`);
        if (parsed) lastChapter = parsed.chapter;
      }
      const fullRef = /^\d+\s*[-–]/.test(range)
        ? `${book} ${lastChapter}:${range}`
        : /^\d/.test(range)
          ? `${book} ${range}`
          : range;
      const passage = await getKjvPassageFromDolRef(fullRef);
      if (passage) results.push(passage);
    }
  }

  return results;
}

function LessonRow({ lesson }: { lesson: ComposedLesson }) {
  const [passages, setPassages] = useState<KjvPassage[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadLessonPassages(lesson.ref).then((ps) => {
      if (!cancelled) setPassages(ps);
    });
    return () => {
      cancelled = true;
    };
  }, [lesson.ref]);

  return (
    <View style={styles.lessonRow}>
      <Text style={styles.lessonRef}>
        <Text style={styles.lessonLabel}>{lesson.label}: </Text>
        {lesson.ref}
        {lesson.optional ? "  (optional)" : ""}
      </Text>
      {passages.map((p) => (
        <ScriptureView key={`${p.book}-${p.chapter}`} passage={p} />
      ))}
    </View>
  );
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
            <LessonRow key={l.ref} lesson={l} />
          ))}
        </View>
      );
    case "collect":
      return (
        <View style={styles.collectBlock}>
          <Text style={styles.collectCross}>{"\u2720"}</Text>
          <View style={styles.collectBody}>
            <Text style={styles.collectTitle}>{node.passage.title}</Text>
            <Text style={styles.collectText}>{node.passage.text}</Text>
          </View>
        </View>
      );
    case "fixed-collect":
      return (
        <View style={styles.fixedCollectBlock}>
          <Text style={styles.collectCross}>{"\u2720"}</Text>
          <View style={styles.collectBody}>
            {node.title ? (
              <Text style={styles.fixedCollectTitle}>{node.title}</Text>
            ) : null}
            <Text style={styles.fixedCollectText}>{node.text}</Text>
          </View>
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
    case "fixed-collect":
      return `fc:${node.title ?? ""}:${node.text}`;
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
    fontFamily: SERIF_SEMI,
    fontSize: 22,
    lineHeight: 30,
    marginTop: 28,
    marginBottom: 8,
    color: "var(--text, #2c2020)",
  },
  rubric: {
    fontFamily: SERIF_ITALIC,
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
    marginTop: 22,
    paddingLeft: 4,
  },
  psalmTitle: {
    fontFamily: SERIF_ITALIC,
    fontSize: 15,
    color: "var(--text-secondary, #7a6e64)",
    marginBottom: 6,
  },
  lessonBlock: {
    marginTop: 22,
    paddingLeft: 4,
  },
  lessonRow: {
    marginBottom: 14,
  },
  lessonRef: {
    fontFamily: SERIF_ITALIC,
    fontSize: 15,
    color: "var(--text-secondary, #7a6e64)",
  },
  lessonLabel: {
    color: "var(--accent, #7a3040)",
  },
  collectBlock: {
    marginTop: 10,
    marginBottom: 10,
    flexDirection: "row",
  },
  collectCross: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 16,
    color: "var(--accent, #7a3040)",
    marginRight: 4,
  },
  collectBody: {
    flex: 1,
  },
  collectTitle: {
    fontFamily: SERIF_ITALIC,
    fontSize: 14,
    color: "var(--accent, #7a3040)",
    marginBottom: 4,
  },
  collectText: {
    fontFamily: SERIF,
    fontSize: 17,
    lineHeight: 28,
    color: "var(--text, #2c2020)",
  },
  fixedCollectBlock: {
    marginTop: 10,
    marginBottom: 10,
    flexDirection: "row",
  },
  fixedCollectTitle: {
    fontFamily: SERIF_ITALIC,
    fontSize: 14,
    color: "var(--accent, #7a3040)",
    marginBottom: 4,
  },
  fixedCollectText: {
    fontFamily: SERIF,
    fontSize: 17,
    lineHeight: 28,
    color: "var(--text, #2c2020)",
  },
});
