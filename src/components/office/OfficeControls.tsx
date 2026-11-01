import {
  createContext,
  type ReactNode,
  useCallback,
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
import { CHROME_FONT } from "../../lib/fonts";
import { FLOATING_MENU_SURFACE } from "../../lib/theme/surfaces";
import {
  defineThemedStyles,
  useThemedStyles,
} from "../../lib/theme/themedStyles";
import { useViewport } from "../../lib/viewport";
import { registerEsc } from "../shell/AppModal";
import { Chevron } from "../shell/Chevron";

// the inline office controls sit in the reading column, not the bar, so they
// borrow the bar's chip vocabulary at content scale. binary choices stay
// visible; longer menus open a small anchored popover.

export type ControlOption = {
  id: string;
  label: string;
  /** the popover row's text when it should differ from the trigger's */
  menuLabel?: string;
  /** rows sharing a group are preceded once by this heading */
  group?: string;
};

// react-native-web gives every View z-index 0, so a popover cannot paint over
// a later sibling on its own. every wrapper in between lifts itself while open.
export const MenuAnchorContext = createContext<(open: boolean) => void>(
  () => undefined,
);

// an anchor that raises itself while a nested ChoiceMenu is open. nesting
// these from the control up to the section lets the popover clear every later
// sibling.
export function MenuAnchor({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useThemedStyles(menuAnchorStyles);
  const notifyParent = useContext(MenuAnchorContext);
  const [open, setOpen] = useState(false);
  const notify = useCallback(
    (next: boolean) => {
      setOpen(next);
      notifyParent(next);
    },
    [notifyParent],
  );
  return (
    <MenuAnchorContext.Provider value={notify}>
      <View style={[style, open && styles.raised]}>{children}</View>
    </MenuAnchorContext.Provider>
  );
}

const menuAnchorStyles = defineThemedStyles({
  // one step above the default View layer is enough; later siblings are all
  // z-index 0, and only one dropdown is open at a time
  raised: {
    zIndex: 5,
  },
});

export function Segmented({
  value,
  options,
  onChange,
  accessibilityLabel,
}: {
  value: string;
  options: readonly { id: string; label: string }[];
  onChange: (id: string) => void;
  accessibilityLabel: string;
}) {
  const styles = useThemedStyles(officeControlStyles);
  return (
    <View style={styles.segmented} accessibilityLabel={accessibilityLabel}>
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <Pressable
            key={option.id}
            style={({ hovered }) => [
              styles.segItem,
              (hovered || selected) && styles.segItemActive,
            ]}
            onPress={() => onChange(option.id)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
          >
            <Text style={[styles.segText, selected && styles.segTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ChoiceMenu({
  value,
  options,
  onChange,
  label,
  accessibilityLabel,
  fullWidth = false,
}: {
  value: string;
  options: readonly ControlOption[];
  onChange: (id: string) => void;
  /** the trigger text; the selected option's label is used when it matches */
  label: string;
  accessibilityLabel: string;
  /** stretch the trigger, and its menu, to the whole column */
  fullWidth?: boolean;
}) {
  const styles = useThemedStyles(officeControlStyles);
  const { compact } = useViewport();
  const notifyAnchor = useContext(MenuAnchorContext);
  const [open, setOpen] = useState(false);
  const current = options.find((option) => option.id === value);
  const trigger = current?.label ?? label;

  useEffect(() => {
    if (!open) return;
    notifyAnchor(true);
    return () => notifyAnchor(false);
  }, [open, notifyAnchor]);

  useEffect(() => {
    if (!open) return;
    return registerEsc(() => setOpen(false));
  }, [open]);

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  let lastGroup: string | undefined;
  return (
    <View
      style={[
        styles.menuWrap,
        fullWidth
          ? styles.menuWrapFull
          : compact
            ? styles.menuWrapCompact
            : styles.menuWrapWide,
      ]}
    >
      <Pressable
        style={({ hovered }) => [
          styles.trigger,
          fullWidth && styles.triggerFull,
          hovered && styles.triggerHover,
        ]}
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={accessibilityLabel}
      >
        <Chevron direction={open ? "up" : "down"} size={4.5} />
        <Text
          style={[styles.triggerText, fullWidth && styles.triggerTextFull]}
          numberOfLines={1}
        >
          {trigger}
        </Text>
      </Pressable>
      {open ? (
        <>
          <Pressable
            style={styles.backdrop}
            onPress={() => setOpen(false)}
            accessibilityLabel="Close menu"
            accessibilityRole="button"
          />
          <View style={styles.menu}>
            <ScrollView
              style={styles.menuList}
              contentContainerStyle={styles.menuListContent}
              keyboardShouldPersistTaps="handled"
            >
              {options.map((option) => {
                const selected = option.id === value;
                const header =
                  option.group && option.group !== lastGroup
                    ? option.group
                    : undefined;
                lastGroup = option.group;
                return (
                  <View key={option.id}>
                    {header ? (
                      <Text style={styles.menuGroup}>{header}</Text>
                    ) : null}
                    <Pressable
                      style={({ hovered }) => [
                        styles.menuItem,
                        (hovered || selected) && styles.menuItemActive,
                      ]}
                      onPress={() => pick(option.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                    >
                      <Text
                        style={[
                          styles.menuItemText,
                          selected && styles.menuItemTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {option.menuLabel ?? option.label}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </>
      ) : null}
    </View>
  );
}

// a bare chip for Reset and similar one-shot actions
export function ControlChip({
  label,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const styles = useThemedStyles(officeControlStyles);
  return (
    <Pressable
      style={({ hovered }) => [styles.trigger, hovered && styles.triggerHover]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={styles.triggerText}>{label}</Text>
    </Pressable>
  );
}

const officeControlStyles = defineThemedStyles({
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
    fontSize: 10,
    letterSpacing: 0.2,
    color: "var(--text-secondary)",
  },
  segTextActive: {
    color: "var(--accent)",
    fontWeight: "700",
  },
  menuWrap: {
    position: "relative",
    flexShrink: 0,
  },
  // the menu matches the trigger's width, so every dropdown gets a readable
  // default width; the compact one keeps the row clear of its heading on a phone
  menuWrapWide: {
    width: 260,
  },
  menuWrapCompact: {
    width: 210,
  },
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
  menuWrapFull: {
    width: "100%",
    flexShrink: 1,
  },
  triggerFull: {
    width: "100%",
  },
  triggerHover: {
    backgroundColor: "var(--control-hover)",
  },
  triggerText: {
    fontFamily: CHROME_FONT,
    fontWeight: "500",
    fontSize: 10,
    color: "var(--text-secondary)",
    flexShrink: 1,
    minWidth: 0,
  },
  triggerTextFull: {
    flex: 1,
  },
  backdrop: {
    position: "absolute",
    top: -10000,
    left: -10000,
    width: 30000,
    height: 30000,
    zIndex: 40,
  },
  menu: {
    ...FLOATING_MENU_SURFACE,
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 6,
    zIndex: 50,
    backgroundColor: "var(--bg)",
    overflow: "hidden",
  },
  // a long menu (opening sentences run to thirty entries) scrolls inside a
  // fixed pane instead of running off the page
  menuList: {
    maxHeight: 300,
  },
  menuListContent: {
    padding: 4,
  },
  menuGroup: {
    fontFamily: CHROME_FONT,
    fontWeight: "600",
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "var(--text-secondary)",
    paddingTop: 7,
    paddingBottom: 3,
    paddingHorizontal: 8,
  },
  menuItem: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  menuItemActive: {
    backgroundColor: "var(--control-hover)",
  },
  menuItemText: {
    fontFamily: CHROME_FONT,
    fontSize: 12,
    fontWeight: "500",
    color: "var(--text)",
  },
  menuItemTextActive: {
    color: "var(--accent)",
    fontWeight: "700",
  },
});
