import { CHROME_FONT } from "../../lib/fonts";
import { defineThemedStyles } from "../../lib/theme/themedStyles";

// the 30px office bar's shared chrome, kept as a themed definition; every
// consumer resolves it with useThemedStyles so it paints on web and native
export const officeBarStyles = defineThemedStyles({
  bar: {
    height: 30,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // matches the sidebar toolbar and the reference bars
    paddingHorizontal: 6,
    backgroundColor: "var(--bg)",
    flexShrink: 0,
    // anchor and lift for the bar's dropdown menus: RNW gives every view
    // z-index 0, so the page would paint over an open menu without it
    position: "relative",
    zIndex: 2,
  },
  tabsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  togglesRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tabHover: {
    backgroundColor: "var(--control-hover)",
  },
  tabText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 11,
    color: "var(--text-secondary)",
  },
  tabTextActive: {
    color: "var(--accent)",
    fontWeight: "700",
  },
  toggle: {
    // every bar chip (picker, arrows, toggles, dropdown) is a fixed 24px
    // so they line up across the bar
    height: 24,
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  // the mode switch (Devotions) reads as a primary control: a bordered
  // chip in the left group, accent border while active
  modeToggle: {
    borderWidth: 1,
    borderColor: "var(--border)",
    borderRadius: 4,
    backgroundColor: "var(--surface)",
  },
  modeToggleOn: {
    borderColor: "var(--accent)",
  },
  toggleText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 11,
    color: "var(--text-secondary)",
  },
  toggleTextOn: {
    color: "var(--accent)",
    fontWeight: "700",
  },
  // invisible bold twin reserves the widest metrics so the visible label
  // can switch weight without reflowing the row
  steadyText: {
    position: "relative",
    alignSelf: "center",
  },
  steadyTextGhost: {
    opacity: 0,
    fontWeight: "700",
  },
  steadyTextLabel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    textAlign: "center",
  },
  groupCompact: {
    gap: 2,
  },
  itemCompact: {
    paddingHorizontal: 5,
  },
});
