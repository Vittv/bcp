import { StyleSheet } from "react-native";
import { CHROME_FONT } from "../../lib/fonts";

// every content section rule (PSALMS, READINGS, COLLECT OF THE DAY) across
// the office and saints pages shares one voice: Inter Tight 11/600,
// letterspaced, uppercase, accent red, hairline rule directly beneath.
// both pages must keep step here, so they import this one object instead
// of spelling the rule out again.
export const sectionHeading = StyleSheet.create({
  rule: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "var(--accent, #7a3040)",
    marginBottom: 12,
    marginTop: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border-content, #b5aa9e)",
  },
}).rule;
