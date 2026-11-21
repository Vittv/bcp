import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { colorFor, daysInMonth, weekday } from "../../lib/calendar";
import type { CalendarDate } from "../../lib/calendar/types";
import { useThemedStyles } from "../../lib/theme/themedStyles";
import { Chevron } from "./Chevron";
import { monthPickerStyles } from "./MonthPicker.styles";
import { today } from "./model/shellUtils";
import { useSeasonColorMap } from "./SeasonDot";

export const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function sameDate(a: CalendarDate, b: CalendarDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

export function shortLabel(date: CalendarDate): string {
  const wd = WEEKDAYS_SHORT[weekday(date)];
  return `${wd}, ${MONTHS_SHORT[date.month - 1]} ${date.day}, ${date.year}`;
}

// phones drop the weekday and year to make room for the office name
export function compactLabel(date: CalendarDate): string {
  return `${MONTHS_SHORT[date.month - 1]} ${date.day}`;
}

// compact month grid: season-tinted days, today ringed, selected filled
export function MonthPicker({
  date,
  sheetStyle,
  anchorStyle,
  onChange,
}: {
  date: CalendarDate;
  sheetStyle: { backgroundColor: string };
  anchorStyle?: { left: "auto"; right: number };
  onChange: (d: CalendarDate) => void;
}) {
  const colorMap = useSeasonColorMap();
  const [view, setView] = useState(() => ({
    year: date.year,
    month: date.month,
  }));
  const styles = useThemedStyles(monthPickerStyles);

  const shiftMonth = (n: number) => {
    const m = ((view.month - 1 + n + 12) % 12) + 1;
    const y =
      view.month + n < 1
        ? view.year - 1
        : view.month + n > 12
          ? view.year + 1
          : view.year;
    setView({ year: y, month: m });
  };

  const firstDay = weekday({ year: view.year, month: view.month, day: 1 });
  const days = daysInMonth(view.year, view.month);
  const totalCells = Math.ceil((firstDay + days) / 7) * 7;
  const now = today();

  return (
    <View style={[styles.popover, sheetStyle, anchorStyle]}>
      <View style={styles.popNav}>
        <Pressable
          style={({ hovered }) => [styles.stepBtn, hovered && styles.rowHover]}
          onPress={() => shiftMonth(-1)}
          accessibilityLabel="Previous month"
          accessibilityRole="button"
        >
          <Chevron direction="left" />
        </Pressable>
        <Text style={styles.popMonth}>
          {MONTHS_SHORT[view.month - 1]} {view.year}
        </Text>
        <Pressable
          style={({ hovered }) => [styles.stepBtn, hovered && styles.rowHover]}
          onPress={() => shiftMonth(1)}
          accessibilityLabel="Next month"
          accessibilityRole="button"
        >
          <Chevron direction="right" />
        </Pressable>
      </View>
      <View style={styles.popGrid}>
        {Array.from({ length: totalCells }, (_, i) => {
          const dayNum = i - firstDay + 1;
          const isValid = dayNum >= 1 && dayNum <= days;
          const cell: CalendarDate = {
            year: view.year,
            month: view.month,
            day: dayNum,
          };
          const isSelected = isValid && sameDate(cell, date);
          const isToday = isValid && sameDate(cell, now);

          return (
            <Pressable
              // biome-ignore lint/suspicious/noArrayIndexKey: static grid, never reorders
              key={i}
              disabled={!isValid}
              onPress={() => onChange(cell)}
              style={({ hovered }) => [
                styles.popCell,
                hovered && isValid && styles.rowHover,
                isToday && styles.popCellToday,
                isSelected && styles.popCellSelected,
              ]}
            >
              {isValid ? (
                <Text
                  style={[
                    styles.popCellText,
                    { color: colorMap[colorFor(cell)] },
                    isSelected && styles.popCellTextSelected,
                  ]}
                >
                  {dayNum}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      <Pressable
        style={({ hovered }) => [styles.popToday, hovered && styles.rowHover]}
        onPress={() => onChange(now)}
        accessibilityLabel="Jump to today"
        accessibilityRole="button"
      >
        <Text style={styles.popTodayText}>Today</Text>
      </Pressable>
    </View>
  );
}
