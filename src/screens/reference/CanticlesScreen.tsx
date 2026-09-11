import { memo, type ReactNode, useCallback, useMemo } from "react";
import { Text, View } from "react-native";
import { usePalette } from "../../context/PaletteContext";
import {
  CANTICLE_COUNT,
  canticleExists,
  canticlePassage,
  canticleTitle,
} from "../../lib/content/canticles";
import type { CanticlePassage } from "../../lib/content/types";
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

export function CanticlesScreen({
  isMobile,
  fontScale,
  onScrollProgress,
}: {
  isMobile: boolean;
  fontScale: number;
  onScrollProgress?: (pct: number) => void;
}) {
  const { openCanticle } = useReference();
  if (isMobile) {
    return (
      <View style={styles.container}>
        <DetailPage compact>
          <CanticleDetailBody number={openCanticle ?? 1} />
        </DetailPage>
      </View>
    );
  }
  return (
    <SplitPane
      fontScale={fontScale}
      onScrollProgress={onScrollProgress}
      detail={
        <CanticleDetailBody
          number={openCanticle ?? 1}
          key={`c${openCanticle ?? 1}`}
        />
      }
      detailOpen
    />
  );
}

// the canticles bar mirrors the psalms bar: the sidebar-show button and
// the current-pick chip that re-opens the floating picker
export function CanticlesBar({ leading }: { leading?: ReactNode }) {
  const { openCanticle } = useReference();
  const palette = usePalette();
  const n = openCanticle ?? 1;
  const verses =
    canticlePassage(n)?.sections.reduce((sum, s) => sum + s.verses.length, 0) ??
    0;
  const rite = canticleRite(n);
  return (
    <View style={[styles.bar, noSelect]}>
      <View style={styles.barLeft}>
        {leading}
        <PickerButton
          label={canticleTitle(n) ?? `Canticle ${n}`}
          meta={[
            `Canticle ${n}`,
            rite,
            `${verses} verse${verses === 1 ? "" : "s"}`,
          ]
            .filter(Boolean)
            .join(" · ")}
          onPress={() => palette.open("canticles")}
        />
      </View>
    </View>
  );
}

// the single source of truth for the index: every existing number in
// order, with its title and a verse count
function useCanticleMeta() {
  return useMemo(() => {
    const list: { number: number; title: string; verses: number }[] = [];
    for (let n = 1; n <= CANTICLE_COUNT; n++) {
      if (!canticleExists(n)) continue;
      const title = canticleTitle(n) ?? "";
      const passage = canticlePassage(n);
      const verses =
        passage?.sections.reduce((sum, s) => sum + s.verses.length, 0) ?? 0;
      list.push({ number: n, title, verses });
    }
    return list;
  }, []);
}

// canticles fall into two wordings, matching the 1979 BCP's S-280 table:
// 1-7 traditional, 8-21 contemporary. the index groups them like the
// collects page does, so the paired songs (e.g. 3 and 15 Mary) read as
// two renditions of the same text rather than two strangers
const RITE_GROUPS: { label: string; numbers: number[] }[] = [
  { label: "Traditional", numbers: [1, 2, 3, 4, 5, 6, 7] },
  {
    label: "Contemporary",
    numbers: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
  },
];

function canticleRite(number: number): string | undefined {
  return RITE_GROUPS.find((g) => g.numbers.includes(number))?.label;
}

// memoized canticle row: a cursor flip re-renders only the two rows whose
// active state changed, instead of rebuilding the whole list every move
const CanticleRow = memo(function CanticleRow({
  item,
  active,
  selected,
  onSelect,
}: {
  item: { number: number; title: string; verses: number };
  active: boolean;
  selected: number | null;
  onSelect: (n: number | null) => void;
}) {
  return (
    <IndexRow
      cursor={active}
      onPress={() => onSelect(selected === item.number ? null : item.number)}
    >
      {(a) => (
        <View style={styles.collectRowInner}>
          <Text
            numberOfLines={1}
            style={[styles.canticleIndexTitle, a && styles.rowTextActive]}
          >
            {item.title}
          </Text>
          <Text style={[styles.rowMeta, a && styles.rowTextActive]}>
            {item.verses} verse{item.verses === 1 ? "" : "s"}
          </Text>
        </View>
      )}
    </IndexRow>
  );
});

export function CanticleIndex({
  query,
  selected,
  onSelect,
}: {
  query: string;
  selected: number | null;
  onSelect: (n: number | null) => void;
}) {
  const all = useCanticleMeta();
  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (q === "") return all;
    return all.filter(
      (c) =>
        String(c.number).startsWith(q) || c.title.toLowerCase().includes(q),
    );
  }, [all, q]);

  const onEnter = useCallback(
    (_i: number, c: { number: number; title: string; verses: number }) =>
      onSelect(c.number === selected ? null : c.number),
    [selected, onSelect],
  );
  const { cursor } = useIndexKeyboard(filtered, onEnter);
  const cursorItem = filtered[cursor];
  if (filtered.length === 0) {
    return <EmptyMessage message={`No canticle matches “${query}”.`} />;
  }

  // when the query is empty the list keeps its rite subheadings; a
  // filtered search collapses to a flat result set
  const groups = RITE_GROUPS.map((g) => ({
    ...g,
    items: filtered.filter((c) => g.numbers.includes(c.number)),
  })).filter((g) => g.items.length > 0);

  return (
    <View style={styles.indexBody} dataSet={{ indexList: "" }}>
      {(q === ""
        ? groups
        : [{ label: null, numbers: [], items: filtered }]
      ).map((group) => (
        <View key={group.label ?? "results"} style={styles.collectGroup}>
          {group.label ? (
            <Text style={[styles.groupHeading, styles.groupHeadingIndex]}>
              {group.label}
            </Text>
          ) : null}
          {group.items.map((c) => (
            <CanticleRow
              key={c.number}
              item={c}
              active={c === cursorItem}
              selected={selected}
              onSelect={onSelect}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

// memoized: query keystrokes re-render the bar and index; the reading
// pane should sit still unless its canticle actually changes
const CanticleDetailBody = memo(function CanticleDetailBody({
  number,
}: {
  number: number;
}) {
  const passage = useMemo(() => canticlePassage(number), [number]);
  if (!passage) return null;
  const verses = passage.sections.reduce((s, x) => s + x.verses.length, 0);
  return (
    <>
      <Text style={styles.detailTitle}>{passage.title}</Text>
      <Text style={styles.detailSubtitle}>
        {"Canticle "}
        {number}
        {canticleRite(number) ? ` · ${canticleRite(number)}` : ""}
        {passage.latin ? ` · ${passage.latin}` : ""}
        {passage.source ? ` · ${passage.source}` : ""}
        {" · "}
        {verses} verse{verses === 1 ? "" : "s"}
      </Text>
      {passage.note ? (
        <Text style={styles.canticleNote}>{passage.note}</Text>
      ) : null}
      <CanticleText passage={passage} />
    </>
  );
});

// renders one canticle's sections and plain verses; unlike psalms the
// verses are unnumbered, so each section is a serif block of its own
function CanticleText({ passage }: { passage: CanticlePassage }) {
  return (
    <View>
      {passage.sections.map((section, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static sections, never reorder
        <View key={i} style={styles.canticleSection}>
          {section.title ? (
            <Text style={styles.canticleSectionTitle}>{section.title}</Text>
          ) : null}
          {section.verses.map((verse, j) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static verses, never reorder
            <Text key={j} style={styles.canticleVerse}>
              {verse}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}
