import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { CHROME_FONT } from "../lib/fonts";

type StepsProps = { children: ReactNode };

export function Steps({ children }: StepsProps) {
  return <View style={styles.box}>{children}</View>;
}

type StepProps = { n: number; children: ReactNode };

export function Step({ n, children }: StepProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.text}>
        <Text style={styles.number}>{n}.</Text> {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  number: {
    fontFamily: CHROME_FONT,
    fontSize: 15,
    fontWeight: "700",
    color: "var(--accent, #7a3040)",
  },
  text: {
    flex: 1,
    fontFamily: CHROME_FONT,
    fontWeight: "400",
    fontSize: 15,
    color: "var(--text-secondary, #7a6e64)",
    lineHeight: 23,
  },
});
