import {
  memo,
  type ReactNode,
  useCallback,
  useDeferredValue,
  useMemo,
} from "react";
import { Pressable, Text, View } from "react-native";
import { useSubheading } from "../../components/office/contentHeadings";
import { useEdition } from "../../context/EditionContext";
import { usePalette } from "../../context/PaletteContext";
import {
  type FeastIdentity,
  feastMonthDayLabel,
  feastMonthDayShortLabel,
  lesserFeastBySlugForTradition,
  lesserFeastForTraditionDate,
  searchLesserFeastsForTradition,
  upcomingLesserFeastForTradition,
} from "../../lib/calendar/feastsByTradition";
import { LESSER_FEAST_BIOS } from "../../lib/calendar/lesserFeastBios";
import { LESSER_FEASTS_URL } from "../../lib/calendar/lesserFeasts";
import {
  LESSER_FEAST_WIKI,
  wikipediaArticleUrl,
  wikipediaSearchUrl,
} from "../../lib/calendar/lesserFeastWiki";
import { traditionForEdition } from "../../lib/calendar/tradition";
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

export function LesserFeastsScreen({
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
  const { openLesserFeast } = useReference();
  const styles = useThemedStyles(styleDef);
  const selected =
    (openLesserFeast &&
      lesserFeastBySlugForTradition(openLesserFeast, tradition)) ||
    upcomingLesserFeastForTradition(today(), tradition);
  if (isMobile) {
    return (
      <View style={styles.container}>
        <DetailPage compact>
          <LesserFeastCard feast={selected} tradition={tradition} />
        </DetailPage>
      </View>
    );
  }
  return (
    <SplitPane
      fontScale={fontScale}
      onScrollProgress={onScrollProgress}
      detail={
        <LesserFeastCard
          feast={selected}
          tradition={tradition}
          key={selected.slug}
        />
      }
      detailOpen
    />
  );
}

// the bar mirrors the holy days bar: the sidebar-show button and the
// current-feast chip that re-opens the floating picker. a Today chip returns
// to the day's commemoration after browsing elsewhere; it appears only when
// the calendar has an entry for today, since there is nothing to return to
// on a day without one.
export function LesserFeastsBar({ leading }: { leading?: ReactNode }) {
  const { edition } = useEdition();
  const tradition = traditionForEdition(edition);
  const { openLesserFeast, setOpenLesserFeast } = useReference();
  const palette = usePalette();
  const styles = useThemedStyles(styleDef);
  const feast =
    (openLesserFeast &&
      lesserFeastBySlugForTradition(openLesserFeast, tradition)) ||
    upcomingLesserFeastForTradition(today(), tradition);
  const todayFeast = lesserFeastForTraditionDate(today(), tradition);
  const onToday = todayFeast !== undefined && feast.slug === todayFeast.slug;
  return (
    <View style={[styles.bar, noSelect]}>
      <View style={styles.barLeft}>
        {leading}
        <PickerButton
          label={feast?.name ?? "Lesser feast"}
          meta={
            feast ? feastMonthDayShortLabel(feast.month, feast.day) : undefined
          }
          onPress={() => palette.open("lesser-feasts")}
        />
      </View>
      {todayFeast ? (
        <View style={styles.barRight}>
          <Pressable
            style={({ hovered }) => [
              styles.todayBtn,
              hovered && styles.rowHover,
            ]}
            onPress={() => setOpenLesserFeast(todayFeast.slug)}
            accessibilityRole="button"
            accessibilityState={{ selected: onToday }}
            accessibilityLabel="Jump to today's lesser feast"
          >
            <Text style={[styles.todayText, onToday && styles.todayTextOn]}>
              Today
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

// memoized feast row: a cursor flip re-renders only the two rows whose
// active state changed, instead of rebuilding the whole list every move
const LesserFeastRow = memo(function LesserFeastRow({
  hit,
  active,
  selected,
  onSelect,
}: {
  hit: FeastIdentity;
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
            {hit.name}
          </Text>
          <Text style={[styles.saintDate, a && styles.rowTextActive]}>
            {feastMonthDayShortLabel(hit.month, hit.day)}
          </Text>
        </View>
      )}
    </IndexRow>
  );
});

// date-sorted index for the floating picker, with the same name-or-date
// search the holy days index uses
export const LesserFeastIndex = memo(function LesserFeastIndex({
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
    () => searchLesserFeastsForTradition(deferredQuery, tradition),
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
    return (
      <EmptyMessage message={`No lesser feast matches “${deferredQuery}”.`} />
    );
  }
  return (
    <View style={styles.indexBody} dataSet={{ indexList: "" }}>
      {hits.map((hit, i) => (
        <LesserFeastRow
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

// the detail card carries only what the app may reproduce: the name, the
// date, the trial marker, any original biography, and links out to a
// wikipedia article and the official book
export function LesserFeastCard({
  feast,
  tradition,
}: {
  feast: FeastIdentity;
  tradition: "tec" | "coe" | "acc";
}) {
  const styles = useThemedStyles(styleDef);
  const subheading = useSubheading();
  const bio = tradition === "tec" ? LESSER_FEAST_BIOS[feast.slug] : undefined;
  const wikiLinks =
    tradition === "tec" ? (LESSER_FEAST_WIKI[feast.slug] ?? []) : [];
  const date = feastMonthDayLabel(feast.month, feast.day);
  const calendar =
    tradition === "tec"
      ? "TEC · Lesser Feasts and Fasts 2024"
      : tradition === "coe"
        ? "CoE · 1662 daily calendar"
        : "ACC · 1962 Canadian calendar";
  return (
    <View>
      <Text style={[subheading, styles.lesserFeastTitle]}>{feast.name}</Text>
      <Text style={styles.detailSubtitle}>
        {calendar}
        {"\n"}
        {date}
        {feast.trial ? " · Trial use" : ""}
      </Text>
      {bio ? (
        <Text style={styles.lesserBio}>{bio}</Text>
      ) : (
        <Text style={styles.lesserBio}>{`Commemorated on ${date}.`}</Text>
      )}
      {wikiLinks.length > 0 ? (
        wikiLinks.map((link) => (
          <Pressable
            key={link.title}
            style={({ hovered }) => [
              styles.lesserLinkRow,
              hovered && styles.rowHover,
            ]}
            onPress={() =>
              window.open(
                wikipediaArticleUrl(link.title),
                "_blank",
                "noreferrer",
              )
            }
            accessibilityRole="link"
            accessibilityLabel={`Read ${link.label ?? link.title} on Wikipedia`}
          >
            <Text style={styles.lesserLink}>
              {`${link.label ?? link.title} on Wikipedia ›`}
            </Text>
          </Pressable>
        ))
      ) : (
        <Pressable
          style={({ hovered }) => [
            styles.lesserLinkRow,
            hovered && styles.rowHover,
          ]}
          onPress={() =>
            window.open(wikipediaSearchUrl(feast.name), "_blank", "noreferrer")
          }
          accessibilityRole="link"
          accessibilityLabel={`Search Wikipedia for ${feast.name}`}
        >
          <Text style={styles.lesserLink}>{"Search Wikipedia ›"}</Text>
        </Pressable>
      )}
      {tradition === "tec" ? (
        <Pressable
          style={({ hovered }) => [
            styles.lesserLinkRow,
            hovered && styles.rowHover,
          ]}
          onPress={() => window.open(LESSER_FEASTS_URL, "_blank", "noreferrer")}
          accessibilityRole="link"
          accessibilityLabel="Open the official Lesser Feasts and Fasts 2024 PDF"
        >
          <Text style={styles.lesserLink}>
            {"Lesser Feasts and Fasts 2024, official PDF ›"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
