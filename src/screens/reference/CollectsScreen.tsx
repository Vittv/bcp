import { memo, type ReactNode, useDeferredValue, useMemo, useRef } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Chevron } from "../../components/shell/Chevron";
import { SearchField } from "../../components/shell/SearchField";
import { collectPassage } from "../../lib/content/collects";
import type { CollectRite, CollectSection } from "../../lib/content/types";
import { searchCollects } from "../../lib/reference/search";
import {
  type CollectSel,
  DetailPage,
  EmptyMessage,
  FIRST_COLLECT,
  noSelect,
  SplitPane,
  useReference,
} from "./shared";
import { sharedStyles as styles } from "./styles";

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
}: {
  isMobile: boolean;
  fontScale: number;
}) {
  const { query, setQuery, selectedCollect, setSelectedCollect } =
    useReference();
  const desktopInputRef = useRef<TextInput>(null);
  if (isMobile) {
    return (
      <View style={styles.container}>
        {selectedCollect !== null ? (
          <DetailPage compact>
            <CollectCompare sel={selectedCollect} />
          </DetailPage>
        ) : (
          <CollectIndex
            query={query}
            selected={null}
            onSelect={setSelectedCollect}
          />
        )}
      </View>
    );
  }
  return (
    <SplitPane
      fontScale={fontScale}
      header={
        <SearchField
          ref={desktopInputRef}
          value={query}
          onChangeText={setQuery}
          placeholder="Search"
          accessibilityLabel="Search collects"
        />
      }
      list={
        <CollectIndex
          query={query}
          // fall back to the first collect so the pane never shows an
          // empty hint; the row highlights as if it were picked
          selected={selectedCollect ?? FIRST_COLLECT}
          onSelect={setSelectedCollect}
        />
      }
      detail={
        <CollectCompare
          sel={selectedCollect ?? FIRST_COLLECT}
          key={(selectedCollect ?? FIRST_COLLECT).title}
        />
      }
      detailOpen={selectedCollect !== null}
    />
  );
}

// the collects bar mirrors the psalms bar: on mobile it carries search
// (or a back button when a collect is open). Desktop search lives in
// the right navigator header instead.
export function CollectsBar({
  leading,
  isMobile,
}: {
  leading?: ReactNode;
  isMobile: boolean;
}) {
  const { query, setQuery, selectedCollect, setSelectedCollect } =
    useReference();
  const inputRef = useRef<TextInput>(null);
  const searching = isMobile ? selectedCollect === null : false;

  if (!isMobile) {
    return (
      <View style={[styles.bar, noSelect]}>
        <View style={styles.barLeft}>{leading}</View>
      </View>
    );
  }

  return (
    <Pressable
      style={[styles.bar, noSelect]}
      onPress={() => inputRef.current?.focus()}
    >
      <View style={styles.barLeft}>
        {leading}
        {!searching ? (
          <Pressable
            style={({ hovered }) => [
              styles.backBtn,
              hovered && styles.rowHover,
            ]}
            onPress={() => setSelectedCollect(null)}
            accessibilityLabel="Back to list"
            accessibilityRole="button"
          >
            <Chevron direction="left" size={5} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        ) : null}
      </View>
      {searching ? (
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by title or text"
          placeholderTextColor="var(--text-secondary, #7a6e64)"
          style={styles.search}
          accessibilityLabel="Search collects"
        />
      ) : null}
    </Pressable>
  );
}

// selectable collect index for the split layout: one row per collect
// (both rites share titles), grouped by section in printed order. same
// deferred-query logic as the psalm index so typing never blocks
function CollectIndex({
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
  if (hits.length === 0) {
    return <EmptyMessage message={`No collects match “${deferredQuery}”.`} />;
  }
  return (
    <View style={styles.indexBody}>
      {sections.map((section) => (
        <View key={section} style={styles.collectGroup}>
          <Text
            style={[
              styles.groupHeading,
              styles.groupRule,
              styles.groupHeadingIndex,
            ]}
          >
            {sectionLabel(section)}
          </Text>
          {hits
            .filter((h) => h.section === section)
            .map((hit) => {
              const isSelected =
                selected?.section === hit.section &&
                selected?.title === hit.title;
              return (
                <Pressable
                  key={`${hit.section}:${hit.title}`}
                  style={({ hovered }) => [
                    styles.row,
                    isSelected && styles.rowSelected,
                    hovered && !isSelected && styles.rowHover,
                  ]}
                  onPress={() =>
                    onSelect(
                      isSelected
                        ? null
                        : { section: hit.section, title: hit.title },
                    )
                  }
                >
                  <View style={styles.collectRowInner}>
                    <Text numberOfLines={2} style={styles.collectIndexTitle}>
                      {hit.title}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
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
