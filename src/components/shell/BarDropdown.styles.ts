import { CHROME_FONT } from "../../lib/fonts";
import { FLOATING_MENU_SURFACE } from "../../lib/theme/surfaces";
import { defineThemedStyles } from "../../lib/theme/themedStyles";

// technical tokens like translation codes read in the app's mono face, as
// keycaps and status text do
export const MONO = '"JetBrains Mono", monospace';

// themed definition: the popover reads its surface from var(--bg) so it is
// always painted from the theme, whatever the class engine does
export const barDropdownStyles = defineThemedStyles({
  wrap: {
    // anchor for the menu; keeps the popover pinned to the chip
    position: "relative",
    flexShrink: 0,
  },
  // the bar toggle's frame plus a row layout for the leading chevron.
  // tighter side padding and a wider gap set the chevron off the code
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    gap: 7,
  },
  mono: {
    fontFamily: MONO,
  },
  // a trigger label that keeps the widest option's width: an invisible ghost
  // sets the box, the visible label floats above it
  labelWrap: {
    position: "relative",
  },
  labelGhost: {
    opacity: 0,
  },
  labelOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  accentText: {
    color: "var(--accent)",
  },
  // full-viewport dismiss layer; the huge offsets escape the bar's box
  backdrop: {
    position: "absolute",
    top: -10000,
    left: -10000,
    width: 30000,
    height: 30000,
    zIndex: 40,
  },
  menu: {
    ...FLOATING_MENU_SURFACE,
    position: "absolute",
    top: 30,
    zIndex: 50,
    padding: 4,
    backgroundColor: "var(--bg)",
  },
  item: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  itemText: {
    fontFamily: CHROME_FONT,
    fontSize: 12,
    fontWeight: "500",
    color: "var(--text)",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  menuRowText: {
    fontFamily: CHROME_FONT,
    fontSize: 12,
    fontWeight: "500",
    color: "var(--text)",
  },
  menuRowState: {
    fontFamily: CHROME_FONT,
    fontSize: 12,
    fontWeight: "500",
    color: "var(--text-secondary)",
  },
});
