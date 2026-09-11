import {
  memo,
  type ReactNode,
  useCallback,
  useDeferredValue,
  useMemo,
} from "react";
import { Text, View } from "react-native";
import { usePalette } from "../../context/PaletteContext";
import { collectPassage } from "../../lib/content/collects";
import type { CollectRite, CollectSection } from "../../lib/content/types";
import { type CollectHit, searchCollects } from "../../lib/reference/search";
import {
  type CollectSel,
  DetailPage,
  EmptyMessage,
  FIRST_COLLECT,
  IndexRow,
  noSelect,
  PickerButton,
  SplitPane,
  useReference,
} from "./shared";
import { sharedStyles as styles } from "./styles";
import { useIndexKeyboard } from "./useIndexKeyboard";

const RITE_LABELS: Record<CollectRite, string> = {
  traditional: "Traditional (Rite I)",
  contemporary: "Contemporary (Rite II)",
};

const SECTION_LABELS: Record<string, string> = {
  "church-year": "The Church Year",
  "holy-days": "Holy Days",
  "common-of-saints": "Common of Saints",
  "various-occasions": "Various Occasions",
};

function sectionLabel(section: string): string {
  return SECTION_LABELS[section] ?? section;
}

export function CollectsScreen({
  isMobile,
  fontScale,
  onScrollProgress,
}: {
  isMobile: boolean;
  fontScale: number;
  onScrollProgress?: (pct: number) => void;
}) {
  const { selectedCollect } = useReference();
  if (isMobile) {
    return (
      <View style={styles.container}>
        <DetailPage compact>
          <CollectCompare sel={selectedCollect ?? FIRST_COLLECT} />
        </DetailPage>
      </View>
    );
  }
  return (
    <SplitPane
      fontScale={fontScale}
      onScrollProgress={onScrollProgress}
      detail={
        <CollectCompare
          sel={selectedCollect ?? FIRST_COLLECT}
          key={(selectedCollect ?? FIRST_COLLECT).title}
        />
      }
      detailOpen
    />
  );
}

// the collects bar mirrors the psalms bar: the sidebar-show button and
// the current-pick chip that re-opens the floating picker
export function CollectsBar({ leading }: { leading?: ReactNode }) {
  const { selectedCollect } = useReference();
  const palette = usePalette();
  const sel = selectedCollect ?? FIRST_COLLECT;
  return (
    <View style={[styles.bar, noSelect]}>
      <View style={styles.barLeft}>
        {leading}
        <PickerButton
          label={sel.title}
          meta={sectionLabel(sel.section)}
          onPress={() => palette.open("collects")}
        />
      </View>
    </View>
  );
}

// memoized collect row: a cursor flip re-renders only the two rows whose
// active state changed, instead of rebuilding the whole list every move
const CollectRow = memo(function CollectRow({
  hit,
  active,
  selected,
  onSelect,
}: {
  hit: CollectHit;
  active: boolean;
  selected: CollectSel | null;
  onSelect: (c: CollectSel | null) => void;
}) {
  const isSelected =
    selected?.section === hit.section && selected?.title === hit.title;
  return (
    <IndexRow
      cursor={active}
      onPress={() =>
        onSelect(isSelected ? null : { section: hit.section, title: hit.title })
      }
    >
      {(a) => (
        <View style={styles.collectRowInner}>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.collectIndexTitle, a && styles.rowTextActive]}
          >
            {hit.title}
          </Text>
        </View>
      )}
    </IndexRow>
  );
});

// selectable collect index for the floating picker: one row per collect
// (both rites share titles), grouped by section in printed order. same
// deferred-query logic as the psalm index so typing never blocks
export function CollectIndex({
  query,
  selected,
  onSelect,
}: {
  query: string;
  selected: CollectSel | null;
  onSelect: (c: CollectSel | null) => void;
}) {
  const deferredQuery = useDeferredValue(query);
  const hits = useMemo(() => searchCollects(deferredQuery), [deferredQuery]);
  const sections = useMemo(() => {
    const gs: CollectSection[] = [];
    for (const hit of hits) {
      if (!gs.some((s) => s === hit.section)) {
        gs.push(hit.section);
      }
    }
    return gs;
  }, [hits]);
  const onEnter = useCallback(
    (_i: number, hit: CollectHit) =>
      onSelect(
        selected?.section === hit.section && selected?.title === hit.title
          ? null
          : { section: hit.section, title: hit.title },
      ),
    [selected, onSelect],
  );
  const { cursor } = useIndexKeyboard(hits, onEnter);
  const cursorHit = hits[cursor];
  if (hits.length === 0) {
    return <EmptyMessage message={`No collects match “${deferredQuery}”.`} />;
  }
  return (
    <View style={styles.indexBody} dataSet={{ indexList: "" }}>
      {sections.map((section) => (
        <View key={section} style={styles.collectGroup}>
          <Text style={[styles.groupHeading, styles.groupHeadingIndex]}>
            {sectionLabel(section)}
          </Text>
          {hits
            .filter((h) => h.section === section)
            .map((hit) => (
              <CollectRow
                key={`${hit.section}:${hit.title}`}
                hit={hit}
                active={hit === cursorHit}
                selected={selected}
                onSelect={onSelect}
              />
            ))}
        </View>
      ))}
    </View>
  );
}

// stacked rites: Traditional on top, Contemporary below. the data pairs
// 1:1 by section and title, so a missing half is data rot.
// memoized so query keystrokes leave the reading pane alone
const CollectCompare = memo(function CollectCompare({
  sel,
}: {
  sel: CollectSel;
}) {
  const traditional = collectPassage("traditional", sel.section, sel.title);
  const contemporary = collectPassage("contemporary", sel.section, sel.title);
  const columns = [traditional, contemporary].filter((c) => c !== undefined);
  if (columns.length === 0) return null;
  return (
    <>
      <Text style={styles.detailTitle}>{sel.title}</Text>
      <Text style={styles.detailSubtitle}>{sectionLabel(sel.section)}</Text>
      <View style={styles.compareRow}>
        {columns.map((c) => (
          <View key={c.rite} style={styles.compareCol}>
            <Text style={styles.compareRite}>{RITE_LABELS[c.rite]}</Text>
            <Text style={styles.collectBody}>{c.text}</Text>
          </View>
        ))}
      </View>
    </>
  );
});
