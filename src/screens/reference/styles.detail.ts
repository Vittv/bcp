import type { ViewStyle } from "react-native";

import {
  CHROME_FONT,
  HEADING_FONT,
  SERIF_FONT,
  SERIF_ITALIC_FONT,
} from "../../lib/fonts";
import { defineThemedStyles } from "../../lib/theme/themedStyles";

export const DETAIL_COLUMN_WIDTH = 736;
export const DETAIL_COLUMN_PAD_X = 40;
export const DETAIL_COLUMN_PAD_TOP = 32;
export const DETAIL_COLUMN_PAD_BOTTOM = 64;

export function detailPageScale(
  fontScale: number,
  opts?: { preserveMeasure?: boolean },
): ViewStyle | undefined {
  if (fontScale === 1) return undefined;
  if (opts?.preserveMeasure) return undefined;
  return {
    maxWidth: DETAIL_COLUMN_WIDTH / fontScale,
    paddingHorizontal: DETAIL_COLUMN_PAD_X / fontScale,
    paddingTop: DETAIL_COLUMN_PAD_TOP / fontScale,
    paddingBottom: DETAIL_COLUMN_PAD_BOTTOM / fontScale,
  };
}

export const detailStyles = defineThemedStyles({
  detailPage: {
    width: "100%",
    maxWidth: DETAIL_COLUMN_WIDTH,
    marginHorizontal: "auto",
    paddingHorizontal: DETAIL_COLUMN_PAD_X,
    paddingTop: DETAIL_COLUMN_PAD_TOP,
    paddingBottom: DETAIL_COLUMN_PAD_BOTTOM,
  },
  // phone-width inset for the same wrapper: mirrors Today's shell
  // padding (~19px at phone widths) and the list rows' 18px language
  detailPageMobile: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  detailTitle: {
    fontFamily: HEADING_FONT,
    fontWeight: "500",
    fontSize: 30,
    lineHeight: 38,
    color: "var(--text)",
    marginBottom: 4,
  },
  detailSubtitle: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 13,
    color: "var(--text-secondary)",
    marginBottom: 22,
  },
  collectGroup: {
    marginBottom: 0,
  },
  groupHeading: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "var(--text-secondary)",
    paddingVertical: 8,
  },
  // (groupRule removed: categories no longer carry a top border or margin,
  // every element shares the same padded vertical rhythm as the rows)
  collectBody: {
    fontFamily: SERIF_FONT,
    fontSize: 18,
    lineHeight: 29,
    color: "var(--text)",
  },
  // canticles read like psalms but carry unnumbered verses grouped into
  // titled sections, so each section is its own serif block; the title itself
  // is the shared subheading voice (useSubheading), which drops its own top
  // margin here because canticleSection already spaces the sections
  canticleSection: {
    marginBottom: 18,
  },
  canticleSectionTitle: {
    marginTop: 0,
  },
  canticleVerse: {
    fontFamily: SERIF_FONT,
    fontSize: 18,
    lineHeight: 30,
    color: "var(--text)",
  },
  canticleNote: {
    fontFamily: SERIF_FONT,
    fontSize: 15,
    fontStyle: "italic",
    lineHeight: 24,
    color: "var(--text-secondary)",
    marginBottom: 18,
  },
  // the month captions are table column labels, so they follow the line above
  // closely instead of opening a new block
  psalterMonthNote: {
    marginTop: -14,
  },
  // the 30-day psalter lists each portion's citations as their own labeled
  // blocks, the way the lectionary page prints its psalms
  psalterBlock: {
    // clear the bottom rule of the heading above the citation line
    marginTop: 8,
    marginBottom: 22,
    paddingLeft: 4,
  },
  psalterItem: {
    marginTop: 24,
  },
  psalterRef: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 15,
    color: "var(--text-secondary)",
    marginBottom: 6,
  },
  // a lesser feast's title is a block title rather than the page's main
  // heading, so it takes the shared subheading voice; the pane already opens
  // at the top, so the subheading's own top margin is dropped
  lesserFeastTitle: {
    marginTop: 0,
  },
  // a lesser feast's original biography uses the same serif voice as the
  // sanctorale notes, with the Wikipedia and official PDF links below it
  lesserBio: {
    fontFamily: SERIF_FONT,
    fontSize: 17,
    lineHeight: 28,
    color: "var(--text)",
    marginBottom: 22,
  },
  lesserLinkRow: {
    alignSelf: "flex-start",
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginLeft: -6,
  },
  lesserLink: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    fontWeight: "600",
    color: "var(--accent)",
  },
  // date trigger: a chip like every other control in these bars, no
  // border, the bar's single 11px type scale, accent red per the
  // standing decision that date/office triggers read in red
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  dateBtnCompact: {
    paddingHorizontal: 5,
  },
  dateBtnHover: {
    backgroundColor: "var(--control-hover)",
  },
  dateText: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    fontWeight: "600",
    color: "var(--accent)",
    fontVariant: ["tabular-nums"],
  },
  // current-pick chip for the floating pickers: a full-bar strip that takes
  // all the space between the sidebar trigger and the trailing actions. the
  // label leads and an optional right-aligned meta (position/verse counts)
  // fills the rest, so the strip reads as a live caption of the page.
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    // same gap as the bar's arrow buttons so chips and arrows space evenly
    gap: 4,
    flexGrow: 1,
    // fixed 24px like the bar's other buttons (sidebar trigger, arrows);
    // 6px side padding matches the global-search trigger's breathing
    height: 24,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "var(--border)",
    backgroundColor: "var(--surface)",
  },
  pickerBtnHover: {
    backgroundColor: "var(--control-hover)",
  },
  pickerText: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    fontWeight: "500",
    color: "var(--text-secondary)",
    fontVariant: ["tabular-nums"],
    // shrink instead of pushing the chip open; min-width: 0 lets a flex text
    // node shrink below its content width so the label ellipsizes on
    // narrow bars
    flexShrink: 1,
    minWidth: 0,
  },
  // the chip's trailing meta: right-aligned count/verse info in the same
  // 11px muted voice as the list rows' rowMeta
  pickerMeta: {
    marginLeft: "auto",
    fontFamily: CHROME_FONT,
    fontSize: 11,
    fontWeight: "500",
    color: "var(--text-secondary)",
    fontVariant: ["tabular-nums"],
    flexShrink: 0,
  },
  // the hotkey key-cap pinned to the far right of the chip (Ctrl+///⌘+/
  // opens the same picker): a quieter mono voice than the palette footer
  pickerKbd: {
    fontFamily: '"JetBrains Mono", monospace',
    fontWeight: "500",
    fontSize: 11,
    lineHeight: 15,
    fontVariant: ["tabular-nums"],
    color: "var(--text-secondary)",
    // a soft filled keycap, recessed and darker than the surface
    backgroundColor: "var(--key-bg)",
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 1,
    flexShrink: 0,
  },
  stepBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  todayBtn: {
    // fixed width so the bold active label cannot widen the chip and shift
    // the bar's flexed content; the label stays centered in the reserved slot
    width: 56,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  todayBtnCompact: {
    width: 46,
    paddingHorizontal: 5,
  },
  todayText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 11,
    color: "var(--text-secondary)",
  },
  todayTextOn: {
    color: "var(--accent)",
    fontWeight: "700",
  },
});
