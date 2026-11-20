import { useState } from "react";
import { Text, View } from "react-native";
import type {
  Bcp1962ComposedOffice,
  Bcp1962OfficeNode,
} from "../../lib/content/bcp1962";
import { ALL_SCRIPTURE_BOOKS } from "../../lib/content/bible";
import { getBookMeta } from "../../lib/content/scripture";
import { SERIF_FONT, SERIF_ITALIC_FONT } from "../../lib/fonts";
import type { LessonSlot } from "../../lib/office/types";
import {
  defineThemedStyles,
  useThemedStyles,
} from "../../lib/theme/themedStyles";
import { useSectionHeading, useSubheading } from "./contentHeadings";
import {
  ChoiceMenu,
  type ControlOption,
  MenuAnchor,
  Segmented,
} from "./OfficeControls";
import { OFFICE_EDITION_LABELS, OfficeHeader } from "./OfficeHeader";
import { ReadingsControl } from "./OfficeView.controls";
import { truncate } from "./OfficeView.shared";
import { officeDocumentStyles } from "./officeDocumentStyles";
import { PsalmText } from "./PsalmText";
import { ScriptureText } from "./ScriptureText";
import { ScriptureView } from "./ScriptureView";

const SPEAKERS: Record<string, string> = {
  minister: "Minister",
  priest: "Priest",
  people: "People",
  answer: "Answer",
  all: "All",
};

type CanticleNode = Extract<Bcp1962OfficeNode, { kind: "canticle" }>;
type PsalmNode = Extract<Bcp1962OfficeNode, { kind: "psalm" }>;
type CreedNode = Extract<Bcp1962OfficeNode, { kind: "creed" }>;
type OccasionalNode = Extract<Bcp1962OfficeNode, { kind: "occasional" }>;
type SentenceNode = Extract<Bcp1962OfficeNode, { kind: "text" }> & {
  group: string;
};
type ChoiceNode = Extract<Bcp1962OfficeNode, { kind: "text" }> & {
  choiceGroup: string;
  choiceId: string;
  choiceLabel: string;
};

const CHOICE_LABELS: Record<string, string> = {
  "compline-reading": "Short Lesson",
  "compline-collect": "Collect",
};

// the book allows one optional prayer or thanksgiving after the collects
const OPTIONAL_PRAYERS = new Set(["all-conditions", "general-thanksgiving"]);

const GOSPELS = new Set(["Matt", "Mark", "Luke", "John"]);
const NEW_TESTAMENT = new Set([
  "Matt",
  "Mark",
  "Luke",
  "John",
  "Acts",
  "Rom",
  "1 Cor",
  "2 Cor",
  "Gal",
  "Eph",
  "Phil",
  "Col",
  "1 Thess",
  "2 Thess",
  "1 Tim",
  "2 Tim",
  "Titus",
  "Phlm",
  "Heb",
  "Jas",
  "1 Pet",
  "2 Pet",
  "1 John",
  "2 John",
  "3 John",
  "Jude",
  "Rev",
]);

// the office appoints two lessons, but their kind varies by day
function lessonKind(ref?: string): "OT" | "NT" | "Gospel" {
  const key = (ref ?? "")
    .trim()
    .match(/^([A-Za-z][A-Za-z .]*?)\s+(?=\d)/)?.[1]
    ?.trim()
    .replace(/\.$/, "")
    .replace(/^((?:[123]\s+)?)(?:St\.?\s+|Saint\s+)/i, "$1")
    .trim();
  const book = key ? getBookMeta(ALL_SCRIPTURE_BOOKS, key)?.abbrev : undefined;
  if (!book) return "OT";
  if (GOSPELS.has(book)) return "Gospel";
  return NEW_TESTAMENT.has(book) ? "NT" : "OT";
}

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
  const sectionHeading = useSectionHeading();
  const subheading = useSubheading();
  switch (node.kind) {
    case "heading":
      if (
        node.rule ||
        node.text === "Suffrages" ||
        node.text === "Confession of Sin"
      ) {
        return <Text style={sectionHeading}>{node.text}</Text>;
      }
      if (node.scripture) {
        return (
          <Text style={styles.verse}>
            {node.text}
            {node.citation ? (
              <Text style={styles.rubric}> {node.citation}</Text>
            ) : null}
          </Text>
        );
      }
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
            node.collect && styles.collectText,
            node.anthem && styles.anthemText,
            node.anthem && styles.rubric,
            node.choiceGroup === "compline-reading" && styles.readingText,
            node.lordsPrayerFirst && styles.lordsPrayerStart,
            node.lordsPrayerLast && styles.lordsPrayerEnd,
            showSpeakers && node.speaker === "people" && styles.textPeople,
          ]}
        >
          {label ? <Text style={styles.speaker}>{label} </Text> : null}
          {node.seasonLabel ? (
            <Text style={styles.rubric}>{node.seasonLabel} </Text>
          ) : null}
          {node.text}
          {node.citation ? (
            <Text style={styles.rubric}> {node.citation}</Text>
          ) : null}
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
          <Text style={[subheading, styles.canticleTitle]}>{node.title}</Text>
          {node.text.split(/\n|(?<=[;.:])\s+(?=[A-Z])/).map((line, i) => (
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
          <Text style={[subheading, styles.creedTitle]}>{node.title}</Text>
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
  const subheading = useSubheading();
  const [openingSelection, setOpeningSelection] = useState("suggested");
  const [choiceSelections, setChoiceSelections] = useState<
    Record<string, string>
  >({});
  const [lessonSelection, setLessonSelection] = useState("suggested");
  const [psalmSelection, setPsalmSelection] = useState("suggested");
  const [prayerSelection, setPrayerSelection] = useState(
    "general-thanksgiving",
  );
  const [canticleFirst, setCanticleFirst] = useState("suggested");
  const [canticleSecond, setCanticleSecond] = useState("suggested");
  const [creedOverride, setCreedOverride] = useState<
    "apostles" | "athanasian" | null
  >(null);

  const complinePsalmNode =
    doc.office === "compline"
      ? doc.sections
          .flatMap((s) => s.nodes)
          .find((n): n is PsalmNode => n.kind === "psalm")
      : undefined;
  const psalmOptions: ControlOption[] = [
    { id: "suggested", label: "All psalms", group: "Suggested" },
    ...(complinePsalmNode?.refs ?? []).map((ref) => ({
      id: ref,
      label: `Psalm ${ref}`,
      group: "Psalms",
    })),
  ];

  const choiceNodes = doc.sections
    .flatMap((s) => s.nodes)
    .filter(
      (n): n is ChoiceNode => n.kind === "text" && n.choiceGroup !== undefined,
    );
  const choicesFor = (group: string) =>
    choiceNodes.filter((n) => n.choiceGroup === group);
  const choiceValue = (group: string) =>
    choiceSelections[group] ?? choicesFor(group)[0]?.choiceId ?? "";

  const canticleNodes =
    doc.sections
      .find((s) => s.key === "lessons")
      ?.nodes.filter((n): n is CanticleNode => n.kind === "canticle") ?? [];
  const creedNodes =
    doc.sections
      .find((s) => s.key === "creed")
      ?.nodes.filter((n): n is CreedNode => n.kind === "creed") ?? [];
  const creedSuggested = creedNodes.find((n) => n.suggested)?.id ?? "apostles";
  const creedId = creedOverride ?? creedSuggested;

  const lessonNodes =
    doc.sections
      .find((s) => s.key === "lessons")
      ?.nodes.filter(
        (n): n is Extract<Bcp1962OfficeNode, { kind: "lesson" }> =>
          n.kind === "lesson",
      ) ?? [];
  const readingSlots: LessonSlot[] = lessonNodes.map((n) => ({
    key: n.slot,
    label: n.label,
    desc: lessonKind(n.ref ?? n.normalized),
  }));
  const readingAll =
    lessonSelection === "suggested" || lessonSelection === "both";
  const readingSlot =
    lessonSelection === "1"
      ? "first"
      : lessonSelection === "2"
        ? "second"
        : null;

  const closingNodes =
    doc.sections.find((s) => s.key === "closing")?.nodes ?? [];
  const optionalPrayers = closingNodes.filter(
    (n): n is OccasionalNode =>
      n.kind === "occasional" && OPTIONAL_PRAYERS.has(n.id),
  );
  const prayerOptions: ControlOption[] = [
    { id: "none", label: "None", group: "Other" },
    ...optionalPrayers.map((n) => ({
      id: n.id,
      label: n.title,
      group: n.id === "general-thanksgiving" ? "Thanksgivings" : "Prayers",
    })),
  ];
  // anchor the control to a node that survives the filter in every state
  const prayerControlId =
    (prayerSelection !== "none" ? prayerSelection : null) ??
    closingNodes.find(
      (n): n is OccasionalNode =>
        n.kind === "occasional" && n.id === "chrysostom",
    )?.id;

  const sentenceNodes =
    doc.sections
      .find((s) => s.key === "opening")
      ?.nodes.filter(
        (n): n is SentenceNode => n.kind === "text" && n.group !== undefined,
      ) ?? [];
  const suggestedSentence = sentenceNodes.find((n) => n.suggested);
  const sentenceLabel = (n: SentenceNode) =>
    truncate([n.seasonLabel, n.text, n.citation].filter(Boolean).join(" "), 64);
  const openingOptions: ControlOption[] = [
    {
      id: "suggested",
      label: suggestedSentence
        ? truncate(sentenceLabel(suggestedSentence), 52)
        : "Suggested",
      group: "Suggested",
    },
    ...sentenceNodes.map((n) => ({
      id: n.text,
      label: sentenceLabel(n),
      group: n.group,
    })),
    { id: "all", label: "All sentences", group: "Other" },
  ];

  const canticleOptions = (slot: CanticleNode["slot"]) => {
    const inSlot = canticleNodes.filter((n) => n.slot === slot);
    const suggested = inSlot.find((n) => n.suggested);
    return [
      ...(suggested
        ? [{ id: "suggested", label: suggested.title, group: "Suggested" }]
        : []),
      ...inSlot.map((n) => ({ id: n.id, label: n.title, group: "Canticles" })),
    ];
  };
  const canticleControl = (slot: CanticleNode["slot"]) => {
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

  return (
    <View>
      <OfficeHeader
        officeName={doc.officeName}
        date={doc.date}
        title={doc.title}
        editionLabel={OFFICE_EDITION_LABELS["1962"]}
        titleBelowEdition
      />
      {doc.sections.map((section) => (
        <MenuAnchor key={section.key} style={styles.section}>
          {section.key === "lessons" && section.heading ? (
            <MenuAnchor style={styles.headingRow}>
              <Text style={[sectionHeading, styles.headingText]}>
                {section.heading}
              </Text>
              <ReadingsControl
                choices={{ lessonSlots: readingSlots }}
                value={lessonSelection}
                onChange={setLessonSelection}
              />
            </MenuAnchor>
          ) : section.key === "creed" && creedNodes.length > 1 ? (
            <MenuAnchor style={styles.headingRow}>
              <Text style={[sectionHeading, styles.headingText]}>
                {section.heading ?? "The Creed"}
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
          ) : section.heading ? (
            <Text style={sectionHeading}>{section.heading}</Text>
          ) : null}
          {section.key === "opening" && sentenceNodes.length > 0 ? (
            <MenuAnchor style={styles.controlRow}>
              <ChoiceMenu
                value={openingSelection}
                options={openingOptions}
                label="Opening Sentence"
                accessibilityLabel="Opening Sentence"
                fullWidth
                onChange={setOpeningSelection}
              />
            </MenuAnchor>
          ) : null}
          {section.nodes
            .filter((node) => {
              if (
                section.key === "opening" &&
                node.kind === "text" &&
                node.group !== undefined
              ) {
                if (openingSelection === "all") return true;
                return openingSelection === "suggested"
                  ? node.suggested === true
                  : node.text === openingSelection;
              }
              if (
                node.kind === "text" &&
                node.choiceGroup !== undefined &&
                node.choiceId !== choiceValue(node.choiceGroup)
              ) {
                return false;
              }
              if (node.kind === "lesson") {
                if (readingAll) return true;
                return node.slot === readingSlot;
              }
              if (node.kind === "canticle") {
                if (!readingAll && node.slot !== readingSlot) {
                  return false;
                }
                const selection =
                  node.slot === "first" ? canticleFirst : canticleSecond;
                return selection === "suggested"
                  ? node.suggested
                  : node.id === selection;
              }
              if (node.kind === "creed") return node.id === creedId;
              if (node.kind === "occasional" && OPTIONAL_PRAYERS.has(node.id)) {
                return node.id === prayerSelection;
              }
              return true;
            })
            .map((node, i) => (
              <MenuAnchor
                // biome-ignore lint/suspicious/noArrayIndexKey: composed office content
                key={`${section.key}-${node.kind}-${i}`}
              >
                {node.kind === "canticle" && doc.office !== "compline"
                  ? canticleControl(node.slot)
                  : null}
                {node.kind === "text" && node.choiceGroup !== undefined ? (
                  <>
                    <MenuAnchor style={styles.controlRow}>
                      <ChoiceMenu
                        value={choiceValue(node.choiceGroup)}
                        options={choicesFor(node.choiceGroup).map((n) => ({
                          id: n.choiceId,
                          label: n.choiceLabel,
                          group: "Options",
                        }))}
                        label={CHOICE_LABELS[node.choiceGroup] ?? "Options"}
                        accessibilityLabel={
                          CHOICE_LABELS[node.choiceGroup] ?? "Options"
                        }
                        fullWidth
                        onChange={(id) =>
                          setChoiceSelections((prev) => ({
                            ...prev,
                            [node.choiceGroup ?? ""]: id,
                          }))
                        }
                      />
                    </MenuAnchor>
                    {node.choiceGroup !== "compline-reading" ? (
                      <Text style={subheading}>{node.choiceLabel}</Text>
                    ) : null}
                  </>
                ) : null}
                {section.key === "closing" &&
                node.kind === "occasional" &&
                node.id === prayerControlId ? (
                  <MenuAnchor style={styles.controlRow}>
                    <ChoiceMenu
                      value={prayerSelection}
                      options={prayerOptions}
                      label="Prayers and Thanksgivings"
                      accessibilityLabel="Prayers and Thanksgivings"
                      fullWidth
                      onChange={setPrayerSelection}
                    />
                  </MenuAnchor>
                ) : null}
                {node.kind === "psalm" && psalmOptions.length > 1 ? (
                  <MenuAnchor style={styles.controlRow}>
                    <ChoiceMenu
                      value={psalmSelection}
                      options={psalmOptions}
                      label="Psalms"
                      accessibilityLabel="Psalms"
                      fullWidth
                      onChange={setPsalmSelection}
                    />
                  </MenuAnchor>
                ) : null}
                {node.kind === "text" &&
                node.choiceGroup === "compline-reading" ? (
                  <ScriptureText text={node.text} citation={node.choiceLabel} />
                ) : (
                  <NodeView
                    node={
                      node.kind === "psalm" && psalmSelection !== "suggested"
                        ? {
                            ...node,
                            refs: node.refs.filter((r) => r === psalmSelection),
                            passages: node.passages.filter(
                              (p) => p.ref === psalmSelection,
                            ),
                          }
                        : node
                    }
                    showRubrics={showRubrics}
                    showSpeakers={showSpeakers}
                  />
                )}
              </MenuAnchor>
            ))}
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

const bcp1962Styles = defineThemedStyles({
  section: {
    ...officeDocumentStyles.section,
    position: "relative",
    zIndex: 2,
  },
  headingRow: { ...officeDocumentStyles.headingRow, position: "relative" },
  headingText: officeDocumentStyles.headingText,
  controlRow: { position: "relative", marginTop: 8, marginBottom: 12 },
  canticleControl: {
    position: "relative",
    alignSelf: "flex-end",
    marginTop: 8,
    marginBottom: 4,
  },
  block: { marginBottom: 8 },
  psalmBlock: { marginTop: 22, paddingLeft: 4 },
  lessonBlock: { marginBottom: 12 },
  canticleTitle: { marginBottom: 6 },
  verse: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 17,
    lineHeight: 28,
    color: "var(--text)",
    marginTop: 12,
    marginBottom: 4,
  },
  creedTitle: { marginTop: 0 },
  accent: officeDocumentStyles.accent,
  label: { fontFamily: SERIF_FONT, fontSize: 15, color: "var(--text)" },
  psalmTitle: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 15,
    color: "var(--text-secondary)",
    marginBottom: 6,
  },
  lessonRef: { ...officeDocumentStyles.lessonRef, marginBottom: 4 },
  rubric: officeDocumentStyles.rubric,
  text: { ...officeDocumentStyles.text, marginTop: 8 },
  collectText: {
    ...officeDocumentStyles.text,
    fontSize: 17,
    lineHeight: 28,
    paddingLeft: 4,
  },
  readingText: { paddingLeft: 4 },
  anthemText: { marginTop: 8, marginBottom: 8 },
  lordsPrayerStart: { marginTop: 4 },
  lordsPrayerEnd: { marginBottom: 8 },
  textPeople: officeDocumentStyles.textPeople,
  speaker: officeDocumentStyles.speaker,
  notes: officeDocumentStyles.notes,
  noteText: officeDocumentStyles.noteText,
});
