import {
  memo,
  type ReactNode,
  useCallback,
  useDeferredValue,
  useMemo,
} from "react";
import { Pressable, Text, View } from "react-native";
import { FeastCard } from "../../components/office/FeastCard";
import { officeBarStyles } from "../../components/shell/officeBarStyles";
import { useEdition } from "../../context/EditionContext";
import { usePalette } from "../../context/PaletteContext";
import {
  type FeastIdentity,
  feastMonthDayShortLabel,
  feastNameForTradition,
  holyDayBySlugForTradition,
  searchHolyDaysForTradition,
} from "../../lib/calendar/feastsByTradition";
import { sanctoraleBySlug } from "../../lib/calendar/sanctorale";
import { traditionForEdition } from "../../lib/calendar/tradition";
import { useThemedStyles } from "../../lib/theme/themedStyles";
import {
  DetailPage,
  defaultSaint,
  EmptyMessage,
  IndexRow,
  noSelect,
  PickerButton,
  SplitPane,
  useReference,
} from "./shared";
import { sharedStyles as styleDef } from "./styles";
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
  const { edition } = useEdition();
  const tradition = traditionForEdition(edition);
  const { openSaint, saintBio, saintLiturgy } = useReference();
  const styles = useThemedStyles(styleDef);
  const slug = openSaint ?? defaultSaint(tradition);
  const feast = holyDayBySlugForTradition(slug, tradition);
  // a shared feast keeps one page; the card shows the selected church's
  // printed name, date, biography and propers.
  const detail = feast ? (
    <FeastCard
      feast={feast}
      tradition={tradition}
      showBio={saintBio}
      showLiturgy={saintLiturgy}
    />
  ) : null;
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
      detail={<View key={`${tradition}:${slug}`}>{detail}</View>}
      detailOpen
    />
  );
}

// the saints bar mirrors the psalms bar: the sidebar-show button, the
// current-pick chip that re-opens the floating picker, and the bio/liturgy
// view toggles (shown once a saint is on screen; bio leads by default,
// both standalone so each can be on or off independently)
export function SaintsBar({ leading }: { leading?: ReactNode }) {
  const { edition } = useEdition();
  const tradition = traditionForEdition(edition);
  const { openSaint, saintBio, setSaintBio, saintLiturgy, setSaintLiturgy } =
    useReference();
  const palette = usePalette();
  const styles = useThemedStyles(styleDef);
  const barStyles = useThemedStyles(officeBarStyles);

  const toggles = (
    <View style={styles.saintToggles}>
      <Pressable
        style={({ hovered }) => [barStyles.toggle, hovered && styles.rowHover]}
        onPress={() => setSaintBio(!saintBio)}
        accessibilityRole="button"
        accessibilityState={{ selected: saintBio }}
        accessibilityLabel={saintBio ? "Hide biography" : "Show biography"}
      >
        <Text style={[barStyles.toggleText, saintBio && styles.toggleOn]}>
          Bio
        </Text>
      </Pressable>
      <Pressable
        style={({ hovered }) => [barStyles.toggle, hovered && styles.rowHover]}
        onPress={() => setSaintLiturgy(!saintLiturgy)}
        accessibilityRole="button"
        accessibilityState={{ selected: saintLiturgy }}
        accessibilityLabel={
          saintLiturgy ? "Hide liturgical content" : "Show liturgical content"
        }
      >
        <Text style={[barStyles.toggleText, saintLiturgy && styles.toggleOn]}>
          Liturgy
        </Text>
      </Pressable>
    </View>
  );

  const slug = openSaint ?? defaultSaint(tradition);
  const sel =
    tradition === "tec"
      ? sanctoraleBySlug(slug)
      : holyDayBySlugForTradition(slug, tradition);

  return (
    <View style={[styles.bar, noSelect]}>
      <View style={styles.barLeft}>
        {leading}
        <PickerButton
          label={
            sel && "title" in sel
              ? sel.title
              : sel
                ? feastNameForTradition(sel, tradition)
                : "Holy day"
          }
          meta={sel ? feastMonthDayShortLabel(sel.month, sel.day) : undefined}
          onPress={() => palette.open("saints")}
        />
      </View>
      <View style={styles.barRight}>
        {tradition === "tec" ? toggles : null}
      </View>
    </View>
  );
}

// memoized saint row: a cursor flip re-renders only the two rows whose
// active state changed, instead of rebuilding the whole list every move
const SaintRow = memo(function SaintRow({
  hit,
  name,
  active,
  selected,
  onSelect,
}: {
  hit: FeastIdentity;
  name: string;
  active: boolean;
  selected: string | null;
  onSelect: (slug: string | null) => void;
}) {
  const styles = useThemedStyles(styleDef);
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
            {name}
          </Text>
          <Text style={[styles.saintDate, a && styles.rowTextActive]}>
            {feastMonthDayShortLabel(hit.month, hit.day)}
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
  const { edition } = useEdition();
  const tradition = traditionForEdition(edition);
  const deferredQuery = useDeferredValue(query);
  const hits = useMemo(
    () => searchHolyDaysForTradition(deferredQuery, tradition),
    [deferredQuery, tradition],
  );
  const onEnter = useCallback(
    (_i: number, hit: FeastIdentity) =>
      onSelect(hit.slug === selected ? null : hit.slug),
    [selected, onSelect],
  );
  const { cursor } = useIndexKeyboard(hits, onEnter);
  const styles = useThemedStyles(styleDef);
  if (hits.length === 0) {
    return <EmptyMessage message={`No holy days match “${deferredQuery}”.`} />;
  }
  return (
    <View style={styles.indexBody} dataSet={{ indexList: "" }}>
      {hits.map((hit, i) => (
        <SaintRow
          key={hit.slug}
          hit={hit}
          name={feastNameForTradition(hit, tradition)}
          active={i === cursor}
          selected={selected}
          onSelect={onSelect}
        />
      ))}
    </View>
  );
});
