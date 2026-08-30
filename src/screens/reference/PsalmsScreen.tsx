import { memo, type ReactNode, useDeferredValue, useMemo, useRef } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { PsalmText } from "../../components/office/PsalmText";
import { Chevron } from "../../components/shell/Chevron";
import { psalmPassage } from "../../lib/content/psalter";
import { searchPsalms } from "../../lib/reference/search";
import {
  DetailPage,
  EmptyMessage,
  noSelect,
  SplitPane,
  useReference,
} from "./shared";
import { sharedStyles as styles } from "./styles";

export function PsalmsScreen({
  isMobile,
  fontScale,
  onScrollProgress,
}: {
  isMobile: boolean;
  fontScale: number;
  onScrollProgress?: (pct: number) => void;
}) {
  const { query, setQuery, openPsalm, setOpenPsalm } = useReference();
  const desktopInputRef = useRef<TextInput>(null);
  if (isMobile) {
    return (
      <View style={styles.container}>
        {openPsalm !== null ? (
          <DetailPage compact>
            <PsalmDetailBody psalm={openPsalm} />
          </DetailPage>
        ) : (
          <PsalmIndex query={query} selected={null} onSelect={setOpenPsalm} />
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
          ref={desktopInputRef}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by number or text"
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
          accessibilityLabel="Search psalms"
        />
      }
      list={
        <PsalmIndex
          query={query}
          // fall back to the first psalm so the pane never shows an
          // empty hint; the row highlights as if it were picked
          selected={openPsalm ?? 1}
          onSelect={(n) => setOpenPsalm(openPsalm === n ? null : n)}
        />
      }
      detail={
        <PsalmDetailBody psalm={openPsalm ?? 1} key={`p${openPsalm ?? 1}`} />
      }
      detailOpen={openPsalm !== null}
    />
  );
}

// the psalms bar carries the sidebar-show button; on mobile it also
// has search (or a back button when a psalm is open). Desktop search
// lives in the right navigator header instead.
export function PsalmsBar({
  leading,
  isMobile,
}: {
  leading?: ReactNode;
  isMobile: boolean;
}) {
  const { query, setQuery, openPsalm, setOpenPsalm } = useReference();
  const inputRef = useRef<TextInput>(null);
  const searching = isMobile ? openPsalm === null : false;

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
            onPress={() => setOpenPsalm(null)}
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
          placeholder="Search by number or text"
          placeholderTextColor="var(--text-secondary, #7a6e64)"
          style={styles.search}
          accessibilityLabel="Search psalms"
        />
      ) : null}
    </Pressable>
  );
}

// psalm index shared by both layouts; `selected` drives the highlight.
// filtering runs against a deferred copy of the query so fast typing
// never blocks the input
function PsalmIndex({
  query,
  selected,
  onSelect,
}: {
  query: string;
  selected: number | null;
  onSelect: (psalm: number) => void;
}) {
  const deferredQuery = useDeferredValue(query);
  const hits = useMemo(() => searchPsalms(deferredQuery), [deferredQuery]);
  if (hits.length === 0) {
    return <EmptyMessage message={`No psalms match “${deferredQuery}”.`} />;
  }
  return (
    <View style={styles.indexBody}>
      {hits.map((hit) => {
        const isSelected = hit.psalm === selected;
        return (
          <Pressable
            key={hit.psalm}
            style={({ hovered }) => [styles.row, hovered && styles.rowHover]}
            onPress={() => onSelect(hit.psalm)}
          >
            <View style={styles.psalmRowInner}>
              <Text
                style={[styles.psalmNumber, isSelected && styles.rowTextActive]}
              >
                {hit.psalm}
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.incipit, isSelected && styles.rowTextActive]}
              >
                {hit.incipit}
              </Text>
              <Text
                style={[styles.rowMeta, isSelected && styles.rowTextActive]}
              >
                {hit.verses} verse{hit.verses === 1 ? "" : "s"}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

// memoized: query keystrokes re-render the bar and index; the reading
// pane should sit still unless its psalm actually changes
const PsalmDetailBody = memo(function PsalmDetailBody({
  psalm,
}: {
  psalm: number;
}) {
  const passage = useMemo(() => psalmPassage({ psalm }), [psalm]);
  const verses = passage?.verses.length ?? 0;
  return (
    <>
      <Text style={styles.detailTitle}>Psalm {psalm}</Text>
      <Text style={styles.detailSubtitle}>
        {verses} verse{verses === 1 ? "" : "s"}
      </Text>
      {passage ? <PsalmText passage={passage} /> : null}
    </>
  );
});
