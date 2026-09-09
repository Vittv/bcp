import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { CHROME_FONT } from "../lib/fonts";

export function Note({ children }: { children: ReactNode }) {
  return (
    <View style={styles.box}>
      <Text style={styles.label}>Note</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderColor: "var(--border-content, #b5aa9e)",
    borderRadius: 8,
    backgroundColor: "var(--bg-raised, #ece7dd)",
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  label: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    fontWeight: "700",
    color: "var(--text, #2c2020)",
    marginBottom: 4,
  },
});
