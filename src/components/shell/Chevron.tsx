import { StyleSheet, View } from "react-native";

// translate compensates for stroke mass biased toward the apex after rotation
export function Chevron({
  direction,
  size = 8,
  stroke = 1.5,
}: {
  direction: "left" | "right" | "up" | "down";
  size?: number;
  stroke?: number;
}) {
  const bias = 0.354 * (size - stroke);
  const tx = direction === "left" ? bias : direction === "right" ? -bias : 0;
  const ty = direction === "up" ? bias : direction === "down" ? -bias : 0;
  const angle =
    direction === "left"
      ? 45
      : direction === "right"
        ? -135
        : direction === "up"
          ? 135
          : -45;
  return (
    <View
      style={[
        styles.chevron,
        {
          width: size,
          height: size,
          borderLeftWidth: stroke,
          borderBottomWidth: stroke,
          borderRadius: stroke,
          transform: [
            { translateX: tx },
            { translateY: ty },
            { rotate: `${angle}deg` },
          ],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  chevron: {
    borderColor: "var(--text-secondary, #7a6e64)",
  },
});
