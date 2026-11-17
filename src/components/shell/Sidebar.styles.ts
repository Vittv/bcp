import { CHROME_FONT } from "../../lib/fonts";
import { defineThemedStyles } from "../../lib/theme/themedStyles";

export const sidebarStyles = defineThemedStyles({
  sidebar: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    borderRightWidth: 1,
    borderRightColor: "var(--border)",
    backgroundColor: "var(--bg)",
  },
  toolbar: {
    height: 30,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border)",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
  },
  toolbarSpacer: {
    flex: 1,
  },
  toolBtn: {
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "var(--border)",
    backgroundColor: "var(--surface)",
  },
  toolBtnSubtle: {
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  // labeled pills keep the 24px row height, widening only for the label so
  // icon-only and labeled buttons stay flush with the bar chips
  toolBtnLabeled: {
    paddingHorizontal: 8,
  },
  // footer pills sit at 20px so their hover leaves breathing room inside
  // the 24px footer strip instead of filling it edge to edge
  toolBtnFooter: {
    height: 20,
    paddingHorizontal: 6,
  },
  toolBtnHover: {
    backgroundColor: "var(--control-hover)",
  },
  toolBtnText: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    fontWeight: "500",
    color: "var(--text-secondary)",
  },
  toolBtnTextHover: {
    color: "var(--text)",
  },
  scroll: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
  },
  nav: {
    paddingVertical: 4,
  },
  section: {
    paddingBottom: 4,
  },
  // hairline between the nav blocks, tucked under the block above it: the
  // divider-owning block has no top padding, so the rule lands one step below
  // the last row and one step above the first
  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "var(--border-faint)",
    marginHorizontal: 10,
    marginBottom: 4,
  },
  navItem: {
    paddingVertical: 9,
    paddingHorizontal: 10,
    marginHorizontal: 8,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  navLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
  },
  navIcon: {
    width: 18,
    alignItems: "center",
    color: "var(--text-secondary)",
    // idle icons recede; the active row pops at full accent
    opacity: 0.6,
  },
  navIconActive: {
    color: "var(--accent)",
    opacity: 1,
  },
  navItemHover: {
    backgroundColor: "var(--control-hover)",
  },
  navText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 14,
    color: "var(--text-secondary)",
    // long labels ellipsize within the icon+label group rather than fight
    // the trailing detail
    flexShrink: 1,
  },
  navTextActive: {
    color: "var(--accent)",
    fontWeight: "600",
  },
  navDetail: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 11,
    color: "var(--text-secondary)",
    opacity: 0.7,
    // long details (feast names) ellipsize within the trailing space rather
    // than squeeze the row label
    flexShrink: 1,
  },
  // a feast that falls today stops counting down and reads as a live marker
  navDetailToday: {
    color: "var(--accent)",
    fontWeight: "700",
    textTransform: "capitalize",
    opacity: 1,
  },
  editionWrap: {
    flexShrink: 0,
    borderTopWidth: 1,
    borderTopColor: "var(--border)",
    backgroundColor: "var(--bg)",
  },
  editionList: {
    borderBottomWidth: 1,
    borderBottomColor: "var(--border-faint)",
  },
  editionItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  editionItemActive: {
    backgroundColor: "var(--control-hover)",
  },
  editionItemText: {
    fontFamily: CHROME_FONT,
    fontSize: 12,
    fontWeight: "500",
    color: "var(--text-secondary)",
  },
  editionTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  editionTriggerText: {
    fontFamily: CHROME_FONT,
    fontSize: 12,
    fontWeight: "500",
    color: "var(--text-secondary)",
    flexShrink: 1,
  },
  editionYearAccent: {
    color: "var(--accent)",
    fontWeight: "500",
  },
  editionBullet: {
    fontSize: 10,
  },
  footer: {
    height: 24,
    flexShrink: 0,
    borderTopWidth: 1,
    borderTopColor: "var(--border)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 2,
  },
  footerText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 11,
    color: "var(--text-secondary)",
  },
});
