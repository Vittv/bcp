import { type ReactNode, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { CHROME_FONT } from "../../lib/fonts";
import {
  defineThemedStyles,
  useThemedStyles,
  useThemeVar,
} from "../../lib/theme/themedStyles";
import { registerEsc } from "./AppModal";
import { Chevron } from "./Chevron";
import { officeBarStyles } from "./officeBarStyles";

// technical tokens like translation codes read in the app's mono face, as
// keycaps and status text do
const MONO = '"JetBrains Mono", monospace';

export type DropdownOption<T extends string> = {
  id: T;
  label: string;
};

// a bar chip that opens a small anchored list. generic over the option id so
// the same control can pick a bible translation now and a bcp edition later.
export function BarDropdown<T extends string>({
  value,
  options,
  onChange,
  accessibilityLabel,
  mono = false,
  menuWidth = 128,
  align = "end",
  accent = false,
  steadyWidth = false,
}: {
  value: T;
  options: readonly DropdownOption<T>[];
  onChange: (id: T) => void;
  accessibilityLabel: string;
  mono?: boolean;
  menuWidth?: number;
  // which edge the menu hangs from; "start" lets a chip at the bar's left
  // edge open rightward instead of spilling off screen
  align?: "start" | "end";
  // paint the trigger label in the accent color
  accent?: boolean;
  // reserve the widest option's width so switching labels never reflows the bar
  steadyWidth?: boolean;
}) {
  const styles = useThemedStyles(barDropdownStyles);
  const barStyles = useThemedStyles(officeBarStyles);
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.id === value);
  const labelStyle = mono ? styles.mono : undefined;
  const widestLabel = options.reduce(
    (widest, option) =>
      option.label.length > widest.length ? option.label : widest,
    "",
  );

  // the Escape key closes the menu like the floating pickers, one layer at a
  // time
  useEffect(() => {
    if (!open) return;
    return registerEsc(() => setOpen(false));
  }, [open]);

  const pick = (id: T) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ hovered }) => [
          barStyles.toggle,
          barStyles.modeToggle,
          styles.trigger,
          hovered && barStyles.tabHover,
        ]}
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={accessibilityLabel}
      >
        <Chevron direction={open ? "up" : "down"} size={5} />
        {steadyWidth ? (
          <View style={styles.labelWrap}>
            <Text style={[barStyles.toggleText, labelStyle, styles.labelGhost]}>
              {widestLabel}
            </Text>
            <Text
              style={[
                barStyles.toggleText,
                labelStyle,
                accent && styles.accentText,
                styles.labelOverlay,
              ]}
            >
              {current?.label}
            </Text>
          </View>
        ) : (
          <Text
            style={[
              barStyles.toggleText,
              labelStyle,
              accent && styles.accentText,
            ]}
          >
            {current?.label}
          </Text>
        )}
      </Pressable>
      {open ? (
        <>
          <Pressable
            style={styles.backdrop}
            onPress={() => setOpen(false)}
            accessibilityLabel="Close menu"
            accessibilityRole="button"
          />
          <View
            style={[
              styles.menu,
              { width: menuWidth },
              align === "start" ? { left: 0 } : { right: 0 },
            ]}
          >
            {options.map((o) => {
              const selected = o.id === value;
              return (
                <Pressable
                  key={o.id}
                  style={({ hovered }) => [
                    styles.item,
                    (hovered || selected) && barStyles.tabHover,
                  ]}
                  onPress={() => pick(o.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text
                    style={[
                      styles.itemText,
                      labelStyle,
                      selected && barStyles.toggleTextOn,
                    ]}
                  >
                    {o.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}
    </View>
  );
}

// a bar chip that opens a small menu the caller fills with rows; the menu
// stays open across its toggles and closes on outside click or Escape
export function BarMenu({
  label,
  icon,
  accessibilityLabel,
  align = "end",
  menuWidth = 168,
  children,
}: {
  label?: string;
  icon?: (color: string) => ReactNode;
  accessibilityLabel: string;
  align?: "start" | "end";
  menuWidth?: number;
  children: ReactNode;
}) {
  const styles = useThemedStyles(barDropdownStyles);
  const barStyles = useThemedStyles(officeBarStyles);
  const v = useThemeVar();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    return registerEsc(() => setOpen(false));
  }, [open]);

  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ hovered }) => [
          barStyles.toggle,
          barStyles.modeToggle,
          styles.trigger,
          hovered && barStyles.tabHover,
        ]}
        onPress={() => setOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={accessibilityLabel}
      >
        {label ? <Chevron direction={open ? "up" : "down"} size={5} /> : null}
        {icon
          ? icon(v(open ? "var(--accent)" : "var(--text-secondary)"))
          : null}
        {label ? <Text style={barStyles.toggleText}>{label}</Text> : null}
      </Pressable>
      {open ? (
        <>
          <Pressable
            style={styles.backdrop}
            onPress={() => setOpen(false)}
            accessibilityLabel="Close menu"
            accessibilityRole="button"
          />
          <View
            style={[
              styles.menu,
              { width: menuWidth },
              align === "start" ? { left: 0 } : { right: 0 },
            ]}
          >
            {children}
          </View>
        </>
      ) : null}
    </View>
  );
}

// one on/off row inside a BarMenu; the value reads in accent while on
export function BarMenuItem({
  label,
  value,
  selected,
  onPress,
}: {
  label: string;
  value: string;
  selected: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles(barDropdownStyles);
  const barStyles = useThemedStyles(officeBarStyles);
  return (
    <Pressable
      style={({ hovered }) => [styles.menuRow, hovered && barStyles.tabHover]}
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text style={styles.menuRowText}>{label}</Text>
      <Text style={[styles.menuRowState, selected && barStyles.toggleTextOn]}>
        {value}
      </Text>
    </Pressable>
  );
}

// themed definition: the popover reads its surface from var(--bg) so it is
// always painted from the theme, whatever the class engine does
const barDropdownStyles = defineThemedStyles({
  wrap: {
    // anchor for the menu; keeps the popover pinned to the chip
    position: "relative",
    flexShrink: 0,
  },
  // the bar toggle's frame plus a row layout for the leading chevron.
  // tighter side padding and a wider gap set the chevron off the code
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    gap: 7,
  },
  mono: {
    fontFamily: MONO,
  },
  // a trigger label that keeps the widest option's width: an invisible ghost
  // sets the box, the visible label floats above it
  labelWrap: {
    position: "relative",
  },
  labelGhost: {
    opacity: 0,
  },
  labelOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  accentText: {
    color: "var(--accent)",
  },
  // full-viewport dismiss layer; the huge offsets escape the bar's box
  backdrop: {
    position: "absolute",
    top: -10000,
    left: -10000,
    width: 30000,
    height: 30000,
    zIndex: 40,
  },
  menu: {
    position: "absolute",
    top: 30,
    zIndex: 50,
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "var(--border-content)",
    backgroundColor: "var(--bg)",
    shadowColor: "var(--shadow-color)",
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  item: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  itemText: {
    fontFamily: CHROME_FONT,
    fontSize: 12,
    fontWeight: "500",
    color: "var(--text)",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  menuRowText: {
    fontFamily: CHROME_FONT,
    fontSize: 12,
    fontWeight: "500",
    color: "var(--text)",
  },
  menuRowState: {
    fontFamily: CHROME_FONT,
    fontSize: 12,
    fontWeight: "500",
    color: "var(--text-secondary)",
  },
});
