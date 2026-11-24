import { useMemo } from "react";
import { View } from "react-native";
import { useOfficeSettings } from "../../context/OfficeSettingsContext";
import type { ComposedSection, OfficeDocument } from "../../lib/office/types";
import { useThemedStyles } from "../../lib/theme/themedStyles";
import { ControlChip } from "./OfficeControls";
import {
  MenuView,
  PsalmCycleControl,
  SectionControl,
} from "./OfficeView.controls";
import { SectionView } from "./OfficeView.render";
import { scriptureForRite, sectionKeys } from "./OfficeView.shared";
import { officeViewStyles } from "./OfficeView.styles";

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
  const scripture = useMemo(
    () => scriptureForRite(document.rite),
    [document.rite],
  );
  // the final header in the document is the only one left unsticky. computed
  // across section rules and inline headings, so every office follows one rule
  const lastHeaderKey = (() => {
    const keys: string[] = [];
    for (const section of document.sections) {
      if (section.heading) keys.push(`section:${section.key}`);
      const nodeKeys = sectionKeys(section.nodes);
      section.nodes.forEach((node, i) => {
        if (node.kind === "section-heading") {
          keys.push(`node:${section.key}:${nodeKeys[i]}`);
        }
      });
    }
    return keys.at(-1);
  })();
  const psalmCitations = document.choices.psalmCitations;
  const storedPsalm = customization.psalmChoice;
  const activePsalm =
    storedPsalm && psalmCitations?.includes(storedPsalm)
      ? storedPsalm
      : undefined;

  const controlFor = (section: ComposedSection) => {
    if (section.menu) {
      const set = document.choices.menus?.[section.menu];
      return set ? (
        <MenuView
          menu={section.menu}
          set={set}
          officeId={document.office}
          heading
        />
      ) : null;
    }
    const key = section.key;
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
          scripture={scripture}
          control={controlFor(section)}
          bottomControl={
            section.key === "psalms" &&
            psalmCitations &&
            psalmCitations.length > 0 ? (
              <PsalmCycleControl officeId={document.office} />
            ) : null
          }
          psalmChoice={section.key === "psalms" ? activePsalm : undefined}
          fullWidthControl={section.key === "opening"}
          lastHeaderKey={lastHeaderKey}
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
