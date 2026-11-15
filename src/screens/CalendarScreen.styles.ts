import { CHROME_FONT } from "../lib/fonts";
import { defineThemedStyles } from "../lib/theme/themedStyles";

export const calendarStyles = defineThemedStyles({
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  leading: {
    position: "absolute",
    left: 4,
    flexDirection: "row",
  },
  monthNav: {
    height: 30,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border)",
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
  },
  monthCenter: {
    position: "absolute",
    left: "50%",
    transform: [{ translateX: "-50%" }],
    flexDirection: "row",
    alignItems: "center",
  },
  arrowBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  arrowBtnHover: {
    backgroundColor: "var(--control-hover)",
  },
  todayBtn: {
    position: "absolute",
    right: 8,
    height: 28,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  todayBtnHover: {
    backgroundColor: "var(--control-hover)",
  },
  todayText: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    fontWeight: "500",
    color: "var(--text-secondary)",
  },
  todayTextOn: {
    color: "var(--accent)",
    fontWeight: "600",
  },
  monthTitle: {
    fontFamily: CHROME_FONT,
    fontSize: 14,
    fontWeight: "600",
    color: "var(--text)",
    minWidth: 150,
    textAlign: "center",
  },
  grid: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: "var(--border)",
    display: "flex",
    flexDirection: "column",
  },
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "var(--border)",
    flexShrink: 0,
  },
  headerCell: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
  },
  headerCellRight: {
    borderRightWidth: 1,
    borderRightColor: "var(--border)",
  },
  headerText: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "var(--text-secondary)",
  },
  body: {
    flex: 1,
    display: "flex",
  },
  weekRow: {
    flex: 1,
    flexDirection: "row",
  },
  cell: {
    flex: 1,
    padding: 4,
    alignItems: "flex-start",
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  cellRight: {
    borderRightWidth: 1,
    borderRightColor: "var(--border)",
  },
  cellBottom: {
    borderBottomWidth: 1,
    borderBottomColor: "var(--border)",
  },
  cellToday: {
    backgroundColor: "var(--today-bg)",
  },
  cellSelected: {
    backgroundColor: "var(--selected-bg)",
  },
  cellHover: {
    backgroundColor: "var(--control-hover)",
  },
  cellInner: {
    alignItems: "flex-start",
    width: "100%",
  },
  cellText: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    fontWeight: "500",
    color: "var(--text)",
    fontVariant: ["tabular-nums"],
  },
  cellLabel: {
    fontFamily: CHROME_FONT,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "600",
    color: "var(--text-secondary)",
  },
  // principal feasts and holy days read in liturgical gold; the Sunday name
  // and lesser feasts stay quiet
  cellLabelFeast: {
    fontWeight: "700",
  },
  cellLabelQuiet: {
    fontWeight: "500",
    opacity: 0.85,
  },
  cellLabels: {
    marginTop: 4,
    alignSelf: "stretch",
  },
  cellChip: {
    alignSelf: "stretch",
    borderTopWidth: 1,
    borderTopColor: "var(--border)",
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  cellChipLast: {
    borderBottomWidth: 1,
    borderBottomColor: "var(--border)",
  },
  cellLabelSeason: {
    color: "var(--accent)",
  },
  cellMore: {
    fontFamily: CHROME_FONT,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "600",
    color: "var(--text-secondary)",
    opacity: 0.8,
    paddingHorizontal: 4,
  },
  strip: {
    flexShrink: 0,
    borderTopWidth: 1,
    borderTopColor: "var(--border)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "var(--bg-raised)",
  },
  stripBtn: {
    gap: 2,
  },
  stripBtnHover: {},
  stripDate: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    fontWeight: "700",
    color: "var(--text)",
  },
  stripSeason: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  stripBody: {
    fontFamily: CHROME_FONT,
    fontSize: 12,
    lineHeight: 17,
    color: "var(--text-secondary)",
  },
  modalSeason: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  modalList: {
    gap: 4,
  },
  modalEmpty: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    color: "var(--text-secondary)",
    paddingVertical: 8,
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  modalRowHover: {
    backgroundColor: "var(--control-hover)",
  },
  modalRowClickable: {
    borderWidth: 1,
    borderColor: "var(--border)",
  },
  modalRowName: {
    fontFamily: CHROME_FONT,
    fontSize: 15,
    color: "var(--text)",
    flex: 1,
  },
  modalRowNameLesser: {
    color: "var(--text-secondary)",
    fontWeight: "500",
  },
  modalRowNameSunday: {
    color: "var(--text-secondary)",
    fontSize: 14,
  },
  modalRowGo: {
    fontFamily: CHROME_FONT,
    fontSize: 12,
    fontWeight: "600",
    color: "var(--accent)",
    flexShrink: 0,
  },
});
