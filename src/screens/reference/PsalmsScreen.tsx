import {
  memo,
  type ReactNode,
  useCallback,
  useDeferredValue,
  useMemo,
} from "react";
import { Pressable, Text, View } from "react-native";
import { PsalmText } from "../../components/office/PsalmText";
import { MONO } from "../../components/shell/BarDropdown.styles";
import { Chevron } from "../../components/shell/Chevron";
import { officeBarStyles } from "../../components/shell/officeBarStyles";
import { useEdition } from "../../context/EditionContext";
import { usePalette } from "../../context/PaletteContext";
import type { CalendarEdition } from "../../lib/calendar/types";
import {
  editionPsalmNumbers,
  editionPsalmPassage,
  editionPsalmVerseCount,
} from "../../lib/content/psalmsEdition";
import {
  type PsalmHit,
  searchPsalmsForEdition,
} from "../../lib/reference/search";
import { useThemedStyles } from "../../lib/theme/themedStyles";
import {
  DetailPage,
  EmptyMessage,
  IndexRow,
  noSelect,
  PickerButton,
  SplitPane,
  useReference,
} from "./shared";
import { sharedStyles as styleDef } from "./styles";
import { useIndexKeyboard } from "./useIndexKeyboard";

const PSALM_EDITION_LABEL: Record<CalendarEdition, string> = {
  "1979": "1979 BCP",
  "1662": "1662 BCP",
  "1962": "1962 BCP",
};

function useEditionPsalms(n: number | null) {
  const { edition } = useEdition();
  const numbers = useMemo(() => editionPsalmNumbers(edition), [edition]);
  const psalm = n && numbers.includes(n) ? n : (numbers[0] ?? 1);
  return { edition, numbers, psalm };
}

export function PsalmsScreen({
  isMobile,
  fontScale,
  onScrollProgress,
}: {
  isMobile: boolean;
  fontScale: number;
  onScrollProgress?: (pct: number) => void;
}) {
  const { openPsalm } = useReference();
  const { edition, psalm } = useEditionPsalms(openPsalm);
  const styles = useThemedStyles(styleDef);
  const detail = (
    <PsalmDetailBody
      psalm={psalm}
      edition={edition}
      key={`p${psalm}-${edition}`}
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

// the psalms bar carries the sidebar-show button and, in place of the
// old index, an edition chip and the current-pick chip that re-opens the
// floating picker, with prev/next arrows clamped to the book's psalms
const PSALM_COUNT = 150;
export function PsalmsBar({ leading }: { leading?: ReactNode }) {
  const { openPsalm, setOpenPsalm } = useReference();
  const { edition, numbers, psalm: n } = useEditionPsalms(openPsalm);
  const palette = usePalette();
  const styles = useThemedStyles(styleDef);
  const barStyles = useThemedStyles(officeBarStyles);
  const verses = editionPsalmVerseCount(edition, n);
  const last = numbers[numbers.length - 1] ?? PSALM_COUNT;
  const atStart = n <= (numbers[0] ?? 1);
  const atEnd = n >= last;
  const step = (delta: number) => {
    const i = numbers.indexOf(n);
    setOpenPsalm(numbers[Math.min(Math.max(i + delta, 0), numbers.length - 1)]);
  };
  return (
    <View style={[styles.bar, noSelect]}>
      <View style={styles.barLeft}>
        {leading}
        <View
          style={[
            barStyles.toggle,
            barStyles.modeToggle,
            { paddingHorizontal: 7 },
          ]}
          accessibilityLabel={`${PSALM_EDITION_LABEL[edition]} Psalter`}
        >
          <Text
            style={[
              barStyles.toggleText,
              { fontFamily: MONO, color: "var(--accent)" },
            ]}
          >
            {PSALM_EDITION_LABEL[edition]}
          </Text>
        </View>
        <PickerButton
          label={`Psalm ${n}`}
          meta={`${n} / ${last} · ${verses} verse${verses === 1 ? "" : "s"}`}
          onPress={() => palette.open("psalms")}
        />
      </View>
      <View style={styles.barRight}>
        <Pressable
          style={({ hovered }) => [
            styles.arrowBtn,
            hovered && styles.arrowBtnHover,
            atStart && { opacity: 0.4 },
          ]}
          onPress={() => step(-1)}
          disabled={atStart}
          accessibilityLabel="Previous psalm"
        >
          <Chevron direction="left" size={6} />
        </Pressable>
        <Pressable
          style={({ hovered }) => [
            styles.arrowBtn,
            hovered && styles.arrowBtnHover,
            atEnd && { opacity: 0.4 },
          ]}
          onPress={() => step(1)}
          disabled={atEnd}
          accessibilityLabel="Next psalm"
        >
          <Chevron direction="right" size={6} />
        </Pressable>
      </View>
    </View>
  );
}

// memoized psalm row: a cursor flip re-renders only the two rows whose
// active state changed, instead of rebuilding the whole list every move.
// hit/onSelect are stable across cursor moves, so memo() bails for the
// untouched rows
const PsalmRow = memo(function PsalmRow({
  hit,
  active,
  onSelect,
}: {
  hit: PsalmHit;
  active: boolean;
  onSelect: (psalm: number) => void;
}) {
  const styles = useThemedStyles(styleDef);
  return (
    <IndexRow cursor={active} onPress={() => onSelect(hit.psalm)}>
      {(a) => (
        <View style={styles.psalmRowInner}>
          <Text style={[styles.psalmNumber, a && styles.rowTextActive]}>
            {hit.psalm}
          </Text>
          <Text
            numberOfLines={1}
            style={[styles.incipit, a && styles.rowTextActive]}
          >
            {hit.incipit}
          </Text>
          <Text style={[styles.rowMeta, a && styles.rowTextActive]}>
            {hit.verses} verse{hit.verses === 1 ? "" : "s"}
          </Text>
        </View>
      )}
    </IndexRow>
  );
});

// psalm index for the floating picker; the active row follows the picker
// cursor/hover, the picked value lives on the bar chip. filtering runs against
// a deferred copy of the query so fast typing never blocks the input
export function PsalmIndex({
  query,
  onSelect,
}: {
  query: string;
  onSelect: (psalm: number) => void;
}) {
  const { edition } = useEdition();
  const deferredQuery = useDeferredValue(query);
  const hits = useMemo(
    () => searchPsalmsForEdition(edition, deferredQuery),
    [edition, deferredQuery],
  );
  const onEnter = useCallback(
    (_i: number, hit: PsalmHit) => onSelect(hit.psalm),
    [onSelect],
  );
  const { cursor } = useIndexKeyboard(hits, onEnter);
  const styles = useThemedStyles(styleDef);
  if (hits.length === 0) {
    return <EmptyMessage message={`No psalms match “${deferredQuery}”.`} />;
  }
  return (
    <View style={styles.indexBody} dataSet={{ indexList: "" }}>
      {hits.map((hit, i) => (
        <PsalmRow
          key={hit.psalm}
          hit={hit}
          active={i === cursor}
          onSelect={onSelect}
        />
      ))}
    </View>
  );
}

// memoized: query keystrokes re-render the bar and index; the reading
// pane should sit still unless its psalm actually changes
const PsalmDetailBody = memo(function PsalmDetailBody({
  psalm,
  edition,
}: {
  psalm: number;
  edition: CalendarEdition;
}) {
  const passage = useMemo(
    () => editionPsalmPassage(edition, psalm),
    [edition, psalm],
  );
  const styles = useThemedStyles(styleDef);
  const verses = passage?.verses.length ?? 0;
  return (
    <>
      <Text style={styles.detailTitle}>Psalm {psalm}</Text>
      <Text style={styles.detailSubtitle}>
        {verses} verse{verses === 1 ? "" : "s"}
      </Text>
      {passage ? <PsalmText passage={passage} size="body" /> : null}
    </>
  );
});
