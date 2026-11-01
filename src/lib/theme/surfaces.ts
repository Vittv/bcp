import type { ViewStyle } from "react-native";

// the floating menu chrome every dropdown popup shares: a faint edge, a soft
// lift, and rounded corners. each caller keeps its own position and fill.
export const FLOATING_MENU_SURFACE = {
  borderRadius: 8,
  borderWidth: 1,
  borderColor: "var(--border)",
  shadowColor: "var(--shadow-color)",
  shadowOpacity: 0.24,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 4 },
} satisfies ViewStyle;
