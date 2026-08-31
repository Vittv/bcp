import { type ReactNode, useEffect } from "react";
import {
  BackHandler,
  Platform,
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
// card with a title bar and close button, a scrollable body, an optional
// pinned footer bar, and a dimmed backdrop. On phones it becomes a
// full-screen sheet. The three chrome panels (Settings, Install, About) and
// the saint mention lookup share this so their chrome matches. Every modal
// dismisses the same way: Esc, the X, or clicking the dim area.

type AppModalProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
  /** overrides the title bar's typography (e.g. a serif display face) */
  titleStyle?: StyleProp<TextStyle>;
  /** a non-scrolling bar pinned under the body (button stays reachable) */
  footer?: ReactNode;
};

const HOVER_COLOR = "var(--text, #2c2020)";
const IDLE_COLOR = "var(--text-secondary, #7a6e64)";

type EscEntry = { run: () => void };
const escRegistry: EscEntry[] = [];

// the shell owns the capture-phase keydown listener, which mounts before
// any modal ever does, so a modal's own window listener could never win
// the ordering. instead modals sign up here and the shell invokes them.
function registerEsc(run: () => void): () => void {
  const entry = { run };
  escRegistry.push(entry);
  return () => {
    const i = escRegistry.indexOf(entry);
    if (i >= 0) escRegistry.splice(i, 1);
  };
}

// the shell calls this from its global Escape handling: every mounted
// modal closes about the same way the X does
export function dismissEscapeConsumers(): void {
  for (const e of escRegistry) e.run();
}

export function AppModal({
  title,
  onClose,
  children,
  footer,
  titleStyle,
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
  const baseTitleStyle = styles.title as StyleProp<TextStyle>;
  // SAFETY: body panel is a plain ViewStyle at runtime.
  const bodyStyle = styles.body as StyleProp<ViewStyle>;
  // SAFETY: footer bar is a plain ViewStyle at runtime.
  const footerStyle = styles.footer as StyleProp<ViewStyle>;
  // SAFETY: close button and its hover state are both ViewStyle at runtime.
  const closeBtnStyle = (hovered: boolean): StyleProp<ViewStyle> =>
    [styles.closeBtn, hovered && styles.closeBtnHover] as StyleProp<ViewStyle>;

  // Esc (web, via the shell's global handler) and the hardware back
  // button (Android) close any modal about the same way the X does
  useEffect(() => {
    if (Platform.OS !== "web") {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        onClose();
        return true;
      });
      return () => sub.remove();
    }
    return registerEsc(onClose);
  }, [onClose]);

  return (
    <View style={backdropStyle}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Dismiss dialog"
      />
      <View style={cardStyle}>
        <View style={titleBarStyle}>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[baseTitleStyle, titleStyle]}
          >
            {title}
          </Text>
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
        {footer ? <View style={footerStyle}>{footer}</View> : null}
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
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 24,
    paddingRight: 12,
    flexShrink: 0,
    backgroundColor: "var(--bg, #e0dbd0)",
    userSelect: "none",
  },
  title: {
    fontFamily: CHROME_FONT,
    fontWeight: "600",
    fontSize: 26,
    letterSpacing: 0.2,
    color: "var(--text, #2c2020)",
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
  footer: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "var(--border, #c9c1b2)",
    backgroundColor: "var(--bg, #e0dbd0)",
  },
});
