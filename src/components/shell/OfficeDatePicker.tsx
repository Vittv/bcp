import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import type { CalendarDate } from "../../lib/calendar/types";
import { useThemedStyles, useThemeVar } from "../../lib/theme/themedStyles";
import { registerEsc } from "./AppModal";
import { CalendarIcon } from "./Icon";
import { MonthPicker } from "./MonthPicker";
import { officeDatePickerStyles } from "./OfficeDatePicker.styles";

// a single calendar icon beside the office toggles; the Offices reference bar
// uses the same MonthPicker, but this chip keeps the picked date out of the bar
export function OfficeDatePicker({
  date,
  onPickDate,
}: {
  date: CalendarDate;
  onPickDate: (date: CalendarDate) => void;
}) {
  const [open, setOpen] = useState(false);
  const { tokens } = useTheme();
  const styles = useThemedStyles(officeDatePickerStyles);
  const v = useThemeVar();

  useEffect(() => {
    if (!open) return;
    return registerEsc(() => setOpen(false));
  }, [open]);

  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ hovered }) => [styles.button, hovered && styles.hover]}
        onPress={() => setOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel="Pick a date for the Daily Office"
      >
        <CalendarIcon
          size={14}
          color={v(open ? "var(--accent)" : "var(--text-secondary)")}
        />
      </Pressable>
      {open ? (
        <>
          <Pressable
            style={styles.backdrop}
            onPress={() => setOpen(false)}
            accessibilityLabel="Close date picker"
            accessibilityRole="button"
          />
          <MonthPicker
            date={date}
            sheetStyle={{ backgroundColor: tokens.bg }}
            anchorStyle={styles.anchor}
            onChange={(next) => {
              onPickDate(next);
              setOpen(false);
            }}
          />
        </>
      ) : null}
    </View>
  );
}
