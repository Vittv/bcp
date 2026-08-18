import { StyleSheet, View } from "react-native";
import type { Color } from "../../lib/calendar/types";

export const COLOR_MAP: Record<Color, string> = {
  blue: "#7e98e8",
  purple: "#6b4e97",
  white: "#cdcdcd",
  gold: "#f3be7c",
  green: "#7fa563",
  red: "#d8647e",
  black: "#3a3a3a",
};

export function SeasonDot({
  color,
  size = 8,
}: {
  color: Color;
  size?: number;
}) {
  return (
    <View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: COLOR_MAP[color],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    display: "flex",
  },
});
