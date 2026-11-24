import { type ReactNode, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useOfficeSettings } from "../../context/OfficeSettingsContext";
import { getScripturePassagesFromDolRef } from "../../lib/content/bible";
import { appointmentInCollectTitle } from "../../lib/content/collects";
import type {
  CanticlePassage,
  KjvPassage,
  OfficeId,
  OfficeSpeaker,
} from "../../lib/content/types";
import type {
  ComposedLesson,
  ComposedNode,
  ComposedSection,
  OfficeChoices,
} from "../../lib/office/types";
import { useThemedStyles } from "../../lib/theme/themedStyles";
import { useSectionHeading, useSubheading } from "./contentHeadings";
import { MentionedText } from "./MentionedText";
import { ChoiceMenu, MenuAnchor } from "./OfficeControls";
import { officeSectionId } from "./OfficeToc";
import { MenuView } from "./OfficeView.controls";
import {
  canticleOptions,
  type ScriptureConfig,
  SPEAKER_LABEL,
  sectionKeys,
} from "./OfficeView.shared";
import { officeViewStyles } from "./OfficeView.styles";
import { PsalmText } from "./PsalmText";
import { ScriptureView } from "./ScriptureView";
import { StickyHeading } from "./StickyHeading";

type NodeViewProps = {
  node: ComposedNode;
  showRubrics: boolean;
  showSpeakers: boolean;
  todaySlug?: string;
  officeId: OfficeId;
  rite: "One" | "Two" | null;
  choices: OfficeChoices;
  fullText: boolean;
  scripture: ScriptureConfig;
  sticky?: boolean;
};

function SpeakerLabel({ speaker }: { speaker: OfficeSpeaker }) {
  const styles = useThemedStyles(officeViewStyles);
  return <Text style={styles.speaker}>{SPEAKER_LABEL[speaker]} </Text>;
}

export function LessonRow({
  lesson,
  scripture,
}: {
  lesson: ComposedLesson;
  scripture: ScriptureConfig;
}) {
  const styles = useThemedStyles(officeViewStyles);
  const [passages, setPassages] = useState<KjvPassage[]>([]);

  useEffect(() => {
    let cancelled = false;
    getScripturePassagesFromDolRef(scripture, lesson.ref).then((ps) => {
      if (!cancelled) setPassages(ps);
    });
    return () => {
      cancelled = true;
    };
  }, [lesson.ref, scripture]);

  return (
    <View style={styles.lessonRow}>
      <Text style={styles.lessonRef}>
        <Text style={styles.lessonLabel}>{lesson.label}: </Text>
        {lesson.ref}
        {lesson.optional ? "  (optional)" : ""}
      </Text>
      {passages.map((p) => {
        const first = p.verses[0]?.number;
        const last = p.verses[p.verses.length - 1]?.number;
        return (
          <ScriptureView
            key={`${p.book}-${p.chapter}-${first ?? "x"}-${last ?? "x"}`}
            passage={p}
          />
        );
      })}
      {passages.length === 0 ? (
        <Text style={styles.lessonMissing}>Reading text not available</Text>
      ) : null}
    </View>
  );
}

export function CanticleView({
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

// the inline control that belongs to one office section. the controls write
// straight to the reader's per-office customization; the composer recomputes
// the document on the next render.

export function NodeView({
  node,
  showRubrics,
  showSpeakers,
  todaySlug,
  officeId,
  rite,
  choices,
  fullText,
  scripture,
  sticky = false,
}: NodeViewProps) {
  const styles = useThemedStyles(officeViewStyles);
  const subheading = useSubheading();
  const sectionHeading = useSectionHeading();
  switch (node.kind) {
    case "heading":
      return <Text style={subheading}>{node.text}</Text>;
    case "section-heading": {
      const set = node.menu ? choices.menus?.[node.menu] : undefined;
      return (
        <StickyHeading sticky={sticky} withControl={!!set}>
          {set && node.menu ? (
            <MenuAnchor style={styles.headingRow}>
              <Text style={[sectionHeading, styles.headingText]}>
                {node.text}
              </Text>
              <MenuView
                menu={node.menu}
                set={set}
                officeId={officeId}
                heading
              />
            </MenuAnchor>
          ) : (
            <Text style={sectionHeading}>{node.text}</Text>
          )}
        </StickyHeading>
      );
    }
    case "menu": {
      const set = choices.menus?.[node.menu];
      return set ? (
        <MenuView menu={node.menu} set={set} officeId={officeId} />
      ) : null;
    }
    case "rubric":
      if (!showRubrics) return null;
      return (
        <Text
          style={[
            styles.rubric,
            node.text === "All repeat the Antiphon" &&
              styles.rubricRepeatAntiphon,
          ]}
        >
          {node.text}
        </Text>
      );
    case "text": {
      const asterisk = node.text.indexOf(" * ");
      const hasHalfVerse = asterisk !== -1;
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
            {hasHalfVerse ? (
              <>
                <MentionedText
                  text={node.text.slice(0, asterisk + 2).trimEnd()}
                  todaySlug={todaySlug}
                />
                {"\n"}
                <Text style={styles.halfVerse}>
                  <MentionedText
                    text={node.text.slice(asterisk + 3).trimStart()}
                    todaySlug={todaySlug}
                  />
                </Text>
              </>
            ) : (
              <MentionedText text={node.text} todaySlug={todaySlug} />
            )}
          </Text>
          {node.citation ? (
            <Text style={styles.textCitation}>{node.citation}</Text>
          ) : null}
        </View>
      );
    }
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
            <LessonRow key={l.ref} lesson={l} scripture={scripture} />
          ))}
        </View>
      );
    case "reading":
      return <LessonRow lesson={node.lesson} scripture={scripture} />;
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
          {node.appointment &&
          !appointmentInCollectTitle(node.appointment, node.passage.title) ? (
            <Text style={styles.collectAppointment}>
              {`Appointed for ${node.appointment}`}
            </Text>
          ) : null}
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

export function SectionView({
  section,
  showRubrics,
  showSpeakers,
  todaySlug,
  officeId,
  rite,
  choices,
  fullText,
  scripture,
  control,
  bottomControl,
  fullWidthControl = false,
  lastHeaderKey,
  psalmChoice,
}: {
  section: ComposedSection;
  showRubrics: boolean;
  showSpeakers: boolean;
  todaySlug?: string;
  officeId: OfficeId;
  rite: "One" | "Two" | null;
  choices: OfficeChoices;
  fullText: boolean;
  scripture: ScriptureConfig;
  control?: ReactNode;
  bottomControl?: ReactNode;
  /** a heading-less control that should span the reading column */
  fullWidthControl?: boolean;
  // stable key of the document's final header, which alone is left unsticky
  lastHeaderKey?: string;
  psalmChoice?: string;
}) {
  const styles = useThemedStyles(officeViewStyles);
  const heading = useSectionHeading();
  const nodes =
    section.key === "psalms" && psalmChoice
      ? section.nodes.filter(
          (node) => node.kind !== "psalm" || node.citation === psalmChoice,
        )
      : section.nodes;
  if (nodes.length === 0) return null;
  const keys = sectionKeys(nodes);
  // group nodes under each header, including the section heading in the first
  // group, so a sticky rule unsticks when its own content leaves and the next
  // header takes its place without stacking against it
  const groups: { key: string; nodes: ComposedNode[]; keys: string[] }[] = [];
  let group: (typeof groups)[number] | undefined;
  for (const [i, node] of nodes.entries()) {
    const key = keys[i] ?? `node-${i}`;
    if (node.kind === "section-heading" || !group) {
      group = { key, nodes: [], keys: [] };
      groups.push(group);
    }
    group.nodes.push(node);
    group.keys.push(key);
  }
  const nextStartsWithHeading = (gi: number) =>
    groups[gi + 1]?.nodes[0]?.kind === "section-heading";
  return (
    <MenuAnchor nativeID={officeSectionId(section.key)} style={styles.section}>
      {groups.map((group, gi) => (
        <MenuAnchor
          key={group.key}
          style={
            nextStartsWithHeading(gi) ? styles.beforeSectionHeading : undefined
          }
        >
          {gi === 0 && section.heading ? (
            <StickyHeading
              sticky={`section:${section.key}` !== lastHeaderKey}
              withControl={!!control}
            >
              {control ? (
                <MenuAnchor style={styles.headingRow}>
                  <Text style={[heading, styles.headingText]}>
                    {section.heading}
                  </Text>
                  {control}
                </MenuAnchor>
              ) : (
                <Text style={heading}>{section.heading}</Text>
              )}
            </StickyHeading>
          ) : gi === 0 && control ? (
            <MenuAnchor
              style={
                fullWidthControl
                  ? styles.controlOnlyRowFull
                  : styles.controlOnlyRow
              }
            >
              {control}
            </MenuAnchor>
          ) : null}
          {gi === 0 && bottomControl ? (
            <View style={styles.psalmCycleRow}>{bottomControl}</View>
          ) : null}
          {group.nodes.map((node, ni) => (
            <NodeView
              key={group.keys[ni]}
              node={node}
              showRubrics={showRubrics}
              showSpeakers={showSpeakers}
              todaySlug={todaySlug}
              officeId={officeId}
              rite={rite}
              choices={choices}
              fullText={fullText}
              scripture={scripture}
              sticky={
                node.kind === "section-heading" &&
                `node:${section.key}:${group.keys[ni]}` !== lastHeaderKey
              }
            />
          ))}
        </MenuAnchor>
      ))}
    </MenuAnchor>
  );
}
