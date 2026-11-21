import { CHROME_FONT } from "../../lib/fonts";
import { defineThemedStyles } from "../../lib/theme/themedStyles";

// transparent-background cross glyph, rendered as an alpha mask and tinted
// with the active theme's secondary text token so the in-app mark follows the
// selected family and mode instead of a baked-in per-mode color
export const CROSS_ICON = require("../../../assets/app_icons/cross_light_192.png");

// bundled via expo-font; system monospace is the fallback on native
export const MONO = '"JetBrains Mono", monospace';

export const noSelect = {
  userSelect: "none" as const,
  WebkitUserSelect: "none" as const,
};

export const topBarStyles = defineThemedStyles({
  bar: {
    height: 40,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border)",
    flexDirection: "row",
    alignItems: "center",
    // left-only: the window-control cluster must sit flush against
    // the right edge
    paddingLeft: 12,
    flexShrink: 0,
    backgroundColor: "var(--bg)",
    // lift the chrome above the sidebar and drawer; modals sit higher
    // the season text truncates on its own, so the bar needs no overflow clip
    position: "relative",
    zIndex: 60,
  },
  // pull the traffic lights closer to the window edge than the right controls
  barCustomLeft: {
    paddingLeft: 8,
  },
  controls: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    // breathing room before the window-control cluster; when that
    // cluster is hidden this doubles as the bar's right padding
    marginRight: 12,
  },
  seasonLabel: {
    flexDirection: "row",
    alignItems: "center",
    // let the season name ellipsize before it can push the controls off the bar
    flexShrink: 1,
    minWidth: 0,
  },
  appIcon: {
    width: 18,
    height: 18,
    marginRight: 6,
  },
  seasonText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 12,
    color: "var(--text-secondary)",
    flexShrink: 1,
  },
  // keeps the mobile edition chip clear of the season label
  editionChip: {
    marginLeft: 10,
  },
  countdown: {
    borderRadius: 4,
  },
  countdownHover: {
    backgroundColor: "var(--control-hover)",
  },
  // the bullet separating the season title from the countdown/saint-day
  // label; a fixed, always-spaced item that is never part of the label's
  // hoverable area
  countdownSep: {
    fontSize: 11,
    color: "var(--text-secondary)",
    opacity: 0.7,
    marginHorizontal: 6,
  },
  countdownText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 11,
    color: "var(--text-secondary)",
    opacity: 0.7,
  },
  fontControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
    marginRight: -4,
  },
  fontSizeLabel: {
    fontFamily: MONO,
    fontWeight: "500",
    fontSize: 11,
    color: "var(--text-secondary)",
    minWidth: 32,
    textAlign: "right",
    marginRight: 2,
  },
  fontBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  fontBtnDisabled: {
    opacity: 0.4,
  },
  hover: {
    backgroundColor: "var(--control-hover)",
  },
  pressed: {
    backgroundColor: "var(--selected-bg)",
  },
  // the global-search trigger stretches the top bar's full 40px so search
  // reads as a control of the chrome rather than a chip of the page beneath
  searchTrigger: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    gap: 6,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "var(--border)",
    backgroundColor: "var(--surface)",
  },
  searchTriggerHover: {
    backgroundColor: "var(--control-hover)",
  },
  searchTriggerPressed: {
    backgroundColor: "var(--selected-bg)",
  },
  searchText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 12,
    color: "var(--text-secondary)",
  },
  themeBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  controlText: {
    fontSize: 12,
    color: "var(--text-secondary)",
  },
  // keeps the brand clear of macOS's overlaid traffic lights
  macGap: {
    width: 78,
    flexShrink: 0,
  },
});
