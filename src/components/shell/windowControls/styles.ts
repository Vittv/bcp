import { defineThemedStyles } from "../../../lib/theme/themedStyles";

export const windowControlStyles = defineThemedStyles({
  flatRow: {
    flexDirection: "row",
    flexShrink: 0,
  },
  flatButton: {
    // 46px is the standard titlebar button width
    width: 46,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  flatHover: {
    backgroundColor: "var(--control-hover)",
  },
  flatCloseHover: {
    backgroundColor: "#c42b1c",
  },
  roundRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingRight: 6,
    flexShrink: 0,
  },
  roundButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  roundHover: {
    backgroundColor: "var(--control-hover)",
  },
  roundCloseHover: {
    backgroundColor: "#c01c28",
  },
  macRow: {
    flexDirection: "row",
    alignItems: "center",
    // 14px lights in 23px buttons, with trailing padding before the season label
    paddingRight: 13,
    flexShrink: 0,
  },
  macButton: {
    width: 23,
    height: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  macButtonPressed: {
    opacity: 0.65,
  },
  macLight: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 0.5,
    alignItems: "center",
    justifyContent: "center",
  },
  bar: {
    height: 1.5,
    borderRadius: 1,
  },
  box: {
    borderWidth: 1.2,
    borderRadius: 1,
  },
  restoreBack: {
    position: "absolute",
    top: -2,
    right: -2,
  },
  restoreFront: {
    position: "absolute",
    left: 0,
    bottom: 0,
  },
  closeWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  closeBarA: {
    position: "absolute",
    transform: [{ rotate: "45deg" }],
  },
  closeBarB: {
    position: "absolute",
    transform: [{ rotate: "-45deg" }],
  },
  zoomTriangle: {
    width: 0,
    height: 0,
    borderColor: "transparent",
  },
  zoomTopRight: {
    position: "absolute",
    top: 0,
    right: 0,
  },
  zoomBottomLeft: {
    position: "absolute",
    bottom: 0,
    left: 0,
  },
});
