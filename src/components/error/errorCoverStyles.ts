import { StyleSheet } from "react-native";

import { CHROME_FONT, HEADING_FONT, SERIF_FONT } from "../../lib/fonts";
import type { ThemeTokens } from "../../lib/theme/tokens";

// every color comes from the active palette, so the cover reads as a page of
// the chosen theme; concrete tokens still paint if the theme provider crashed
export function errorCoverStyles(t: ThemeTokens) {
  return StyleSheet.create({
    cover: {
      flex: 1,
      backgroundColor: t.bg,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
      paddingVertical: 48,
    },
    frame: {
      width: "100%",
      maxWidth: 420,
      alignItems: "center",
      borderWidth: 1,
      borderColor: t.border,
      paddingVertical: 52,
      paddingHorizontal: 24,
      marginBottom: 44,
    },
    cross: {
      width: 84,
      height: 84,
      marginBottom: 24,
    },
    monogram: {
      fontFamily: HEADING_FONT,
      color: t.accent,
      fontSize: 42,
      lineHeight: 50,
      letterSpacing: 8,
      // letter spacing trails the last glyph, so nudge back to the true center
      marginLeft: 8,
    },
    rule: {
      width: 110,
      height: 1,
      backgroundColor: t.accent,
      marginVertical: 22,
    },
    title: {
      fontFamily: SERIF_FONT,
      color: t.text,
      fontSize: 15,
      lineHeight: 24,
      letterSpacing: 2,
      textAlign: "center",
    },
    message: {
      fontFamily: SERIF_FONT,
      color: t.textSecondary,
      fontSize: 14,
      textAlign: "center",
    },
    button: {
      marginTop: 24,
      paddingVertical: 12,
      paddingHorizontal: 32,
      borderWidth: 1,
      borderColor: t.accent,
      borderRadius: 2,
    },
    buttonText: {
      fontFamily: CHROME_FONT,
      color: t.accent,
      fontSize: 12,
      fontWeight: "600",
      letterSpacing: 1,
      textTransform: "uppercase",
    },
  });
}
