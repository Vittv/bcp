import {
  memo,
  type ReactNode,
  useCallback,
  useDeferredValue,
  useMemo,
} from "react";
import { Pressable, Text, View } from "react-native";
import { usePalette } from "../../context/PaletteContext";
import { LESSER_FEAST_BIOS } from "../../lib/calendar/lesserFeastBios";
import {
  LESSER_FEASTS_URL,
  lesserFeastBySlug,
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
// current-feast chip that re-opens the floating picker. there are no view
// toggles because the page carries no permitted propers to hide
export function LesserFeastsBar({ leading }: { leading?: ReactNode }) {
  const { openLesserFeast } = useReference();
  const palette = usePalette();
  const styles = useThemedStyles(styleDef);
  const feast = lesserFeastBySlug(openLesserFeast ?? defaultLesserFeast());
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
  const feast = lesserFeastBySlug(slug);
  if (!feast) return null;
  const bio = LESSER_FEAST_BIOS[slug];
  const wikiLinks = LESSER_FEAST_WIKI[slug] ?? [];
  const date = monthDayLabel(feast.month, feast.day);
  return (
    <View>
      <Text style={styles.detailTitle}>{feast.name}</Text>
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
      <Text style={styles.canticleNote}>
        {
          "Lesser feasts are optional and yield to Sundays, Principal Feasts and Holy Days. The 2024 edition's biographies and propers are not reproduced here."
        }
      </Text>
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
