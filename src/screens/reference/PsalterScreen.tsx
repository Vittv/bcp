import { memo, type ReactNode, useCallback, useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { useSectionHeading } from "../../components/office/contentHeadings";
import { PsalmText } from "../../components/office/PsalmText";
import { StickyHeading } from "../../components/office/StickyHeading";
import {
  BarDropdown,
  type DropdownOption,
} from "../../components/shell/BarDropdown";
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
import {
  getBcp1962PsalmPassages,
  getBcp1962WeekdayPsalms,
  parseBcp1962PsalmAppointment,
} from "../../lib/content/vendor/bcp1962";
import { searchPsalterDays } from "../../lib/reference/search";
import { useThemedStyles } from "../../lib/theme/themedStyles";
import {
  DetailPage,
  EmptyMessage,
  IndexRow,
  noSelect,
  PickerButton,
  type PsalterView,
  SplitPane,
  today,
  useReference,
} from "./shared";
import { sharedStyles as styleDef } from "./styles";
import { useIndexKeyboard } from "./useIndexKeyboard";

// the page opens on today's cycle day: the day of the month, with the 31st
// reading day 30 and February ending at 28 or 29. the 1962 weekday table keeps
// its own 31st day, so its view selects the limit.
function currentDay(edition: string, view: PsalterView): number {
  if (edition === "1662") {
    const d = today();
    return Math.min(Math.max(d.day, 1), 30);
  }
  if (edition === "1962") {
    const limit =
      view === "table" ? BCP1962_PSALTER_DAY_COUNT : PSALTER_DAY_COUNT;
    return Math.min(Math.max(today().day, 1), limit);
  }
  return psalterDayForDate(today());
}

const BCP1662_PSLATER_DAY_COUNT = 30;
const BCP1962_PSALTER_DAY_COUNT = 31;

const PSALTER_VIEW_OPTIONS: readonly DropdownOption<PsalterView>[] = [
  { id: "cycle", label: "30-day" },
  { id: "table", label: "Weekdays" },
];

// the 1962 book's optional ordinary weekday table prints two alternating month
// sets by day of the month, with Mattins and Evensong in each column
type Bcp1962PsalterRow = {
  day: number;
  oddMonths: { morning: string[]; evening: string[] };
  evenMonths: { morning: string[]; evening: string[] };
};

function bcp1962PsalterDay(day: number): Bcp1962PsalterRow | null {
  const d = Math.min(Math.max(day, 1), BCP1962_PSALTER_DAY_COUNT);
  const odd = getBcp1962WeekdayPsalms(1, d);
  const even = getBcp1962WeekdayPsalms(2, d);
  if (!odd || !even) return null;
  return {
    day: d,
    oddMonths: {
      morning: parseBcp1962PsalmAppointment(odd.mattins),
      evening: parseBcp1962PsalmAppointment(odd.evensong),
    },
    evenMonths: {
      morning: parseBcp1962PsalmAppointment(even.mattins),
      evening: parseBcp1962PsalmAppointment(even.evensong),
    },
  };
}

function bcp1962PsalterDays(): PsalterDay[] {
  const out: PsalterDay[] = [];
  for (let day = 1; day <= BCP1962_PSALTER_DAY_COUNT; day++) {
    const row = bcp1962PsalterDay(day);
    if (row)
      out.push({
        day,
        morning: row.oddMonths.morning,
        evening: row.oddMonths.evening,
      });
  }
  return out;
}

function searchBcp1962PsalterDays(query: string): PsalterDay[] {
  const q = query.trim().toLowerCase();
  return bcp1962PsalterDays().filter((day) => {
    if (!q) return true;
    if (String(day.day) === q) return true;
    const row = bcp1962PsalterDay(day.day);
    const citations = row
      ? [
          ...row.oddMonths.morning,
          ...row.oddMonths.evening,
          ...row.evenMonths.morning,
          ...row.evenMonths.evening,
        ]
      : [];
    return citations.some((p) => p.toLowerCase().includes(q));
  });
}

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
  const { openPsalterDay, psalterView } = useReference();
  const day = openPsalterDay ?? currentDay(edition, psalterView);
  const styles = useThemedStyles(styleDef);
  const detail = (
    <PsalterDetailBody
      day={day}
      edition={edition}
      view={psalterView}
      key={`d${day}-${psalterView}`}
    />
  );
  if (isMobile) {
    return (
      <View style={styles.container}>
        <DetailPage compact>{detail}</DetailPage>
      </View>
    );
  }
  return (
    <SplitPane
      fontScale={fontScale}
      onScrollProgress={onScrollProgress}
      detail={detail}
      detailOpen
    />
  );
}

// the bar mirrors the psalms bar: the sidebar-show button and the current-day
// chip that re-opens the floating picker, with prev/next arrows clamped to the
// active view's day count and an appointment toggle for the 1962 book
export function PsalterBar({ leading }: { leading?: ReactNode }) {
  const { edition } = useEdition();
  const { openPsalterDay, setOpenPsalterDay, psalterView, setPsalterView } =
    useReference();
  const palette = usePalette();
  const styles = useThemedStyles(styleDef);
  const n = openPsalterDay ?? currentDay(edition, psalterView);
  const useTable = edition === "1962" && psalterView === "table";
  const dayCount =
    edition === "1662"
      ? BCP1662_PSLATER_DAY_COUNT
      : useTable
        ? BCP1962_PSALTER_DAY_COUNT
        : PSALTER_DAY_COUNT;
  const row = useTable
    ? bcp1962PsalterDay(n)
    : edition === "1662"
      ? bcp1662PsalterDay(n)
      : psalterDay(n);
  let psalms = 0;
  if (useTable) {
    // SAFETY: the table branch above calls bcp1962PsalterDay, which returns this shape.
    const r = row as Bcp1962PsalterRow | null;
    psalms = r ? r.oddMonths.morning.length + r.oddMonths.evening.length : 0;
  } else if (row) {
    // SAFETY: the 1662 and 1979 day helpers both return morning/evening arrays.
    const r = row as { morning: string[]; evening: string[] };
    psalms = r.morning.length + r.evening.length;
  }
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
        {edition === "1962" ? (
          <BarDropdown
            value={psalterView}
            options={PSALTER_VIEW_OPTIONS}
            onChange={(view) => {
              setPsalterView(view);
              const limit =
                view === "table"
                  ? BCP1962_PSALTER_DAY_COUNT
                  : PSALTER_DAY_COUNT;
              if (n > limit) setOpenPsalterDay(limit);
            }}
            accessibilityLabel="Psalter appointment"
            steadyWidth
          />
        ) : null}
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
  const { psalterView } = useReference();
  const hits = useMemo(
    () =>
      edition === "1662"
        ? searchBcp1662PsalterDays(query)
        : edition === "1962" && psalterView === "table"
          ? searchBcp1962PsalterDays(query)
          : searchPsalterDays(query),
    [edition, query, psalterView],
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
// should sit still unless its day or appointment view changes
const PsalterDetailBody = memo(function PsalterDetailBody({
  day,
  edition,
  view,
}: {
  day: number;
  edition: string;
  view: PsalterView;
}) {
  const is1662 = edition === "1662";
  const is1962 = edition === "1962";
  const useTable = is1962 && view === "table";
  const dayCount = is1662
    ? BCP1662_PSLATER_DAY_COUNT
    : useTable
      ? BCP1962_PSALTER_DAY_COUNT
      : PSALTER_DAY_COUNT;
  const row = useTable
    ? bcp1962PsalterDay(day)
    : is1662
      ? bcp1662PsalterDay(day)
      : psalterDay(day);
  const styles = useThemedStyles(styleDef);
  if (!row) return null;
  // the 31st repeats day 30, so say so instead of silently showing it twice
  const repeats = day === dayCount && today().day > dayCount;
  if (useTable) {
    // SAFETY: the 1962 branch above calls bcp1962PsalterDay, which returns this shape.
    const bcp1962Row = row as Bcp1962PsalterRow;
    return (
      <>
        <Text style={styles.detailTitle}>Day {day}</Text>
        <Text style={styles.detailSubtitle}>
          1962 Psalter · monthly appointment tables · Morning and Evening
          portions
        </Text>
        <Text style={[styles.canticleNote, styles.psalterMonthNote]}>
          Odd months: January, March, May, July, September, November
        </Text>
        <PsalterPortion
          label="Morning Prayer"
          citations={bcp1962Row.oddMonths.morning}
          edition={edition}
        />
        <PsalterPortion
          label="Evening Prayer"
          citations={bcp1962Row.oddMonths.evening}
          edition={edition}
        />
        <Text style={[styles.canticleNote, styles.psalterMonthNote]}>
          Even months: February, April, June, August, October, December
        </Text>
        <PsalterPortion
          label="Morning Prayer"
          citations={bcp1962Row.evenMonths.morning}
          edition={edition}
        />
        <PsalterPortion
          label="Evening Prayer"
          citations={bcp1962Row.evenMonths.evening}
          edition={edition}
        />
        {day === 31 ? (
          <Text style={styles.canticleNote}>
            On the thirty-first day, use the thirtieth day's psalms or one of
            the twenty-four selections.
          </Text>
        ) : null}
        <Text style={styles.canticleNote}>
          On a weekday with no proper psalms, one psalm may be omitted provided
          one psalm or numbered portion is retained.
        </Text>
      </>
    );
  }
  // SAFETY: the 1662 and 1979 day helpers both return a PsalterDay.
  const psalterRow = row as PsalterDay;
  return (
    <>
      <Text style={styles.detailTitle}>Day {day}</Text>
      <Text style={styles.detailSubtitle}>
        {is1662
          ? "1662 Psalter · 30 days · Morning and Evening portions"
          : is1962
            ? "1962 Psalter · 30 days · Morning and Evening portions"
            : "The Psalter in 30 days · Morning and Evening portions"}
      </Text>
      {repeats ? (
        <Text style={styles.canticleNote}>{"The 31st repeats day 30."}</Text>
      ) : null}
      <PsalterPortion
        label="Morning Prayer"
        citations={psalterRow.morning}
        edition={edition}
      />
      <PsalterPortion
        label="Evening Prayer"
        citations={psalterRow.evening}
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
      <StickyHeading sticky>
        <Text style={heading}>{label}</Text>
      </StickyHeading>
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
