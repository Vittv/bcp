import { View } from "react-native";

import { useThemedStyles, useThemeVar } from "../../../lib/theme/themedStyles";
import { windowControlStyles } from "./styles";

export function MinimizeGlyph({
  color,
  width = 10,
}: {
  color: string;
  width?: number;
}) {
  const styles = useThemedStyles(windowControlStyles);
  return <View style={[styles.bar, { width, backgroundColor: color }]} />;
}

export function MaximizeGlyph({
  color,
  size = 10,
}: {
  color: string;
  size?: number;
}) {
  const styles = useThemedStyles(windowControlStyles);
  return (
    <View
      style={[styles.box, { width: size, height: size, borderColor: color }]}
    />
  );
}

export function RestoreGlyph({
  color,
  size = 10,
}: {
  color: string;
  size?: number;
}) {
  const styles = useThemedStyles(windowControlStyles);
  const v = useThemeVar();
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.box,
          styles.restoreBack,
          { width: size, height: size, borderColor: color },
        ]}
      />
      <View
        style={[
          styles.box,
          styles.restoreFront,
          {
            width: size,
            height: size,
            borderColor: color,
            backgroundColor: v("var(--bg)"),
          },
        ]}
      />
    </View>
  );
}

export function CloseGlyph({
  color,
  size = 10,
}: {
  color: string;
  size?: number;
}) {
  const styles = useThemedStyles(windowControlStyles);
  return (
    <View style={[styles.closeWrap, { width: size, height: size }]}>
      <View
        style={[
          styles.bar,
          styles.closeBarA,
          { width: size, backgroundColor: color },
        ]}
      />
      <View
        style={[
          styles.bar,
          styles.closeBarB,
          { width: size, backgroundColor: color },
        ]}
      />
    </View>
  );
}

// two opposing right triangles form the zoom mark
export function MacZoomGlyph({
  color,
  size = 7,
}: {
  color: string;
  size?: number;
}) {
  const styles = useThemedStyles(windowControlStyles);
  const edge = size - 1.5;
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.zoomTriangle,
          styles.zoomTopRight,
          {
            borderTopWidth: edge,
            borderLeftWidth: edge,
            borderTopColor: color,
            borderLeftColor: "transparent",
          },
        ]}
      />
      <View
        style={[
          styles.zoomTriangle,
          styles.zoomBottomLeft,
          {
            borderBottomWidth: edge,
            borderRightWidth: edge,
            borderBottomColor: color,
            borderRightColor: "transparent",
          },
        ]}
      />
    </View>
  );
}
