import { View } from "react-native";

import { AUTOSCROLL_INDICATOR_SIZE } from "../../../lib/input/autoscroll";
import {
  defineThemedStyles,
  useThemedStyles,
} from "../../../lib/theme/themedStyles";
import type { AutoscrollIndicator } from "../useAutoscroll";

// the scroll-click autoscroll glyph, drawn to match the browser's own: a
// small white circle with a black border, two chevrons (up and down), and a
// dot in the center. parked where the middle-click landed.
export function AutoscrollGlyph({
  indicator,
}: {
  indicator: AutoscrollIndicator;
}) {
  const styles = useThemedStyles(autoscrollGlyphStyles);
  return (
    <View
      pointerEvents="none"
      style={[
        styles.autoscrollIndicator,
        { left: indicator.x, top: indicator.y },
      ]}
    >
      <svg
        width={AUTOSCROLL_INDICATOR_SIZE}
        height={AUTOSCROLL_INDICATOR_SIZE}
        viewBox="0 0 40 40"
        role="img"
        aria-label="Autoscroll"
      >
        <circle
          cx="20"
          cy="20"
          r="18.5"
          fill="#ffffff"
          stroke="#000000"
          strokeWidth="1.5"
        />
        <path
          d="M12.4 15.8 L20 7.9 L27.6 15.8"
          fill="none"
          stroke="#000000"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="20" cy="20" r="2" fill="#000000" />
        <path
          d="M12.4 24.2 L20 32.1 L27.6 24.2"
          fill="none"
          stroke="#000000"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </View>
  );
}

const autoscrollGlyphStyles = defineThemedStyles({
  autoscrollIndicator: {
    position: "absolute",
    zIndex: 100,
    width: AUTOSCROLL_INDICATOR_SIZE,
    height: AUTOSCROLL_INDICATOR_SIZE,
    marginLeft: -AUTOSCROLL_INDICATOR_SIZE / 2,
    marginTop: -AUTOSCROLL_INDICATOR_SIZE / 2,
  },
});
