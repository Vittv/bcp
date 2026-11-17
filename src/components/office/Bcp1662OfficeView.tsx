import { useState } from "react";
import { Text, View } from "react-native";
import type {
  Bcp1662ComposedOffice,
  Bcp1662OfficeNode,
} from "../../lib/content/bcp1662";
import { BCP1662_OFFICE_TEXT } from "../../lib/content/vendor/bcp1662";
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
import { ChoiceMenu } from "./OfficeControls";
import { PsalmText } from "./PsalmText";
import { ScriptureView } from "./ScriptureView";

function NodeView({ node }: { node: Bcp1662OfficeNode }) {
  const styles = useThemedStyles(bcp1662Styles);
  const subheading = useSubheading();
  switch (node.kind) {
    case "heading":
      return <Text style={subheading}>{node.text}</Text>;
    case "rubric":
      return <Text style={styles.rubric}>{node.text}</Text>;
    case "text": {
      const speakerLabel =
        node.speaker === "minister" || node.speaker === "priest"
          ? "Minister"
          : node.speaker === "people"
            ? "People"
            : node.speaker === "all"
              ? "All"
              : node.speaker === "answer"
                ? "Answer"
                : null;
      const opening = BCP1662_OFFICE_TEXT.common.openingSentences ?? [];
      const isOpening = opening.some((s) => s.text === node.text);
      let body = node.text;
      let citation: string | null = null;
      if (isOpening) {
        const text = node.text;
        let bestRemainder = "";
        let bestIndex = -1;
        let idx = text.indexOf(". ", 0);
        while (idx !== -1) {
          const remainder = text.slice(idx + 2);
          if (/[0-9]/.test(remainder) && /^[A-Za-z0-9]/.test(remainder)) {
            if (remainder.length > bestRemainder.length) {
              bestRemainder = remainder;
              bestIndex = idx;
            }
          }
          idx = text.indexOf(". ", idx + 2);
        }
        if (bestIndex !== -1) {
          body = text.slice(0, bestIndex + 1).trimEnd();
          citation = bestRemainder.trim();
        }
      }
      return (
        <View>
          {body.split("\n").map((line, i) => (
            // fixed liturgical text
            <Text
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed liturgical text
              key={i}
              style={[
                styles.text,
                node.speaker === "people" && styles.textPeople,
              ]}
            >
              {i === 0 && speakerLabel ? (
                <Text style={styles.speaker}>{speakerLabel} </Text>
              ) : null}
              {line}
              {i === body.split("\n").length - 1 && citation ? (
                <Text style={styles.citation}> {citation}</Text>
              ) : null}
            </Text>
          ))}
        </View>
      );
    }
    case "psalm":
      return (
        <View style={styles.block}>
          {node.passages.length > 0 ? (
            node.passages.map(({ ref, passage }) => (
              <View
                key={`${ref}-${passage.verses[0]?.number ?? 0}`}
                style={styles.psalmBlock}
              >
                <Text style={styles.psalmTitle}>
                  {ref.startsWith("Psalm") ? ref : `Psalm ${ref}`}
                </Text>
                <PsalmText passage={passage} />
              </View>
            ))
          ) : (
            <Text style={styles.label}>{node.refs.join(", ")}</Text>
          )}
          <Text style={[styles.muted, styles.psalmSource]}>
            {node.source === "proper"
              ? "Proper Psalms"
              : "Thirty Day Psalm Cycle"}
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
  const sentences = BCP1662_OFFICE_TEXT.common.openingSentences ?? [];
  const suggested = sentences[0]?.text ?? "";
  const [openingSelection, setOpeningSelection] = useState<string>("suggested");
  const psalmNode = doc.sections
    .find((s) => s.key === "psalms")
    ?.nodes.find((n) => n.kind === "psalm");
  const psalmRefs = psalmNode?.kind === "psalm" ? psalmNode.refs : [];
  const [psalmSelection, setPsalmSelection] = useState<string>("suggested");
  const [lessonSelection, setLessonSelection] = useState<string>("suggested");
  const isOpeningSentence = (text: string) =>
    sentences.some((s) => s.text === text);
  const truncate = (s: string, n: number) =>
    s.length > n ? `${s.slice(0, n - 1)}…` : s;
  const groups = Array.from(
    sentences.reduce((map, s) => {
      const list = map.get(s.label) ?? [];
      list.push(s.text);
      map.set(s.label, list);
      return map;
    }, new Map<string, string[]>()),
  ).map(([season, texts]) => ({ season, texts }));
  const options = [
    { id: "suggested", label: truncate(suggested, 52), group: "Suggested" },
    ...groups.flatMap((g) =>
      g.texts.map((t) => ({ id: t, label: truncate(t, 64), group: g.season })),
    ),
    { id: "all", label: "All sentences", group: "Other" },
  ];
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.officeName}>{doc.officeName}</Text>
        <Text style={styles.dateLabel}>{dayLabel(doc.date)}</Text>
        {doc.title ? <Text style={styles.entryTitle}>{doc.title}</Text> : null}
        <Text style={styles.editionLabel}>1662 - Book of Common Prayer</Text>
      </View>
      {doc.sections.map((section) => (
        <View key={section.key} style={styles.section}>
          <Text style={sectionHeading}>{section.heading}</Text>
          {section.key === "opening" && sentences.length > 0 ? (
            <View style={styles.controlRow}>
              <ChoiceMenu
                value={openingSelection}
                options={options}
                label="Opening Sentence"
                accessibilityLabel="Opening Sentence"
                fullWidth
                onChange={setOpeningSelection}
              />
            </View>
          ) : null}
          {section.key === "psalms" && psalmRefs.length > 1 ? (
            <View style={styles.controlRow}>
              <ChoiceMenu
                value={psalmSelection}
                options={[
                  { id: "suggested", label: "All psalms", group: "Suggested" },
                  ...psalmRefs.map((ref) => ({
                    id: ref,
                    label: ref,
                    group: "Psalms",
                  })),
                ]}
                label="Psalms"
                accessibilityLabel="Psalms"
                fullWidth
                onChange={setPsalmSelection}
              />
            </View>
          ) : null}
          {section.key === "lessons" ? (
            <View style={styles.controlRow}>
              <ChoiceMenu
                value={lessonSelection}
                options={[
                  {
                    id: "suggested",
                    label: "OT & NT",
                    group: "Suggested",
                  },
                  { id: "first", label: "OT only", group: "Lessons" },
                  {
                    id: "second",
                    label: "NT only",
                    group: "Lessons",
                  },
                ]}
                label="Lessons"
                accessibilityLabel="Lessons"
                fullWidth
                onChange={setLessonSelection}
              />
            </View>
          ) : null}
          {section.nodes
            .filter((node) => {
              if (section.key === "opening" && node.kind === "text") {
                if (!isOpeningSentence(node.text)) return true;
                if (openingSelection === "all") return true;
                const target =
                  openingSelection === "suggested"
                    ? suggested
                    : openingSelection;
                return node.text === target;
              }
              if (section.key === "lessons" && node.kind === "lesson") {
                if (lessonSelection === "suggested") return true;
                return node.slot === lessonSelection;
              }
              return true;
            })
            .map((node, i) => {
              const renderedNode =
                section.key === "psalms" && node.kind === "psalm"
                  ? psalmSelection === "suggested"
                    ? node
                    : {
                        ...node,
                        refs: node.refs.filter((r) => r === psalmSelection),
                        passages: node.passages.filter(
                          (p) =>
                            (p.ref.startsWith("Psalm")
                              ? p.ref
                              : `Psalm ${p.ref}`) === psalmSelection,
                        ),
                      }
                  : node;
              const isLordsPrayerText =
                node.kind === "text" &&
                i > 0 &&
                section.nodes[i - 1]?.kind === "heading" &&
                section.nodes[i - 1]?.text === "The Lord's Prayer";
              return (
                // nodes are composed in order without stable ids
                <View
                  // biome-ignore lint/suspicious/noArrayIndexKey: composed office content
                  key={`${section.key}-${node.kind}-${i}`}
                  style={
                    isLordsPrayerText ? styles.lordsPrayerBlock : undefined
                  }
                >
                  <NodeView node={renderedNode} />
                </View>
              );
            })}
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
  psalmBlock: {
    marginTop: 10,
    marginBottom: 12,
  },
  psalmTitle: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 18,
    lineHeight: 30,
    color: "var(--text-secondary)",
    marginBottom: 2,
  },
  psalmSource: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 4,
  },
  lessonBlock: {
    marginTop: 16,
    marginBottom: 12,
  },
  text: {
    fontFamily: SERIF_FONT,
    fontSize: 18,
    lineHeight: 30,
    color: "var(--text)",
    marginTop: 4,
  },
  speaker: {
    fontFamily: SERIF_FONT,
    fontWeight: "600",
    fontSize: 15,
    color: "var(--accent)",
  },
  textPeople: {
    fontWeight: "700",
  },
  citation: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 18,
    color: "var(--text-secondary)",
  },
  controlRow: {
    position: "relative",
    zIndex: 100,
    isolation: "isolate",
    marginTop: 8,
    marginBottom: 12,
  },
  lordsPrayerBlock: {
    marginBottom: 16,
  },
  psalmPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
    marginBottom: 12,
  },
  psalmToggle: {
    borderWidth: 1,
    borderColor: "var(--border)",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "var(--surface)",
  },
  psalmToggleOn: {
    backgroundColor: "var(--accent)",
    borderColor: "var(--accent)",
  },
  psalmToggleText: {
    fontFamily: SERIF_FONT,
    fontSize: 13,
    color: "var(--text)",
  },
  psalmToggleTextOn: {
    color: "var(--bg)",
  },
  rubric: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 18,
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
    fontSize: 18,
    color: "var(--text-secondary)",
    marginTop: 4,
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
