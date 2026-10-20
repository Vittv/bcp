import { View } from "react-native";
import {
  defineThemedStyles,
  useThemedStyles,
  useThemeVar,
} from "../../lib/theme/themedStyles";

// translate compensates for stroke mass biased toward the apex after rotation
export function Chevron({
  direction,
  size = 8,
  stroke = 1.5,
}: {
  direction: "left" | "right" | "up" | "down";
  size?: number;
  stroke?: number;
}) {
  const styles = useThemedStyles(chevronStyles);
  const bias = 0.354 * (size - stroke);
  const tx = direction === "left" ? bias : direction === "right" ? -bias : 0;
  const ty = direction === "up" ? bias : direction === "down" ? -bias : 0;
  const angle =
    direction === "left"
      ? 45
      : direction === "right"
        ? -135
        : direction === "up"
          ? 135
          : -45;
  return (
    <View
      style={[
        styles.chevron,
        {
          width: size,
          height: size,
          borderLeftWidth: stroke,
          borderBottomWidth: stroke,
          borderRadius: stroke,
          transform: [
            { translateX: tx },
            { translateY: ty },
            { rotate: `${angle}deg` },
          ],
        },
      ]}
    />
  );
}

const chevronStyles = defineThemedStyles({
  chevron: {
    borderColor: "var(--text-secondary)",
  },
});

// the drawer tabs are only 14px wide, so their chevron opens wider than the
// 90 degree glyph elsewhere: a squat arrow disappears at this size, while the
// tall splay reads as a pull cue
export function PullChevron({ direction }: { direction: "left" | "right" }) {
  const v = useThemeVar();
  return (
    <svg
      width={8}
      height={18}
      viewBox="0 0 8 18"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={direction === "left" ? "M6 1.5L1.5 9L6 16.5" : "M2 1.5L6.5 9L2 16.5"}
        stroke={v("var(--text-secondary)")}
        strokeWidth={1.5}
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
