import { type ReactNode, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import {
  BarDropdown,
  type DropdownOption,
} from "../../components/shell/BarDropdown";
import { Chevron } from "../../components/shell/Chevron";
import {
  compactLabel,
  MonthPicker,
  sameDate,
  shortLabel,
} from "../../components/shell/MonthPicker";
import { useEdition } from "../../context/EditionContext";
import { useTheme } from "../../context/ThemeContext";
import { addDays } from "../../lib/calendar";
import { useThemedStyles } from "../../lib/theme/themedStyles";
import { useViewport } from "../../lib/viewport";
import {
  BASE_OFFICES,
  BCP1662_BASE_OFFICES,
  BCP1962_BASE_OFFICES,
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
  const offices =
    edition === "1962"
      ? BCP1962_BASE_OFFICES
      : edition === "1662"
        ? BCP1662_BASE_OFFICES
        : BASE_OFFICES;
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
    edition !== "1662" &&
    edition !== "1962" &&
    (current === "morning" || current === "evening");

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
