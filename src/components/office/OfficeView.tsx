import { useMemo } from "react";
import { View } from "react-native";
import { useOfficeSettings } from "../../context/OfficeSettingsContext";
import type { ComposedSection, OfficeDocument } from "../../lib/office/types";
import { useThemedStyles } from "../../lib/theme/themedStyles";
import { ControlChip } from "./OfficeControls";
import { SectionControl } from "./OfficeView.controls";
import { SectionView } from "./OfficeView.render";
import { scriptureForRite } from "./OfficeView.shared";
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
          scripture={scripture}
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
