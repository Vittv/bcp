import { monthPickerStyles } from "../../components/shell/MonthPicker.styles";
import { officeBarStyles } from "../../components/shell/officeBarStyles";
import { CHROME_FONT, HEADING_FONT } from "../../lib/fonts";
import { defineThemedStyles } from "../../lib/theme/themedStyles";

export const overlayStyles = defineThemedStyles({
  popBackdrop: {
    position: "absolute",
    top: -10000,
    left: -10000,
    width: 30000,
    height: 30000,
    zIndex: 40,
  },
  // the month grid is shared with the Today date button so both pickers
  // stay visually identical
  popover: monthPickerStyles.popover,
  popNav: monthPickerStyles.popNav,
  popMonth: monthPickerStyles.popMonth,
  popGrid: monthPickerStyles.popGrid,
  popCell: monthPickerStyles.popCell,
  popCellToday: monthPickerStyles.popCellToday,
  popCellSelected: monthPickerStyles.popCellSelected,
  popCellText: monthPickerStyles.popCellText,
  popCellTextSelected: monthPickerStyles.popCellTextSelected,
  popToday: monthPickerStyles.popToday,
  popTodayText: monthPickerStyles.popTodayText,
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
