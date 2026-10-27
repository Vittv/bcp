import {
  memo,
  type ReactNode,
  useCallback,
  useDeferredValue,
  useMemo,
} from "react";
import { Pressable, Text, View } from "react-native";
import { useSubheading } from "../../components/office/contentHeadings";
import { usePalette } from "../../context/PaletteContext";
import { LESSER_FEAST_BIOS } from "../../lib/calendar/lesserFeastBios";
import {
  LESSER_FEASTS_URL,
  lesserFeastBySlug,
  lesserFeastsForDate,
} from "../../lib/calendar/lesserFeasts";
import {
  LESSER_FEAST_WIKI,
  wikipediaArticleUrl,
  wikipediaSearchUrl,
} from "../../lib/calendar/lesserFeastWiki";
import {
  monthDayLabel,
  monthDayShortLabel,
} from "../../lib/calendar/sanctorale";
import {
  type LesserFeastHit,
  searchLesserFeasts,
} from "../../lib/reference/search";
import { useThemedStyles } from "../../lib/theme/themedStyles";
import {
  DetailPage,
  defaultLesserFeast,
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
  const { openLesserFeast } = useReference();
  const styles = useThemedStyles(styleDef);
  const slug = openLesserFeast ?? defaultLesserFeast();
  if (isMobile) {
    return (
      <View style={styles.container}>
        <DetailPage compact>
          <LesserFeastCard slug={slug} />
        </DetailPage>
      </View>
    );
  }
  return (
    <SplitPane
      fontScale={fontScale}
      onScrollProgress={onScrollProgress}
      detail={<LesserFeastCard slug={slug} key={slug} />}
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
  const { openLesserFeast, setOpenLesserFeast } = useReference();
  const palette = usePalette();
  const styles = useThemedStyles(styleDef);
  const feast = lesserFeastBySlug(openLesserFeast ?? defaultLesserFeast());
  const todayFeast = lesserFeastsForDate(today())[0];
  const onToday = todayFeast !== undefined && feast?.slug === todayFeast.slug;
  return (
    <View style={[styles.bar, noSelect]}>
      <View style={styles.barLeft}>
        {leading}
        <PickerButton
          label={feast?.name ?? "Lesser feast"}
          meta={feast ? monthDayShortLabel(feast.month, feast.day) : undefined}
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
  hit: LesserFeastHit;
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
            {monthDayShortLabel(hit.month, hit.day)}
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
  const deferredQuery = useDeferredValue(query);
  const hits = useMemo(
    () => searchLesserFeasts(deferredQuery),
    [deferredQuery],
  );
  const onEnter = useCallback(
    (_i: number, hit: LesserFeastHit) =>
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
export function LesserFeastCard({ slug }: { slug: string }) {
  const styles = useThemedStyles(styleDef);
  const subheading = useSubheading();
  const feast = lesserFeastBySlug(slug);
  if (!feast) return null;
  const bio = LESSER_FEAST_BIOS[slug];
  const wikiLinks = LESSER_FEAST_WIKI[slug] ?? [];
  const date = monthDayLabel(feast.month, feast.day);
  return (
    <View>
      <Text style={[subheading, styles.lesserFeastTitle]}>{feast.name}</Text>
      <Text style={styles.detailSubtitle}>
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
    </View>
  );
}
