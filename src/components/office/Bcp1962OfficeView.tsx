import { Fragment, useState } from "react";
import { Text, View } from "react-native";
import type {
  Bcp1962ComposedOffice,
  Bcp1962ComposedSection,
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
import { allPsalmsLabel, truncate } from "./OfficeView.shared";
import { officeDocumentStyles } from "./officeDocumentStyles";
import { PsalmText } from "./PsalmText";
import { ScriptureText } from "./ScriptureText";
import { ScriptureView } from "./ScriptureView";
import { StickyHeading } from "./StickyHeading";

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
type MenuKey = NonNullable<
  Extract<Bcp1962OfficeNode, { kind: "section-heading" }>["menu"]
>;
type MenuSet = {
  options: ControlOption[];
  value: string;
  onChange: (id: string) => void;
  label: string;
  /** compline's two collects are a printed either/or, shown as chips */
  segmented?: boolean;
};
type MenuSets = Partial<Record<MenuKey, MenuSet>>;

const CHOICE_LABELS: Record<string, string> = {
  absolution: "Absolution",
  "compline-reading": "The Reading",
  "midday-prayer": "Additional Prayers",
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
  sticky = false,
  menus,
  fullText,
}: {
  node: Bcp1962OfficeNode;
  showRubrics: boolean;
  showSpeakers: boolean;
  sticky?: boolean;
  menus: MenuSets;
  fullText: boolean;
}) {
  const styles = useThemedStyles(bcp1962Styles);
  const sectionHeading = useSectionHeading();
  const subheading = useSubheading();
  switch (node.kind) {
    case "heading":
      if (node.rule) {
        return (
          <StickyHeading sticky={sticky}>
            <Text style={sectionHeading}>{node.text}</Text>
          </StickyHeading>
        );
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
    case "section-heading": {
      const menu = node.menu ? menus[node.menu] : undefined;
      const withPicker =
        menu !== undefined && menu.options.length > 1 && !fullText;
      return (
        <StickyHeading sticky={sticky} withControl={withPicker}>
          {withPicker && menu ? (
            menu.segmented ? (
              <View>
                <Text style={sectionHeading}>{node.text}</Text>
                <MenuAnchor style={styles.segmentedRow}>
                  <Segmented
                    value={menu.value}
                    options={menu.options.map((option) => ({
                      id: option.id,
                      label: option.label,
                    }))}
                    accessibilityLabel={menu.label}
                    onChange={menu.onChange}
                  />
                </MenuAnchor>
              </View>
            ) : (
              <MenuAnchor style={styles.headingRow}>
                <Text style={[sectionHeading, styles.headingText]}>
                  {node.text}
                </Text>
                <ChoiceMenu
                  value={menu.value}
                  options={menu.options}
                  label={menu.label}
                  accessibilityLabel={menu.label}
                  onChange={menu.onChange}
                />
              </MenuAnchor>
            )
          ) : (
            <Text style={sectionHeading}>{node.text}</Text>
          )}
        </StickyHeading>
      );
    }
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
            node.choiceGroup === "compline-reading" && styles.readingText,
            node.lordsPrayerFirst && styles.lordsPrayerStart,
            node.lordsPrayerLast && styles.lordsPrayerEnd,
            showSpeakers &&
              (node.speaker === "people" || node.speaker === "all") &&
              styles.textPeople,
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
          {node.rubric && showRubrics ? (
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
  fullText = false,
}: {
  doc: Bcp1962ComposedOffice;
  showRubrics?: boolean;
  showSpeakers?: boolean;
  fullText?: boolean;
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
  const familyCollectDefault = doc.sections
    .flatMap((s) => s.nodes)
    .some(
      (n) =>
        n.kind === "text" &&
        n.choiceGroup === "family-collect" &&
        n.choiceId === "proper",
    )
    ? "proper"
    : "none";
  const [familyCollect, setFamilyCollect] = useState(familyCollectDefault);
  const [middayPrayer, setMiddayPrayer] = useState("none");
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
  const officePsalmNode =
    doc.sections
      .find((s) => s.key === "psalms")
      ?.nodes.find((n): n is PsalmNode => n.kind === "psalm") ?? undefined;
  const psalmRefs = (officePsalmNode ?? complinePsalmNode)?.refs ?? [];
  const psalmOptions: ControlOption[] = [
    {
      id: "suggested",
      label: allPsalmsLabel(psalmRefs.length),
      group: "Suggested",
    },
    ...psalmRefs.map((ref) => ({
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
    group === "family-collect"
      ? familyCollect
      : (choiceSelections[group] ?? choicesFor(group)[0]?.choiceId ?? "");
  const familyCollectOptions: ControlOption[] = [
    { id: "none", label: "None", group: "Other" },
    ...choicesFor("family-collect").map((n) => ({
      id: n.choiceId,
      label: n.choiceLabel,
      group: "Collects",
    })),
  ];
  const middayPrayerOptions: ControlOption[] = [
    { id: "none", label: "None", group: "Other" },
    ...choicesFor("midday-prayer").map((n) => ({
      id: n.choiceId,
      label: n.choiceLabel,
      group: n.choiceId.startsWith("morning") ? "Collects" : "Prayers",
    })),
  ];

  // the collect menu sits in its rule instead of a full-width row
  const collectOptions: ControlOption[] = choicesFor("collect").map((n) => ({
    id: n.choiceId,
    label: n.choiceLabel,
    group: n.choiceId === "suggested" ? "Suggested" : "Appointed",
  }));
  const collectSelection = choiceValue("collect");
  const setCollectSelection = (id: string) =>
    setChoiceSelections((prev) => ({ ...prev, collect: id }));

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
  const creedTitle =
    creedNodes.find((n) => n.id === creedId)?.title ??
    doc.sections.find((s) => s.key === "creed")?.heading ??
    "The Apostles' Creed";

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
  // the picker emits one digit per printed position and pairs such as "12"
  // for both; a two-position choice keeps both lessons rather than nothing
  const readingDigits = new Set(
    [...lessonSelection]
      .map((digit) => Number(digit))
      .filter((number) => number === 1 || number === 2),
  );
  const readingAll =
    lessonSelection === "suggested" ||
    readingDigits.size === 0 ||
    (readingDigits.has(1) && readingDigits.has(2));
  const keepsLesson = (slot: "first" | "second") =>
    readingDigits.has(slot === "first" ? 1 : 2);

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
  const prayerControlId =
    (prayerSelection !== "none" ? prayerSelection : null) ??
    closingNodes.find(
      (n): n is OccasionalNode =>
        n.kind === "occasional" && n.id === "chrysostom",
    )?.id;

  // the book offers one of the sovereign's prayers; the rest stay in the
  // document so full text can print them all
  const missionNodes = doc.sections
    .flatMap((s) => s.nodes)
    .filter(
      (
        n,
      ): n is OccasionalNode & {
        choiceGroup: string;
        choiceId: string;
        choiceLabel?: string;
      } => n.kind === "occasional" && n.choiceGroup === "mission",
    );
  const missionOptions: ControlOption[] = missionNodes.map((n) => ({
    id: n.choiceId,
    label: n.choiceLabel ?? n.title,
    group: n.choiceId === "queen" ? "Suggested" : "Appointed",
  }));
  const storedMission = choiceSelections.mission;
  const missionSelection =
    missionOptions.find((o) => o.id === storedMission)?.id ??
    missionOptions[0]?.id ??
    "";
  const setMissionSelection = (id: string) =>
    setChoiceSelections((prev) => ({ ...prev, mission: id }));

  // compline's printed menus live in their section rules
  const readingOptions: ControlOption[] = choicesFor("compline-reading").map(
    (n) => ({
      id: n.choiceId,
      label: n.choiceLabel,
      group: n.choiceId === "jeremiah" ? "Suggested" : "Appointed",
    }),
  );
  const readingSelection = choiceValue("compline-reading");
  const setReadingSelection = (id: string) =>
    setChoiceSelections((prev) => ({ ...prev, "compline-reading": id }));
  // the rubric says one of these may be added; print the first by default
  const addedPrayerOptions: ControlOption[] = choicesFor("prayer").map((n) => ({
    id: n.choiceId,
    label: n.choiceLabel,
    group: "Prayers",
  }));
  const storedPrayer = choiceSelections.prayer;
  const addedPrayerSelection = addedPrayerOptions.some(
    (o) => o.id === storedPrayer,
  )
    ? storedPrayer
    : (addedPrayerOptions[0]?.id ?? "");
  const setAddedPrayerSelection = (id: string) =>
    setChoiceSelections((prev) => ({ ...prev, prayer: id }));
  const hasPsalmRule = doc.sections.some((section) =>
    section.nodes.some(
      (n) => n.kind === "section-heading" && n.menu === "psalm",
    ),
  );
  const menus: MenuSets = {
    collect: {
      options: collectOptions,
      value: collectSelection,
      onChange: setCollectSelection,
      label: "Collect",
      segmented: doc.office === "compline",
    },
    mission: {
      options: missionOptions,
      value: missionSelection,
      onChange: setMissionSelection,
      label: "Prayers for Mission",
    },
    psalm: {
      options: psalmOptions,
      value: psalmSelection,
      onChange: setPsalmSelection,
      label: "Psalms",
    },
    reading: {
      options: readingOptions,
      value: readingSelection,
      onChange: setReadingSelection,
      label: "The Reading",
    },
  };

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

  type Entry = { node: Bcp1962OfficeNode; index: number };
  const visibleNodes = (section: Bcp1962ComposedSection): Entry[] =>
    section.nodes
      .map((node, index) => ({ node, index }))
      .filter(({ node }) => {
        if (fullText) return true;
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
        const choice: { choiceGroup?: string; choiceId?: string } =
          node.kind === "text" || node.kind === "rubric" ? node : {};
        if (
          choice.choiceGroup === "midday-prayer" &&
          choice.choiceId !== middayPrayer
        ) {
          return false;
        }
        if (choice.choiceGroup === "prayer") {
          return choice.choiceId === addedPrayerSelection;
        }
        if (
          choice.choiceGroup !== undefined &&
          choice.choiceGroup !== "midday-prayer" &&
          choice.choiceId !== choiceValue(choice.choiceGroup)
        ) {
          return false;
        }
        if (node.kind === "lesson") {
          return readingAll || keepsLesson(node.slot);
        }
        if (node.kind === "canticle") {
          if (!readingAll && !keepsLesson(node.slot)) {
            return false;
          }
          const selection =
            node.slot === "first" ? canticleFirst : canticleSecond;
          return selection === "suggested"
            ? node.suggested
            : node.id === selection;
        }
        if (node.kind === "creed") return node.id === creedId;
        if (node.kind === "occasional" && node.choiceGroup === "mission") {
          return node.choiceId === missionSelection;
        }
        if (node.kind === "occasional" && OPTIONAL_PRAYERS.has(node.id)) {
          return node.id === prayerSelection;
        }
        return true;
      });

  const isRule = (node: Bcp1962OfficeNode) =>
    node.kind === "section-heading" ||
    (node.kind === "heading" && node.rule === true);
  const nodeKey = (sectionKey: string, index: number) =>
    `node:${sectionKey}:${index}`;
  // the final header alone stays unsticky, across section and inline rules
  const lastHeaderKey = (() => {
    const keys: string[] = [];
    for (const section of doc.sections) {
      if (section.heading) keys.push(`section:${section.key}`);
      for (const entry of visibleNodes(section)) {
        if (isRule(entry.node)) keys.push(nodeKey(section.key, entry.index));
      }
    }
    return keys.at(-1);
  })();
  const sectionIsSticky = (key: string) => `section:${key}` !== lastHeaderKey;
  const nodeIsSticky = (key: string, index: number) =>
    nodeKey(key, index) !== lastHeaderKey;
  const groupsFor = (sectionKey: string, entries: Entry[]) => {
    const out: { key: string; entries: Entry[] }[] = [];
    let current: (typeof out)[number] | undefined;
    for (const entry of entries) {
      if (isRule(entry.node) || !current) {
        current = {
          key: isRule(entry.node)
            ? nodeKey(sectionKey, entry.index)
            : `group:${sectionKey}:0`,
          entries: [],
        };
        out.push(current);
      }
      current.entries.push(entry);
    }
    return out;
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
      {doc.sections.map((section) => {
        const entries = visibleNodes(section);
        const groups = groupsFor(section.key, entries);
        return (
          <MenuAnchor key={section.key} style={styles.section}>
            {groups.map((group, gi) => (
              <MenuAnchor
                key={group.key}
                style={
                  groups[gi + 1]?.entries[0]?.node &&
                  isRule(groups[gi + 1].entries[0].node)
                    ? styles.beforeSectionHeading
                    : undefined
                }
              >
                {gi === 0 && section.heading ? (
                  <StickyHeading
                    sticky={sectionIsSticky(section.key)}
                    withControl
                  >
                    <MenuAnchor style={styles.headingRow}>
                      <Text style={[sectionHeading, styles.headingText]}>
                        {section.key === "creed" ? creedTitle : section.heading}
                      </Text>
                      {section.key === "psalms" && psalmRefs.length > 0 ? (
                        <ChoiceMenu
                          value={psalmSelection}
                          options={psalmOptions}
                          label="Psalms"
                          accessibilityLabel="Psalms"
                          onChange={setPsalmSelection}
                        />
                      ) : section.key === "lessons" ? (
                        <ReadingsControl
                          choices={{ lessonSlots: readingSlots }}
                          value={lessonSelection}
                          onChange={setLessonSelection}
                        />
                      ) : section.key === "creed" && creedNodes.length > 1 ? (
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
                      ) : null}
                    </MenuAnchor>
                  </StickyHeading>
                ) : null}
                {gi === 0 &&
                section.key === "opening" &&
                sentenceNodes.length > 0 ? (
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
                {group.entries.map(({ node, index: i }) => {
                  const key = `${section.key}-${node.kind}-${i}`;
                  const sticky = nodeIsSticky(section.key, i);
                  const content = (
                    <>
                      {node.kind === "canticle" && doc.office !== "compline"
                        ? canticleControl(node.slot)
                        : null}
                      {node.kind === "text" &&
                      node.choiceGroup === "family-collect" &&
                      node.choiceId === familyCollect &&
                      familyCollect !== "none" ? (
                        <Text style={subheading}>{node.choiceLabel}</Text>
                      ) : null}
                      {node.kind === "text" &&
                      node.choiceGroup === "midday-prayer" &&
                      node.choiceId === middayPrayer &&
                      middayPrayer !== "none" ? (
                        <Text style={subheading}>{node.choiceLabel}</Text>
                      ) : null}
                      {node.kind === "text" &&
                      node.choiceGroup !== undefined &&
                      node.choiceGroup !== "collect" &&
                      node.choiceGroup !== "compline-reading" &&
                      node.choiceGroup !== "family-collect" &&
                      node.choiceGroup !== "prayer" &&
                      node.choiceGroup !== "midday-prayer" ? (
                        <>
                          <MenuAnchor style={styles.controlRow}>
                            <ChoiceMenu
                              value={choiceValue(node.choiceGroup)}
                              options={choicesFor(node.choiceGroup).map(
                                (n) => ({
                                  id: n.choiceId,
                                  label: n.choiceLabel,
                                  group: "Options",
                                }),
                              )}
                              label={
                                CHOICE_LABELS[node.choiceGroup] ?? "Options"
                              }
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
                            <Text style={subheading}>
                              {node.choiceHeading ?? node.choiceLabel}
                            </Text>
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
                      {node.kind === "psalm" &&
                      section.key !== "psalms" &&
                      !hasPsalmRule &&
                      psalmOptions.length > 1 ? (
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
                      node.choiceGroup === "collect" &&
                      node.choiceHeading ? (
                        <Text style={subheading}>{node.choiceHeading}</Text>
                      ) : null}
                      {node.kind === "text" &&
                      node.choiceGroup === "compline-reading" ? (
                        <ScriptureText
                          text={node.text}
                          citation={node.choiceLabel}
                        />
                      ) : (
                        <NodeView
                          node={
                            node.kind === "psalm" &&
                            psalmSelection !== "suggested"
                              ? {
                                  ...node,
                                  refs: node.refs.filter(
                                    (r) => r === psalmSelection,
                                  ),
                                  passages: node.passages.filter(
                                    (p) => p.ref === psalmSelection,
                                  ),
                                }
                              : node
                          }
                          showRubrics={showRubrics}
                          showSpeakers={showSpeakers}
                          sticky={sticky}
                          menus={menus}
                          fullText={fullText}
                        />
                      )}
                      {node.kind === "rubric" &&
                      node.choiceAnchorFor === "family-collect" ? (
                        <MenuAnchor style={styles.controlRow}>
                          <ChoiceMenu
                            value={familyCollect}
                            options={familyCollectOptions}
                            label="Collect"
                            accessibilityLabel="Collect"
                            fullWidth
                            onChange={setFamilyCollect}
                          />
                        </MenuAnchor>
                      ) : null}
                      {node.kind === "rubric" &&
                      node.choiceAnchorFor === "midday-prayer" ? (
                        <MenuAnchor style={styles.controlRow}>
                          <ChoiceMenu
                            value={middayPrayer}
                            options={middayPrayerOptions}
                            label="Additional Prayers"
                            accessibilityLabel="Additional Prayers"
                            fullWidth
                            onChange={setMiddayPrayer}
                          />
                        </MenuAnchor>
                      ) : null}
                      {node.kind === "rubric" &&
                      node.choiceAnchorFor === "additional-prayer" ? (
                        <MenuAnchor style={styles.controlRow}>
                          <ChoiceMenu
                            value={addedPrayerSelection}
                            options={addedPrayerOptions}
                            label="Additional Prayers"
                            accessibilityLabel="Additional Prayers"
                            fullWidth
                            onChange={setAddedPrayerSelection}
                          />
                        </MenuAnchor>
                      ) : null}
                    </>
                  );
                  return sticky ? (
                    <Fragment key={key}>{content}</Fragment>
                  ) : (
                    <MenuAnchor key={key}>{content}</MenuAnchor>
                  );
                })}
              </MenuAnchor>
            ))}
          </MenuAnchor>
        );
      })}
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
  section: officeDocumentStyles.section,
  headingRow: { ...officeDocumentStyles.headingRow, position: "relative" },
  headingText: { ...officeDocumentStyles.headingText, flexShrink: 1 },
  beforeSectionHeading: { marginBottom: 20 },
  controlRow: { position: "relative", marginTop: 8, marginBottom: 12 },
  segmentedRow: {
    position: "relative",
    alignSelf: "flex-start",
    marginTop: 6,
    marginBottom: 4,
  },
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
