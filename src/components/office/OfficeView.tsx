import { type ReactNode, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useOfficeSettings } from "../../context/OfficeSettingsContext";
import { useTranslation } from "../../context/TranslationContext";
import { getScripturePassagesFromDolRef } from "../../lib/content/bible";
import { canticleTitle } from "../../lib/content/canticles";
import type {
  CanticlePassage,
  KjvPassage,
  OfficeId,
  OfficeSpeaker,
} from "../../lib/content/types";
import { CHROME_FONT, SERIF_FONT, SERIF_ITALIC_FONT } from "../../lib/fonts";
import { readingsApply } from "../../lib/office/compose";
import type {
  ComposedLesson,
  ComposedNode,
  ComposedSection,
  InvitatoryChoice,
  LessonSlot,
  MenuChoices,
  MenuKey,
  OfficeChoices,
  OfficeDocument,
} from "../../lib/office/types";
import {
  defineThemedStyles,
  useThemedStyles,
} from "../../lib/theme/themedStyles";
import { useSectionHeading, useSubheading } from "./contentHeadings";
import { MentionedText } from "./MentionedText";
import {
  ChoiceMenu,
  ControlChip,
  type ControlOption,
  MenuAnchor,
  Segmented,
} from "./OfficeControls";
import { PsalmText } from "./PsalmText";
import { ScriptureView } from "./ScriptureView";

const SPEAKER_LABEL: Record<OfficeSpeaker, string> = {
  officiant: "Officiant",
  people: "People",
  all: "All",
};

type NodeViewProps = {
  node: ComposedNode;
  showRubrics: boolean;
  showSpeakers: boolean;
  todaySlug?: string;
  officeId: OfficeId;
  rite: "One" | "Two" | null;
  choices: OfficeChoices;
  fullText: boolean;
};

function SpeakerLabel({ speaker }: { speaker: OfficeSpeaker }) {
  const styles = useThemedStyles(officeViewStyles);
  return <Text style={styles.speaker}>{SPEAKER_LABEL[speaker]} </Text>;
}

function LessonRow({ lesson }: { lesson: ComposedLesson }) {
  const styles = useThemedStyles(officeViewStyles);
  const { translation, apocrypha } = useTranslation();
  const [passages, setPassages] = useState<KjvPassage[]>([]);

  useEffect(() => {
    let cancelled = false;
    getScripturePassagesFromDolRef({ translation, apocrypha }, lesson.ref).then(
      (ps) => {
        if (!cancelled) setPassages(ps);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [lesson.ref, translation, apocrypha]);

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
      {passages.length === 0 ? (
        <Text style={styles.lessonMissing}>Reading text not available</Text>
      ) : null}
    </View>
  );
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function canticleOptions(
  suggestedNumber: number | null,
  rite: "One" | "Two" | null,
): ControlOption[] {
  const options: ControlOption[] = [];
  const suggestedTitle = suggestedNumber
    ? `${suggestedNumber}. ${canticleTitle(suggestedNumber) ?? ""}`
    : "None";
  options.push({
    id: "suggested",
    label: `Suggested · ${suggestedTitle}`,
    menuLabel: suggestedTitle,
    group: "Suggested",
  });
  const all = Array.from({ length: 21 }, (_, i) => i + 1);
  // the rite's own set first, then the other set, so the common choices are
  // at the top without hiding the rest
  const traditional = all.filter((n) => n <= 7);
  const contemporary = all.filter((n) => n > 7);
  const first = rite === "One" ? traditional : contemporary;
  const second = rite === "One" ? contemporary : traditional;
  for (const number of first) {
    options.push({
      id: String(number),
      label: `${number}. ${canticleTitle(number) ?? ""}`,
      group: rite === "One" ? "Rite I" : "Rite II",
    });
  }
  for (const number of second) {
    options.push({
      id: String(number),
      label: `${number}. ${canticleTitle(number) ?? ""}`,
      group: rite === "One" ? "Rite II" : "Rite I",
    });
  }
  options.push({ id: "none", label: "None", group: "Other" });
  return options;
}

function CanticleView({
  passage,
  slot,
  suggestedNumber,
  officeId,
  rite,
  fullText,
}: {
  passage: CanticlePassage | null;
  slot: 1 | 2;
  suggestedNumber: number | null;
  officeId: OfficeId;
  rite: "One" | "Two" | null;
  fullText: boolean;
}) {
  const styles = useThemedStyles(officeViewStyles);
  const subheading = useSubheading();
  const { customizationFor, setOfficeChoice } = useOfficeSettings();
  const customization = customizationFor(officeId);
  const key = slot === 1 ? "canticle1" : "canticle2";
  const chosen = customization[key];
  const value =
    chosen === undefined
      ? "suggested"
      : chosen === null
        ? "none"
        : String(chosen);
  const options = canticleOptions(suggestedNumber, rite);
  return (
    <MenuAnchor style={styles.canticleBlock}>
      {fullText ? null : (
        <MenuAnchor style={styles.canticleControlRow}>
          <ChoiceMenu
            value={value}
            options={options}
            label={`Canticle for reading ${slot}`}
            accessibilityLabel={`Canticle after reading ${slot}`}
            onChange={(id) =>
              setOfficeChoice(officeId, {
                [key]:
                  id === "suggested"
                    ? undefined
                    : id === "none"
                      ? null
                      : Number(id),
              })
            }
          />
        </MenuAnchor>
      )}
      {passage ? (
        <>
          <Text style={[subheading, styles.canticleHeading]}>
            {fullText ? `Canticle ${passage.number}. ` : ""}
            {passage.title}
          </Text>
          {passage.latin ? (
            <Text style={styles.canticleLatin}>{passage.latin}</Text>
          ) : null}
          {passage.sections.map((section, i) => (
            // sections are fixed liturgical text without stable ids
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed liturgical text
            <View key={`${section.title ?? "section"}-${i}`}>
              {section.title ? (
                <Text style={styles.canticleSection}>{section.title}</Text>
              ) : null}
              {section.verses.map((verse, j) => (
                <Text
                  // verses are fixed text with no stable id; the index is the key
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed liturgical text
                  key={j}
                  style={styles.canticleVerse}
                >
                  {verse}
                </Text>
              ))}
            </View>
          ))}
        </>
      ) : (
        <Text style={styles.canticleNone}>No canticle after this reading.</Text>
      )}
    </MenuAnchor>
  );
}

const INVITATORY_LABEL: Record<InvitatoryChoice, string> = {
  venite: "Venite (Psalm 95)",
  jubilate: "Jubilate (Psalm 100)",
  pascha: "Pascha nostrum",
};

// the inline control that belongs to one office section. the controls write
// straight to the reader's per-office customization; the composer recomputes
// the document on the next render.
function SectionControl({
  sectionKey,
  officeId,
  choices,
}: {
  sectionKey: ComposedSection["key"];
  officeId: OfficeId;
  choices: OfficeChoices;
}) {
  const { customizationFor, setOfficeChoice } = useOfficeSettings();
  const customization = customizationFor(officeId);

  switch (sectionKey) {
    case "lessons": {
      if (!choices.lessonSlots || choices.lessonSlots.length === 0) return null;
      // a stored choice the day cannot honor (a feast's two readings under
      // an evening "Gospel only") shows as Suggested; the stored key
      // survives and rules again tomorrow
      const stored = customization.readings;
      const value =
        stored !== undefined && readingsApply(choices, stored)
          ? stored
          : "suggested";
      return (
        <ReadingsControl
          choices={choices}
          value={value}
          onChange={(id) =>
            setOfficeChoice(officeId, {
              readings: id === "suggested" ? undefined : id,
            })
          }
        />
      );
    }
    case "opening": {
      if (choices.openingGroups.length === 0) return null;
      const options: ControlOption[] = [
        {
          id: "suggested",
          label: choices.openingSuggested
            ? `Suggested · ${truncate(choices.openingSuggested, 52)}`
            : "Suggested",
          group: "Suggested",
        },
      ];
      const seen = new Set<string>();
      for (const group of choices.openingGroups) {
        for (const text of group.texts) {
          if (seen.has(text)) continue;
          seen.add(text);
          options.push({
            id: text,
            label: truncate(text, 64),
            group: group.season,
          });
        }
      }
      options.push({ id: "all", label: "All sentences", group: "Other" });
      return (
        <ChoiceMenu
          value={customization.opening ?? "suggested"}
          options={options}
          label="Opening Sentence"
          accessibilityLabel="Opening Sentence"
          fullWidth
          onChange={(id) =>
            setOfficeChoice(officeId, {
              opening: id === "suggested" ? undefined : id,
            })
          }
        />
      );
    }
    case "invitatory":
      return (
        <ChoiceMenu
          narrow
          value={customization.invitatory ?? "suggested"}
          options={[
            {
              id: "suggested",
              label: INVITATORY_LABEL[choices.invitatorySuggested],
              group: "Suggested",
            },
            { id: "venite", label: INVITATORY_LABEL.venite, group: "Psalms" },
            { id: "jubilate", label: INVITATORY_LABEL.jubilate },
            { id: "pascha", label: INVITATORY_LABEL.pascha },
          ]}
          label="Invitatory"
          accessibilityLabel="Invitatory Psalm"
          onChange={(id) =>
            setOfficeChoice(officeId, {
              invitatory:
                id === "venite" || id === "jubilate" || id === "pascha"
                  ? id
                  : undefined,
            })
          }
        />
      );
    case "psalms":
      return (
        <Segmented
          value={customization.psalmCycle ?? "office"}
          options={[
            { id: "office", label: "Office" },
            { id: "psalter30", label: "30-Day" },
          ]}
          accessibilityLabel="Psalm source"
          onChange={(id) =>
            setOfficeChoice(officeId, {
              psalmCycle: id === "psalter30" ? "psalter30" : "office",
            })
          }
        />
      );
    case "suffrages-a":
    case "suffrages-b":
      return (
        <Segmented
          value={customization.suffrages ?? choices.suffragesSuggested}
          options={[
            { id: "a", label: "A" },
            { id: "b", label: "B" },
          ]}
          accessibilityLabel="Suffrages"
          onChange={(id) =>
            setOfficeChoice(officeId, {
              suffrages: id === "a" ? "a" : "b",
            })
          }
        />
      );
    default:
      return null;
  }
}

// short position names for the Readings picker; the corpus descriptors
// appear on shared year-table days, where the book assigns the positions
const READING_NAME: Record<LessonSlot["key"], string> = {
  first: "First",
  second: "Second",
  third: "Third",
  gospel: "Gospel",
};

// digits to positions to composition and the picker alike; third and
// gospel share position 3 and never carry refs on the same day
const READING_NO: Record<LessonSlot["key"], 1 | 2 | 3> = {
  first: 1,
  second: 2,
  third: 3,
  gospel: 3,
};

function slotName(slot: LessonSlot): string {
  // the corpus reads as the name where the book assigns it (OT, NT,
  // Gospel); split-set days fall back to the position
  return slot.desc ?? READING_NAME[slot.key];
}

// the Readings picker: the day's full set restores the default (a missing
// stored key), then the one- and two-reading subsets. a day without a
// gospel shows a disabled row where the gospel choices would sit
function ReadingsControl({
  choices,
  value,
  onChange,
}: {
  choices: OfficeChoices;
  value: string;
  onChange: (id: string) => void;
}) {
  const slots = choices.lessonSlots ?? [];
  const options: ControlOption[] = [{ id: "suggested", label: "All readings" }];
  options.push(
    ...slots.map((slot) => ({
      id: String(READING_NO[slot.key]),
      group: "One reading",
      label: `${slotName(slot)} only`,
    })),
  );
  if (!slots.some((slot) => slot.key === "gospel")) {
    options.push({
      id: "disabled",
      group: "One reading",
      label: "No gospel appointed today",
      disabled: true,
    });
  }
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      options.push({
        id: `${READING_NO[slots[i].key]}${READING_NO[slots[j].key]}`,
        group: "Two readings",
        label: `${slotName(slots[i])} & ${slotName(slots[j])}`,
      });
    }
  }
  return (
    <ChoiceMenu
      value={value}
      options={options}
      label="Readings"
      accessibilityLabel="Readings"
      onChange={onChange}
    />
  );
}

// the inline control belonging to one printed menu node; noonday and compline
// have no heading rows, so the picker takes the full column
const MENU_META: Record<
  MenuKey,
  {
    key: "psalmMenu" | "readingMenu" | "collectMenu";
    label: string;
    a11y: string;
  }
> = {
  psalm: { key: "psalmMenu", label: "Psalm", a11y: "Psalm" },
  reading: { key: "readingMenu", label: "Reading", a11y: "Reading" },
  collect: { key: "collectMenu", label: "Collect", a11y: "Collect" },
};

function MenuView({
  menu,
  set,
  officeId,
}: {
  menu: MenuKey;
  set: MenuChoices;
  officeId: OfficeId;
}) {
  const styles = useThemedStyles(officeViewStyles);
  const { customizationFor, setOfficeChoice } = useOfficeSettings();
  const customization = customizationFor(officeId);
  const meta = MENU_META[menu];
  const stored = customization[meta.key];
  return (
    <MenuAnchor style={styles.menuControlRow}>
      <ChoiceMenu
        fullWidth
        value={stored ?? "suggested"}
        options={set.options}
        label={meta.label}
        accessibilityLabel={meta.a11y}
        onChange={(id) => {
          if (id === "suggested") {
            setOfficeChoice(officeId, { [meta.key]: undefined });
            return;
          }
          const patch =
            menu === "psalm"
              ? { psalmMenu: id }
              : menu === "reading"
                ? { readingMenu: id }
                : { collectMenu: id };
          setOfficeChoice(officeId, patch);
        }}
      />
    </MenuAnchor>
  );
}

function NodeView({
  node,
  showRubrics,
  showSpeakers,
  todaySlug,
  officeId,
  rite,
  choices,
  fullText,
}: NodeViewProps) {
  const styles = useThemedStyles(officeViewStyles);
  const subheading = useSubheading();
  switch (node.kind) {
    case "heading":
      return <Text style={subheading}>{node.text}</Text>;
    case "rubric":
      if (!showRubrics) return null;
      return <Text style={styles.rubric}>{node.text}</Text>;
    case "menu": {
      const set = choices.menus?.[node.menu];
      if (!set || fullText) return null;
      return <MenuView menu={node.menu} set={set} officeId={officeId} />;
    }
    case "text":
      return (
        <View>
          <Text
            style={[
              styles.text,
              node.speaker === "people" && showSpeakers && styles.textPeople,
            ]}
          >
            {node.speaker && showSpeakers ? (
              <SpeakerLabel speaker={node.speaker} />
            ) : null}
            <MentionedText text={node.text} todaySlug={todaySlug} />
          </Text>
          {node.citation ? (
            <Text style={styles.textCitation}>{node.citation}</Text>
          ) : null}
        </View>
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
    case "reading":
      return <LessonRow lesson={node.lesson} />;
    case "canticle":
      return (
        <CanticleView
          passage={node.passage}
          slot={node.slot}
          suggestedNumber={choices.canticleSuggested[node.slot - 1]}
          officeId={officeId}
          rite={rite}
          fullText={fullText}
        />
      );
    case "collect":
      return (
        <View style={styles.collectBlock}>
          <Text style={styles.collectLabel}>
            <MentionedText
              text={node.passage.title}
              todaySlug={todaySlug}
              slug={node.slug}
            />
          </Text>
          <Text style={styles.collectText}>{node.passage.text}</Text>
        </View>
      );
    case "fixed-collect":
      return (
        <View style={styles.fixedCollectBlock}>
          {node.title ? (
            <Text style={subheading}>
              <MentionedText text={node.title} todaySlug={todaySlug} />
            </Text>
          ) : null}
          <Text style={styles.fixedCollectText}>{node.text}</Text>
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
  todaySlug,
  officeId,
  rite,
  choices,
  fullText,
  control,
  fullWidthControl = false,
}: {
  section: ComposedSection;
  showRubrics: boolean;
  showSpeakers: boolean;
  todaySlug?: string;
  officeId: OfficeId;
  rite: "One" | "Two" | null;
  choices: OfficeChoices;
  fullText: boolean;
  control?: ReactNode;
  /** a heading-less control that should span the reading column */
  fullWidthControl?: boolean;
}) {
  const styles = useThemedStyles(officeViewStyles);
  const heading = useSectionHeading();
  if (section.nodes.length === 0) return null;
  const keys = sectionKeys(section.nodes);
  return (
    <MenuAnchor style={styles.section}>
      {section.heading ? (
        control ? (
          <MenuAnchor
            style={[
              styles.headingRow,
              section.key !== "suffrages-a" && section.key !== "suffrages-b"
                ? styles.stickyHeader
                : null,
            ]}
          >
            <Text style={[heading, styles.headingText]}>{section.heading}</Text>
            {control}
          </MenuAnchor>
        ) : (
          <Text
            style={[
              heading,
              section.key !== "suffrages-a" && section.key !== "suffrages-b"
                ? styles.stickyHeader
                : null,
            ]}
          >
            {section.heading}
          </Text>
        )
      ) : control ? (
        <MenuAnchor
          style={
            fullWidthControl ? styles.controlOnlyRowFull : styles.controlOnlyRow
          }
        >
          {control}
        </MenuAnchor>
      ) : null}
      {section.nodes.map((node, i) => (
        <NodeView
          key={keys[i]}
          node={node}
          showRubrics={showRubrics}
          showSpeakers={showSpeakers}
          todaySlug={todaySlug}
          officeId={officeId}
          rite={rite}
          choices={choices}
          fullText={fullText}
        />
      ))}
    </MenuAnchor>
  );
}

export function OfficeView({
  document,
  showRubrics,
  showSpeakers,
  fullText = false,
}: {
  document: OfficeDocument;
  showRubrics: boolean;
  showSpeakers: boolean;
  fullText?: boolean;
}) {
  const styles = useThemedStyles(officeViewStyles);
  const { customizationFor, resetOffice } = useOfficeSettings();
  const customization = customizationFor(document.office);
  const hasSuffragesA = document.sections.some(
    (section) => section.key === "suffrages-a",
  );

  const controlFor = (key: ComposedSection["key"]) => {
    // full text prints the book's own menus, so the pickers would have
    // nothing to act on
    if (
      fullText &&
      (key === "opening" || key === "invitatory" || key === "lessons")
    ) {
      return null;
    }
    if (key === "suffrages-b" && hasSuffragesA) return null;
    return (
      <SectionControl
        sectionKey={key}
        officeId={document.office}
        choices={document.choices}
      />
    );
  };

  return (
    <View>
      {document.sections.map((section) => (
        <SectionView
          key={section.key}
          section={section}
          showRubrics={showRubrics}
          showSpeakers={showSpeakers}
          todaySlug={document.slot.holyDay}
          officeId={document.office}
          rite={document.rite}
          choices={document.choices}
          fullText={fullText}
          control={controlFor(section.key)}
          fullWidthControl={section.key === "opening"}
        />
      ))}
      {Object.keys(customization).length > 0 ? (
        <View style={styles.resetRow}>
          <ControlChip
            label="Reset this office"
            accessibilityLabel="Reset this office"
            onPress={() => resetOffice(document.office)}
          />
        </View>
      ) : null}
    </View>
  );
}

function nodeKey(node: ComposedNode): string {
  switch (node.kind) {
    case "heading":
      return `h:${node.text}`;
    case "rubric":
      return `r:${node.text}`;
    case "menu":
      return `m:${node.menu}`;
    case "text":
      return `t:${node.citation ?? ""}:${node.speaker ?? ""}:${node.text}`;
    case "psalm":
      return `p:${node.citation}`;
    case "lessons":
      return `l:${node.lessons.map((l) => l.ref).join("|")}`;
    case "reading":
      return `rd:${node.lesson.label}:${node.lesson.ref}`;
    case "canticle":
      return `cn:${node.slot}:${node.passage?.number ?? "none"}`;
    case "collect":
      return `c:${node.passage.text}`;
    case "fixed-collect":
      return `fc:${node.title ?? ""}:${node.text}`;
  }
}

const officeViewStyles = defineThemedStyles({
  section: {
    marginBottom: 20,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 18,
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border-content)",
  },
  stickyHeader: {
    position: "sticky",
    top: 0,
    backgroundColor: "var(--bg)",
    zIndex: 10,
  },
  headingText: {
    flexShrink: 1,
    marginTop: 0,
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  controlOnlyRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
    marginBottom: 2,
  },
  controlOnlyRowFull: {
    marginTop: 4,
    marginBottom: 2,
  },
  // a menu node sits under its rubric, taking the full column
  menuControlRow: {
    marginTop: 4,
    marginBottom: 2,
  },
  resetRow: {
    marginTop: 4,
    marginBottom: 24,
    alignItems: "flex-start",
  },
  rubric: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 15,
    lineHeight: 25,
    color: "var(--text-secondary)",
    marginTop: 4,
    marginBottom: 4,
  },
  text: {
    fontFamily: SERIF_FONT,
    fontSize: 18,
    lineHeight: 30,
    color: "var(--text)",
    marginTop: 8,
  },
  textPeople: {
    fontWeight: "600",
  },
  // the printed citation a menu reading names after its passage
  textCitation: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 15,
    lineHeight: 24,
    color: "var(--text-secondary)",
    marginTop: 2,
    marginBottom: 4,
  },
  speaker: {
    fontFamily: CHROME_FONT,
    fontWeight: "600",
    fontSize: 11,
    letterSpacing: 0.4,
    color: "var(--accent)",
  },
  psalmBlock: {
    marginTop: 22,
    paddingLeft: 4,
  },
  psalmTitle: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 15,
    color: "var(--text-secondary)",
    marginBottom: 6,
  },
  lessonBlock: {
    marginBottom: 12,
    paddingLeft: 4,
  },
  lessonRow: {
    marginTop: 22,
  },
  lessonRef: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 15,
    color: "var(--text-secondary)",
  },
  lessonLabel: {
    color: "var(--accent)",
  },
  lessonMissing: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 13,
    lineHeight: 20,
    color: "var(--text-secondary)",
    marginTop: 4,
  },
  canticleBlock: {
    marginTop: 26,
    marginBottom: 12,
    paddingLeft: 4,
  },
  // the title takes the shared subheading voice (the same one Venite and
  // Jubilate use); the block's own top margin opens it, so the subheading's
  // default leading space is dropped
  canticleHeading: {
    marginTop: 0,
    marginBottom: 0,
  },
  canticleLatin: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 14,
    color: "var(--text-secondary)",
    marginTop: 2,
    marginBottom: 6,
  },
  canticleSection: {
    fontFamily: CHROME_FONT,
    fontWeight: "600",
    fontSize: 11,
    letterSpacing: 0.4,
    color: "var(--text-secondary)",
    marginTop: 10,
    marginBottom: 2,
  },
  canticleVerse: {
    fontFamily: SERIF_FONT,
    fontSize: 17,
    lineHeight: 28,
    color: "var(--text)",
    marginTop: 6,
  },
  canticleControlRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 2,
  },
  canticleNone: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 15,
    lineHeight: 24,
    color: "var(--text-secondary)",
  },
  // the day collect's block follows its subheading node ("The Collect of the
  // Day"), so the block carries no top margin of its own; the proper title
  // rides under the heading as the label voice
  collectBlock: {
    marginBottom: 10,
    paddingLeft: 4,
  },
  collectLabel: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 15,
    lineHeight: 23,
    color: "var(--text-secondary)",
    marginBottom: 2,
  },
  collectText: {
    fontFamily: SERIF_FONT,
    fontSize: 17,
    lineHeight: 28,
    color: "var(--text)",
  },
  // the subheading on the title opens the block, so the wrapper stays margin-free
  fixedCollectBlock: {
    marginBottom: 10,
    paddingLeft: 4,
  },
  fixedCollectText: {
    fontFamily: SERIF_FONT,
    fontSize: 17,
    lineHeight: 28,
    color: "var(--text)",
  },
});
