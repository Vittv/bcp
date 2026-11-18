import { memo, type ReactNode, useCallback, useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { useSectionHeading } from "../../components/office/contentHeadings";
import { PsalmText } from "../../components/office/PsalmText";
import { Chevron } from "../../components/shell/Chevron";
import { useEdition } from "../../context/EditionContext";
import { usePalette } from "../../context/PaletteContext";
import { parsePsalmCitation } from "../../lib/content/psalms";
import { psalmPassage } from "../../lib/content/psalter";
import {
  PSALTER_DAY_COUNT,
  psalterDay,
  psalterDayForDate,
  psalterDaySummary,
} from "../../lib/content/psalterDays";
import type { PsalterDay } from "../../lib/content/types";
import { getBcp1662PsalmPassages } from "../../lib/content/vendor/bcp1662";
import bcp1662PsalterCycle from "../../lib/content/vendor/bcp1662/psalter-cycle.json";
import { getBcp1962PsalmPassages } from "../../lib/content/vendor/bcp1962";
import { searchPsalterDays } from "../../lib/reference/search";
import { useThemedStyles } from "../../lib/theme/themedStyles";
import {
  DetailPage,
  EmptyMessage,
  IndexRow,
  noSelect,
  PickerButton,
  SplitPane,
  today,
  useReference,
} from "./shared";
import { sharedStyles as styleDef } from "./styles";
import { useIndexKeyboard } from "./useIndexKeyboard";

// the page opens on today's cycle day: the day of the month, with the 31st
// reading day 30 and February ending at 28 or 29
function currentDay(edition: string): number {
  if (edition === "1662") {
    const d = today();
    return Math.min(Math.max(d.day, 1), 30);
  }
  return psalterDayForDate(today());
}

const BCP1662_PSLATER_DAY_COUNT = 30;

function bcp1662PsalterDay(
  day: number,
): { morning: string[]; evening: string[] } | null {
  const d = Math.min(Math.max(day, 1), BCP1662_PSLATER_DAY_COUNT);
  // SAFETY: vendored 1662 psalter-cycle JSON is keyed by day number.
  const entry = (
    bcp1662PsalterCycle as {
      days: Record<string, { morning: string[]; evening: string[] }>;
    }
  ).days[String(d)];
  return entry ?? null;
}

function bcp1662PsalterDays(): PsalterDay[] {
  const out: PsalterDay[] = [];
  for (let day = 1; day <= BCP1662_PSLATER_DAY_COUNT; day++) {
    const entry = bcp1662PsalterDay(day);
    if (entry)
      out.push({ day, morning: entry.morning, evening: entry.evening });
  }
  return out;
}

function searchBcp1662PsalterDays(query: string): PsalterDay[] {
  const q = query.trim().toLowerCase();
  return bcp1662PsalterDays().filter((day) => {
    if (!q) return true;
    if (String(day.day) === q) return true;
    return [...day.morning, ...day.evening].some((p) =>
      p.toLowerCase().includes(q),
    );
  });
}

export function PsalterScreen({
  isMobile,
  fontScale,
  onScrollProgress,
}: {
  isMobile: boolean;
  fontScale: number;
  onScrollProgress?: (pct: number) => void;
}) {
  const { edition } = useEdition();
  const { openPsalterDay } = useReference();
  const day = openPsalterDay ?? currentDay(edition);
  const styles = useThemedStyles(styleDef);
  if (isMobile) {
    return (
      <View style={styles.container}>
        <DetailPage compact>
          <PsalterDetailBody day={day} edition={edition} />
        </DetailPage>
      </View>
    );
  }
  return (
    <SplitPane
      fontScale={fontScale}
      onScrollProgress={onScrollProgress}
      detail={<PsalterDetailBody day={day} edition={edition} key={`d${day}`} />}
      detailOpen
    />
  );
}

// the bar mirrors the psalms bar: the sidebar-show button and the current-day
// chip that re-opens the floating picker, with prev/next arrows clamped 1-30
export function PsalterBar({ leading }: { leading?: ReactNode }) {
  const { edition } = useEdition();
  const { openPsalterDay, setOpenPsalterDay } = useReference();
  const palette = usePalette();
  const styles = useThemedStyles(styleDef);
  const n = openPsalterDay ?? currentDay(edition);
  const dayCount =
    edition === "1662" ? BCP1662_PSLATER_DAY_COUNT : PSALTER_DAY_COUNT;
  const row = edition === "1662" ? bcp1662PsalterDay(n) : psalterDay(n);
  const psalms = (row?.morning.length ?? 0) + (row?.evening.length ?? 0);
  const atStart = n <= 1;
  const atEnd = n >= dayCount;
  return (
    <View style={[styles.bar, noSelect]}>
      <View style={styles.barLeft}>
        {leading}
        <PickerButton
          label={`Day ${n}`}
          meta={`${n} / ${dayCount} · ${psalms} psalm${
            psalms === 1 ? "" : "s"
          }`}
          onPress={() => palette.open("psalter")}
        />
      </View>
      <View style={styles.barRight}>
        <Pressable
          style={({ hovered }) => [
            styles.arrowBtn,
            hovered && styles.arrowBtnHover,
            atStart && { opacity: 0.4 },
          ]}
          onPress={() => setOpenPsalterDay(n - 1)}
          disabled={atStart}
          accessibilityLabel="Previous day"
        >
          <Chevron direction="left" size={6} />
        </Pressable>
        <Pressable
          style={({ hovered }) => [
            styles.arrowBtn,
            hovered && styles.arrowBtnHover,
            atEnd && { opacity: 0.4 },
          ]}
          onPress={() => setOpenPsalterDay(n + 1)}
          disabled={atEnd}
          accessibilityLabel="Next day"
        >
          <Chevron direction="right" size={6} />
        </Pressable>
      </View>
    </View>
  );
}

// memoized day row: a cursor flip re-renders only the two rows whose active
// state changed, instead of rebuilding the whole list every move
const PsalterRow = memo(function PsalterRow({
  day,
  active,
  selected,
  onSelect,
}: {
  day: PsalterDay;
  active: boolean;
  selected: number | null;
  onSelect: (n: number | null) => void;
}) {
  const styles = useThemedStyles(styleDef);
  return (
    <IndexRow
      cursor={active}
      onPress={() => onSelect(selected === day.day ? null : day.day)}
    >
      {(a) => (
        <View style={styles.collectRowInner}>
          <Text
            numberOfLines={1}
            style={[styles.canticleIndexTitle, a && styles.rowTextActive]}
          >
            Day {day.day}
          </Text>
          <Text
            numberOfLines={1}
            style={[styles.rowMeta, a && styles.rowTextActive]}
          >
            {psalterDaySummary(day)}
          </Text>
        </View>
      )}
    </IndexRow>
  );
});

export function PsalterIndex({
  query,
  selected,
  onSelect,
}: {
  query: string;
  selected: number | null;
  onSelect: (n: number | null) => void;
}) {
  const { edition } = useEdition();
  const hits = useMemo(
    () =>
      edition === "1662"
        ? searchBcp1662PsalterDays(query)
        : searchPsalterDays(query),
    [edition, query],
  );
  const onEnter = useCallback(
    (_i: number, day: PsalterDay) =>
      onSelect(day.day === selected ? null : day.day),
    [selected, onSelect],
  );
  const { cursor } = useIndexKeyboard(hits, onEnter);
  const styles = useThemedStyles(styleDef);
  const cursorItem = hits[cursor];
  if (hits.length === 0) {
    return <EmptyMessage message={`No psalter day matches “${query}”.`} />;
  }
  return (
    <View style={styles.indexBody} dataSet={{ indexList: "" }}>
      {hits.map((day) => (
        <PsalterRow
          key={day.day}
          day={day}
          active={day === cursorItem}
          selected={selected}
          onSelect={onSelect}
        />
      ))}
    </View>
  );
}

// memoized: query keystrokes re-render the bar and index; the reading pane
// should sit still unless its day actually changes
const PsalterDetailBody = memo(function PsalterDetailBody({
  day,
  edition,
}: {
  day: number;
  edition: string;
}) {
  const is1662 = edition === "1662";
  const dayCount = is1662 ? BCP1662_PSLATER_DAY_COUNT : PSALTER_DAY_COUNT;
  const row = is1662 ? bcp1662PsalterDay(day) : psalterDay(day);
  const styles = useThemedStyles(styleDef);
  if (!row) return null;
  // the 31st repeats day 30, so say so instead of silently showing it twice
  const repeats = day === dayCount && today().day > dayCount;
  return (
    <>
      <Text style={styles.detailTitle}>Day {day}</Text>
      <Text style={styles.detailSubtitle}>
        {is1662
          ? "1662 Psalter · 30 days · Morning and Evening portions"
          : "The Psalter in 30 days · Morning and Evening portions"}
      </Text>
      {repeats ? (
        <Text style={styles.canticleNote}>{"The 31st repeats day 30."}</Text>
      ) : null}
      <PsalterPortion
        label="Morning Prayer"
        citations={row.morning}
        edition={edition}
      />
      <PsalterPortion
        label="Evening Prayer"
        citations={row.evening}
        edition={edition}
      />
    </>
  );
});

function PsalterPortion({
  label,
  citations,
  edition,
}: {
  label: string;
  citations: string[];
  edition: string;
}) {
  const heading = useSectionHeading();
  const styles = useThemedStyles(styleDef);
  if (citations.length === 0) return null;
  const is1662 = edition === "1662";
  const is1962 = edition === "1962";
  return (
    <View>
      <Text style={heading}>{label}</Text>
      <View style={styles.psalterBlock}>
        {citations.map((citation, i) => {
          const parsed = parsePsalmCitation(citation);
          const passage = is1962
            ? getBcp1962PsalmPassages([citation])[0]
            : is1662
              ? getBcp1662PsalmPassages([citation])[0]
              : parsed
                ? psalmPassage(parsed)
                : undefined;
          return (
            <View
              key={citation}
              style={i === 0 ? undefined : styles.psalterItem}
            >
              <Text style={styles.psalterRef}>Psalm {citation}</Text>
              {passage ? <PsalmText passage={passage} size="body" /> : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}
