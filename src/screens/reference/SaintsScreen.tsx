import {
  memo,
  type ReactNode,
  useCallback,
  useDeferredValue,
  useMemo,
} from "react";
import { Pressable, Text, View } from "react-native";
import { SanctoraleCard } from "../../components/office/SanctoraleCard";
import { officeBarStyles } from "../../components/shell/OfficeTabs";
import { usePalette } from "../../context/PaletteContext";
import {
  monthDayShortLabel,
  sanctoraleBySlug,
} from "../../lib/calendar/sanctorale";
import { type SaintHit, searchSaints } from "../../lib/reference/search";
import {
  DetailPage,
  EmptyMessage,
  FIRST_SAINT,
  IndexRow,
  noSelect,
  PickerButton,
  SplitPane,
  useReference,
} from "./shared";
import { sharedStyles as styles } from "./styles";
import { useIndexKeyboard } from "./useIndexKeyboard";

export function SaintsScreen({
  isMobile,
  fontScale,
  onScrollProgress,
}: {
  isMobile: boolean;
  fontScale: number;
  onScrollProgress?: (pct: number) => void;
}) {
  const { openSaint, saintBio, saintLiturgy } = useReference();
  if (isMobile) {
    return (
      <View style={styles.container}>
        <DetailPage compact>
          <SanctoraleCard
            slug={openSaint ?? FIRST_SAINT}
            showBio={saintBio}
            showLiturgy={saintLiturgy}
          />
        </DetailPage>
      </View>
    );
  }
  return (
    <SplitPane
      fontScale={fontScale}
      onScrollProgress={onScrollProgress}
      detail={
        <SanctoraleCard
          slug={openSaint ?? FIRST_SAINT}
          key={openSaint ?? FIRST_SAINT}
          showBio={saintBio}
          showLiturgy={saintLiturgy}
        />
      }
      detailOpen
    />
  );
}

// the saints bar mirrors the psalms bar: the sidebar-show button, the
// current-pick chip that re-opens the floating picker, and the bio/liturgy
// view toggles (shown once a saint is on screen; bio leads by default,
// both standalone so each can be on or off independently)
export function SaintsBar({ leading }: { leading?: ReactNode }) {
  const { openSaint, saintBio, setSaintBio, saintLiturgy, setSaintLiturgy } =
    useReference();
  const palette = usePalette();

  const toggles = (
    <View style={styles.saintToggles}>
      <Pressable
        style={({ hovered }) => [
          officeBarStyles.toggle,
          hovered && styles.rowHover,
        ]}
        onPress={() => setSaintBio(!saintBio)}
        accessibilityRole="button"
        accessibilityState={{ selected: saintBio }}
        accessibilityLabel={saintBio ? "Hide biography" : "Show biography"}
      >
        <Text style={[officeBarStyles.toggleText, saintBio && styles.toggleOn]}>
          Bio
        </Text>
      </Pressable>
      <Pressable
        style={({ hovered }) => [
          officeBarStyles.toggle,
          hovered && styles.rowHover,
        ]}
        onPress={() => setSaintLiturgy(!saintLiturgy)}
        accessibilityRole="button"
        accessibilityState={{ selected: saintLiturgy }}
        accessibilityLabel={
          saintLiturgy ? "Hide liturgical content" : "Show liturgical content"
        }
      >
        <Text
          style={[officeBarStyles.toggleText, saintLiturgy && styles.toggleOn]}
        >
          Liturgy
        </Text>
      </Pressable>
    </View>
  );

  const sel = sanctoraleBySlug(openSaint ?? FIRST_SAINT);

  return (
    <View style={[styles.bar, noSelect]}>
      <View style={styles.barLeft}>
        {leading}
        <PickerButton
          label={sel?.title ?? "Saint"}
          meta={sel ? monthDayShortLabel(sel.month, sel.day) : undefined}
          onPress={() => palette.open("saints")}
        />
      </View>
      <View style={styles.barRight}>{toggles}</View>
    </View>
  );
}

// memoized saint row: a cursor flip re-renders only the two rows whose
// active state changed, instead of rebuilding the whole list every move
const SaintRow = memo(function SaintRow({
  hit,
  active,
  selected,
  onSelect,
}: {
  hit: SaintHit;
  active: boolean;
  selected: string | null;
  onSelect: (slug: string | null) => void;
}) {
  const isSelected = hit.slug === selected;
  return (
    <IndexRow
      cursor={active}
      onPress={() => onSelect(isSelected ? null : hit.slug)}
    >
      {(a) => (
        <View style={styles.saintRowInner}>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.saintTitle, a && styles.rowTextActive]}
          >
            {hit.title}
          </Text>
          <Text style={[styles.saintDate, a && styles.rowTextActive]}>
            {monthDayShortLabel(hit.month, hit.day)}
          </Text>
        </View>
      )}
    </IndexRow>
  );
});

// grouped date-sorted index for the floating picker: the fixed-date table
// races the calendar automatically, so no explicit grouping is needed
export const SaintIndex = memo(function SaintIndex({
  query,
  selected,
  onSelect,
}: {
  query: string;
  selected: string | null;
  onSelect: (slug: string | null) => void;
}) {
  const deferredQuery = useDeferredValue(query);
  const hits = useMemo(() => searchSaints(deferredQuery), [deferredQuery]);
  const onEnter = useCallback(
    (_i: number, hit: SaintHit) =>
      onSelect(hit.slug === selected ? null : hit.slug),
    [selected, onSelect],
  );
  const { cursor } = useIndexKeyboard(hits, onEnter);
  if (hits.length === 0) {
    return <EmptyMessage message={`No saints match “${deferredQuery}”.`} />;
  }
  return (
    <View style={styles.indexBody} dataSet={{ indexList: "" }}>
      {hits.map((hit, i) => (
        <SaintRow
          key={hit.slug}
          hit={hit}
          active={i === cursor}
          selected={selected}
          onSelect={onSelect}
        />
      ))}
    </View>
  );
});
