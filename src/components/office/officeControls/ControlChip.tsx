import { Pressable, Text } from "react-native";

import { useThemedStyles } from "../../../lib/theme/themedStyles";
import { officeControlStyles } from "./styles";

// a bare chip for Reset and similar one-shot actions
export function ControlChip({
  label,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const styles = useThemedStyles(officeControlStyles);
  return (
    <Pressable
      style={({ hovered }) => [styles.trigger, hovered && styles.triggerHover]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={styles.triggerText}>{label}</Text>
    </Pressable>
  );
}
