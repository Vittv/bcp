import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
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
import { CHROME_FONT } from "../lib/fonts";
import { registerPageStepper } from "../lib/input/sequenceNav";
import { defineThemedStyles, useThemedStyles } from "../lib/theme/themedStyles";
import { useViewport, WIDTH_COMPACT } from "../lib/viewport";
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
// first and last days), then any named observances of the day. the Sunday
// name and lesser feasts stay quiet so an actual feast leads the cell.
function cellLabels(
  info: DayInfo,
): { season: boolean; quiet: boolean; text: string }[] {
  const labels: { season: boolean; quiet: boolean; text: string }[] = [];
  if (info.seasonStart || info.seasonEnd) {
    labels.push({
      season: true,
      quiet: false,
      text: seasonLabel(info.season),
    });
  }
  for (const obs of info.observances) {
    labels.push({
      season: false,
      quiet: obs.rank === "sunday" || obs.rank === "lesser",
      text: cellName(obs.name),
    });
  }
  return labels;
}

type CalendarScreenProps = {
  leading?: ReactNode;
};

export function CalendarScreen({ leading }: CalendarScreenProps) {
  const styles = useThemedStyles(styleDef);
  const colorMap = useSeasonColorMap();
  const { setOpenSaint, setOpenLesserFeast } = useReference();
  const { navigateTo } = useNavigation();
  const { height } = useWindowDimensions();
  const { width } = useViewport();
  // chips read best at three per cell on a desktop grid and two on a phone;
  // one of the slots is reserved for the "+N" row when a day overflows
  const cellRows = height < 800 ? 3 : 4;
  const narrowCells = width < 420;
  const compactCells = width < WIDTH_COMPACT;
  const cellPad = narrowCells ? 2 : compactCells ? 3 : 4;
  const cellLabelSize = narrowCells ? 9 : compactCells ? 10 : 12;
  const cellLabelLineHeight = narrowCells ? 12 : compactCells ? 13 : 15;
  const cellTextSize = narrowCells ? 11 : compactCells ? 12 : 13;
  const chipPadH = narrowCells ? 2 : compactCells ? 3 : 4;
  const chipPadV = narrowCells ? 0 : 1;
  const cellLabelGap = narrowCells ? 2 : 3;
  const cellLabelsMarginTop = narrowCells ? 2 : 4;
  const cellMoreSize = narrowCells ? 8 : 9;
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

  // step the visible month by one, rolling the year at the boundaries.
  const shiftMonth = useCallback((delta: number) => {
    const step = delta > 0 ? 1 : delta < 0 ? -1 : 0;
    if (step === 0) return;
    setViewMonth((current) => {
      const month = current.month + step;
      if (month < 1) return { year: current.year - 1, month: 12 };
      if (month > 12) return { year: current.year + 1, month: 1 };
      return { year: current.year, month };
    });
  }, []);

  const prevMonth = () => shiftMonth(-1);
  const nextMonth = () => shiftMonth(1);

  // left/right and h/l step the month while the calendar page is active. the
  // day modal keeps the keys, so the stepper unregisters while it is open.
  useEffect(() => {
    if (openDay) return;
    registerPageStepper("calendar", (delta) => {
      if (delta === 0) return false;
      shiftMonth(delta);
      return true;
    });
    return () => registerPageStepper("calendar", null);
  }, [openDay, shiftMonth]);

  const goToday = () => {
    setSelected(todayDate);
    setOpenDay(null);
    setViewMonth({ year: todayDate.year, month: todayDate.month });
  };

  const totalCells = Math.ceil((firstDay + days) / 7) * 7;

  const goToObservance = (obs: DayObservance) => {
    if (obs.lesserSlug) {
      setOpenLesserFeast(obs.lesserSlug);
      navigateTo({ page: "lesser-feasts" });
      return;
    }
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
                const labels = info ? cellLabels(info) : [];
                const visibleLabels =
                  labels.length > cellRows
                    ? labels.slice(0, cellRows - 1)
                    : labels;
                const hiddenLabels = labels.length - visibleLabels.length;

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
                      { padding: cellPad },
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
                            { fontSize: cellTextSize },
                            seasonColor ? { color: seasonColor } : undefined,
                          ]}
                        >
                          {dayNum}
                        </Text>
                        {visibleLabels.length > 0 ? (
                          <View
                            style={[
                              styles.cellLabels,
                              {
                                marginTop: cellLabelsMarginTop,
                                gap: cellLabelGap,
                              },
                            ]}
                          >
                            {visibleLabels.map((l) => (
                              <View
                                key={l.text}
                                style={[
                                  styles.cellChip,
                                  {
                                    paddingHorizontal: chipPadH,
                                    paddingVertical: chipPadV,
                                  },
                                  !l.quiet &&
                                    !l.season && { borderColor: colorMap.gold },
                                  l.season && seasonColor
                                    ? { borderColor: seasonColor }
                                    : null,
                                ]}
                              >
                                <Text
                                  numberOfLines={1}
                                  style={[
                                    styles.cellLabel,
                                    {
                                      fontSize: cellLabelSize,
                                      lineHeight: cellLabelLineHeight,
                                    },
                                    !l.quiet && styles.cellLabelFeast,
                                    l.season ? styles.cellLabelSeason : null,
                                    l.quiet ? styles.cellLabelQuiet : null,
                                    l.season && seasonColor
                                      ? { color: seasonColor }
                                      : null,
                                  ]}
                                >
                                  {l.text}
                                </Text>
                              </View>
                            ))}
                            {hiddenLabels > 0 ? (
                              <Text
                                style={[
                                  styles.cellMore,
                                  { fontSize: cellMoreSize },
                                ]}
                              >
                                +{hiddenLabels} more
                              </Text>
                            ) : null}
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
  const styles = useThemedStyles(styleDef);
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
  const styles = useThemedStyles(styleDef);
  const colorMap = useSeasonColorMap();
  const seasonColor = colorMap[colorFor(date)];
  return (
    <AppModal
      title={formatDate(date)}
      onClose={onClose}
      width={400}
      titleStyle={{
        fontFamily: CHROME_FONT,
        fontWeight: "600",
        fontSize: 20,
        letterSpacing: 0.2,
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
          info.observances.map((obs) =>
            obs.lesserSlug ? (
              <Pressable
                key={obs.lesserSlug}
                style={({ hovered }) => [
                  styles.modalRow,
                  styles.modalRowClickable,
                  hovered && styles.modalRowHover,
                ]}
                onPress={() => onGo(obs)}
                accessibilityRole="button"
              >
                <Text style={[styles.modalRowName, styles.modalRowNameLesser]}>
                  {obs.name}
                </Text>
                <Text style={styles.modalRowGo}>Open ›</Text>
              </Pressable>
            ) : obs.rank === "lesser" ? (
              <View key={obs.name} style={styles.modalRow}>
                <Text style={[styles.modalRowName, styles.modalRowNameLesser]}>
                  {obs.name}
                </Text>
              </View>
            ) : obs.rank === "sunday" ? (
              <View key={obs.name} style={styles.modalRow}>
                <Text style={[styles.modalRowName, styles.modalRowNameSunday]}>
                  {obs.name}
                </Text>
              </View>
            ) : (
              <Pressable
                key={obs.slug ?? obs.name}
                style={({ hovered }) => [
                  styles.modalRow,
                  styles.modalRowClickable,
                  hovered && styles.modalRowHover,
                ]}
                onPress={() => onGo(obs)}
                accessibilityRole="button"
              >
                <Text style={styles.modalRowName}>{obs.name}</Text>
                <Text style={styles.modalRowGo}>
                  {obs.slug ? "Open in Holy Days" : "Go to day"} ›
                </Text>
              </Pressable>
            ),
          )
        )}
      </View>
    </AppModal>
  );
}

const styleDef = defineThemedStyles({
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
    borderBottomColor: "var(--border)",
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
    backgroundColor: "var(--control-hover)",
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
    backgroundColor: "var(--control-hover)",
  },
  todayText: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    fontWeight: "500",
    color: "var(--text-secondary)",
  },
  todayTextOn: {
    color: "var(--accent)",
    fontWeight: "600",
  },
  monthTitle: {
    fontFamily: CHROME_FONT,
    fontSize: 14,
    fontWeight: "600",
    color: "var(--text)",
    minWidth: 150,
    textAlign: "center",
  },
  grid: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: "var(--border)",
    display: "flex",
    flexDirection: "column",
  },
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "var(--border)",
    flexShrink: 0,
  },
  headerCell: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
  },
  headerCellRight: {
    borderRightWidth: 1,
    borderRightColor: "var(--border)",
  },
  headerText: {
    fontFamily: CHROME_FONT,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "var(--text-secondary)",
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
    borderRightColor: "var(--border)",
  },
  cellBottom: {
    borderBottomWidth: 1,
    borderBottomColor: "var(--border)",
  },
  cellToday: {
    backgroundColor: "var(--today-bg)",
  },
  cellSelected: {
    backgroundColor: "var(--selected-bg)",
  },
  cellHover: {
    backgroundColor: "var(--control-hover)",
  },
  cellInner: {
    alignItems: "flex-start",
    width: "100%",
  },
  cellText: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    fontWeight: "500",
    color: "var(--text)",
    fontVariant: ["tabular-nums"],
  },
  cellLabel: {
    fontFamily: CHROME_FONT,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "600",
    color: "var(--text-secondary)",
  },
  // principal feasts and holy days read at full ink; the Sunday name and
  // lesser feasts stay quiet
  cellLabelFeast: {
    color: "var(--text)",
    fontWeight: "700",
  },
  cellLabelQuiet: {
    fontWeight: "500",
    opacity: 0.85,
  },
  cellLabels: {
    marginTop: 4,
    gap: 3,
    width: "100%",
  },
  cellChip: {
    alignSelf: "stretch",
    borderWidth: 1,
    borderColor: "var(--border)",
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  cellLabelSeason: {
    color: "var(--accent)",
  },
  cellMore: {
    fontFamily: CHROME_FONT,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "600",
    color: "var(--text-secondary)",
    opacity: 0.8,
    paddingHorizontal: 4,
  },
  strip: {
    flexShrink: 0,
    borderTopWidth: 1,
    borderTopColor: "var(--border)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "var(--bg-raised)",
  },
  stripBtn: {
    gap: 2,
  },
  stripBtnHover: {},
  stripDate: {
    fontFamily: CHROME_FONT,
    fontSize: 13,
    fontWeight: "700",
    color: "var(--text)",
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
    color: "var(--text-secondary)",
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
    color: "var(--text-secondary)",
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
    backgroundColor: "var(--control-hover)",
  },
  modalRowClickable: {
    borderWidth: 1,
    borderColor: "var(--border)",
  },
  modalRowName: {
    fontFamily: CHROME_FONT,
    fontSize: 15,
    color: "var(--text)",
    flex: 1,
  },
  modalRowNameLesser: {
    color: "var(--text-secondary)",
    fontWeight: "500",
  },
  modalRowNameSunday: {
    color: "var(--text-secondary)",
    fontSize: 14,
  },
  modalRowGo: {
    fontFamily: CHROME_FONT,
    fontSize: 12,
    fontWeight: "600",
    color: "var(--accent)",
    flexShrink: 0,
  },
});
