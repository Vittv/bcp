import { StyleSheet } from "react-native";
import { officeBarStyles } from "../../components/shell/OfficeTabs";
import { CHROME_FONT } from "../../lib/fonts";

const SERIF = '"Crimson Pro", Georgia, "Times New Roman", serif';
// expo-font registers each face as its own single-face family
const SERIF_SEMI =
  '"Crimson Pro SemiBold", "Crimson Pro", Georgia, "Times New Roman", serif';

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
    paddingHorizontal: 10,
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
    flexShrink: 0,
  },
  barRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    marginLeft: 8,
  },
  backText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 12,
    color: "var(--text-secondary, #7a6e64)",
  },
  list: {
    flexGrow: 1,
  },
  // file-manager rows: hover/selected paint as rounded pills inset from the
  // pane edges, matching the main sidebar nav; the faint hairline divider is
  // kept so the long psalm/collect lists stay scannable
  row: {
    marginHorizontal: 8,
    marginVertical: 1,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border-faint, rgba(44, 32, 32, 0.09))",
  },
  rowHover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  rowInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  // psalm rows pin their geometry to match the collect rows exactly:
  // 22px incipit line + 2×6px padding + 1px hairline = 35px, same as
  // collectIndexTitle's 18 + 2×8 + 1
  psalmRowInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  rowMeta: {
    marginLeft: "auto",
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 12,
    color: "var(--text-secondary, #7a6e64)",
    fontVariant: ["tabular-nums"],
  },
  rowChevron: {
    opacity: 0,
  },
  rowChevronShown: {
    opacity: 1,
  },
  // active matches hover on purpose, same as the sidebar and office tabs
  rowSelected: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  indexBody: {
    paddingBottom: 24,
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
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 18,
    color: "var(--text-secondary, #7a6e64)",
    flex: 1,
  },
  collectRowInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
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
  // number itself sits flush left, lined up with the search text
  psalmNumber: {
    width: 28,
    textAlign: "left",
    fontFamily: SERIF_SEMI,
    fontSize: 15,
    color: "var(--accent, #7a3040)",
    fontVariant: ["tabular-nums"],
  },
  incipit: {
    fontFamily: SERIF,
    fontSize: 17,
    lineHeight: 22,
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
    fontFamily: SERIF_SEMI,
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
    marginBottom: 20,
  },
  groupHeading: {
    fontFamily: CHROME_FONT,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "var(--accent, #7a3040)",
    marginBottom: 10,
  },
  groupRule: {
    borderTopWidth: 1,
    borderTopColor: "var(--border-faint, rgba(44, 32, 32, 0.09))",
    paddingTop: 12,
  },
  collectBody: {
    fontFamily: SERIF,
    fontSize: 17,
    lineHeight: 27,
    color: "var(--text, #2c2020)",
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
  dateBtnActive: {
    backgroundColor: "var(--row-hover, rgba(44, 32, 32, 0.06))",
  },
  dateText: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    fontWeight: "600",
    color: "var(--accent, #7a3040)",
    fontVariant: ["tabular-nums"],
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
  // latched look when the picked date IS today: the same chip-on
  // treatment as OfficeTabs' active toggles
  todayBtnOn: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
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
  popCellSelected: {
    backgroundColor: "var(--accent, #7a3040)",
  },
  popCellText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 12,
    color: "var(--text, #2c2020)",
    fontVariant: ["tabular-nums"],
  },
  popCellTextLight: {
    color: "var(--bg, #e0dbd0)",
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
    ...officeBarStyles.tabActive,
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
  riteChipOn: {
    ...officeBarStyles.toggle,
    ...officeBarStyles.toggleOn,
  },
  riteChipOff: {
    ...officeBarStyles.toggle,
  },
  riteChipText: {
    ...officeBarStyles.toggleText,
    flexShrink: 0,
  },
  riteChipTextOn: {
    ...officeBarStyles.toggleTextOn,
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
  officeBtnActive: {
    backgroundColor: "var(--row-hover, rgba(44, 32, 32, 0.06))",
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
    fontFamily: SERIF_SEMI,
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
