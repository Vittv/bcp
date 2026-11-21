import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  Pressable,
  ScrollView,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import { useThemedStyles } from "../../lib/theme/themedStyles";
import { registerEsc } from "../shell/AppModal";
import { Chevron } from "../shell/Chevron";
import { MenuAnchor, MenuAnchorContext } from "./MenuAnchor";
import { dropdownStyles } from "./styles";

export type DropdownWidth = "wide" | "compact" | "narrow" | "full" | number;

// lets rows close the menu after a pick, while the caller's onChange still
// decides what the selection means
export const DropdownContext = createContext<() => void>(() => undefined);

// a page/prose dropdown: pick the width and where it opens, then fill it with
// content. owns its open state, Escape, outside-click dismiss, and the raised
// anchor chain that keeps the menu above later page content.
export function Dropdown({
  triggerLabel,
  accessibilityLabel,
  width = "wide",
  align = "start",
  placement = "down",
  accent = false,
  centered = false,
  children,
  menuStyle,
}: {
  triggerLabel: string;
  accessibilityLabel: string;
  width?: DropdownWidth;
  align?: "start" | "end";
  placement?: "down" | "up";
  accent?: boolean;
  centered?: boolean;
  children: ReactNode;
  /** extra style for the menu content wrapper (e.g. a wider custom menu) */
  menuStyle?: StyleProp<ViewStyle>;
}) {
  const styles = useThemedStyles(dropdownStyles);
  const notifyParent = useContext(MenuAnchorContext);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    notifyParent(true);
    return () => notifyParent(false);
  }, [open, notifyParent]);

  useEffect(() => {
    if (!open) return;
    return registerEsc(() => setOpen(false));
  }, [open]);

  const wrapWidth =
    typeof width === "number"
      ? { width }
      : width === "full"
        ? styles.wrapFull
        : width === "narrow"
          ? styles.wrapNarrow
          : width === "compact"
            ? styles.wrapCompact
            : styles.wrapWide;

  return (
    <MenuAnchor raised={open}>
      <View
        style={[styles.wrap, wrapWidth, align === "end" && styles.alignEnd]}
      >
        <Pressable
          style={({ hovered }) => [
            styles.trigger,
            width === "full" && styles.triggerFull,
            centered && styles.triggerCentered,
            hovered && styles.triggerHover,
          ]}
          onPress={() => setOpen((v) => !v)}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={accessibilityLabel}
        >
          {centered ? (
            <View style={styles.chevronSlotCentered}>
              <Chevron direction={open ? "up" : "down"} size={4.5} />
            </View>
          ) : (
            <Chevron direction={open ? "up" : "down"} size={4.5} />
          )}
          <Text
            style={[
              styles.triggerText,
              width === "full" && styles.triggerTextFull,
              accent && styles.triggerTextAccent,
              centered && styles.triggerTextCentered,
            ]}
            numberOfLines={1}
          >
            {triggerLabel}
          </Text>
        </Pressable>
        {open ? (
          <DropdownContext.Provider value={() => setOpen(false)}>
            <Pressable
              style={styles.backdrop}
              onPress={() => setOpen(false)}
              accessibilityLabel="Close menu"
              accessibilityRole="button"
            />
            <View
              style={[
                styles.menu,
                placement === "up" && styles.menuUp,
                menuStyle,
              ]}
            >
              <ScrollView
                style={styles.menuList}
                contentContainerStyle={styles.menuListContent}
                keyboardShouldPersistTaps="handled"
              >
                {children}
              </ScrollView>
            </View>
          </DropdownContext.Provider>
        ) : null}
      </View>
    </MenuAnchor>
  );
}
