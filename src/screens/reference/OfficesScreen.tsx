import {
  memo,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { OfficeHeader } from "../../components/office/OfficeHeader";
import { OfficeView } from "../../components/office/OfficeView";
import { Chevron } from "../../components/shell/Chevron";
import { useSeasonColorMap } from "../../components/shell/SeasonDot";
import { SHEET_BG, useTheme } from "../../context/ThemeContext";
import { addDays, colorFor, daysInMonth, weekday } from "../../lib/calendar";
import type { CalendarDate } from "../../lib/calendar/types";
import { composeOffice } from "../../lib/office";
import { DEFAULT_PREFS } from "../../lib/office/types";
import {
  BASE_OFFICES,
  noSelect,
  type OfficeRite,
  type RefOfficeBase,
  refOfficeId,
  today,
  useReference,
} from "./shared";
import { sharedStyles as styles } from "./styles";

// SAFETY: the literals are exactly the OfficeRite union members
const RITES: OfficeRite[] = ["One", "Two"];

function sameDate(a: CalendarDate, b: CalendarDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

export function OfficesScreen({
  onScrollProgress,
}: {
  // the page scrolls in its own ScrollView (the shell's outer scroller
  // is hidden on reference pages), so it reports progress up to the
  // status bar itself
  onScrollProgress?: (pct: number) => void;
}) {
  const { openOffice, officeRite } = useReference();
  // the bar picks the office; the page just renders it full-width.
  // height 100% is what bounds the ScrollView: the shell wrapper above
  // is a plain block, so flex alone leaves it unbounded and unscrollable
  const current = openOffice ?? "morning";

  // document switches reset scroll position; report that too, since a
  // programmatic reset emits no scroll event (latest-ref keeps the
  // callback out of the dependency list)
  const progressRef = useRef(onScrollProgress);
  useEffect(() => {
    progressRef.current = onScrollProgress;
  });
  // fires on document *identity* change (scroll reset), not value reads
  // biome-ignore lint/correctness/useExhaustiveDependencies: see above
  useEffect(() => {
    progressRef.current?.(0);
  }, [current, officeRite]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const max = contentSize.height - layoutMeasurement.height;
    onScrollProgress?.(max > 0 ? Math.round((contentOffset.y / max) * 100) : 0);
  };

  return (
    <View style={[styles.container, { height: "100%" }]}>
      {/* key resets scroll when switching offices */}
      <ScrollView
        key={current}
        style={styles.list}
        contentContainerStyle={{ alignItems: "center" }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={[styles.detailPage, styles.officeMeasure]}>
          <OfficeDetailBody base={current} />
        </View>
      </ScrollView>
    </View>
  );
}

// the offices bar carries everything: office picker (tabs on desktop,
// dropdown menu on phones) on the left, date controls on the right.
// every office renders against the picked date rather than always today
export function OfficesBar({
  leading,
  isMobile,
}: {
  leading?: ReactNode;
  isMobile: boolean;
}) {
  const {
    openOffice,
    setOpenOffice,
    officeRite,
    setOfficeRite,
    officeDate,
    setOfficeDate,
  } = useReference();
  const { resolved } = useTheme();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const current = openOffice ?? "morning";
  // inline so the sheet is always painted, whatever the class engine does
  const sheetStyle = { backgroundColor: SHEET_BG[resolved] };
  const onToday = sameDate(officeDate, today());

  const step = (n: number) => setOfficeDate(addDays(officeDate, n));
  const openMenu = () => {
    setPickerOpen(false);
    setMenuOpen(!menuOpen);
  };
  const openPicker = () => {
    setMenuOpen(false);
    setPickerOpen(!pickerOpen);
  };

  const pickOffice = (id: RefOfficeBase) => {
    setOpenOffice(id);
    setMenuOpen(false);
  };

  // trad/cont segment; the rite only applies to morning and evening
  const riteToggle = (
    <View style={styles.riteSeg}>
      {RITES.map((r) => (
        <Pressable
          key={r}
          style={({ hovered }) => [
            r === officeRite ? styles.riteChipOn : styles.riteChipOff,
            hovered && r !== officeRite && styles.offTabActive,
          ]}
          onPress={() => setOfficeRite(r)}
          accessibilityRole="button"
          accessibilityState={{ selected: r === officeRite }}
          accessibilityLabel={
            r === "One" ? "Traditional rite" : "Contemporary rite"
          }
        >
          <Text
            style={[
              styles.riteChipText,
              r === officeRite && styles.riteChipTextOn,
            ]}
          >
            {r === "One" ? "Trad" : "Cont"}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  const controls = (
    <View style={styles.barRight}>
      <Pressable
        style={({ hovered }) => [styles.stepBtn, hovered && styles.rowHover]}
        onPress={() => step(-1)}
        accessibilityLabel="Previous day"
        accessibilityRole="button"
      >
        <Chevron direction="left" size={6} />
      </Pressable>
      <Pressable
        style={({ hovered }) => [
          styles.dateBtn,
          hovered && !pickerOpen && styles.dateBtnActive,
          pickerOpen && styles.dateBtnActive,
        ]}
        onPress={openPicker}
        accessibilityLabel="Pick date"
        accessibilityRole="button"
      >
        <Text style={styles.dateText}>
          {isMobile ? compactLabel(officeDate) : shortLabel(officeDate)}
        </Text>
        <Chevron direction={pickerOpen ? "up" : "down"} size={5} />
      </Pressable>
      <Pressable
        style={({ hovered }) => [styles.stepBtn, hovered && styles.rowHover]}
        onPress={() => step(1)}
        accessibilityLabel="Next day"
        accessibilityRole="button"
      >
        <Chevron direction="right" size={6} />
      </Pressable>
      <Pressable
        style={({ hovered }) => [
          styles.todayBtn,
          onToday && styles.todayBtnOn,
          !onToday && hovered && styles.rowHover,
        ]}
        onPress={() => setOfficeDate(today())}
        accessibilityLabel="Jump to today"
        accessibilityRole="button"
        accessibilityState={{ selected: onToday }}
      >
        <Text style={[styles.todayText, onToday && styles.todayTextOn]}>
          Today
        </Text>
      </Pressable>
      {riteToggle}
    </View>
  );

  if (isMobile) {
    return (
      <View style={[styles.bar, noSelect]}>
        <View style={styles.barLeft}>
          {leading}
          <Pressable
            style={({ hovered }) => [
              styles.officeBtn,
              (hovered || menuOpen) && styles.officeBtnActive,
            ]}
            onPress={openMenu}
            accessibilityLabel="Pick office"
            accessibilityRole="button"
          >
            <Text style={styles.officeBtnText}>
              {BASE_OFFICES.find((b) => b.id === current)?.label}
            </Text>
            <Chevron direction={menuOpen ? "up" : "down"} size={5} />
          </Pressable>
        </View>
        {controls}
        {menuOpen ? (
          <>
            <Pressable
              style={styles.popBackdrop}
              onPress={() => setMenuOpen(false)}
              accessibilityLabel="Close office menu"
              accessibilityRole="button"
            />
            <View style={[styles.popover, styles.popMenuWide, sheetStyle]}>
              {BASE_OFFICES.map((b) => {
                const isSelected = b.id === current;
                return (
                  <Pressable
                    key={b.id}
                    style={({ hovered }) => [
                      styles.popMenuItem,
                      (hovered || isSelected) && styles.popMenuItemSelected,
                    ]}
                    onPress={() => pickOffice(b.id)}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.popMenuItemText,
                        isSelected && styles.offTabTextActive,
                      ]}
                    >
                      {b.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}
        {pickerOpen ? (
          <>
            <Pressable
              style={styles.popBackdrop}
              onPress={() => setPickerOpen(false)}
              accessibilityLabel="Close date picker"
              accessibilityRole="button"
            />
            <MonthPicker
              date={officeDate}
              sheetStyle={sheetStyle}
              anchorStyle={styles.popRight}
              onChange={(d) => {
                setOfficeDate(d);
                setPickerOpen(false);
              }}
            />
          </>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.bar, noSelect]}>
      <View style={styles.barLeft}>
        {leading}
        <View style={styles.offTabs}>
          {BASE_OFFICES.map((t) => {
            const isActive = t.id === current;
            return (
              <Pressable
                key={t.id}
                style={({ hovered }) => [
                  styles.offTab,
                  (isActive || hovered) && styles.offTabActive,
                ]}
                onPress={() => setOpenOffice(t.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={[
                    styles.offTabText,
                    isActive && styles.offTabTextActive,
                  ]}
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      {controls}
      {pickerOpen ? (
        <>
          <Pressable
            style={styles.popBackdrop}
            onPress={() => setPickerOpen(false)}
            accessibilityLabel="Close date picker"
            accessibilityRole="button"
          />
          <MonthPicker
            date={officeDate}
            sheetStyle={sheetStyle}
            anchorStyle={styles.popRight}
            onChange={(d) => {
              setOfficeDate(d);
              setPickerOpen(false);
            }}
          />
        </>
      ) : null}
    </View>
  );
}

const MONTHS_SHORT = [
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

function shortLabel(date: CalendarDate): string {
  const wd = WEEKDAYS_SHORT[weekday(date)];
  return `${wd}, ${MONTHS_SHORT[date.month - 1]} ${date.day}, ${date.year}`;
}

// phones drop the weekday and year to make room for the office name
function compactLabel(date: CalendarDate): string {
  return `${MONTHS_SHORT[date.month - 1]} ${date.day}`;
}

// compact month grid: season-tinted days, today ringed, selected filled
function MonthPicker({
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
          const isSelected =
            isValid &&
            cell.day === date.day &&
            cell.month === date.month &&
            cell.year === date.year;
          const isToday =
            isValid &&
            cell.day === now.day &&
            cell.month === now.month &&
            cell.year === now.year;

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
                    isSelected && styles.popCellTextLight,
                  ]}
                >
                  {dayNum}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// memoized so bar interactions (e.g. the date picker popover) don't
// recompose the whole office text
const OfficeDetailBody = memo(function OfficeDetailBody({
  base,
}: {
  base: RefOfficeBase;
}) {
  const { officeDate, officeRite } = useReference();
  const officeId = refOfficeId(base, officeRite);
  const document = useMemo(
    () =>
      composeOffice(officeDate, officeId, {
        ...DEFAULT_PREFS,
        personalMode: false,
        showRubrics: true,
      }),
    [officeDate, officeId],
  );
  return (
    <>
      {/* same masthead as Today: name, date, feast line */}
      <OfficeHeader document={document} />
      <OfficeView document={document} showRubrics showSpeakers />
    </>
  );
});
