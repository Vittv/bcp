import { type ReactNode, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Chevron } from "../components/shell/Chevron";
import { useSeasonColorMap } from "../components/shell/SeasonDot";
import { colorFor, daysInMonth, weekday } from "../lib/calendar";
import type { CalendarDate } from "../lib/calendar/types";

const noSelect = {
  userSelect: "none" as const,
  WebkitUserSelect: "none" as const,
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function isSameDay(a: CalendarDate, b: CalendarDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

type CalendarScreenProps = {
  date: CalendarDate;
  onSelectDate: (date: CalendarDate) => void;
  leading?: ReactNode;
};

export function CalendarScreen({
  date,
  onSelectDate,
  leading,
}: CalendarScreenProps) {
  const colorMap = useSeasonColorMap();
  const [viewMonth, setViewMonth] = useState(() => ({
    year: date.year,
    month: date.month,
  }));

  const firstDay = weekday({
    year: viewMonth.year,
    month: viewMonth.month,
    day: 1,
  });
  const days = daysInMonth(viewMonth.year, viewMonth.month);
  const todayDate: CalendarDate = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
  };

  const prevMonth = () => {
    const m = viewMonth.month === 1 ? 12 : viewMonth.month - 1;
    const y = viewMonth.month === 1 ? viewMonth.year - 1 : viewMonth.year;
    setViewMonth({ year: y, month: m });
  };

  const nextMonth = () => {
    const m = viewMonth.month === 12 ? 1 : viewMonth.month + 1;
    const y = viewMonth.month === 12 ? viewMonth.year + 1 : viewMonth.year;
    setViewMonth({ year: y, month: m });
  };

  const totalCells = Math.ceil((firstDay + days) / 7) * 7;

  return (
    <View style={styles.container}>
      <View style={[styles.monthNav, noSelect]}>
        {leading ? <View style={styles.leading}>{leading}</View> : null}
        <Pressable
          style={({ hovered }) => [
            styles.arrowBtn,
            hovered && styles.arrowBtnHover,
          ]}
          onPress={prevMonth}
          accessibilityLabel="Previous month"
          accessibilityRole="button"
        >
          <Chevron direction="left" />
        </Pressable>
        <Text style={styles.monthTitle}>
          {MONTH_NAMES[viewMonth.month - 1]} {viewMonth.year}
        </Text>
        <Pressable
          style={({ hovered }) => [
            styles.arrowBtn,
            hovered && styles.arrowBtnHover,
          ]}
          onPress={nextMonth}
          accessibilityLabel="Next month"
          accessibilityRole="button"
        >
          <Chevron direction="right" />
        </Pressable>
      </View>

      <View style={styles.grid}>
        <View style={[styles.headerRow, noSelect]}>
          {DAY_LABELS.map((d, i) => (
            <View
              key={d}
              style={[styles.headerCell, i < 6 && styles.headerCellRight]}
            >
              <Text style={styles.headerText}>{d}</Text>
            </View>
          ))}
        </View>

        <View style={styles.body}>
          {Array.from({ length: totalCells / 7 }, (_, week) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static grid, never reorders
            <View key={`week-${week}`} style={styles.weekRow}>
              {Array.from({ length: 7 }, (_, dayOfWeek) => {
                const i = week * 7 + dayOfWeek;
                const dayNum = i - firstDay + 1;
                const isValid = dayNum >= 1 && dayNum <= days;
                const cell: CalendarDate = {
                  year: viewMonth.year,
                  month: viewMonth.month,
                  day: dayNum,
                };
                const seasonColor = isValid ? colorMap[colorFor(cell)] : null;
                const isToday = isValid && isSameDay(cell, todayDate);
                const isSelected = isValid && isSameDay(cell, date);

                return (
                  <Pressable
                    key={`cell-${viewMonth.year}-${viewMonth.month}-${dayNum}`}
                    onPress={() => isValid && onSelectDate(cell)}
                    style={({ hovered }) => [
                      styles.cell,
                      dayOfWeek < 6 && styles.cellRight,
                      week < totalCells / 7 - 1 && styles.cellBottom,
                      isToday && styles.cellToday,
                      isSelected && styles.cellSelected,
                      hovered && isValid && styles.cellHover,
                    ]}
                  >
                    {isValid ? (
                      <Text
                        style={[
                          styles.cellText,
                          seasonColor ? { color: seasonColor } : undefined,
                        ]}
                      >
                        {dayNum}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const SANS =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const styles = StyleSheet.create({
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  leading: {
    position: "absolute",
    left: 4,
    flexDirection: "row",
  },
  monthNav: {
    height: 30,
    borderBottomWidth: 1,
    borderBottomColor: "var(--border, #d2cbbf)",
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  arrowBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  arrowBtnHover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  monthTitle: {
    fontFamily: SANS,
    fontSize: 14,
    fontWeight: "600",
    color: "var(--text, #2c2020)",
    minWidth: 150,
    textAlign: "center",
  },
  grid: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: "var(--border, #d2cbbf)",
  },
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "var(--border, #d2cbbf)",
  },
  headerCell: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  headerCellRight: {
    borderRightWidth: 1,
    borderRightColor: "var(--border, #d2cbbf)",
  },
  headerText: {
    fontFamily: SANS,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "var(--text-secondary, #7a6e64)",
  },
  body: {
    flex: 1,
  },
  weekRow: {
    flex: 1,
    flexDirection: "row",
  },
  cell: {
    flex: 1,
    padding: 6,
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  cellRight: {
    borderRightWidth: 1,
    borderRightColor: "var(--border, #d2cbbf)",
  },
  cellBottom: {
    borderBottomWidth: 1,
    borderBottomColor: "var(--border, #d2cbbf)",
  },
  cellToday: {
    backgroundColor: "var(--today-bg, rgba(122, 48, 64, 0.16))",
  },
  cellSelected: {
    backgroundColor: "var(--selected-bg, rgba(44, 32, 32, 0.09))",
  },
  cellHover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  cellText: {
    fontFamily: SANS,
    fontSize: 14,
    fontWeight: "500",
    color: "var(--text, #2c2020)",
  },
});
