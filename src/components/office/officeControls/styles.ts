import { CHROME_FONT } from "../../../lib/fonts";
import { defineThemedStyles } from "../../../lib/theme/themedStyles";

export const officeControlStyles = defineThemedStyles({
  // the two-option segmented control (Suffrages A/B, creed)
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
  // the bare chip used by ControlChip (Reset and similar one-shot actions)
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
  triggerHover: { backgroundColor: "var(--control-hover)" },
  triggerText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 12,
    color: "var(--text-secondary)",
    flexShrink: 1,
    minWidth: 0,
  },
});
