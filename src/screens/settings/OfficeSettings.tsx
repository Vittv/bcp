import { Text, View } from "react-native";
import type { OfficeRite } from "../../lib/office/types";
import { useThemedStyles } from "../../lib/theme/themedStyles";
import { OptionChips, ToggleRow } from "./SettingsUi";
import { settingsStyles } from "./settingsStyles";

type OfficeSettingsProps = {
  showRubrics: boolean;
  setShowRubrics: (update: boolean | ((prev: boolean) => boolean)) => void;
  showSpeakers: boolean;
  setShowSpeakers: (update: boolean | ((prev: boolean) => boolean)) => void;
  devotions: boolean;
  setDevotions: (v: boolean) => void;
  rite: OfficeRite;
  setRite: (r: OfficeRite) => void;
};

const RITE_OPTIONS = [
  { id: "One" as const, label: "Rite I" },
  { id: "Two" as const, label: "Rite II" },
];

export function OfficeSettingsPanel({
  showRubrics,
  setShowRubrics,
  showSpeakers,
  setShowSpeakers,
  devotions,
  setDevotions,
  rite,
  setRite,
}: OfficeSettingsProps) {
  const styles = useThemedStyles(settingsStyles);
  return (
    <>
      <View style={styles.section}>
        <Text style={styles.label}>Default Rite</Text>
        <OptionChips options={RITE_OPTIONS} value={rite} onSelect={setRite} />
        <Text style={styles.settingDescription}>
          The default rite for Morning and Evening Prayer. Office lessons follow
          the selected rite.
        </Text>
      </View>
      <ToggleRow
        label="Rubrics"
        value={showRubrics}
        onChange={setShowRubrics}
        description="The service's instructions, shown in italics as the prayer book prints them."
      />
      <ToggleRow
        label="Speakers"
        value={showSpeakers}
        onChange={setShowSpeakers}
        description="Who speaks each part: Officiant, People, or All."
      />
      <ToggleRow
        label="Daily Devotions"
        value={devotions}
        onChange={setDevotions}
        description="Replace each office with the shorter Daily Devotions prayers."
      />
    </>
  );
}
