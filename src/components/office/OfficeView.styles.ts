import { CHROME_FONT, SERIF_FONT, SERIF_ITALIC_FONT } from "../../lib/fonts";
import { defineThemedStyles } from "../../lib/theme/themedStyles";

export const officeViewStyles = defineThemedStyles({
  section: {
    marginBottom: 20,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 18,
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border-content)",
  },
  stickyHeader: {
    position: "sticky",
    top: -1,
    backgroundColor: "var(--bg)",
    zIndex: 100,
    isolation: "isolate",
  },
  stickyBlock: {
    paddingTop: 3,
  },
  headingText: {
    flexShrink: 1,
    marginTop: 0,
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  controlOnlyRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
    marginBottom: 2,
  },
  controlOnlyRowFull: {
    marginTop: 4,
    marginBottom: 2,
  },
  // a menu node sits under its rubric, taking the full column
  menuControlRow: {
    marginTop: 4,
    marginBottom: 2,
  },
  resetRow: {
    marginTop: 4,
    marginBottom: 24,
    alignItems: "flex-start",
  },
  rubric: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 18,
    lineHeight: 25,
    color: "var(--text-secondary)",
    marginTop: 4,
    marginBottom: 4,
  },
  rubricRepeatAntiphon: {
    marginTop: 16,
  },
  text: {
    fontFamily: SERIF_FONT,
    fontSize: 18,
    lineHeight: 30,
    color: "var(--text)",
    marginTop: 8,
  },
  textPeople: {
    fontWeight: "700",
  },
  halfVerse: {
    paddingLeft: 20,
  },
  // the printed citation a menu reading names after its passage
  textCitation: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 18,
    lineHeight: 30,
    color: "var(--text-secondary)",
    marginTop: 2,
    marginBottom: 4,
  },
  speaker: {
    fontFamily: SERIF_FONT,
    fontWeight: "600",
    fontSize: 15,
    color: "var(--accent)",
  },
  psalmBlock: {
    marginTop: 22,
    paddingLeft: 4,
  },
  psalmTitle: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 18,
    lineHeight: 30,
    color: "var(--text-secondary)",
    marginBottom: 6,
  },
  lessonBlock: {
    marginBottom: 12,
    paddingLeft: 4,
  },
  lessonRow: {
    marginTop: 22,
  },
  lessonRef: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 18,
    lineHeight: 30,
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
  canticleBlock: {
    marginTop: 26,
    marginBottom: 12,
    paddingLeft: 4,
  },
  // the title takes the shared subheading voice (the same one Venite and
  // Jubilate use); the block's own top margin opens it, so the subheading's
  // default leading space is dropped
  canticleHeading: {
    marginTop: 0,
    marginBottom: 0,
  },
  canticleLatin: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 14,
    color: "var(--text-secondary)",
    marginTop: 2,
    marginBottom: 6,
  },
  canticleSection: {
    fontFamily: CHROME_FONT,
    fontWeight: "600",
    fontSize: 11,
    letterSpacing: 0.4,
    color: "var(--text-secondary)",
    marginTop: 10,
    marginBottom: 2,
  },
  canticleVerse: {
    fontFamily: SERIF_FONT,
    fontSize: 17,
    lineHeight: 28,
    color: "var(--text)",
    marginTop: 6,
  },
  canticleControlRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 2,
  },
  canticleNone: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 15,
    lineHeight: 24,
    color: "var(--text-secondary)",
  },
  // the day collect's block follows its subheading node ("The Collect of the
  // Day"), so the block carries no top margin of its own; the proper title
  // rides under the heading as the label voice
  collectBlock: {
    marginBottom: 10,
    paddingLeft: 4,
  },
  collectLabel: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 15,
    lineHeight: 23,
    color: "var(--text-secondary)",
    marginBottom: 2,
  },
  collectText: {
    fontFamily: SERIF_FONT,
    fontSize: 17,
    lineHeight: 28,
    color: "var(--text)",
  },
  // the subheading on the title opens the block, so the wrapper stays margin-free
  fixedCollectBlock: {
    marginBottom: 10,
    paddingLeft: 4,
  },
  fixedCollectText: {
    fontFamily: SERIF_FONT,
    fontSize: 17,
    lineHeight: 28,
    color: "var(--text)",
  },
});
