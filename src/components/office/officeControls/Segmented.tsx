import { Pressable, Text, View } from "react-native";

import { useThemedStyles } from "../../../lib/theme/themedStyles";
import { officeControlStyles } from "./styles";

export function Segmented({
  value,
  options,
  onChange,
  accessibilityLabel,
}: {
  value: string;
  options: readonly { id: string; label: string }[];
  onChange: (id: string) => void;
  accessibilityLabel: string;
}) {
  const styles = useThemedStyles(officeControlStyles);
  return (
    <View style={styles.segmented} accessibilityLabel={accessibilityLabel}>
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <Pressable
            key={option.id}
            style={({ hovered }) => [
              styles.segItem,
              (hovered || selected) && styles.segItemActive,
            ]}
            onPress={() => onChange(option.id)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
          >
            <Text style={[styles.segText, selected && styles.segTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
