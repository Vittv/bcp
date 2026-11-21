import { defineThemedStyles } from "../../lib/theme/themedStyles";

export const officeDatePickerStyles = defineThemedStyles({
  wrap: {
    // anchor the month sheet under the icon inside the office bar
    position: "relative",
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
  anchor: {
    left: "auto",
    right: 0,
  },
});
