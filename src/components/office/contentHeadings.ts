import { SERIF_FONT, SUBHEADING_FONT } from "../../lib/fonts";
import {
  defineThemedStyles,
  useThemedStyles,
} from "../../lib/theme/themedStyles";

// every content section rule (Opening, Psalms, Lessons, etc.) shares one
// BCP-like voice: centered serif small-caps style, larger than body labels,
// with a hairline rule beneath. both pages must keep step here, so they call
// this one hook instead of spelling the rule out again.
const sectionHeadingStyles = defineThemedStyles({
  rule: {
    fontFamily: SERIF_FONT,
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "uppercase",
    textAlign: "center",
    color: "var(--accent)",
    marginBottom: 10,
    marginTop: 22,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border-content)",
  },
});

export function useSectionHeading() {
  return useThemedStyles(sectionHeadingStyles).rule;
}

// every block title that is not the page's main heading and not a section rule
// (canticle titles, "A Reading", "The Collect", season and rubric groups) shares
// this second voice, so the pages read as one hierarchy: the main heading, then
// the small-caps section rule, then the subheading, then the body. the face is
// the reader's subheading choice, set semibold. the space above is the main
// separator, well clear of the body paragraph's 8, so a title opens its block;
// where the block above owns its own bottom spacing, the title drops this
// margin instead of adding to it
const subheadingStyles = defineThemedStyles({
  block: {
    fontFamily: SUBHEADING_FONT,
    fontWeight: "600",
    fontSize: 20,
    lineHeight: 27,
    color: "var(--text)",
    marginTop: 30,
    marginBottom: 6,
  },
});

export function useSubheading() {
  return useThemedStyles(subheadingStyles).block;
}
