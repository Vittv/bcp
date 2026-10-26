import { memo, type ReactNode, useCallback, useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { useSectionHeading } from "../../components/office/contentHeadings";
import { PsalmText } from "../../components/office/PsalmText";
import { Chevron } from "../../components/shell/Chevron";
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
function currentDay(): number {
  return psalterDayForDate(today());
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
  const { openPsalterDay } = useReference();
  const day = openPsalterDay ?? currentDay();
  const styles = useThemedStyles(styleDef);
  if (isMobile) {
    return (
      <View style={styles.container}>
        <DetailPage compact>
          <PsalterDetailBody day={day} />
        </DetailPage>
      </View>
    );
  }
  return (
    <SplitPane
      fontScale={fontScale}
      onScrollProgress={onScrollProgress}
      detail={<PsalterDetailBody day={day} key={`d${day}`} />}
      detailOpen
    />
  );
}

// the bar mirrors the psalms bar: the sidebar-show button and the current-day
// chip that re-opens the floating picker, with prev/next arrows clamped 1-30
export function PsalterBar({ leading }: { leading?: ReactNode }) {
  const { openPsalterDay, setOpenPsalterDay } = useReference();
  const palette = usePalette();
  const styles = useThemedStyles(styleDef);
  const n = openPsalterDay ?? currentDay();
  const psalms =
    (psalterDay(n)?.morning.length ?? 0) + (psalterDay(n)?.evening.length ?? 0);
  const atStart = n <= 1;
  const atEnd = n >= PSALTER_DAY_COUNT;
  return (
    <View style={[styles.bar, noSelect]}>
      <View style={styles.barLeft}>
        {leading}
        <PickerButton
          label={`Day ${n}`}
          meta={`${n} / ${PSALTER_DAY_COUNT} · ${psalms} psalm${
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
  const hits = useMemo(() => searchPsalterDays(query), [query]);
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
}: {
  day: number;
}) {
  const row = psalterDay(day);
  const styles = useThemedStyles(styleDef);
  if (!row) return null;
  // the 31st repeats day 30, so say so instead of silently showing it twice
  const repeats = day === PSALTER_DAY_COUNT && today().day > PSALTER_DAY_COUNT;
  return (
    <>
      <Text style={styles.detailTitle}>Day {day}</Text>
      <Text style={styles.detailSubtitle}>
        {"The Psalter in 30 days · Morning and Evening portions"}
      </Text>
      {repeats ? (
        <Text style={styles.canticleNote}>{"The 31st repeats day 30."}</Text>
      ) : null}
      <PsalterPortion label="Morning Prayer" citations={row.morning} />
      <PsalterPortion label="Evening Prayer" citations={row.evening} />
    </>
  );
});

function PsalterPortion({
  label,
  citations,
}: {
  label: string;
  citations: string[];
}) {
  const heading = useSectionHeading();
  const styles = useThemedStyles(styleDef);
  if (citations.length === 0) return null;
  return (
    <View>
      <Text style={heading}>{label}</Text>
      <View style={styles.psalterBlock}>
        {citations.map((citation, i) => {
          const parsed = parsePsalmCitation(citation);
          const passage = parsed ? psalmPassage(parsed) : undefined;
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
