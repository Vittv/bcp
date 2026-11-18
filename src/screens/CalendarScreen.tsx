import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";

import { Chevron } from "../components/shell/Chevron";
import { useSeasonColorMap } from "../components/shell/SeasonDot";
import { useEdition } from "../context/EditionContext";
import { useNavigation } from "../context/NavigationContext";
import { colorFor, daysInMonth, weekday } from "../lib/calendar";
import {
  type DayInfo,
  type DayObservance,
  dayInfo,
} from "../lib/calendar/observances";
import type { CalendarDate } from "../lib/calendar/types";
import { registerPageStepper } from "../lib/input/sequenceNav";
import { useThemedStyles } from "../lib/theme/themedStyles";
import { useViewport, WIDTH_COMPACT } from "../lib/viewport";
import { DayModal, SelectedDayStrip } from "./CalendarScreen.components";
import {
  cellLabels,
  DAY_LABELS,
  isSameDay,
  MONTH_NAMES,
  noSelect,
} from "./CalendarScreen.helpers";
import { calendarStyles } from "./CalendarScreen.styles";
import { useReference } from "./reference/shared";

type CalendarScreenProps = {
  leading?: ReactNode;
};

export function CalendarScreen({ leading }: CalendarScreenProps) {
  const { edition } = useEdition();
  const styles = useThemedStyles(calendarStyles);
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
  const chipPadV = narrowCells ? 0 : 1;
  const chipSlot = cellLabelLineHeight + chipPadV * 2 + 1;
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
        dayInfo(
          {
            year: viewMonth.year,
            month: viewMonth.month,
            day: d,
          },
          edition,
        ),
      );
    }
    return map;
  }, [viewMonth.year, viewMonth.month, days, edition]);

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

  const openObs = openDay ? dayInfo(openDay, edition) : null;

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
                const labels = info ? cellLabels(info, edition) : [];
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
                                marginHorizontal: -cellPad,
                              },
                            ]}
                          >
                            {visibleLabels.map((l, idx) => {
                              const isLast = idx === visibleLabels.length - 1;
                              const closes = isLast && hiddenLabels === 0;
                              return (
                                <View
                                  key={l.text}
                                  style={[
                                    styles.cellChip,
                                    {
                                      height: closes ? chipSlot + 1 : chipSlot,
                                      paddingHorizontal: cellPad,
                                      paddingVertical: chipPadV,
                                    },
                                    closes ? styles.cellChipLast : null,
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
                                      !l.quiet &&
                                        !l.season && { color: colorMap.gold },
                                    ]}
                                  >
                                    {l.text}
                                  </Text>
                                </View>
                              );
                            })}
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
