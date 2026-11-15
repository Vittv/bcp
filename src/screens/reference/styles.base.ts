import { CHROME_FONT } from "../../lib/fonts";
import { defineThemedStyles } from "../../lib/theme/themedStyles";

export const baseStyles = defineThemedStyles({
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
});
