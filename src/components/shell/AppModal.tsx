import type { ReactNode } from "react";
import {
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import { CHROME_FONT } from "../../lib/fonts";
import { CloseIcon } from "./Icon";

// A reusable floating-window modal (feishin/zennotes inspiration): a centered
// card with a title bar and close button, a scrollable body, and a dimmed
// backdrop. On phones it becomes a full-screen sheet. The three chrome panels
// (Settings, Install, About) share this so their chrome matches.

type AppModalProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
};

const HOVER_COLOR = "var(--text, #2c2020)";
const IDLE_COLOR = "var(--text-secondary, #7a6e64)";

export function AppModal({
  title,
  onClose,
  children,
  width = 760,
}: AppModalProps) {
  // SAFETY: RN-web's StyleSheet values widen to a union TypeScript rejects
  // against the expected StyleProp; each is a valid runtime RN style, so the
  // narrowing below is sound.
  const cardStyle = { ...styles.card, width } as StyleProp<ViewStyle>;
  // SAFETY: background/frame style is a plain ViewStyle at runtime.
  const backdropStyle = styles.backdrop as StyleProp<ViewStyle>;
  // SAFETY: title-bar is a plain ViewStyle at runtime.
  const titleBarStyle = styles.titleBar as StyleProp<ViewStyle>;
  // SAFETY: title is a TextStyle at runtime.
  const titleStyle = styles.title as StyleProp<TextStyle>;
  // SAFETY: body panel is a plain ViewStyle at runtime.
  const bodyStyle = styles.body as StyleProp<ViewStyle>;
  // SAFETY: close button and its hover state are both ViewStyle at runtime.
  const closeBtnStyle = (hovered: boolean): StyleProp<ViewStyle> =>
    [styles.closeBtn, hovered && styles.closeBtnHover] as StyleProp<ViewStyle>;

  return (
    <View style={backdropStyle}>
      <View style={cardStyle}>
        <View style={titleBarStyle}>
          <Text style={titleStyle}>{title}</Text>
          <Pressable
            onPress={onClose}
            style={({ hovered }) => closeBtnStyle(hovered)}
            accessibilityRole="button"
            accessibilityLabel={`Close ${title}`}
          >
            {({ hovered }) => (
              <CloseIcon size={16} color={hovered ? HOVER_COLOR : IDLE_COLOR} />
            )}
          </Pressable>
        </View>
        <View style={bodyStyle}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    backgroundColor: "rgba(20, 15, 15, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: 760,
    maxWidth: "100%",
    minHeight: 260,
    backgroundColor: "var(--bg, #e0dbd0)",
    borderWidth: 1,
    borderColor: "var(--border, #c9c1b2)",
    borderRadius: 10,
    display: "flex",
    flexDirection: "column",
    maxHeight: "90%",
    overflow: "hidden",
  },
  titleBar: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 24,
    paddingRight: 12,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border, #d2cbbf)",
    flexShrink: 0,
    backgroundColor: "var(--bg, #e0dbd0)",
    userSelect: "none",
  },
  title: {
    fontFamily: CHROME_FONT,
    fontWeight: "600",
    fontSize: 20,
    letterSpacing: 0.4,
    color: "var(--text, #2c2020)",
  },
  closeBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "var(--border-content, #b5aa9e)",
  },
  closeBtnHover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  body: {
    flexShrink: 1,
    minHeight: 0,
    overflow: "scroll",
    paddingHorizontal: 28,
    paddingVertical: 26,
    backgroundColor: "var(--bg, #e0dbd0)",
  },
});
