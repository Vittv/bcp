import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SHEET_BG, useTheme } from "../../context/ThemeContext";
import { CHROME_FONT } from "../../lib/fonts";
import { Chevron } from "./Chevron";
import { officeBarStyles } from "./OfficeTabs";

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
}) {
  const { resolved } = useTheme();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.id === value);
  const labelStyle = mono ? styles.mono : undefined;

  const pick = (id: T) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ hovered }) => [
          officeBarStyles.toggle,
          officeBarStyles.modeToggle,
          styles.trigger,
          hovered && officeBarStyles.tabHover,
        ]}
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={accessibilityLabel}
      >
        <Chevron direction={open ? "up" : "down"} size={5} />
        <Text
          style={[
            officeBarStyles.toggleText,
            labelStyle,
            accent && styles.accentText,
          ]}
        >
          {current?.label}
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
          <View
            style={[
              styles.menu,
              { width: menuWidth, backgroundColor: SHEET_BG[resolved] },
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
                    (hovered || selected) && officeBarStyles.tabHover,
                  ]}
                  onPress={() => pick(o.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text
                    style={[
                      styles.itemText,
                      labelStyle,
                      selected && officeBarStyles.toggleTextOn,
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

const styles = StyleSheet.create({
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
  accentText: {
    color: "var(--accent, #7a3040)",
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
    borderColor: "var(--border-content, #b5aa9e)",
    shadowColor: "#000",
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
    color: "var(--text, #2c2020)",
  },
});
