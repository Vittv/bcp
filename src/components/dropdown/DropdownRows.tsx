import { useContext } from "react";
import { Pressable, Text, View } from "react-native";

import { useThemedStyles } from "../../lib/theme/themedStyles";
import { DropdownContext } from "./Dropdown";
import { dropdownStyles } from "./styles";

export function DropdownGroup({
  label,
  afterGroup,
}: {
  label: string;
  afterGroup?: boolean;
}) {
  const styles = useThemedStyles(dropdownStyles);
  return (
    <Text style={[styles.menuGroup, afterGroup && styles.menuGroupAfter]}>
      {label}
    </Text>
  );
}

export function DropdownItem({
  label,
  selected,
  disabled,
  centered,
  onPress,
}: {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  centered?: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles(dropdownStyles);
  const close = useContext(DropdownContext);
  if (disabled) {
    return (
      <View style={styles.item}>
        <Text
          style={[
            styles.itemText,
            styles.itemTextDisabled,
            centered && styles.itemTextCentered,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    );
  }
  return (
    <Pressable
      style={({ hovered }) => [
        styles.item,
        centered && styles.itemCentered,
        (hovered || selected) && styles.itemActive,
      ]}
      onPress={() => {
        onPress();
        close();
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected), disabled: false }}
    >
      <Text
        style={[
          styles.itemText,
          selected && styles.itemTextActive,
          centered && styles.itemTextCentered,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}
