import { memo, useCallback, useMemo } from "react";
import { Text, View } from "react-native";
import {
  PALETTE_SECTION_ORDER,
  type PaletteEntry,
  type PaletteSection,
  searchPalette,
} from "../../lib/reference/search";
import { EmptyMessage, IndexRow } from "./shared";
import { sharedStyles as styles } from "./styles";
import { useIndexKeyboard } from "./useIndexKeyboard";

const SECTION_HEADINGS: Record<PaletteSection, string> = {
  psalms: "Psalms",
  proverbs: "Proverbs",
  canticles: "Canticles",
  collects: "Collects",
  saints: "Saints",
  bible: "Bible",
};

// memoized global row: a cursor flip re-renders only the two rows whose
// active state changed, and the whole list stays cheap to filter
const GlobalRow = memo(function GlobalRow({
  entry,
  active,
  onSelect,
}: {
  entry: PaletteEntry;
  active: boolean;
  onSelect: (entry: PaletteEntry) => void;
}) {
  return (
    <IndexRow cursor={active} onPress={() => onSelect(entry)}>
      {(a) => (
        <View style={styles.collectRowInner}>
          <Text
            numberOfLines={1}
            style={[styles.canticleIndexTitle, a && styles.rowTextActive]}
          >
            {entry.label}
          </Text>
          {entry.detail ? (
            <Text
              numberOfLines={1}
              style={[styles.rowMeta, a && styles.rowTextActive]}
            >
              {entry.detail}
            </Text>
          ) : null}
        </View>
      )}
    </IndexRow>
  );
});

// the Ctrl+K palette: every section's picker folds into one searchable
// list, grouped under the page names so a result's provenance is obvious.
// it deliberately starts blank and only fills as the user types; choosing
// a row closes the picker and pulls that reading up on its own page.
export function GlobalIndex({
  query,
  onSelect,
}: {
  query: string;
  onSelect: (entry: PaletteEntry) => void;
}) {
  const hits = useMemo(() => searchPalette(query), [query]);
  const onEnter = useCallback(
    (_i: number, entry: PaletteEntry) => onSelect(entry),
    [onSelect],
  );
  const { cursor } = useIndexKeyboard(hits, onEnter);
  const cursorItem = hits[cursor];

  // the global search starts blank: nothing between the search field and
  // the nav-hint footer until the user types
  if (query.trim() === "") return null;
  if (hits.length === 0) {
    return <EmptyMessage message={`No matches for “${query}”.`} />;
  }

  const groups = PALETTE_SECTION_ORDER.map((section) => ({
    section,
    items: hits.filter((entry) => entry.section === section),
  })).filter((group) => group.items.length > 0);

  return (
    <View style={styles.indexBody} dataSet={{ indexList: "" }}>
      {groups.map((group) => (
        <View key={group.section} style={styles.collectGroup}>
          <Text style={[styles.groupHeading, styles.groupHeadingIndex]}>
            {SECTION_HEADINGS[group.section]}
          </Text>
          {group.items.map((entry) => (
            <GlobalRow
              key={entry.id}
              entry={entry}
              active={entry === cursorItem}
              onSelect={onSelect}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
