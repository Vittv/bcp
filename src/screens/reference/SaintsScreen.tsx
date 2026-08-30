import { memo, type ReactNode, useDeferredValue, useMemo, useRef } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SanctoraleCard } from "../../components/office/SanctoraleCard";
import { Chevron } from "../../components/shell/Chevron";
import { monthDayShortLabel } from "../../lib/calendar/sanctorale";
import { searchSaints } from "../../lib/reference/search";
import {
  DetailPage,
  EmptyMessage,
  FIRST_SAINT,
  noSelect,
  SplitPane,
  useReference,
} from "./shared";
import { sharedStyles as styles } from "./styles";

export function SaintsScreen({
  isMobile,
  fontScale,
  onScrollProgress,
}: {
  isMobile: boolean;
  fontScale: number;
  onScrollProgress?: (pct: number) => void;
}) {
  const { query, setQuery, openSaint, setOpenSaint } = useReference();
  const desktopInputRef = useRef<TextInput>(null);
  if (isMobile) {
    return (
      <View style={styles.container}>
        {openSaint !== null ? (
          <DetailPage compact>
            <SanctoraleCard slug={openSaint} />
          </DetailPage>
        ) : (
          <SaintIndex query={query} selected={null} onSelect={setOpenSaint} />
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
          placeholder="Search saints by name or date"
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
          accessibilityLabel="Search saints"
        />
      }
      list={
        <SaintIndex
          query={query}
          // fall back to the first saint so the pane never shows an
          // empty hint; the row highlights as if it were picked
          selected={openSaint ?? FIRST_SAINT}
          onSelect={setOpenSaint}
        />
      }
      detail={
        <SanctoraleCard
          slug={openSaint ?? FIRST_SAINT}
          key={openSaint ?? FIRST_SAINT}
        />
      }
      detailOpen={openSaint !== null}
    />
  );
}

// the saints bar mirrors the psalms bar: on mobile it carries search
// (or a back button when a saint is open). Desktop search lives in
// the right navigator header instead.
export function SaintsBar({
  leading,
  isMobile,
}: {
  leading?: ReactNode;
  isMobile: boolean;
}) {
  const { query, setQuery, openSaint, setOpenSaint } = useReference();
  const inputRef = useRef<TextInput>(null);
  const searching = isMobile ? openSaint === null : false;

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
            onPress={() => setOpenSaint(null)}
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
          placeholder="Search saints by name or date"
          placeholderTextColor="var(--text-secondary, #7a6e64)"
          style={styles.search}
          accessibilityLabel="Search saints"
        />
      ) : null}
    </Pressable>
  );
}

// grouped date-sorted index for the split layout: the fixed-date table
// races the calendar automatically, so no explicit grouping is needed
const SaintIndex = memo(function SaintIndex({
  query,
  selected,
  onSelect,
}: {
  query: string;
  selected: string | null;
  onSelect: (slug: string | null) => void;
}) {
  const deferredQuery = useDeferredValue(query);
  const hits = useMemo(() => searchSaints(deferredQuery), [deferredQuery]);
  if (hits.length === 0) {
    return <EmptyMessage message={`No saints match “${deferredQuery}”.`} />;
  }
  return (
    <View style={styles.indexBody}>
      {hits.map((hit) => {
        const isSelected = hit.slug === selected;
        return (
          <Pressable
            key={hit.slug}
            style={({ hovered }) => [styles.row, hovered && styles.rowHover]}
            onPress={() => onSelect(isSelected ? null : hit.slug)}
          >
            <View style={styles.saintRowInner}>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[styles.saintTitle, isSelected && styles.rowTextActive]}
              >
                {hit.title}
              </Text>
              <Text
                style={[styles.saintDate, isSelected && styles.rowTextActive]}
              >
                {monthDayShortLabel(hit.month, hit.day)}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
});
