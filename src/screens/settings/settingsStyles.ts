import {
  CHROME_FONT,
  HEADING_FONT,
  SERIF_FONT,
  SERIF_ITALIC_FONT,
  SUBHEADING_FONT,
} from "../../lib/fonts";
import { defineThemedStyles } from "../../lib/theme/themedStyles";

const MONO = '"JetBrains Mono", monospace';

export const settingsStyles = defineThemedStyles({
  // the modal's head is two seating bars split at the rail's right border:
  // the rail bar always says settings, and the pane bar carries the
  // section's small-caps title with the close X at its end
  frame: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    // drags in the modal should move the eye, not highlight chrome; the
    // search field overrides this with userSelect: text
    userSelect: "none",
  },
  chrome: {
    flex: 1,
    flexDirection: "row",
    minHeight: 0,
  },
  chromeMobile: {
    flex: 1,
    minHeight: 0,
  },
  rail: {
    width: 224,
    flexShrink: 0,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    borderRightWidth: 1,
    borderRightColor: "var(--border)",
    backgroundColor: "var(--bg)",
  },
  railHead: {
    flexShrink: 0,
    height: 44,
    paddingHorizontal: 10,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "var(--border)",
  },
  // the mag-glass field uses the global search trigger's surface fill so
  // both search controls read as the same kind of control
  searchField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "var(--border)",
    backgroundColor: "var(--surface)",
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 13,
    color: "var(--text)",
    padding: 0,
    // the field is real text, so the caret can land and text can be selected
    userSelect: "text",
  },
  searchClear: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  searchClearHover: {
    backgroundColor: "var(--control-hover)",
  },
  eyebrow: {
    fontFamily: CHROME_FONT,
    fontWeight: "600",
    fontSize: 13,
    letterSpacing: 0.2,
    color: "var(--text-secondary)",
  },
  railScroll: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 12,
  },
  // hairline between the rail's blocks, inset to the row edges; the first
  // block has none, so the list does not open on a rule
  railDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "var(--border-faint)",
    marginHorizontal: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  railRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 4,
  },
  railRowHover: {
    backgroundColor: "var(--control-hover)",
  },
  railIcon: {
    width: 18,
    alignItems: "center",
    color: "var(--text-secondary)",
    // idle rail icons recede exactly like the nav sidebar's
    opacity: 0.6,
  },
  railIconActive: {
    color: "var(--accent)",
    opacity: 1,
  },
  railRowLabel: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 14,
    color: "var(--text-secondary)",
  },
  railRowLabelActive: {
    color: "var(--accent)",
    fontWeight: "600",
  },
  railFoot: {
    flexShrink: 0,
    height: 40,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: "var(--border)",
    justifyContent: "center",
  },
  railFootText: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    lineHeight: 16,
    color: "var(--text-secondary)",
  },
  // the phone layout's 44px head: search (or back + section title) with the
  // close X, exactly the height of the desktop seats
  mobileHead: {
    flexShrink: 0,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border)",
  },
  mobileHeadSearch: {
    flex: 1,
    minWidth: 0,
  },
  mobileHeadTitle: {
    flex: 1,
    minWidth: 0,
    fontFamily: CHROME_FONT,
    fontWeight: "600",
    fontSize: 13,
    letterSpacing: 0.2,
    color: "var(--text-secondary)",
    textAlign: "center",
  },
  // the detail page's back control: chevron plus the previous screen's name,
  // the same recipe the system settings list uses
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    height: 34,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  backButtonHover: {
    backgroundColor: "var(--control-hover)",
  },
  backText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 13,
    color: "var(--text-secondary)",
  },
  backTextHover: {
    color: "var(--text)",
  },
  mobileList: {
    flex: 1,
    minHeight: 0,
  },
  // the phone list's block rule, inset to the rows' text column
  mobileDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "var(--border-faint)",
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 4,
  },
  // a tappable system-settings row: icon, label, and the trailing chevron
  // that marks the drill-down
  mobileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 40,
    marginHorizontal: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  mobileRowHover: {
    backgroundColor: "var(--control-hover)",
  },
  mobileRowLabel: {
    flex: 1,
    minWidth: 0,
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 14,
    color: "var(--text-secondary)",
  },
  mobileEmpty: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    color: "var(--text-secondary)",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  mobilePaneScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },
  pane: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
  },
  paneHead: {
    flexShrink: 0,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 28,
    paddingRight: 10,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border)",
  },
  paneCloseBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  paneCloseBtnHover: {
    backgroundColor: "var(--control-hover)",
  },
  paneTitle: {
    fontFamily: HEADING_FONT,
    fontWeight: "500",
    fontSize: 30,
    lineHeight: 38,
    color: "var(--text)",
    marginTop: 4,
  },
  paneDescription: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    lineHeight: 19,
    color: "var(--text-secondary)",
    marginTop: 6,
    maxWidth: 560,
  },
  paneScroll: {
    flex: 1,
    minHeight: 0,
  },
  paneScrollContent: {
    paddingHorizontal: 28,
    paddingTop: 14,
    paddingBottom: 40,
  },
  noMatches: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    color: "var(--text-secondary)",
    marginTop: 4,
  },
  // the page's fancy heading stays at the top of the pane scroll, under the
  // modal's slim bar; it scrolls with the settings instead of pinning above
  paneIntro: {
    paddingBottom: 18,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border)",
  },
  section: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border)",
  },
  // the font pickers float a menu past their own box, and every View is its own
  // stacking context (RNW gives them z-index:0), so the section holding them
  // must out-rank the sections that follow it; otherwise the later content
  // paints over the open menu and makes it look transparent
  sectionRaised: {
    zIndex: 1,
  },
  // the font family pickers and the size group below read as one block: this
  // section draws no rule of its own, and the field's frame closes the group,
  // so only a gap separates it from the size block
  sectionFlush: {
    borderBottomWidth: 0,
    paddingBottom: 0,
    marginBottom: 28,
  },
  // the sample's paper panel, raised off the page so the specimen reads as its
  // own object instead of as more settings content
  preview: {
    overflow: "hidden",
    backgroundColor: "var(--bg-raised)",
    borderWidth: 1,
    borderColor: "var(--border)",
    borderRadius: 6,
    padding: 16,
    marginBottom: 20,
  },
  // the specimen under the size control: a page as the reader sets it, a chrome
  // line, a page title, a block title, a prayer, and a rubric, the faces together
  mockChrome: {
    fontFamily: CHROME_FONT,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.4,
    color: "var(--text-secondary)",
  },
  mockHeading: {
    fontFamily: HEADING_FONT,
    fontWeight: "500",
    fontSize: 18,
    lineHeight: 24,
    color: "var(--text)",
    marginTop: 6,
  },
  mockSubheading: {
    fontFamily: SUBHEADING_FONT,
    fontWeight: "600",
    fontSize: 16,
    lineHeight: 22,
    color: "var(--text)",
    marginTop: 8,
  },
  mockBody: {
    fontFamily: SERIF_FONT,
    fontSize: 16,
    lineHeight: 26,
    color: "var(--text)",
    marginTop: 8,
  },
  mockRubric: {
    fontFamily: SERIF_ITALIC_FONT,
    fontSize: 14,
    lineHeight: 22,
    color: "var(--text-secondary)",
    marginTop: 8,
  },
  // the font pickers share one field: a hairline frame and rounding group the
  // three rows, and each row's own surface-filled control stays the only
  // tinted thing, so the dropdown still reads as the interactive element. no
  // overflow clip here: the pickers' menus float past the group's bottom edge
  fontGroup: {
    borderWidth: 1,
    borderColor: "var(--border)",
    borderRadius: 8,
  },
  fontGroupDivider: {
    height: 1,
    backgroundColor: "var(--border)",
  },
  label: {
    fontFamily: CHROME_FONT,
    fontSize: 16,
    fontWeight: "600",
    color: "var(--text)",
    marginBottom: 8,
  },
  value: {
    fontFamily: CHROME_FONT,
    fontWeight: "400",
    fontSize: 14,
    color: "var(--text-secondary)",
  },
  groupRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  groupLabelRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  groupLabel: {
    fontFamily: CHROME_FONT,
    fontSize: 16,
    fontWeight: "600",
    color: "var(--text)",
  },
  reset: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "var(--border)",
  },
  resetHover: {
    backgroundColor: "var(--control-hover)",
  },
  resetText: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    color: "var(--text-secondary)",
  },
  sliderWrap: {
    marginTop: 30,
    marginBottom: 30,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  // let five-option style pickers wrap on narrow panes instead of shrinking
  rowWrap: {
    flexWrap: "wrap",
  },
  option: {
    fontFamily: CHROME_FONT,
    fontWeight: "400",
    fontSize: 15,
    color: "var(--text-secondary)",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "var(--border)",
    backgroundColor: "var(--surface)",
    overflow: "hidden",
  },
  optionActive: {
    color: "var(--accent)",
    borderColor: "var(--accent)",
    fontWeight: "600",
  },
  // a standalone option-plate button; neutral, as forgetting is not a primary action
  resetBtn: {
    alignSelf: "flex-start",
    fontWeight: "500",
    backgroundColor: "transparent",
  },
  // a control with nothing left to do
  optionDisabled: {
    opacity: 0.4,
  },
  // translation abbreviations read as technical tokens, so they use the
  // app's mono face like keycaps and status text
  optionMono: {
    fontFamily: MONO,
  },
  actionBtn: {
    fontFamily: CHROME_FONT,
    fontSize: 15,
    fontWeight: "600",
    color: "var(--on-accent)",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 4,
    backgroundColor: "var(--accent)",
    overflow: "hidden",
  },
  // the one-line description under any option control; same recipe as the
  // pane header's description so every setting reads uniformly
  settingDescription: {
    fontFamily: CHROME_FONT,
    fontWeight: "400",
    fontSize: 13,
    lineHeight: 19,
    color: "var(--text-secondary)",
    marginTop: 8,
    maxWidth: 560,
  },
  // the theme picker: a wrapping row of miniature palette cards
  themeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  themeOption: {
    alignItems: "center",
    gap: 6,
  },
  // the frame carries the family's page background; the inner panel stands in
  // for a raised surface so the two tones read apart at a glance
  themeCard: {
    width: 104,
    height: 70,
    borderRadius: 6,
    borderWidth: 1,
    padding: 8,
    overflow: "hidden",
  },
  // selection wears the live accent, so it reads even before the card's own
  // palette has been applied
  themeCardActive: {
    borderWidth: 1,
    borderColor: "var(--accent)",
  },
  themePanel: {
    flex: 1,
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 6,
    justifyContent: "center",
    gap: 4,
  },
  themeLine: {
    height: 4,
    borderRadius: 2,
    width: "72%",
  },
  themeLineShort: {
    height: 3,
    borderRadius: 2,
    width: "46%",
  },
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 1,
  },
  themeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  themeChip: {
    height: 6,
    borderRadius: 3,
    flex: 1,
  },
  themeLabel: {
    fontFamily: CHROME_FONT,
    fontSize: 12,
    color: "var(--text-secondary)",
  },
  themeLabelActive: {
    color: "var(--text)",
    fontWeight: "600",
  },
  dataGroups: {
    gap: 12,
    marginTop: 8,
  },
  dataGroup: {
    borderWidth: 1,
    borderColor: "var(--border)",
    borderRadius: 6,
    overflow: "hidden",
  },
  dataGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "var(--surface)",
    borderBottomWidth: 1,
    borderBottomColor: "var(--border)",
  },
  dataGroupHeaderPressable: {
    cursor: "pointer",
  },
  dataGroupHeaderHover: {
    backgroundColor: "var(--control-hover)",
  },
  dataGroupTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dataGroupTitle: {
    fontFamily: "var(--chrome-font)",
    fontSize: 12,
    fontWeight: "600",
    color: "var(--text)",
  },
  dataGroupTotal: {
    fontFamily: "var(--chrome-font)",
    fontSize: 11,
    color: "var(--text-secondary)",
  },
  dataList: {
    paddingVertical: 2,
  },
  dataRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  dataName: {
    flex: 1,
    fontFamily: "var(--chrome-font)",
    fontSize: 12,
    color: "var(--text-secondary)",
  },
  dataSize: {
    fontFamily: "var(--chrome-font)",
    fontSize: 11,
    color: "var(--text-faint)",
  },
});
