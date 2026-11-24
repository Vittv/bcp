import { CHROME_FONT, SERIF_FONT, SERIF_ITALIC_FONT } from "../../lib/fonts";
import { defineThemedStyles } from "../../lib/theme/themedStyles";
import { officeDocumentStyles } from "./officeDocumentStyles";

export const officeViewStyles = defineThemedStyles({
  section: officeDocumentStyles.section,
  headingRow: {
    ...officeDocumentStyles.headingRow,
    // the picker's menu has to out-rank the office text that follows it
    position: "relative",
  },
  // below the raised dropdown layer, so an open menu is not split by a pinned heading
  stickyHeader: {
    position: "sticky",
    // clear the top bar with a little air
    top: -8,
    backgroundColor: "var(--bg)",
    zIndex: 4,
    isolation: "isolate",
  },
  stickyHeaderControl: {
    position: "sticky",
    top: -8,
    backgroundColor: "var(--bg)",
    zIndex: 4,
    isolation: "isolate",
  },
  // a heading holding a picker must out-rank the text that follows it, even
  // on the last section where the heading itself is not sticky
  controlLayer: {
    position: "relative",
    zIndex: 5,
  },
  psalmCycleRow: {
    alignSelf: "flex-start",
    marginTop: 8,
    marginBottom: 4,
  },
  headingText: { ...officeDocumentStyles.headingText, flexShrink: 1 },
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
  // breathing room between the ending versicles and an inline section rule
  beforeSectionHeading: {
    marginBottom: 20,
  },
  resetRow: {
    marginTop: 4,
    marginBottom: 24,
    alignItems: "flex-start",
  },
  rubric: officeDocumentStyles.rubric,
  rubricRepeatAntiphon: {
    marginTop: 16,
  },
  text: { ...officeDocumentStyles.text, marginTop: 8 },
  textPeople: officeDocumentStyles.textPeople,
  halfVerse: {
    paddingLeft: 20,
  },
  // the printed citation a menu reading names after its passage
  textCitation: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 15,
    lineHeight: 24,
    color: "var(--text-secondary)",
    marginTop: 2,
    marginBottom: 4,
  },
  speaker: officeDocumentStyles.speaker,
  psalmBlock: {
    marginTop: 22,
    paddingLeft: 4,
  },
  psalmTitle: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 15,
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
  lessonRef: officeDocumentStyles.lessonRef,
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
  collectAppointment: {
    fontFamily: CHROME_FONT,
    fontSize: 12,
    color: "var(--text-secondary)",
    marginBottom: 4,
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
