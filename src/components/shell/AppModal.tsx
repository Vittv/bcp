import { type ReactNode, useEffect } from "react";
import {
  BackHandler,
  Platform,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  type TextStyle,
  useWindowDimensions,
  View,
  type ViewStyle,
} from "react-native";

import { useThemedStyles, useThemeVar } from "../../lib/theme/themedStyles";
import { registerEsc } from "./AppModal.esc";
import { appModalStyles } from "./AppModal.styles";
import { CloseIcon } from "./Icon";

export { dismissEscapeConsumers, registerEsc } from "./AppModal.esc";

// a reusable floating-window modal: a centered card with a title bar and
// close button, a scrollable body, an optional pinned footer bar, and a
// dimmed backdrop. On phones it becomes a full-screen sheet. The three
// chrome panels (Settings, Install, About) and the saint mention lookup
// share this so their chrome matches. Every modal dismisses the same way:
// Esc, the X, or clicking the dim area.

type AppModalProps = {
  /** the title bar's text; a node so one line can mix faces */
  title?: ReactNode;
  /** plain-text title for the close button's accessible name, for node titles */
  titleLabel?: string;
  /** a trailing element in the title bar, just left of the close button */
  headerAccessory?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  width?: number;
  /** overrides the title bar's typography (the default is the display face) */
  titleStyle?: StyleProp<TextStyle>;
  /** a non-scrolling bar pinned under the body (button stays reachable) */
  footer?: ReactNode;
  /** the body stops scrolling for a caller-managed two-pane layout; the
   *  card keeps its normal height and the panes scroll internally */
  stretchBody?: boolean;
  /** hide the title bar (title + close X) for surfaces that close another
   *  way, e.g. settings' Done button */
  titleBar?: boolean;
  /** fixed card height in px; the card otherwise sizes to its content.
   *  clamped to the viewport so short windows still fit */
  height?: number;
};

export function AppModal({
  title,
  titleLabel,
  headerAccessory,
  onClose,
  children,
  footer,
  titleStyle,
  width = 760,
  stretchBody = false,
  titleBar = true,
  height,
}: AppModalProps) {
  const { height: viewportHeight } = useWindowDimensions();
  const styles = useThemedStyles(appModalStyles);
  const v = useThemeVar();
  // clamp a fixed target against the viewport so short windows still fit
  const fixedHeight =
    height == null ? undefined : Math.min(height, viewportHeight * 0.92);
  // SAFETY: RN-web's StyleSheet values widen to a union TypeScript rejects
  // against the expected StyleProp; each is a valid runtime RN style, so the
  // narrowing below is sound.
  const cardStyle = {
    ...styles.card,
    width,
    height: fixedHeight ?? undefined,
  } as StyleProp<ViewStyle>;
  // SAFETY: background/frame style is a plain ViewStyle at runtime.
  const backdropStyle = styles.backdrop as StyleProp<ViewStyle>;
  // SAFETY: title-bar is a plain ViewStyle at runtime.
  const titleBarStyle = styles.titleBar as StyleProp<ViewStyle>;
  // SAFETY: title is a TextStyle at runtime.
  const baseTitleStyle = styles.title as StyleProp<TextStyle>;
  // SAFETY: body panel is a plain ViewStyle at runtime.
  const bodyStyle = (
    stretchBody ? styles.bodyStretch : styles.body
  ) as StyleProp<ViewStyle>;
  // SAFETY: footer bar is a plain ViewStyle at runtime.
  const footerStyle = styles.footer as StyleProp<ViewStyle>;
  // SAFETY: close button and its hover state are both ViewStyle at runtime.
  const closeBtnStyle = (hovered: boolean): StyleProp<ViewStyle> =>
    [styles.closeBtn, hovered && styles.closeBtnHover] as StyleProp<ViewStyle>;
  // the close button needs a plain-text name, which a node title cannot give
  const closeLabel = `Close ${
    titleLabel ?? (typeof title === "string" ? title : "dialog")
  }`;

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
        {titleBar ? (
          <View style={titleBarStyle}>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[baseTitleStyle, titleStyle]}
            >
              {title}
            </Text>
            {headerAccessory}
            <Pressable
              onPress={onClose}
              style={({ hovered }) => closeBtnStyle(hovered)}
              accessibilityRole="button"
              accessibilityLabel={closeLabel}
            >
              {({ hovered }) => (
                <CloseIcon
                  size={16}
                  color={
                    hovered ? v("var(--text)") : v("var(--text-secondary)")
                  }
                />
              )}
            </Pressable>
          </View>
        ) : null}
        <View style={bodyStyle}>{children}</View>
        {footer ? <View style={footerStyle}>{footer}</View> : null}
      </View>
    </View>
  );
}
