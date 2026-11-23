import { Fragment, useState } from "react";
import { Text, View } from "react-native";
import type { BcpEdition } from "../../context/EditionContext";
import type { LitanyDoc, LitanyNode } from "../../lib/content/litany";
import {
  defineThemedStyles,
  useThemedStyles,
} from "../../lib/theme/themedStyles";
import { useSectionHeading, useSubheading } from "./contentHeadings";
import { ChoiceMenu, type ControlOption, MenuAnchor } from "./OfficeControls";
import { OFFICE_EDITION_LABELS, OfficeHeader } from "./OfficeHeader";
import { officeDocumentStyles } from "./officeDocumentStyles";

const SPEAKERS: Record<string, string> = {
  minister: "Minister",
  officiant: "Officiant",
  priest: "Priest",
  people: "People",
  answer: "Answer",
  all: "All",
};

type PrayerChoiceNode = Extract<LitanyNode, { kind: "text" }> & {
  choiceGroup: string;
  choiceId: string;
  choiceLabel: string;
};

type LitanyViewProps = {
  doc: LitanyDoc;
  showRubrics?: boolean;
  showSpeakers?: boolean;
};

// one renderer for the 1662, 1962 and 1979 Litanies; only the masthead label
// changes, and edition-specific choice menus appear when a composer adds them
export function LitanyView({
  doc,
  edition = "1962",
  showRubrics = true,
  showSpeakers = true,
}: LitanyViewProps & { edition?: BcpEdition }) {
  const styles = useThemedStyles(litanyStyles);
  const sectionHeading = useSectionHeading();
  const subheading = useSubheading();
  const [prayerSelection, setPrayerSelection] = useState("none");
  const prayerNodes = doc.nodes.filter(
    (n): n is PrayerChoiceNode =>
      n.kind === "text" && n.choiceGroup === "litany-prayer",
  );
  const prayerOptions: ControlOption[] = [
    { id: "none", label: "None", group: "Other" },
    ...prayerNodes.map((n) => ({
      id: n.choiceId,
      label: n.choiceLabel,
      group:
        n.choiceId === "general-thanksgiving" ? "Thanksgivings" : "Prayers",
    })),
  ];
  return (
    <View>
      <OfficeHeader
        officeName={doc.officeName}
        date={doc.date}
        editionLabel={OFFICE_EDITION_LABELS[edition]}
      />
      {doc.nodes.map((node, i) => {
        if (node.kind === "rubric") {
          if (!showRubrics) return null;
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed liturgical text
            <Fragment key={i}>
              <Text style={styles.rubric}>{node.text}</Text>
              {node.choiceAnchorFor === "litany-prayer" ? (
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
            </Fragment>
          );
        }
        if (node.kind === "heading") {
          if (node.text === "Suffrages" || node.text === "Confession of Sin") {
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed liturgical text
              <Text key={i} style={sectionHeading}>
                {node.text}
              </Text>
            );
          }
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed liturgical text
            <Text key={i} style={subheading}>
              {node.text}
            </Text>
          );
        }
        if (
          node.kind === "text" &&
          node.choiceGroup === "litany-prayer" &&
          node.choiceId !== prayerSelection
        ) {
          return null;
        }
        const label = showSpeakers
          ? (SPEAKERS[node.speaker ?? ""] ?? null)
          : null;
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed liturgical text
          <Fragment key={i}>
            {node.kind === "text" && node.choiceGroup === "litany-prayer" ? (
              <Text style={subheading}>{node.choiceLabel}</Text>
            ) : null}
            <Text
              style={[
                styles.text,
                node.lordsPrayerFirst && styles.lordsPrayerStart,
                node.lordsPrayerLast && styles.lordsPrayerEnd,
                showSpeakers &&
                  (node.speaker === "people" || node.speaker === "all") &&
                  styles.textPeople,
              ]}
            >
              {label ? <Text style={styles.speaker}>{label} </Text> : null}
              {node.text}
            </Text>
          </Fragment>
        );
      })}
    </View>
  );
}

/** the 1962 Litany uses the shared renderer with its own masthead label. */
export function Bcp1962LitanyView(props: LitanyViewProps) {
  return <LitanyView {...props} edition="1962" />;
}

const litanyStyles = defineThemedStyles({
  text: { ...officeDocumentStyles.text, marginTop: 4 },
  controlRow: { position: "relative", marginTop: 8, marginBottom: 12 },
  lordsPrayerStart: { marginTop: 4 },
  lordsPrayerEnd: { marginBottom: 8 },
  textPeople: officeDocumentStyles.textPeople,
  rubric: officeDocumentStyles.rubric,
  speaker: officeDocumentStyles.speaker,
});
