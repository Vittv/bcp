import { type ReactNode, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import {
  BarDropdown,
  type DropdownOption,
} from "../../components/shell/BarDropdown";
import { Chevron } from "../../components/shell/Chevron";
import { useSeasonColorMap } from "../../components/shell/SeasonDot";
import { useEdition } from "../../context/EditionContext";
import { useTheme } from "../../context/ThemeContext";
import { addDays, colorFor, daysInMonth, weekday } from "../../lib/calendar";
import type { CalendarDate } from "../../lib/calendar/types";
import { useThemedStyles } from "../../lib/theme/themedStyles";
import { useViewport } from "../../lib/viewport";
import {
  BASE_OFFICES,
  BCP1662_BASE_OFFICES,
  noSelect,
  type OfficeRite,
  type RefOfficeBase,
  today,
  useReference,
} from "./shared";
import { sharedStyles as styleDef } from "./styles";

const RITE_OPTIONS: readonly DropdownOption<OfficeRite>[] = [
  { id: "One", label: "Rite I" },
  { id: "Two", label: "Rite II" },
];

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

function sameDate(a: CalendarDate, b: CalendarDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

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
  const styles = useThemedStyles(styleDef);

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
  const { edition } = useEdition();
  const { tokens } = useTheme();
  const { width } = useViewport();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const styles = useThemedStyles(styleDef);
  const offices = edition === "1662" ? BCP1662_BASE_OFFICES : BASE_OFFICES;
  const current =
    openOffice && offices.some((o) => o.id === openOffice)
      ? openOffice
      : "morning";

  useEffect(() => {
    if (openOffice && !offices.some((o) => o.id === openOffice)) {
      setOpenOffice("morning");
    }
  }, [offices, openOffice, setOpenOffice]);
  // narrow bars tighten the chips; the main office bar uses the same breakpoint
  const compact = width < 500;
  // the narrowest phones drop Today from the bar; the date picker carries
  // the same shortcut in its footer
  const showToday = width >= 320;
  // inline so the sheet is always painted, whatever the class engine does
  const sheetStyle = { backgroundColor: tokens.bg };
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

  const showRite =
    edition !== "1662" && (current === "morning" || current === "evening");

  const controls = (
    <View style={[styles.barRight, compact && styles.barRightCompact]}>
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
          compact && styles.dateBtnCompact,
          hovered && styles.dateBtnHover,
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
      {showToday ? (
        <Pressable
          style={({ hovered }) => [
            styles.todayBtn,
            compact && styles.todayBtnCompact,
            hovered && styles.rowHover,
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
      ) : null}
      {showRite ? (
        <BarDropdown
          value={officeRite}
          options={RITE_OPTIONS}
          onChange={setOfficeRite}
          accent
          steadyWidth
          accessibilityLabel="Office rite"
        />
      ) : null}
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
              compact && styles.officeBtnCompact,
              hovered && styles.officeBtnHover,
            ]}
            onPress={openMenu}
            accessibilityLabel="Pick office"
            accessibilityRole="button"
          >
            <Chevron direction={menuOpen ? "up" : "down"} size={5} />
            <Text style={styles.officeBtnText}>
              {offices.find((b) => b.id === current)?.label}
            </Text>
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
              {offices.map((b) => {
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
          {offices.map((t) => {
            const isActive = t.id === current;
            return (
              <Pressable
                key={t.id}
                style={({ hovered }) => [
                  styles.offTab,
                  hovered && styles.offTabActive,
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
