import { HEADING_FONT } from "../../lib/fonts";
import { defineThemedStyles } from "../../lib/theme/themedStyles";

export const appModalStyles = defineThemedStyles({
  backdrop: {
    // fixed rather than absolute: the modal is often opened from a nested
    // pane (the calendar, the saint popover), whose position context would
    // otherwise clip the dim to that pane instead of the whole app
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    backgroundColor: "var(--scrim)",
    // a slight blur keeps the page readable behind the dim instead of
    // flattening it into noise; subtle enough to stay an accent
    backdropFilter: "blur(3px)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: 760,
    maxWidth: "100%",
    minHeight: 260,
    backgroundColor: "var(--bg)",
    borderWidth: 1,
    borderColor: "var(--border)",
    borderRadius: 10,
    display: "flex",
    flexDirection: "column",
    maxHeight: "90%",
    overflow: "hidden",
  },
  titleBar: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 20,
    paddingRight: 10,
    flexShrink: 0,
    backgroundColor: "var(--bg)",
    userSelect: "none",
  },
  title: {
    fontFamily: HEADING_FONT,
    fontWeight: "500",
    fontSize: 28,
    letterSpacing: 0.2,
    color: "var(--text)",
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  closeBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  closeBtnHover: {
    backgroundColor: "var(--control-hover)",
  },
  body: {
    flexShrink: 1,
    minHeight: 0,
    overflowY: "auto",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "var(--bg)",
  },
  // two-pane bodies (settings rail + content) scroll inside their own panes;
  // the frame itself just stretches to the card and clips
  bodyStretch: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    padding: 0,
    backgroundColor: "var(--bg)",
  },
  footer: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "var(--border)",
    backgroundColor: "var(--bg)",
  },
});
