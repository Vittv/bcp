import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { CHROME_FONT } from "../lib/fonts";
import { defineThemedStyles, useThemedStyles } from "../lib/theme/themedStyles";

type StepsProps = { children: ReactNode };

export function Steps({ children }: StepsProps) {
  const styles = useThemedStyles(styleDef);
  return <View style={styles.box}>{children}</View>;
}

type StepProps = { n: number; children: ReactNode };

export function Step({ n, children }: StepProps) {
  const styles = useThemedStyles(styleDef);
  return (
    <View style={styles.row}>
      <Text style={styles.text}>
        <Text style={styles.number}>{n}.</Text> {children}
      </Text>
    </View>
  );
}

const styleDef = defineThemedStyles({
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
    color: "var(--accent)",
  },
  text: {
    flex: 1,
    fontFamily: CHROME_FONT,
    fontWeight: "400",
    fontSize: 15,
    color: "var(--text-secondary)",
    lineHeight: 23,
  },
});
