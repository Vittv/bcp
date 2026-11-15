import { memo, useCallback, useDeferredValue, useMemo } from "react";
import { Text, View } from "react-native";

import { useBible } from "../context/BibleContext";
import { getAllProgress } from "../lib/content/bibleProgress";
import type { ScriptureBookMeta } from "../lib/content/scripture";
import { useThemedStyles } from "../lib/theme/themedStyles";
import { EmptyMessage, IndexRow } from "./reference/shared";
import { sharedStyles as styleDef } from "./reference/styles";
import { useIndexKeyboard } from "./reference/useIndexKeyboard";

// memoized book row: a cursor flip re-renders only the two rows whose
// active state changed, instead of rebuilding the whole list every move
const BookRow = memo(function BookRow({
  meta,
  active,
  mark,
  onSelect,
}: {
  meta: ScriptureBookMeta;
  active: boolean;
  mark: number;
  onSelect: (abbrev: string) => void;
}) {
  const styles = useThemedStyles(styleDef);
  return (
    <IndexRow cursor={active} onPress={() => onSelect(meta.abbrev)}>
      {(a) => (
        <View style={styles.psalmRowInner}>
          <Text
            numberOfLines={1}
            style={[styles.incipit, { flex: 1 }, a && styles.rowTextActive]}
          >
            {meta.book}
          </Text>
          <Text
            style={[
              styles.rowMeta,
              mark > 0 && styles.rowMetaReading,
              a && styles.rowTextActive,
            ]}
          >
            {mark > 0 ? `${mark}/${meta.chapters}` : `${meta.chapters} ch.`}
          </Text>
        </View>
      )}
    </IndexRow>
  );
});

export function BibleBookList({
  onSelect,
  query,
}: {
  onSelect: (abbrev: string) => void;
  query?: string;
}) {
  const { books } = useBible();
  const deferredQuery = useDeferredValue(query ?? "");
  // read once per open: the palette is modal over the reader, so no mark can
  // change while these rows are mounted
  const marks = useMemo(() => getAllProgress(), []);
  const filtered = useMemo(
    () =>
      deferredQuery.trim() === ""
        ? books
        : books.filter(
            (b) =>
              b.book
                .toLowerCase()
                .includes(deferredQuery.trim().toLowerCase()) ||
              b.abbrev
                .toLowerCase()
                .startsWith(deferredQuery.trim().toLowerCase()),
          ),
    [books, deferredQuery],
  );
  const pick = useCallback(
    (_i: number, b: ScriptureBookMeta) => onSelect(b.abbrev),
    [onSelect],
  );
  const { cursor } = useIndexKeyboard(filtered, pick);
  const styles = useThemedStyles(styleDef);
  if (filtered.length === 0) {
    return (
      <EmptyMessage message={`No bible book matches “${deferredQuery}”.`} />
    );
  }
  return (
    <View style={styles.indexBody} dataSet={{ indexList: "" }}>
      {filtered.map((b, i) => (
        <BookRow
          key={b.abbrev}
          meta={b}
          active={i === cursor}
          // clamped: a mark from an older content build can exceed a shorter book
          mark={Math.min(marks[b.abbrev] ?? 0, b.chapters)}
          onSelect={onSelect}
        />
      ))}
    </View>
  );
}

// memoized chapter row: a cursor flip re-renders only the two rows whose
// active state changed. the slot carries both markers of where the reader is,
// so "Current" is tested first and wins the slot when the two coincide
const BibleChapterRow = memo(function BibleChapterRow({
  chapter,
  title,
  active,
  selected,
  continueAt,
  onSelect,
}: {
  chapter: number;
  title?: string;
  active: boolean;
  selected: number;
  continueAt: number;
  onSelect: (n: number) => void;
}) {
  const styles = useThemedStyles(styleDef);
  const label =
    selected === chapter
      ? "Current"
      : continueAt === chapter
        ? "Continue"
        : null;
  return (
    <IndexRow cursor={active} onPress={() => onSelect(chapter)}>
      {(a) => (
        <View style={styles.psalmRowInner}>
          <Text
            numberOfLines={1}
            style={[styles.incipit, { flex: 1 }, a && styles.rowTextActive]}
          >
            {title ? `Chapter ${chapter} · ${title}` : `Chapter ${chapter}`}
          </Text>
          {label ? (
            <Text
              style={[
                styles.rowMeta,
                styles.rowMetaReading,
                a && styles.rowTextActive,
              ]}
            >
              {label}
            </Text>
          ) : null}
        </View>
      )}
    </IndexRow>
  );
});

// chapter index for one bible book, searchable by number like the proverbs
// chapter index; picking lands on the chapter and closes the palette.
// `continueAt` is the book's high-water mark, 0 when never opened.
// `chapterTitles` names the chapters a book names rather than numbers, so
// the WEB's Daniel (Greek) lists its two additions as Susanna and Bel
export function BibleChapterList({
  chapters,
  chapterTitles,
  query,
  selected,
  continueAt,
  onSelect,
}: {
  chapters: number[];
  chapterTitles?: Record<number, string>;
  query: string;
  selected: number;
  continueAt: number;
  onSelect: (n: number) => void;
}) {
  const q = query.trim();
  const filtered = useMemo(() => {
    if (q === "") return chapters;
    const num = parseInt(q, 10);
    if (Number.isNaN(num)) return [];
    return chapters.filter((c) => String(c).startsWith(String(num)));
  }, [chapters, q]);
  const onEnter = useCallback(
    (_i: number, c: number) => onSelect(c),
    [onSelect],
  );
  const { cursor } = useIndexKeyboard(filtered, onEnter);
  const styles = useThemedStyles(styleDef);
  if (filtered.length === 0) {
    return <EmptyMessage message={`No bible chapter matches “${q}”.`} />;
  }
  return (
    <View style={styles.indexBody} dataSet={{ indexList: "" }}>
      {filtered.map((c, i) => (
        <BibleChapterRow
          key={c}
          chapter={c}
          title={chapterTitles?.[c]}
          active={i === cursor}
          selected={selected}
          continueAt={continueAt}
          onSelect={onSelect}
        />
      ))}
    </View>
  );
}
