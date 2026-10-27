import type { ViewStyle } from "react-native";
import { officeBarStyles } from "../../components/shell/officeBarStyles";
import {
  CHROME_FONT,
  HEADING_FONT,
  SERIF_FONT,
  SERIF_ITALIC_FONT,
} from "../../lib/fonts";
import { defineThemedStyles } from "../../lib/theme/themedStyles";

// the detail column's fixed measures. font scaling zooms the pane, which
// widens the layout viewport, so a fixed max-width would paint narrower and
// pad the side margins.
const DETAIL_COLUMN_WIDTH = 736;
const DETAIL_COLUMN_PAD_X = 40;
const DETAIL_COLUMN_PAD_TOP = 32;
const DETAIL_COLUMN_PAD_BOTTOM = 64;

// inverse-zoom overrides applied beside sharedStyles.detailPage when a pane is
// zoomed, so a font-size change reflows the text without shrinking the column
export function detailPageScale(fontScale: number): ViewStyle | undefined {
  if (fontScale === 1) return undefined;
  return {
    maxWidth: DETAIL_COLUMN_WIDTH / fontScale,
    paddingHorizontal: DETAIL_COLUMN_PAD_X / fontScale,
    paddingTop: DETAIL_COLUMN_PAD_TOP / fontScale,
    paddingBottom: DETAIL_COLUMN_PAD_BOTTOM / fontScale,
  };
}

// styles shared across the Psalms, Collects, and Offices reference pages.
// a themed definition (var(--token) strings); consumers resolve it with
// useThemedStyles so it paints from the theme on web and native alike
export const sharedStyles = defineThemedStyles({
  container: {
    flex: 1,
    minHeight: 300,
  },
  bar: {
    height: 30,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // same paddingHorizontal as the sidebar toolbar so the leading button
    // and trailing controls sit at the same inset from their edges
    paddingHorizontal: 6,
    backgroundColor: "var(--bg)",
    flexShrink: 0,
    // anchor for the bar's popovers (office menu, month grid). the
    // explicit z-index also lifts this whole bar above the content
    // column that follows it in DOM order, RNW gives the bar
    // z-index:0, which made the page paint over the popovers
    position: "relative",
    zIndex: 2,
  },
  barLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexGrow: 1,
    flexShrink: 0,
    minWidth: 0,
  },
  barRight: {
    flexDirection: "row",
    alignItems: "center",
    // every chip gap in the bar matches the two arrows' spacing
    gap: 4,
    // keep the trailing controls clear of the current-pick chip
    marginLeft: 4,
    flexShrink: 0,
  },
  // narrow bars tighten the chip spacing so the office name, date, and rites
  // share one line; Today joins them once there is room
  barRightCompact: {
    gap: 2,
  },
  // the search fills whatever bar space the leading/back buttons leave,
  // borderless so the whole strip reads as one field; keep its height
  // under the 30px bar so it never crowds the border above. the small
  // left inset keeps its focus ring clear of the sidebar button; the
  // reduced inner padding puts its text at the same 18px inset as the
  // list rows below
  search: {
    flex: 1,
    minWidth: 0,
    marginLeft: 4,
    borderWidth: 0,
    backgroundColor: "transparent",
    paddingHorizontal: 4,
    paddingVertical: 3,
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 14,
    color: "var(--text)",
  },
  // chapter-arrow controls on the testament bars: compact squares matching
  // the bar's other bordered buttons, muted fill that darkens on hover
  arrowBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "var(--border)",
    backgroundColor: "var(--surface)",
  },
  arrowBtnHover: {
    backgroundColor: "var(--control-hover)",
  },
  // the floating picker frame (aetheryte-style search tray): a dimmed
  // backdrop, a centered card whose search field is pinned to the top and
  // the navigation hint row pinned to the bottom, with the result list
  // scrolling in between
  paletteOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    backgroundColor: "var(--scrim)",
    // slight blur behind the tray keeps the page readable under the dim
    backdropFilter: "blur(3px)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  // auto-height mode: the global search anchors to the top, so its search
  // field begins exactly where the scoped pickers' does (15% down, the
  // top edge of their fixed 70% frame) and the card grows downward
  paletteOverlayAuto: {
    justifyContent: "flex-start",
  },
  // coarse-pointer phones: the tray drops its own 15% line is applied as
  // pixels in SearchPalette (percent margins resolve against the container
  // width, not height, so "15%" would sit far too high on a narrow phone)
  paletteOverlayMobile: {
    justifyContent: "flex-start",
  },
  paletteTrayMobile: {
    height: "55%",
    maxHeight: "55%",
  },
  paletteTray: {
    zIndex: 101,
    width: "100%",
    maxWidth: 720,
    height: "70%",
    maxHeight: "85%",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "var(--bg)",
    borderWidth: 1,
    borderColor: "var(--border)",
    borderRadius: 10,
    overflow: "hidden",
    boxShadow: "0 8px 24px var(--panel-shadow)",
  },
  // the global search palette sizes to its results instead of claiming
  // the scoped picker's fixed 70%: an empty query renders as a slim
  // card that grows as results stream in, with the picker's fixed
  // height merely capping the tall end of a long query
  paletteTrayAuto: {
    height: "auto",
    maxHeight: "70%",
  },
  paletteSearch: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 15,
    color: "var(--text)",
    backgroundColor: "transparent",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border)",
    flexShrink: 0,
  },
  paletteBody: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    paddingVertical: 4,
  },
  // auto-height mode: shrink instead of grow, so the body hugs its rows
  paletteBodyAuto: {
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: "auto",
  },
  paletteFooter: {
    flexDirection: "row",
    gap: 18,
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "var(--border)",
    opacity: 0.85,
    flexShrink: 0,
  },
  paletteHint: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  paletteHintText: {
    fontFamily: CHROME_FONT,
    fontWeight: "400",
    fontSize: 12,
    color: "var(--text)",
  },
  paletteKbd: {
    fontFamily: '"JetBrains Mono", monospace',
    fontWeight: "400",
    fontSize: 11,
    color: "var(--text)",
    borderWidth: 1,
    borderColor: "var(--border)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  list: {
    flexGrow: 1,
  },
  // file-manager rows: full-width hover bands; the
  // 18px padding sits the search text and row text on the same left edge
  row: {
    position: "relative",
  },
  // the tiny red ▸ cursor that marks the active row, aligned with the
  // search field's text (16px inset) and drawn in the gutter the item
  // rows indent by, exactly like the aetheryte picker's selected arrow
  pickerCursor: {
    position: "absolute",
    left: 16,
    top: "50%",
    marginTop: -8,
    fontSize: 14,
    lineHeight: 16,
    color: "var(--accent)",
  },
  rowHover: {
    backgroundColor: "var(--control-hover)",
  },
  // picked rows turn every text node accent red instead of painting a
  // background fill; hover paints the rowHover fill on top of that state.
  // the keyboard cursor lights the same text nodes, so arrows are visible
  rowTextActive: {
    color: "var(--accent)",
  },
  rowInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingLeft: 34,
    paddingRight: 18,
  },
  // psalm rows pin their geometry to match the collect rows exactly:
  // 18px incipit line + 2×8px padding + 1px hairline = 35px, same as
  // collectIndexTitle's 18 + 2×8 + 1
  psalmRowInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingLeft: 34,
    paddingRight: 18,
  },
  rowMeta: {
    marginLeft: "auto",
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 11,
    color: "var(--text-secondary)",
    fontVariant: ["tabular-nums"],
  },
  // the reader's own state in a row's trailing slot, where the bare counts
  // beside it are facts about the item. accent, because it is about the
  // reader; the wording carries it too, so colour is never the only cue
  rowMetaReading: {
    color: "var(--accent)",
  },
  rowChevron: {
    opacity: 0,
  },
  rowChevronShown: {
    opacity: 1,
  },
  indexBody: {
    // the split-pane variant still pads the tail, but the palette needs
    // no extra space (the list ends exactly at the last row)
  },
  // headings sit on the cursor arrow's 16px track so the active-row ▸
  // points up into its category; item rows keep their deeper 34px gutter
  groupHeadingIndex: {
    paddingLeft: 16,
  },
  // collect titles are navigation labels rather than prayed text, so
  // they stay sans; like the sidebar nav they sit in the muted
  // secondary ink, and the serif is reserved for the compare view
  collectIndexTitle: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    color: "var(--text-secondary)",
    flex: 1,
  },
  collectRowInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingLeft: 34,
    paddingRight: 18,
  },
  // saint rows carry a short date pinned to the trailing edge so the
  // calendar races itself at a glance while titles keep the ragged-left
  // edge; the min-width keeps the right-aligned column tidy
  saintRowInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingLeft: 34,
    paddingRight: 18,
  },
  saintDate: {
    minWidth: 44,
    flexShrink: 0,
    textAlign: "right",
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 11,
    color: "var(--accent)",
    fontVariant: ["tabular-nums"],
  },
  saintTitle: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    color: "var(--text-secondary)",
    flex: 1,
  },
  // canticle titles are proper names (The Song of Mary, Nunc Dimittis)
  // rather than first-line incipits, so the picker lists them in the same
  // sans navigation voice as collects and saints; the pair keeps the row at
  // the pinned 35px (18px line + 2×8 padding + hairline)
  canticleIndexTitle: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    color: "var(--text-secondary)",
    flex: 1,
  },
  // the canticle picker lists titles only, no number gutter: every row
  // reads title + verse count on the same edge as the other pickers
  // rites always print one above the other at full measure: the
  // horizontal wrap is only useful at extreme widths and fights the
  // 736px column language
  compareRow: {
    gap: 24,
  },
  // rites stack at full measure; each block sizes to its own text
  compareCol: {},
  compareRite: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "var(--accent)",
    marginBottom: 10,
  },
  // fixed-width gutter keeps every incipit on the same edge while the
  // number itself sits flush left, lined up with the search text; digits
  // read in content ink, never red
  psalmNumber: {
    width: 28,
    textAlign: "left",
    fontFamily: CHROME_FONT,
    fontSize: 13,
    fontWeight: "500",
    color: "var(--text)",
    fontVariant: ["tabular-nums"],
  },
  incipit: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
    color: "var(--text-secondary)",
    flex: 1,
  },
  empty: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 14,
    color: "var(--text-secondary)",
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  // detail views keep a readable measure but sit hard left, unlike the
  // centered document column used by the Today page
  // detail column matches Today and the offices browser: same
  // 46rem-equivalent measure, centered via auto margins in both the
  // split pane and mobile wrapper
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
  // the 30-day psalter lists each portion's citations as their own labeled
  // blocks, the way the lectionary page prints its psalms
  psalterBlock: {
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
  popBackdrop: {
    position: "absolute",
    top: -10000,
    left: -10000,
    width: 30000,
    height: 30000,
    zIndex: 40,
  },
  popover: {
    position: "absolute",
    top: 30,
    left: 10,
    zIndex: 50,
    width: 259,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "var(--border-content)",
    // raised surface: one step lighter than --bg so panels float over
    // the page instead of reading as a hole in it
    backgroundColor: "var(--bg-raised)",
    shadowColor: "var(--shadow-color)",
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  popNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  popMonth: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    fontWeight: "600",
    color: "var(--text)",
  },
  popGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  popCell: {
    width: "14.2857%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  popCellToday: {
    borderWidth: 1,
    borderColor: "var(--accent)",
  },
  popCellSelected: {},
  popCellText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 12,
    color: "var(--text)",
    fontVariant: ["tabular-nums"],
  },
  popCellTextSelected: {
    color: "var(--accent)",
    fontWeight: "700",
  },
  // the picker's Today shortcut, which stays available when the bar drops
  // its own chip on narrow phones
  popToday: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: "var(--border)",
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  popTodayText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 11,
    color: "var(--text-secondary)",
  },
  // office picker tabs in the desktop bar, spread directly from the
  // Today page's OfficeTabs stylesheet so the two bars cannot drift
  offTabs: {
    ...officeBarStyles.tabsLeft,
  },
  offTab: {
    ...officeBarStyles.tab,
  },
  offTabActive: {
    ...officeBarStyles.tabHover,
  },
  offTabText: {
    ...officeBarStyles.tabText,
    flexShrink: 0,
  },
  offTabTextActive: {
    ...officeBarStyles.tabTextActive,
  },
  // rite I/II toggle: the same chip language as OfficeTabs'
  // Rubrics/Speakers toggles, laid out as a two-option segment
  riteSeg: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginRight: 6,
  },
  riteSegCompact: {
    marginRight: 0,
  },
  riteChip: {
    ...officeBarStyles.toggle,
  },
  riteChipCompact: {
    paddingHorizontal: 5,
  },
  riteChipText: {
    ...officeBarStyles.toggleText,
    flexShrink: 0,
  },
  riteChipTextOn: {
    ...officeBarStyles.toggleTextOn,
  },
  // the saints bar's bio/liturgy view toggles: a right-aligned pair of
  // chips shown only once a saint is on screen, in the same chip voice
  // as the rites toggle so the detail pane's controls feel connected
  saintToggles: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  toggleOn: {
    color: "var(--accent)",
    fontWeight: "700",
  },
  // mobile office dropdown: a chip-styled trigger matching the tab
  // chips' padding, plus a simple menu list anchored under the bar
  officeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 6,
  },
  officeBtnCompact: {
    paddingHorizontal: 5,
  },
  officeBtnHover: {
    backgroundColor: "var(--control-hover)",
  },
  officeBtnText: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    fontWeight: "600",
    color: "var(--accent)",
    flexShrink: 1,
  },
  popMenuWide: {
    left: 10,
    right: 10,
    width: "auto",
  },
  // the date popover hangs under the right-hand controls cluster
  popRight: {
    left: "auto",
    right: 10,
  },
  popMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  popMenuItemSelected: {
    backgroundColor: "var(--control-hover)",
  },
  popMenuItemText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 13,
    color: "var(--text)",
  },
  // Bible reader
  bibleContainer: {
    flex: 1,
  },
  bibleContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  bibleReaderHeader: {
    marginBottom: 16,
    paddingTop: 8,
  },
  bibleReaderTitle: {
    fontFamily: HEADING_FONT,
    fontWeight: "500",
    fontSize: 24,
    lineHeight: 32,
    color: "var(--text)",
    marginBottom: 4,
  },
  bibleReaderSubtitle: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 14,
    color: "var(--text-secondary)",
  },
  bibleLoading: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 16,
    color: "var(--text-secondary)",
    textAlign: "center",
    marginTop: 40,
  },
  bibleChapterNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "var(--border-faint)",
  },
  bibleNavBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "var(--border)",
    backgroundColor: "var(--surface)",
  },
  bibleNavBtnHover: {
    backgroundColor: "var(--control-hover)",
  },
  bibleNavBtnDisabled: {
    opacity: 0.4,
  },
  bibleNavBtnText: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    fontWeight: "600",
    color: "var(--text)",
  },
  bibleChapterIndicator: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 13,
    color: "var(--text-secondary)",
  },
  // bottom chapter navigation
  bibleBottomNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  bibleNavBtnRight: {
    flexDirection: "row",
  },
  bibleNavLabel: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    fontWeight: "400",
    color: "var(--text)",
  },
});
