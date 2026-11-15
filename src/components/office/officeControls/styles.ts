import { CHROME_FONT } from "../../../lib/fonts";
import { FLOATING_MENU_SURFACE } from "../../../lib/theme/surfaces";
import { defineThemedStyles } from "../../../lib/theme/themedStyles";

export const menuAnchorStyles = defineThemedStyles({
  // one step above the default View layer is enough; later siblings are all
  // z-index 0, and only one dropdown is open at a time
  raised: {
    zIndex: 5,
  },
});

export const officeControlStyles = defineThemedStyles({
  segmented: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "var(--border)",
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "var(--surface)",
    flexShrink: 0,
  },
  segItem: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  segItemActive: {
    backgroundColor: "var(--control-hover)",
  },
  segText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 12,
    letterSpacing: 0.2,
    color: "var(--text-secondary)",
  },
  segTextActive: {
    color: "var(--accent)",
    fontWeight: "700",
  },
  menuWrap: {
    position: "relative",
    flexShrink: 0,
  },
  // the menu matches the trigger's width, so every dropdown gets a readable
  // default width; the compact one keeps the row clear of its heading on a phone
  menuWrapWide: {
    width: 260,
  },
  menuWrapCompact: {
    width: 210,
  },
  // the invitatory's psalm names need nowhere near the others' room
  menuWrapNarrow: {
    width: 150,
  },
  menuWrapNarrowCompact: {
    width: 130,
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 22,
    paddingHorizontal: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "var(--border)",
    backgroundColor: "var(--surface)",
  },
  menuWrapFull: {
    width: "100%",
    flexShrink: 1,
  },
  triggerFull: {
    width: "100%",
  },
  triggerHover: {
    backgroundColor: "var(--control-hover)",
  },
  triggerText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 12,
    color: "var(--text-secondary)",
    flexShrink: 1,
    minWidth: 0,
  },
  triggerTextFull: {
    flex: 1,
  },
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
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 6,
    zIndex: 50,
    backgroundColor: "var(--bg)",
    overflow: "hidden",
  },
  // a long menu (opening sentences run to thirty entries) scrolls inside a
  // fixed pane instead of running off the page
  menuList: {
    maxHeight: 300,
  },
  menuListContent: {
    padding: 4,
  },
  menuGroup: {
    fontFamily: CHROME_FONT,
    fontWeight: "600",
    fontSize: 11,
    color: "var(--text-secondary)",
    paddingTop: 7,
    paddingBottom: 3,
    paddingHorizontal: 8,
  },
  menuGroupAfter: {
    marginTop: 5,
  },
  menuItem: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  menuItemActive: {
    backgroundColor: "var(--control-hover)",
  },
  menuItemText: {
    fontFamily: CHROME_FONT,
    fontSize: 14,
    fontWeight: "500",
    color: "var(--text)",
  },
  menuItemTextActive: {
    color: "var(--accent)",
    fontWeight: "700",
  },
  menuItemTextDisabled: {
    color: "var(--text-secondary)",
  },
});
