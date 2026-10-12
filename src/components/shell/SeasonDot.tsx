import { StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import type { Color } from "../../lib/calendar/types";

// season dots read straight off the active theme's season map, so a family
// re-tints the liturgical colors along with everything else.
export function useSeasonColorMap(): Record<Color, string> {
  return useTheme().tokens.season;
}

export function SeasonDot({
  color,
  size = 8,
}: {
  color: Color;
  size?: number;
}) {
  const { tokens } = useTheme();
  return (
    <View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: tokens.season[color],
          borderWidth: 1,
          borderColor: tokens.seasonRing,
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
