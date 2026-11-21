import { CHROME_FONT } from "../../lib/fonts";
import { FLOATING_MENU_SURFACE } from "../../lib/theme/surfaces";
import { defineThemedStyles } from "../../lib/theme/themedStyles";

// the month sheet shared by the Offices bar and the Today date button
export const monthPickerStyles = defineThemedStyles({
  popover: {
    ...FLOATING_MENU_SURFACE,
    position: "absolute",
    top: 30,
    left: 10,
    zIndex: 50,
    width: 259,
    padding: 8,
    // raised surface: one step lighter than --bg so the panel floats over
    // the page instead of reading as a hole in it
    backgroundColor: "var(--bg-raised)",
  },
  stepBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  rowHover: {
    backgroundColor: "var(--control-hover)",
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
});
