import { ScrollView, StyleSheet, Text, View } from "react-native";

export function OfficesScreen() {
  return (
    <ScrollView>
      <Text style={styles.heading}>Offices & Psalms</Text>
      <View style={styles.placeholder}>
        <Text style={styles.body}>
          Full-text reference browsers for the Daily Office liturgies and the
          150 Psalms will be available in a future milestone.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontFamily: "sans-serif",
    fontSize: 20,
    fontWeight: "700",
    color: "var(--text, #2c2020)",
    marginBottom: 24,
  },
  placeholder: {
    padding: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "var(--border, #d2cbbf)",
    borderStyle: "dashed",
  },
  body: {
    fontFamily: "sans-serif",
    fontSize: 13,
    color: "var(--text-secondary, #7a6e64)",
    lineHeight: 20,
  },
});
