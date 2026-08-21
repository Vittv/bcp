import { StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import type { Color } from "../../lib/calendar/types";

const DARK_COLOR_MAP: Record<Color, string> = {
  blue: "#7e98e8",
  purple: "#6b4e97",
  white: "#cdcdcd",
  gold: "#f3be7c",
  green: "#7fa563",
  red: "#d8647e",
  black: "#3a3a3a",
};

const LIGHT_COLOR_MAP: Record<Color, string> = {
  blue: "#3a68af",
  purple: "#7440ab",
  white: "#a3a3a3",
  gold: "#bb851b",
  green: "#52803a",
  red: "#a63d55",
  black: "#303035",
};

export function useSeasonColorMap(): Record<Color, string> {
  const { resolved } = useTheme();
  return resolved === "dark" ? DARK_COLOR_MAP : LIGHT_COLOR_MAP;
}

export function SeasonDot({
  color,
  size = 8,
}: {
  color: Color;
  size?: number;
}) {
  const { resolved } = useTheme();
  const colorMap = resolved === "dark" ? DARK_COLOR_MAP : LIGHT_COLOR_MAP;
  return (
    <View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colorMap[color],
          borderWidth: 1,
          borderColor:
            resolved === "dark" ? "#00000055" : "rgba(44, 32, 32, 0.35)",
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
