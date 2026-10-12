import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { CHROME_FONT } from "../lib/fonts";
import { defineThemedStyles, useThemedStyles } from "../lib/theme/themedStyles";

export function Note({ children }: { children: ReactNode }) {
  const styles = useThemedStyles(styleDef);
  return (
    <View style={styles.box}>
      <Text style={styles.label}>Note</Text>
      {children}
    </View>
  );
}

const styleDef = defineThemedStyles({
  box: {
    borderWidth: 1,
    borderColor: "var(--border-content)",
    borderRadius: 8,
    backgroundColor: "var(--bg-raised)",
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  label: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    fontWeight: "700",
    color: "var(--text)",
    marginBottom: 4,
  },
});
