import { CHROME_FONT } from "../../lib/fonts";
import {
  defineThemedStyles,
  useThemedStyles,
} from "../../lib/theme/themedStyles";

// every content section rule (PSALMS, READINGS, COLLECT OF THE DAY) across
// the office and saints pages shares one voice: Inter Tight 11/600,
// letterspaced, uppercase, accent red, hairline rule directly beneath.
// both pages must keep step here, so they call this one hook instead of
// spelling the rule out again.
const sectionHeadingStyles = defineThemedStyles({
  rule: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "var(--accent)",
    marginBottom: 12,
    marginTop: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border-content)",
  },
});

export function useSectionHeading() {
  return useThemedStyles(sectionHeadingStyles).rule;
}
