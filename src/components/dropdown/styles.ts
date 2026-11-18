import { CHROME_FONT } from "../../lib/fonts";
import { FLOATING_MENU_SURFACE } from "../../lib/theme/surfaces";
import { defineThemedStyles } from "../../lib/theme/themedStyles";

// every in-page dropdown shares this chrome and stacking behaviour. the
// anchor lifts the whole chain while open so later page content cannot paint
// over the menu, which React Native Web otherwise does at z-index 0.
export const dropdownAnchorStyles = defineThemedStyles({
  raised: {
    zIndex: 5,
  },
});

export const dropdownStyles = defineThemedStyles({
  wrap: {
    position: "relative",
    flexShrink: 0,
  },
  wrapWide: { width: 260 },
  wrapCompact: { width: 210 },
  wrapNarrow: { width: 150 },
  wrapNarrowCompact: { width: 130 },
  wrapFull: { width: "100%", flexShrink: 1 },
  alignEnd: { alignSelf: "flex-end" },
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
  triggerFull: { width: "100%" },
  triggerHover: { backgroundColor: "var(--control-hover)" },
  triggerText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 12,
    color: "var(--text-secondary)",
    flexShrink: 1,
    minWidth: 0,
  },
  triggerTextFull: { flex: 1 },
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
    // match the trigger's corner radius, a step tighter than the shared menu
    // surface used by the bar dropdowns
    borderRadius: 4,
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 6,
    zIndex: 50,
    backgroundColor: "var(--bg)",
    overflow: "hidden",
  },
  menuUp: {
    top: undefined,
    bottom: "100%",
    marginTop: 0,
    marginBottom: 6,
  },
  menuList: { maxHeight: 300 },
  menuListContent: { padding: 4 },
  menuGroup: {
    fontFamily: CHROME_FONT,
    fontWeight: "600",
    fontSize: 11,
    color: "var(--text-secondary)",
    paddingTop: 7,
    paddingBottom: 3,
    paddingHorizontal: 8,
  },
  menuGroupAfter: { marginTop: 5 },
  item: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  itemActive: { backgroundColor: "var(--control-hover)" },
  itemText: {
    fontFamily: CHROME_FONT,
    fontSize: 14,
    fontWeight: "500",
    color: "var(--text)",
  },
  itemTextActive: { color: "var(--accent)", fontWeight: "700" },
  itemTextDisabled: { color: "var(--text-secondary)" },
});
