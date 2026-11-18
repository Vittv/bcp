import { Pressable, Text, View } from "react-native";

import { AppModal } from "../components/shell/AppModal";
import { useSeasonColorMap } from "../components/shell/SeasonDot";
import { useEdition } from "../context/EditionContext";
import { colorFor } from "../lib/calendar";
import {
  type DayInfo,
  type DayObservance,
  dayInfo,
  seasonLabel,
} from "../lib/calendar/observances";
import type { CalendarDate } from "../lib/calendar/types";
import { CHROME_FONT } from "../lib/fonts";
import { useThemedStyles } from "../lib/theme/themedStyles";
import { formatDate, noSelect } from "./CalendarScreen.helpers";
import { calendarStyles } from "./CalendarScreen.styles";

// the strip under the grid: what the selected day observes, and a button
// to open the fuller modal
export function SelectedDayStrip({
  date,
  onOpenDay,
}: {
  date: CalendarDate;
  onOpenDay: (d: CalendarDate) => void;
}) {
  const { edition } = useEdition();
  const styles = useThemedStyles(calendarStyles);
  const colorMap = useSeasonColorMap();
  const info = dayInfo(date, edition);
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
          {seasonLabel(info.season, edition)}
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

export function DayModal({
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
  const { edition } = useEdition();
  const styles = useThemedStyles(calendarStyles);
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
        {seasonLabel(info.season, edition)}
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
