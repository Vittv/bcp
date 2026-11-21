import { defineThemedStyles } from "../../lib/theme/themedStyles";

export const officeDatePickerStyles = defineThemedStyles({
  wrap: {
    // react-native-web positions every View by default; stay static so the
    // sheet anchors to the bar rather than this 26px icon box
    position: "static",
    flexShrink: 0,
  },
  button: {
    width: 26,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  hover: {
    backgroundColor: "var(--control-hover)",
  },
  backdrop: {
    position: "absolute",
    top: -10000,
    left: -10000,
    width: 30000,
    height: 30000,
    zIndex: 40,
  },
  // the sheet anchors to the bar's right edge, like the Offices date picker
  anchor: {
    left: "auto",
    right: 10,
  },
});
