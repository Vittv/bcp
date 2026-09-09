import { StyleSheet } from "react-native";
import { officeBarStyles } from "../../components/shell/OfficeTabs";
import {
  CHROME_FONT,
  HEADING_FONT,
  SERIF_FONT,
  SERIF_SEMI_FONT,
} from "../../lib/fonts";

// styles shared across the Psalms, Collects, and Offices reference pages
export const sharedStyles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 300,
  },
  bar: {
    height: 30,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border, #d2cbbf)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // same paddingHorizontal as the sidebar toolbar so the leading button
    // and trailing controls sit at the same inset from their edges
    paddingHorizontal: 6,
    backgroundColor: "var(--bg, #e0dbd0)",
    flexShrink: 0,
    // anchor for the bar's popovers (office menu, month grid). the
    // explicit z-index also lifts this whole bar above the content
    // column that follows it in DOM order — RNW gives the bar
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
    gap: 6,
    // keep the trailing controls clear of the current-pick chip
    marginLeft: 6,
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
    color: "var(--text, #2c2020)",
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
    borderColor: "var(--border-content, #b5aa9e)",
    backgroundColor: "var(--bg, #e0dbd0)",
  },
  arrowBtnHover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
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
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  paletteTray: {
    zIndex: 101,
    width: "100%",
    maxWidth: 720,
    height: "70%",
    maxHeight: "85%",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "var(--bg, #e0dbd0)",
    borderWidth: 1,
    borderColor: "var(--border, #c3bcb2)",
    borderRadius: 10,
    overflow: "hidden",
    boxShadow: "0 8px 24px rgba(20, 15, 15, 0.18)",
  },
  paletteSearch: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 15,
    color: "var(--text, #2c2020)",
    backgroundColor: "transparent",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border, #c3bcb2)",
    flexShrink: 0,
  },
  paletteBody: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    paddingVertical: 4,
  },
  paletteFooter: {
    flexDirection: "row",
    gap: 18,
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "var(--border, #c3bcb2)",
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
    color: "var(--text, #2c2020)",
  },
  paletteKbd: {
    fontFamily: '"JetBrains Mono", monospace',
    fontWeight: "400",
    fontSize: 11,
    color: "var(--text, #2c2020)",
    borderWidth: 1,
    borderColor: "var(--border, #b9b0a2)",
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
    color: "var(--accent, #7a3040)",
  },
  rowHover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  // picked rows turn every text node accent red instead of painting a
  // background fill; hover paints the rowHover fill on top of that state.
  // the keyboard cursor lights the same text nodes, so arrows are visible
  rowTextActive: {
    color: "var(--accent, #7a3040)",
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
    color: "var(--text-secondary, #7a6e64)",
    fontVariant: ["tabular-nums"],
  },
  // the book list's chapter counter in the bible navigator reads in the
  // same red as the saints' date counter, marking the row's span
  bibleChapterCount: {
    color: "var(--accent, #7a3040)",
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
  // collects desktop index rows pad 18 like rowInner; headings align
  groupHeadingIndex: {
    paddingLeft: 18,
  },
  // collect titles are navigation labels rather than prayed text, so
  // they stay sans; like the sidebar nav they sit in the muted
  // secondary ink, and the serif is reserved for the compare view
  collectIndexTitle: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    color: "var(--text-secondary, #7a6e64)",
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
    color: "var(--accent, #7a3040)",
    fontVariant: ["tabular-nums"],
  },
  saintTitle: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    color: "var(--text-secondary, #7a6e64)",
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
    color: "var(--text-secondary, #7a6e64)",
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
    color: "var(--accent, #7a3040)",
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
    color: "var(--text, #2c2020)",
    fontVariant: ["tabular-nums"],
  },
  incipit: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
    color: "var(--text-secondary, #7a6e64)",
    flex: 1,
  },
  empty: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 14,
    color: "var(--text-secondary, #7a6e64)",
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
    maxWidth: 736,
    marginHorizontal: "auto",
    paddingHorizontal: 40,
    paddingTop: 28,
    paddingBottom: 64,
  },
  // phone-width inset for the same wrapper: mirrors Today's shell
  // padding (~19px at phone widths) and the list rows' 18px language
  detailPageMobile: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  detailTitle: {
    fontFamily: HEADING_FONT,
    fontWeight: "700",
    fontSize: 30,
    lineHeight: 38,
    color: "var(--text, #2c2020)",
    marginBottom: 4,
  },
  detailSubtitle: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 13,
    color: "var(--text-secondary, #7a6e64)",
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
    color: "var(--text-secondary, #7a6e64)",
    paddingVertical: 8,
  },
  // (groupRule removed: categories no longer carry a top border or margin,
  // every element shares the same padded vertical rhythm as the rows)
  collectBody: {
    fontFamily: SERIF_FONT,
    fontSize: 17,
    lineHeight: 27,
    color: "var(--text, #2c2020)",
  },
  // canticles read like psalms but carry unnumbered verses grouped into
  // titled sections, so each section is its own serif block
  canticleSection: {
    marginBottom: 18,
  },
  canticleSectionTitle: {
    fontFamily: HEADING_FONT,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "600",
    color: "var(--accent, #7a3040)",
    marginBottom: 6,
  },
  canticleVerse: {
    fontFamily: SERIF_FONT,
    fontSize: 17,
    lineHeight: 29,
    color: "var(--text, #2c2020)",
  },
  canticleNote: {
    fontFamily: SERIF_FONT,
    fontSize: 15,
    fontStyle: "italic",
    lineHeight: 24,
    color: "var(--text-secondary, #7a6e64)",
    marginBottom: 18,
  },
  // date trigger: a chip like every other control in these bars — no
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
  dateBtnHover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  dateText: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    fontWeight: "600",
    color: "var(--accent, #7a3040)",
    fontVariant: ["tabular-nums"],
  },
  // current-pick chip for the floating pickers: a full-bar strip that takes
  // all the space between the sidebar trigger and the trailing actions. the
  // label leads and an optional right-aligned meta (position/verse counts)
  // fills the rest, so the strip reads as a live caption of the page.
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexGrow: 1,
    // a fixed 24px like the bar's other buttons (sidebar trigger, arrows)
    // so the chip reads at the same height as its neighbors instead of
    // stretching to the bar's full 30px
    height: 24,
    paddingHorizontal: 10,
    paddingVertical: 1,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "var(--border-content, #b5aa9e)",
    backgroundColor: "var(--bg, #e0dbd0)",
  },
  pickerBtnHover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  pickerText: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    fontWeight: "500",
    color: "var(--text-secondary, #7a6e64)",
    fontVariant: ["tabular-nums"],
    // shrink instead of pushing the fixed-width chip open; the label
    // truncates with ellipsis when it outgrows the chip
    flexShrink: 1,
  },
  // the chip's trailing meta: right-aligned count/verse info in the same
  // 11px muted voice as the list rows' rowMeta
  pickerMeta: {
    marginLeft: "auto",
    fontFamily: CHROME_FONT,
    fontSize: 11,
    fontWeight: "500",
    color: "var(--text-secondary, #7a6e64)",
    fontVariant: ["tabular-nums"],
    flexShrink: 0,
  },
  // the hotkey key-cap pinned to the far right of the chip (Ctrl+///⌘+/
  // opens the same picker): a quieter mono voice than the palette footer
  pickerKbd: {
    fontFamily: '"JetBrains Mono", monospace',
    fontWeight: "700",
    fontSize: 11,
    lineHeight: 15,
    fontVariant: ["tabular-nums"],
    color: "var(--text-secondary, #7a6e64)",
    borderWidth: 1,
    borderColor: "var(--border-content, #b5aa9e)",
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  todayText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 11,
    color: "var(--text-secondary, #7a6e64)",
  },
  todayTextOn: {
    ...officeBarStyles.tabTextActive,
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
    borderColor: "var(--border-content, #b5aa9e)",
    // raised surface: one step lighter than --bg so panels float over
    // the page instead of reading as a hole in it
    backgroundColor: "var(--bg-raised, #ece7dd)",
    shadowColor: "#000",
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
    color: "var(--text, #2c2020)",
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
    borderColor: "var(--accent, #7a3040)",
  },
  popCellSelected: {},
  popCellText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 12,
    color: "var(--text, #2c2020)",
    fontVariant: ["tabular-nums"],
  },
  popCellTextSelected: {
    color: "var(--accent, #7a3040)",
    fontWeight: "700",
  },
  // office picker tabs in the desktop bar — spread directly from the
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
  // trad/cont rite toggle: the same chip language as OfficeTabs'
  // Rubrics/Speakers toggles, as a two-option segment
  riteSeg: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginRight: 6,
  },
  riteChip: {
    ...officeBarStyles.toggle,
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
    color: "var(--accent, #7a3040)",
    fontWeight: "700",
  },
  // mobile office dropdown: a chip-styled trigger matching the tab
  // chips' padding, plus a simple menu list anchored under the bar
  officeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 6,
  },
  officeBtnHover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  officeBtnText: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    fontWeight: "600",
    color: "var(--accent, #7a3040)",
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
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  popMenuItemText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 13,
    color: "var(--text, #2c2020)",
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
    fontWeight: "700",
    fontSize: 24,
    lineHeight: 32,
    color: "var(--text, #2c2020)",
    marginBottom: 4,
  },
  bibleReaderSubtitle: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 14,
    color: "var(--text-secondary, #7a6e64)",
  },
  bibleLoading: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 16,
    color: "var(--text-secondary, #7a6e64)",
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
    borderTopColor: "var(--border-faint, rgba(44, 32, 32, 0.09))",
  },
  bibleNavBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "var(--border-content, #b5aa9e)",
  },
  bibleNavBtnHover: {
    backgroundColor: "var(--control-hover, rgba(44, 32, 32, 0.06))",
  },
  bibleNavBtnDisabled: {
    opacity: 0.4,
  },
  bibleNavBtnText: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    fontWeight: "600",
    color: "var(--text, #2c2020)",
  },
  bibleChapterIndicator: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 13,
    color: "var(--text-secondary, #7a6e64)",
  },
  // Bible bar
  bibleBar: {
    height: 30,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border, #d2cbbf)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    backgroundColor: "var(--bg, #e0dbd0)",
    flexShrink: 0,
    position: "relative",
    zIndex: 2,
  },
  bibleBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
  },
  bibleBarCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    flex: 1,
    justifyContent: "center",
    overflow: "hidden",
  },
  bibleBarCenterCompact: {
    justifyContent: "flex-start",
  },
  bibleBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bibleBookSegment: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "transparent",
  },
  bibleBookSegmentHover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  bibleBookSegmentActive: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
    borderColor: "var(--accent, #7a3040)",
  },
  bibleBookSegmentRead: {
    borderColor: "var(--accent, #7a3040)",
  },
  bibleBookSegmentText: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    fontWeight: "600",
    color: "var(--text-secondary, #7a6e64)",
  },
  bibleBookSegmentTextActive: {
    color: "var(--accent, #7a3040)",
    fontWeight: "700",
  },
  bibleResetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "var(--border-content, #b5aa9e)",
    backgroundColor: "var(--bg-raised, #ece7dd)",
  },
  bibleResetBtnHover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  bibleResetBtnText: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    fontWeight: "600",
    color: "var(--text-secondary, #7a6e64)",
  },
  bibleDropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "var(--border-content, #b5aa9e)",
    backgroundColor: "var(--bg-raised, #ece7dd)",
    flex: 1,
    justifyContent: "center",
  },
  bibleDropdownText: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    fontWeight: "600",
    color: "var(--text, #2c2020)",
  },
  bibleDropdownMenu: {
    position: "absolute",
    top: 30,
    left: 10,
    right: 10,
    zIndex: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "var(--border-content, #b5aa9e)",
    backgroundColor: "var(--bg-raised, #ece7dd)",
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    maxHeight: 300,
  },
  bibleDropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border-faint, rgba(44, 32, 32, 0.09))",
  },
  bibleDropdownItemActive: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  bibleDropdownItemText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 13,
    color: "var(--text, #2c2020)",
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
    color: "var(--text, #2c2020)",
  },
});
