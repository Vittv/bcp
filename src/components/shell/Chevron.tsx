import { StyleSheet, View } from "react-native";

// translate compensates for stroke mass biased toward the apex after rotation
export function Chevron({
  direction,
  size = 8,
  stroke = 2,
}: {
  direction: "left" | "right";
  size?: number;
  stroke?: number;
}) {
  const bias = 0.354 * (size - stroke);
  return (
    <View
      style={[
        styles.chevron,
        {
          width: size,
          height: size,
          borderLeftWidth: stroke,
          borderBottomWidth: stroke,
          transform: [
            { translateX: direction === "left" ? bias : -bias },
            { rotate: direction === "left" ? "45deg" : "-135deg" },
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
