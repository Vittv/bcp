import {
  CHROME_FONT,
  HEADING_FONT,
  SERIF_ITALIC_FONT,
  SUBHEADING_FONT,
} from "../lib/fonts";
import { defineThemedStyles } from "../lib/theme/themedStyles";

export const lectionaryStyles = defineThemedStyles({
  header: {
    marginBottom: 24,
    paddingBottom: 16,
  },
  title: {
    fontFamily: HEADING_FONT,
    fontWeight: "500",
    fontSize: 28,
    lineHeight: 36,
    color: "var(--text)",
    letterSpacing: -0.3,
  },
  dateLabel: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 13,
    color: "var(--text-secondary)",
    marginTop: 4,
  },
  entryTitle: {
    fontFamily: CHROME_FONT,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "var(--accent)",
    marginTop: 8,
  },
  // the older lectionaries close with the proper name in the same accent
  // voice as the office masthead's title below the edition line
  properTitle: {
    fontFamily: SUBHEADING_FONT,
    fontWeight: "600",
    fontSize: 20,
    lineHeight: 27,
    color: "var(--accent)",
    marginTop: 6,
  },
  officeNote: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 13,
    lineHeight: 18,
    color: "var(--text-secondary)",
    marginTop: 8,
  },
  psalmBlock: {
    // clear the bottom rule of the heading above the citation line
    marginTop: 8,
    marginBottom: 22,
    paddingLeft: 4,
  },
  psalmItem: {
    marginTop: 14,
  },
  psalmRef: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 15,
    color: "var(--text-secondary)",
    marginBottom: 6,
  },
  lesson: {
    // clear the bottom rule of the heading above the citation line
    marginTop: 8,
    marginBottom: 22,
  },
  lessonRef: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 15,
    color: "var(--text-secondary)",
  },
  lessonLabel: {
    color: "var(--accent)",
  },
  lessonMissing: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 13,
    lineHeight: 20,
    color: "var(--text-secondary)",
    marginTop: 4,
  },
  dayBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  dayBtnText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 12,
    color: "var(--text-secondary)",
  },
  // when the viewed day is today, the button reads as the active day like
  // the calendar's Today control instead of a disabled dim
  dayBtnTextActive: {
    color: "var(--accent)",
    fontWeight: "600",
  },
});
