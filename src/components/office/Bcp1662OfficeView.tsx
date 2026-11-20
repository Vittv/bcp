import { Fragment, useState } from "react";
import { Text, View } from "react-native";
import type {
  Bcp1662ComposedOffice,
  Bcp1662OfficeNode,
} from "../../lib/content/bcp1662";
import { BCP1662_OFFICE_TEXT } from "../../lib/content/vendor/bcp1662";
import { SERIF_FONT, SERIF_ITALIC_FONT } from "../../lib/fonts";
import {
  defineThemedStyles,
  useThemedStyles,
} from "../../lib/theme/themedStyles";
import { useSectionHeading, useSubheading } from "./contentHeadings";
import { ChoiceMenu, MenuAnchor, Segmented } from "./OfficeControls";
import { OFFICE_EDITION_LABELS, OfficeHeader } from "./OfficeHeader";
import { officeViewStyles } from "./OfficeView.styles";
import { officeDocumentStyles } from "./officeDocumentStyles";
import { PsalmText } from "./PsalmText";
import { ScriptureView } from "./ScriptureView";
import { StickyHeading } from "./StickyHeading";

function NodeView({
  node,
  showRubrics,
  showSpeakers,
  collect,
  sticky = false,
}: {
  node: Bcp1662OfficeNode;
  showRubrics: boolean;
  showSpeakers: boolean;
  collect?: boolean;
  sticky?: boolean;
}) {
  const styles = useThemedStyles(bcp1662Styles);
  const sectionHeading = useSectionHeading();
  const subheading = useSubheading();
  switch (node.kind) {
    case "heading":
      if (node.text === "Suffrages" || node.text === "Confession of Sin") {
        return (
          <View style={sticky && officeViewStyles.stickyHeader}>
            <Text style={sectionHeading}>{node.text}</Text>
          </View>
        );
      }
      return <Text style={subheading}>{node.text}</Text>;
    case "rubric":
      if (!showRubrics) return null;
      return <Text style={styles.rubric}>{node.text}</Text>;
    case "text": {
      const speakerLabel = showSpeakers
        ? node.speaker === "minister" || node.speaker === "priest"
          ? "Minister"
          : node.speaker === "people"
            ? "People"
            : node.speaker === "all"
              ? "All"
              : node.speaker === "answer"
                ? "Answer"
                : null
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
                collect ? styles.collectText : styles.text,
                showSpeakers && node.speaker === "people" && styles.textPeople,
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
    case "occasional":
      return (
        <View style={styles.occasionalBlock}>
          <Text style={[subheading, styles.occasionalTitle]}>{node.title}</Text>
          <Text style={styles.text}>{node.text}</Text>
        </View>
      );
    case "creed":
      return (
        <View style={styles.lessonBlock}>
          {node.rubric ? (
            <Text style={styles.rubric}>{node.rubric}</Text>
          ) : null}
          {node.text
            .split(/(?=I believe in the Holy Ghost;)/)
            .map((line, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed liturgical text
              <Text key={i} style={styles.text}>
                {line.trim()}
              </Text>
            ))}
        </View>
      );
    case "canticle":
      return (
        <View style={styles.canticleBlock}>
          {node.rubric ? (
            <Text style={styles.rubric}>{node.rubric}</Text>
          ) : null}
          <Text style={[subheading, styles.canticleTitle]}>{node.title}</Text>
          <Text style={styles.text}>{node.text}</Text>
        </View>
      );
    case "placeholder":
      return <Text style={styles.placeholder}>{node.text}</Text>;
  }
}

export function Bcp1662OfficeView({
  doc,
  showRubrics = true,
  showSpeakers = true,
}: {
  doc: Bcp1662ComposedOffice;
  showRubrics?: boolean;
  showSpeakers?: boolean;
}) {
  const styles = useThemedStyles(bcp1662Styles);
  const sectionHeading = useSectionHeading();
  const suffragesIndex = doc.sections.findIndex((s) =>
    s.nodes.some((n) => n.kind === "heading" && n.text === "Suffrages"),
  );
  const isSticky = (key: string) => {
    const index = doc.sections.findIndex((s) => s.key === key);
    return suffragesIndex < 0 || index < suffragesIndex;
  };
  const suffragesNodeIndex =
    suffragesIndex >= 0
      ? doc.sections[suffragesIndex].nodes.findIndex(
          (n) => n.kind === "heading" && n.text === "Suffrages",
        )
      : -1;
  const nodeIsSticky = (sectionIndex: number, nodeIndex: number) =>
    suffragesIndex < 0 ||
    sectionIndex < suffragesIndex ||
    (sectionIndex === suffragesIndex && nodeIndex < suffragesNodeIndex);
  const sentences = BCP1662_OFFICE_TEXT.common.openingSentences ?? [];
  const suggested = sentences[0]?.text ?? "";
  const [openingSelection, setOpeningSelection] = useState<string>("suggested");
  const psalmNode = doc.sections
    .find((s) => s.key === "psalms")
    ?.nodes.find((n) => n.kind === "psalm");
  const psalmRefs = psalmNode?.kind === "psalm" ? psalmNode.refs : [];
  const [psalmSelection, setPsalmSelection] = useState<string>("suggested");
  const [lessonSelection, setLessonSelection] = useState<string>("suggested");
  const [canticleFirst, setCanticleFirst] = useState("suggested");
  const [canticleSecond, setCanticleSecond] = useState("suggested");
  const [creedOverride, setCreedOverride] = useState<
    "apostles" | "athanasian" | null
  >(null);
  const [occasionalSelection, setOccasionalSelection] = useState("none");
  const occasionalNodes =
    doc.sections
      .find((s) => s.key === "closing")
      ?.nodes.filter(
        (n): n is Extract<Bcp1662OfficeNode, { kind: "occasional" }> =>
          n.kind === "occasional",
      ) ?? [];
  const occasionalOptions = [
    {
      id: "none",
      label: "Prayers and Thanksgivings: None",
      menuLabel: "None",
      group: "Other",
    },
    ...occasionalNodes.map((n) => ({
      id: n.id,
      label: `Prayers and Thanksgivings: ${n.title}`,
      menuLabel: n.title,
      group: n.group,
    })),
  ];
  const occasionalShown = occasionalNodes.some(
    (n) => n.id === occasionalSelection,
  );
  const occasionalControl = () => (
    <MenuAnchor style={styles.controlRow}>
      <ChoiceMenu
        value={occasionalSelection}
        options={occasionalOptions}
        label="Prayers and Thanksgivings"
        accessibilityLabel="Prayers and Thanksgivings"
        fullWidth
        onChange={setOccasionalSelection}
      />
    </MenuAnchor>
  );
  const creedNodes =
    doc.sections
      .find((s) => s.key === "creed")
      ?.nodes.filter(
        (n): n is Extract<Bcp1662OfficeNode, { kind: "creed" }> =>
          n.kind === "creed",
      ) ?? [];
  const creedSuggested = creedNodes.find((n) => n.suggested)?.id ?? "apostles";
  const creedId = creedOverride ?? creedSuggested;
  const creedTitle =
    creedNodes.find((n) => n.id === creedId)?.title ?? "The Apostles' Creed";
  const canticleNodes =
    doc.sections
      .find((s) => s.key === "lessons")
      ?.nodes.filter(
        (n): n is Extract<Bcp1662OfficeNode, { kind: "canticle" }> =>
          n.kind === "canticle",
      ) ?? [];
  const canticleOptions = (slot: "first" | "second") => {
    const inSlot = canticleNodes.filter((n) => n.slot === slot);
    const suggested = inSlot.find((n) => n.suggested);
    return [
      ...(suggested
        ? [{ id: "suggested", label: suggested.title, group: "Suggested" }]
        : []),
      ...inSlot.map((n) => ({ id: n.id, label: n.title, group: "Canticles" })),
    ];
  };
  const canticleControl = (slot: "first" | "second") => {
    const label =
      slot === "first"
        ? "Canticle after the First Lesson"
        : "Canticle after the Second Lesson";
    return (
      <MenuAnchor style={styles.canticleControl}>
        <ChoiceMenu
          value={slot === "first" ? canticleFirst : canticleSecond}
          options={canticleOptions(slot)}
          label={label}
          accessibilityLabel={label}
          onChange={slot === "first" ? setCanticleFirst : setCanticleSecond}
        />
      </MenuAnchor>
    );
  };
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
      <OfficeHeader
        officeName={doc.officeName}
        date={doc.date}
        title={doc.title}
        editionLabel={OFFICE_EDITION_LABELS["1662"]}
      />
      {doc.sections.map((section, sectionIndex) => (
        <MenuAnchor key={section.key} style={styles.section}>
          {section.key === "psalms" && psalmRefs.length > 0 ? (
            <StickyHeading sticky={isSticky(section.key)} withControl>
              <MenuAnchor style={styles.headingRow}>
                <Text style={[sectionHeading, styles.headingText]}>
                  {section.heading}
                </Text>
                <ChoiceMenu
                  value={psalmSelection}
                  options={[
                    {
                      id: "suggested",
                      label: "All psalms",
                      group: "Suggested",
                    },
                    ...psalmRefs.map((ref) => ({
                      id: ref,
                      label: ref,
                      group: "Psalms",
                    })),
                  ]}
                  label="Psalms"
                  accessibilityLabel="Psalms"
                  onChange={setPsalmSelection}
                />
              </MenuAnchor>
            </StickyHeading>
          ) : section.key === "lessons" ? (
            <StickyHeading sticky={isSticky(section.key)} withControl>
              <MenuAnchor style={styles.headingRow}>
                <Text style={[sectionHeading, styles.headingText]}>
                  {section.heading}
                </Text>
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
                  onChange={setLessonSelection}
                />
              </MenuAnchor>
            </StickyHeading>
          ) : section.key === "creed" && creedNodes.length > 1 ? (
            <StickyHeading sticky={isSticky(section.key)} withControl>
              <MenuAnchor style={styles.headingRow}>
                <Text style={[sectionHeading, styles.headingText]}>
                  {creedTitle}
                </Text>
                <Segmented
                  value={creedId}
                  options={[
                    { id: "apostles", label: "Apostles" },
                    { id: "athanasian", label: "Athanasian" },
                  ]}
                  accessibilityLabel="Creed"
                  onChange={(id) =>
                    setCreedOverride(
                      id === "athanasian" ? "athanasian" : "apostles",
                    )
                  }
                />
              </MenuAnchor>
            </StickyHeading>
          ) : section.heading ? (
            <StickyHeading sticky={isSticky(section.key)}>
              <Text style={sectionHeading}>{section.heading}</Text>
            </StickyHeading>
          ) : null}
          {section.key === "opening" && sentences.length > 0 ? (
            <MenuAnchor style={styles.controlRow}>
              <ChoiceMenu
                value={openingSelection}
                options={options}
                label="Opening Sentence"
                accessibilityLabel="Opening Sentence"
                fullWidth
                onChange={setOpeningSelection}
              />
            </MenuAnchor>
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
              if (node.kind === "canticle") {
                if (
                  lessonSelection !== "suggested" &&
                  node.slot !== lessonSelection
                ) {
                  return false;
                }
                const selection =
                  node.slot === "first" ? canticleFirst : canticleSecond;
                return selection === "suggested"
                  ? node.suggested
                  : node.id === selection;
              }
              if (node.kind === "creed") return node.id === creedId;
              if (node.kind === "occasional") {
                return node.id === occasionalSelection;
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
              const prev = section.nodes[i - 1];
              const isLordsPrayerText =
                node.kind === "text" &&
                i > 0 &&
                prev?.kind === "heading" &&
                prev.text === "The Lord's Prayer";
              // a sticky heading must be a direct child of the tall section:
              // a per-node anchor is only as tall as the heading and would
              // leave position:sticky no room to pin
              const key = `${section.key}-${node.kind}-${i}`;
              const content = (
                <>
                  {node.kind === "canticle" ? canticleControl(node.slot) : null}
                  {node.kind === "occasional" ||
                  (!occasionalShown &&
                    occasionalNodes.length > 0 &&
                    section.key === "closing" &&
                    node.kind === "heading" &&
                    node.text === "A Prayer of St. Chrysostom")
                    ? occasionalControl()
                    : null}
                  <NodeView
                    node={renderedNode}
                    showRubrics={showRubrics}
                    showSpeakers={showSpeakers}
                    collect={section.key === "collects"}
                    sticky={nodeIsSticky(sectionIndex, i)}
                  />
                </>
              );
              return nodeIsSticky(sectionIndex, i) ? (
                <Fragment key={key}>{content}</Fragment>
              ) : (
                <MenuAnchor
                  key={key}
                  style={
                    isLordsPrayerText ? styles.lordsPrayerBlock : undefined
                  }
                >
                  {content}
                </MenuAnchor>
              );
            })}
        </MenuAnchor>
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
  section: officeDocumentStyles.section,
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
    fontSize: 16,
    lineHeight: 24,
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
  text: { ...officeDocumentStyles.text, marginTop: 4 },
  // collects read a step smaller and indented, as in the 1979 office
  collectText: {
    fontFamily: SERIF_FONT,
    fontSize: 17,
    lineHeight: 28,
    color: "var(--text)",
    marginTop: 4,
    paddingLeft: 4,
  },
  speaker: officeDocumentStyles.speaker,
  textPeople: officeDocumentStyles.textPeople,
  citation: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 18,
    color: "var(--text-secondary)",
  },
  headingRow: { ...officeDocumentStyles.headingRow, position: "relative" },
  headingText: officeDocumentStyles.headingText,
  controlRow: {
    position: "relative",
    marginTop: 8,
    marginBottom: 12,
  },
  canticleControl: {
    position: "relative",
    alignSelf: "flex-end",
    marginTop: 8,
    marginBottom: 4,
  },
  canticleBlock: {
    marginTop: 4,
    marginBottom: 12,
  },
  canticleTitle: {
    marginTop: 4,
  },
  occasionalBlock: {
    marginTop: 4,
    marginBottom: 12,
  },
  occasionalTitle: {
    marginTop: 2,
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
  rubric: officeDocumentStyles.rubric,
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
    ...officeDocumentStyles.lessonRef,
    marginTop: 4,
    marginBottom: 4,
  },
  accent: officeDocumentStyles.accent,
  notes: officeDocumentStyles.notes,
  noteText: officeDocumentStyles.noteText,
});
