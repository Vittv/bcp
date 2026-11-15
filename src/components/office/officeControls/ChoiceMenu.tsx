import { useContext, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useThemedStyles } from "../../../lib/theme/themedStyles";
import { useViewport } from "../../../lib/viewport";
import { registerEsc } from "../../shell/AppModal";
import { Chevron } from "../../shell/Chevron";
import { MenuAnchorContext } from "./MenuAnchor";
import { officeControlStyles } from "./styles";
import type { ControlOption } from "./types";

export function ChoiceMenu({
  value,
  options,
  onChange,
  label,
  accessibilityLabel,
  fullWidth = false,
  narrow = false,
}: {
  value: string;
  options: readonly ControlOption[];
  onChange: (id: string) => void;
  /** the trigger text; the selected option's label is used when it matches */
  label: string;
  accessibilityLabel: string;
  /** stretch the trigger, and its menu, to the whole column */
  fullWidth?: boolean;
  /** a short-menu control (invitatory) that needs nowhere near the full width */
  narrow?: boolean;
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
          : narrow
            ? compact
              ? styles.menuWrapNarrowCompact
              : styles.menuWrapNarrow
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
                // later group headings separate from the group above
                const afterGroup =
                  header !== undefined && lastGroup !== undefined;
                lastGroup = option.group;
                return (
                  <View key={option.id}>
                    {header ? (
                      <Text
                        style={[
                          styles.menuGroup,
                          afterGroup && styles.menuGroupAfter,
                        ]}
                      >
                        {header}
                      </Text>
                    ) : null}
                    {option.disabled ? (
                      <View style={styles.menuItem}>
                        <Text
                          style={[
                            styles.menuItemText,
                            styles.menuItemTextDisabled,
                          ]}
                          numberOfLines={1}
                        >
                          {option.menuLabel ?? option.label}
                        </Text>
                      </View>
                    ) : (
                      <Pressable
                        style={({ hovered }) => [
                          styles.menuItem,
                          (hovered || selected) && styles.menuItemActive,
                        ]}
                        onPress={() => pick(option.id)}
                        accessibilityRole="button"
                        accessibilityState={{ selected, disabled: false }}
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
                    )}
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
