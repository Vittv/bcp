import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { Chevron } from "../components/shell/Chevron";
import { useThemedStyles } from "../lib/theme/themedStyles";
import { lectionaryStyles } from "./LectionaryScreen.styles";
import { noSelect } from "./reference/shared";
import { sharedStyles } from "./reference/styles";

export function LectionaryBar({
  leading,
  isToday,
  onPrevDate,
  onNextDate,
  onToday,
}: {
  leading?: ReactNode;
  isToday: boolean;
  onPrevDate: () => void;
  onNextDate: () => void;
  onToday: () => void;
}) {
  const barStyles = useThemedStyles(sharedStyles);
  const styles = useThemedStyles(lectionaryStyles);
  return (
    <View style={[barStyles.bar, noSelect]}>
      <View style={barStyles.barLeft}>{leading}</View>
      <View style={barStyles.barRight}>
        <Pressable
          style={({ hovered }) => [
            styles.dayBtn,
            hovered && barStyles.rowHover,
          ]}
          onPress={onToday}
          disabled={isToday}
          accessibilityLabel="Today"
          accessibilityRole="button"
        >
          <Text style={[styles.dayBtnText, isToday && styles.dayBtnTextActive]}>
            Today
          </Text>
        </Pressable>
        {/* day arrows reusing the scripture sections' square arrow buttons */}
        <Pressable
          style={({ hovered }) => [
            barStyles.arrowBtn,
            hovered && barStyles.arrowBtnHover,
          ]}
          onPress={onPrevDate}
          accessibilityLabel="Previous day"
          accessibilityRole="button"
        >
          <Chevron direction="left" size={6} />
        </Pressable>
        <Pressable
          style={({ hovered }) => [
            barStyles.arrowBtn,
            hovered && barStyles.arrowBtnHover,
          ]}
          onPress={onNextDate}
          accessibilityLabel="Next day"
          accessibilityRole="button"
        >
          <Chevron direction="right" size={6} />
        </Pressable>
      </View>
    </View>
  );
}
