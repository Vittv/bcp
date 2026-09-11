import {
  memo,
  type ReactNode,
  useCallback,
  useDeferredValue,
  useMemo,
} from "react";
import { Pressable, Text, View } from "react-native";
import { PsalmText } from "../../components/office/PsalmText";
import { Chevron } from "../../components/shell/Chevron";
import { usePalette } from "../../context/PaletteContext";
import { psalmPassage } from "../../lib/content/psalter";
import { type PsalmHit, searchPsalms } from "../../lib/reference/search";
import {
  DetailPage,
  EmptyMessage,
  IndexRow,
  noSelect,
  PickerButton,
  SplitPane,
  useReference,
} from "./shared";
import { sharedStyles as styles } from "./styles";
import { useIndexKeyboard } from "./useIndexKeyboard";

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
  if (isMobile) {
    return (
      <View style={styles.container}>
        <DetailPage compact>
          <PsalmDetailBody psalm={openPsalm ?? 1} />
        </DetailPage>
      </View>
    );
  }
  return (
    <SplitPane
      fontScale={fontScale}
      onScrollProgress={onScrollProgress}
      detail={
        <PsalmDetailBody psalm={openPsalm ?? 1} key={`p${openPsalm ?? 1}`} />
      }
      detailOpen
    />
  );
}

// the psalms bar carries the sidebar-show button and, in place of the
// old index, the current-pick chip that re-opens the floating picker,
// with prev/next arrows clamped to 1-150 (the linear sequence the page
// is read in)
const PSALM_COUNT = 150;
export function PsalmsBar({ leading }: { leading?: ReactNode }) {
  const { openPsalm, setOpenPsalm } = useReference();
  const palette = usePalette();
  const n = openPsalm ?? 1;
  const verses = psalmPassage({ psalm: n })?.verses.length ?? 0;
  const atStart = n <= 1;
  const atEnd = n >= PSALM_COUNT;
  return (
    <View style={[styles.bar, noSelect]}>
      <View style={styles.barLeft}>
        {leading}
        <PickerButton
          label={`Psalm ${n}`}
          meta={`${n} / ${PSALM_COUNT} · ${verses} verse${
            verses === 1 ? "" : "s"
          }`}
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
          onPress={() => setOpenPsalm(n - 1)}
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
          onPress={() => setOpenPsalm(n + 1)}
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
  const deferredQuery = useDeferredValue(query);
  const hits = useMemo(() => searchPsalms(deferredQuery), [deferredQuery]);
  const onEnter = useCallback(
    (_i: number, hit: PsalmHit) => onSelect(hit.psalm),
    [onSelect],
  );
  const { cursor } = useIndexKeyboard(hits, onEnter);
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
}: {
  psalm: number;
}) {
  const passage = useMemo(() => psalmPassage({ psalm }), [psalm]);
  const verses = passage?.verses.length ?? 0;
  return (
    <>
      <Text style={styles.detailTitle}>Psalm {psalm}</Text>
      <Text style={styles.detailSubtitle}>
        {verses} verse{verses === 1 ? "" : "s"}
      </Text>
      {passage ? <PsalmText passage={passage} /> : null}
    </>
  );
});
