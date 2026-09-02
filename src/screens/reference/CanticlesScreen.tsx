import { memo, type ReactNode, useMemo, useRef } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Chevron } from "../../components/shell/Chevron";
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
  noSelect,
  SplitPane,
  useReference,
} from "./shared";
import { sharedStyles as styles } from "./styles";

export function CanticlesScreen({
  isMobile,
  fontScale,
  onScrollProgress,
}: {
  isMobile: boolean;
  fontScale: number;
  onScrollProgress?: (pct: number) => void;
}) {
  const { query, setQuery, openCanticle, setOpenCanticle } = useReference();
  if (isMobile) {
    return (
      <View style={styles.container}>
        {openCanticle !== null ? (
          <DetailPage compact>
            <CanticleDetailBody number={openCanticle} />
          </DetailPage>
        ) : (
          <CanticleIndex
            query={query}
            selected={null}
            onSelect={setOpenCanticle}
          />
        )}
      </View>
    );
  }
  return (
    <SplitPane
      fontScale={fontScale}
      onScrollProgress={onScrollProgress}
      header={
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by number or title"
          placeholderTextColor="var(--text-secondary, #7a6e64)"
          style={[
            styles.search,
            {
              width: "100%",
              marginLeft: 0,
              borderWidth: 0,
              paddingHorizontal: 0,
              paddingVertical: 0,
            },
          ]}
          accessibilityLabel="Search canticles"
        />
      }
      list={
        <CanticleIndex
          query={query}
          selected={openCanticle ?? 1}
          onSelect={(n) => setOpenCanticle(openCanticle === n ? null : n)}
        />
      }
      detail={
        <CanticleDetailBody
          number={openCanticle ?? 1}
          key={`c${openCanticle ?? 1}`}
        />
      }
      detailOpen={openCanticle !== null}
    />
  );
}

// the canticles bar mirrors the psalms bar: on mobile it carries search
// (or a back button when a canticle is open). desktop search lives in the
// right navigator header instead.
export function CanticlesBar({
  leading,
  isMobile,
}: {
  leading?: ReactNode;
  isMobile: boolean;
}) {
  const { query, setQuery, openCanticle, setOpenCanticle } = useReference();
  const inputRef = useRef<TextInput>(null);
  const searching = isMobile ? openCanticle === null : false;

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
            onPress={() => setOpenCanticle(null)}
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
          placeholder="Search by number or title"
          placeholderTextColor="var(--text-secondary, #7a6e64)"
          style={styles.search}
          accessibilityLabel="Search canticles"
        />
      ) : null}
    </Pressable>
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

function CanticleIndex({
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
    <View style={styles.indexBody}>
      {(q === ""
        ? groups
        : [{ label: null, numbers: [], items: filtered }]
      ).map((group, gi) => (
        <View key={group.label ?? "results"} style={styles.collectGroup}>
          {group.label ? (
            <Text
              style={[
                styles.groupHeading,
                styles.groupHeadingIndex,
                gi === 0 && styles.groupHeadingFirst,
              ]}
            >
              {group.label}
            </Text>
          ) : null}
          {group.items.map((c) => {
            const isSelected = c.number === selected;
            return (
              <Pressable
                key={c.number}
                style={({ hovered }) => [
                  styles.row,
                  hovered && styles.rowHover,
                ]}
                onPress={() => onSelect(isSelected ? null : c.number)}
              >
                <View style={styles.collectRowInner}>
                  <Text
                    style={[
                      styles.canticleNumber,
                      isSelected && styles.rowTextActive,
                    ]}
                  >
                    {c.number}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.canticleIndexTitle,
                      isSelected && styles.rowTextActive,
                    ]}
                  >
                    {c.title}
                  </Text>
                  <Text
                    style={[styles.rowMeta, isSelected && styles.rowTextActive]}
                  >
                    {c.verses} verse{c.verses === 1 ? "" : "s"}
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

// memoized: query keystrokes re-render the bar and index; the reading
// pane should sit still unless its canticle actually changes
const CanticleDetailBody = memo(function CanticleDetailBody({
  number,
}: {
  number: number;
}) {
  const passage = useMemo(
    () => canticlePassage(number) as CanticlePassage | undefined,
    [number],
  );
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
