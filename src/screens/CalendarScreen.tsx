import { type ReactNode, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppModal } from "../components/shell/AppModal";
import { Chevron } from "../components/shell/Chevron";
import { useSeasonColorMap } from "../components/shell/SeasonDot";
import { useNavigation } from "../context/NavigationContext";
import { colorFor, daysInMonth, weekday } from "../lib/calendar";
import {
  type DayInfo,
  type DayObservance,
  dayInfo,
  seasonLabel,
} from "../lib/calendar/observances";
import type { CalendarDate } from "../lib/calendar/types";
import { CHROME_FONT, HEADING_FONT, SERIF_FONT } from "../lib/fonts";
import { useReference } from "./reference/shared";

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

function formatDate(date: CalendarDate): string {
  return `${MONTH_NAMES[date.month - 1]} ${date.day}, ${date.year}`;
}

// a short label for a feast name, sized to fit a calendar cell
function cellName(name: string): string {
  const compact: Record<string, string> = {
    "The Holy Name of Our Lord Jesus Christ": "Holy Name",
    "First Sunday of Advent": "Advent 1",
    "Sunday of the Passion: Palm Sunday": "Palm Sunday",
    "The Day of Pentecost": "Pentecost",
    "The Baptism of our Lord": "Baptism of our Lord",
    "Last Sunday after the Epiphany": "Last Epiphany",
  };
  return compact[name] ?? name.replace(/^The /, "");
}

// the labels shown stacked inside a calendar cell. the season boundary name
// always comes first (so periods like "After Pentecost" read only on their
// first and last days), then any named observances of the day.
function cellLabels(info: DayInfo): { season: boolean; text: string }[] {
  const labels: { season: boolean; text: string }[] = [];
  if (info.seasonStart || info.seasonEnd) {
    labels.push({ season: true, text: seasonLabel(info.season) });
  }
  for (const obs of info.observances) {
    labels.push({ season: false, text: cellName(obs.name) });
  }
  return labels;
}

type CalendarScreenProps = {
  leading?: ReactNode;
};

export function CalendarScreen({ leading }: CalendarScreenProps) {
  const colorMap = useSeasonColorMap();
  const { setOpenSaint } = useReference();
  const { navigateTo } = useNavigation();
  const todayDate: CalendarDate = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
  };
  const [viewMonth, setViewMonth] = useState(() => ({
    year: todayDate.year,
    month: todayDate.month,
  }));
  const [selected, setSelected] = useState<CalendarDate>(todayDate);
  const [openDay, setOpenDay] = useState<CalendarDate | null>(null);

  const firstDay = weekday({
    year: viewMonth.year,
    month: viewMonth.month,
    day: 1,
  });
  const days = daysInMonth(viewMonth.year, viewMonth.month);
  const onToday = isSameDay(selected, todayDate);

  // index the day-info for the whole visible month once per render
  const infoByKey = useMemo(() => {
    const map = new Map<string, DayInfo>();
    for (let d = 1; d <= days; d++) {
      map.set(
        `${viewMonth.year}-${viewMonth.month}-${d}`,
        dayInfo({
          year: viewMonth.year,
          month: viewMonth.month,
          day: d,
        }),
      );
    }
    return map;
  }, [viewMonth.year, viewMonth.month, days]);

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

  const goToday = () => {
    setSelected(todayDate);
    setOpenDay(null);
    setViewMonth({ year: todayDate.year, month: todayDate.month });
  };

  const totalCells = Math.ceil((firstDay + days) / 7) * 7;

  const goToObservance = (obs: DayObservance) => {
    if (obs.slug) {
      setOpenSaint(obs.slug);
      navigateTo({ page: "saints" });
      return;
    }
    navigateTo("today");
  };

  const openObs = openDay ? dayInfo(openDay) : null;

  return (
    <View style={styles.container}>
      <View style={[styles.monthNav, noSelect]}>
        {leading ? <View style={styles.leading}>{leading}</View> : null}
        <View style={styles.monthCenter}>
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
        <Pressable
          style={({ hovered }) => [
            styles.todayBtn,
            hovered && styles.todayBtnHover,
          ]}
          onPress={goToday}
          accessibilityLabel="Jump to today"
          accessibilityRole="button"
          accessibilityState={{ selected: onToday }}
        >
          <Text style={[styles.todayText, onToday && styles.todayTextOn]}>
            Today
          </Text>
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
                const info = isValid
                  ? infoByKey.get(`${cell.year}-${cell.month}-${cell.day}`)
                  : undefined;
                const seasonColor = isValid ? colorMap[colorFor(cell)] : null;
                const isToday = isValid && isSameDay(cell, todayDate);
                const isSelected = isValid && isSameDay(cell, selected);
                const labels = info ? cellLabels(info) : null;

                return (
                  <Pressable
                    key={`cell-${viewMonth.year}-${viewMonth.month}-${dayNum}`}
                    onPress={() => {
                      if (!isValid) return;
                      setSelected(cell);
                      if (info && info.observances.length > 0) setOpenDay(cell);
                      else setOpenDay(null);
                    }}
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
                      <View style={styles.cellInner}>
                        <Text
                          style={[
                            styles.cellText,
                            seasonColor ? { color: seasonColor } : undefined,
                          ]}
                        >
                          {dayNum}
                        </Text>
                        {labels ? (
                          <View style={styles.cellLabels}>
                            {labels.map((l) => (
                              <Text
                                key={l.text}
                                style={[
                                  styles.cellLabel,
                                  l.season ? styles.cellLabelSeason : null,
                                  l.season && seasonColor
                                    ? { color: seasonColor }
                                    : null,
                                ]}
                                numberOfLines={1}
                              >
                                {l.text}
                              </Text>
                            ))}
                          </View>
                        ) : null}
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      <SelectedDayStrip date={selected} onOpenDay={setOpenDay} />

      {openObs && openDay ? (
        <DayModal
          date={openDay}
          info={openObs}
          onClose={() => setOpenDay(null)}
          onGo={goToObservance}
        />
      ) : null}
    </View>
  );
}

// the strip under the grid: what the selected day observes, and a button
// to open the fuller modal
function SelectedDayStrip({
  date,
  onOpenDay,
}: {
  date: CalendarDate;
  onOpenDay: (d: CalendarDate) => void;
}) {
  const colorMap = useSeasonColorMap();
  const info = dayInfo(date);
  const seasonColor = colorMap[colorFor(date)];
  return (
    <View style={[styles.strip, noSelect]}>
      <Pressable
        style={({ hovered }) => [
          styles.stripBtn,
          hovered && styles.stripBtnHover,
        ]}
        onPress={() => onOpenDay(date)}
        accessibilityRole="button"
      >
        <Text style={styles.stripDate}>{formatDate(date)}</Text>
        <Text style={[styles.stripSeason, { color: seasonColor }]}>
          {seasonLabel(info.season)}
        </Text>
        <Text style={styles.stripBody}>
          {info.seasonStart
            ? "Season begins. "
            : info.seasonEnd
              ? "Season ends. "
              : ""}
          {info.observances.length > 0
            ? info.observances.map((o) => o.name).join(" · ")
            : "No proper day."}
        </Text>
      </Pressable>
    </View>
  );
}

function DayModal({
  date,
  info,
  onClose,
  onGo,
}: {
  date: CalendarDate;
  info: DayInfo;
  onClose: () => void;
  onGo: (obs: DayObservance) => void;
}) {
  const colorMap = useSeasonColorMap();
  const seasonColor = colorMap[colorFor(date)];
  return (
    <AppModal
      title={formatDate(date)}
      onClose={onClose}
      width={400}
      titleStyle={{
        fontFamily: HEADING_FONT,
        fontWeight: "700",
        fontSize: 22,
        letterSpacing: 0,
      }}
    >
      <Text style={[styles.modalSeason, { color: seasonColor }]}>
        {seasonLabel(info.season)}
        {info.seasonStart ? " · begins" : info.seasonEnd ? " · ends" : ""}
      </Text>
      <View style={styles.modalList}>
        {info.observances.length === 0 ? (
          <Text style={styles.modalEmpty}>No proper day.</Text>
        ) : (
          info.observances.map((obs) => (
            <Pressable
              key={obs.slug ?? obs.name}
              style={({ hovered }) => [
                styles.modalRow,
                hovered && styles.modalRowHover,
              ]}
              onPress={() => onGo(obs)}
              accessibilityRole="button"
            >
              <Text style={styles.modalRowName}>{obs.name}</Text>
              <Text style={styles.modalRowGo}>
                {obs.slug ? "Open in Saints" : "Go to day"} ›
              </Text>
            </Pressable>
          ))
        )}
      </View>
    </AppModal>
  );
}

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
    justifyContent: "flex-start",
    gap: 8,
  },
  monthCenter: {
    position: "absolute",
    left: "50%",
    transform: [{ translateX: "-50%" }],
    flexDirection: "row",
    alignItems: "center",
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
  todayBtn: {
    position: "absolute",
    right: 8,
    height: 28,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  todayBtnHover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  todayText: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    fontWeight: "500",
    color: "var(--text-secondary, #7a6e64)",
  },
  todayTextOn: {
    color: "var(--accent, #7a3040)",
    fontWeight: "600",
  },
  monthTitle: {
    fontFamily: CHROME_FONT,
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
    display: "flex",
    flexDirection: "column",
  },
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "var(--border, #d2cbbf)",
    flexShrink: 0,
  },
  headerCell: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
  },
  headerCellRight: {
    borderRightWidth: 1,
    borderRightColor: "var(--border, #d2cbbf)",
  },
  headerText: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "var(--text-secondary, #7a6e64)",
  },
  body: {
    flex: 1,
    display: "flex",
  },
  weekRow: {
    flex: 1,
    flexDirection: "row",
  },
  cell: {
    flex: 1,
    padding: 4,
    alignItems: "flex-start",
    justifyContent: "flex-start",
    overflow: "hidden",
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
    backgroundColor: "var(--selected-bg, #dbd7cd)",
  },
  cellHover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  cellInner: {
    alignItems: "flex-start",
  },
  cellText: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    fontWeight: "500",
    color: "var(--text, #2c2020)",
    fontVariant: ["tabular-nums"],
  },
  cellLabel: {
    fontFamily: CHROME_FONT,
    fontSize: 9.5,
    lineHeight: 11,
    fontWeight: "600",
    color: "var(--text-secondary, #7a6e64)",
  },
  cellLabels: {
    marginTop: 2,
    gap: 1,
  },
  cellLabelSeason: {
    color: "var(--accent, #7a3040)",
  },
  strip: {
    flexShrink: 0,
    borderTopWidth: 1,
    borderTopColor: "var(--border, #d2cbbf)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "var(--bg-raised, #ece7dd)",
  },
  stripBtn: {
    gap: 2,
  },
  stripBtnHover: {},
  stripDate: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    fontWeight: "700",
    color: "var(--text, #2c2020)",
  },
  stripSeason: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  stripBody: {
    fontFamily: CHROME_FONT,
    fontSize: 12,
    lineHeight: 17,
    color: "var(--text-secondary, #7a6e64)",
  },
  modalSeason: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  modalList: {
    gap: 4,
  },
  modalEmpty: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    color: "var(--text-secondary, #7a6e64)",
    paddingVertical: 8,
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  modalRowHover: {
    backgroundColor: "var(--control-hover, #d2cbbf)",
  },
  modalRowName: {
    fontFamily: SERIF_FONT,
    fontSize: 16,
    color: "var(--text, #2c2020)",
    flex: 1,
  },
  modalRowGo: {
    fontFamily: CHROME_FONT,
    fontSize: 12,
    fontWeight: "600",
    color: "var(--accent, #7a3040)",
    flexShrink: 0,
  },
});
