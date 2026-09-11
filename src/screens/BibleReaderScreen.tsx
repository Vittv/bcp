import {
  memo,
  type ReactNode,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Pressable, Text, View } from "react-native";
import { ScriptureView } from "../components/office/ScriptureView";
import { Chevron } from "../components/shell/Chevron";
import { bibleBookName, useBible } from "../context/BibleContext";
import { usePalette } from "../context/PaletteContext";
import type { KjvBook, KjvBookMeta } from "../lib/content/kjv";
import { loadKjvBook, sliceKjvPassage } from "../lib/content/kjv";
import {
  DetailPage,
  EmptyMessage,
  IndexRow,
  noSelect,
  PickerButton,
  SplitPane,
} from "./reference/shared";
import { sharedStyles as styles } from "./reference/styles";
import { useIndexKeyboard } from "./reference/useIndexKeyboard";

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function BibleReaderScreen({
  isMobile,
  fontScale,
  onScrollProgress,
}: {
  isMobile: boolean;
  fontScale: number;
  onScrollProgress?: (pct: number) => void;
}) {
  const { book } = useBible();
  const hint = (
    <EmptyMessage message="Open the book picker to start reading." />
  );

  if (isMobile) {
    return (
      <View style={styles.container}>
        <DetailPage compact>{book ? <BibleChapterBody /> : hint}</DetailPage>
      </View>
    );
  }

  return (
    <SplitPane
      fontScale={fontScale}
      onScrollProgress={onScrollProgress}
      detail={book ? <BibleChapterBody /> : hint}
      detailOpen={book !== null}
    />
  );
}

// ---------------------------------------------------------------------------
// Bar
// ---------------------------------------------------------------------------

export function BibleBar({ leading }: { leading?: ReactNode }) {
  const { book, chapter, nextChapter, prevChapter } = useBible();
  const palette = usePalette();
  const total = book?.chapters ?? 0;
  const atStart = chapter <= 1;
  const atEnd = total > 0 && chapter >= total;

  return (
    <View style={[styles.bar, noSelect]}>
      <View style={styles.barLeft}>
        {leading}
        <PickerButton
          label={book ? `${bibleBookName(book.abbrev)} ${chapter}` : "Book"}
          meta={book ? `Ch. ${chapter} / ${total}` : undefined}
          onPress={() => palette.open("bible")}
        />
      </View>
      {book && total > 0 ? (
        <View style={styles.barRight}>
          <Pressable
            style={({ hovered }) => [
              styles.arrowBtn,
              hovered && styles.arrowBtnHover,
              atStart && { opacity: 0.4 },
            ]}
            onPress={prevChapter}
            disabled={atStart}
            accessibilityLabel="Previous chapter"
          >
            <Chevron direction="left" size={6} />
          </Pressable>
          <Pressable
            style={({ hovered }) => [
              styles.arrowBtn,
              hovered && styles.arrowBtnHover,
              atEnd && { opacity: 0.4 },
            ]}
            onPress={nextChapter}
            disabled={atEnd}
            accessibilityLabel="Next chapter"
          >
            <Chevron direction="right" size={6} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Book list
// ---------------------------------------------------------------------------

// memoized book row: a cursor flip re-renders only the two rows whose
// active state changed, instead of rebuilding the whole list every move
const BookRow = memo(function BookRow({
  meta,
  active,
  onSelect,
}: {
  meta: KjvBookMeta;
  active: boolean;
  onSelect: (abbrev: string) => void;
}) {
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
              styles.bibleChapterCount,
              a && styles.rowTextActive,
            ]}
          >
            {meta.chapters} ch.
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
  const onEnter = useCallback(
    (_i: number, b: KjvBookMeta) => onSelect(b.abbrev),
    [onSelect],
  );
  const { cursor } = useIndexKeyboard(filtered, onEnter);
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
          onSelect={onSelect}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Chapter body
// ---------------------------------------------------------------------------

const BibleChapterBody = memo(function BibleChapterBody() {
  const { book, chapter, nextChapter, prevChapter, selectBook, books } =
    useBible();
  const [bookData, setBookData] = useState<KjvBook | null | undefined>(
    undefined,
  );

  useEffect(() => {
    setBookData(undefined);
    if (!book) return;
    let active = true;
    loadKjvBook(book.abbrev).then((d) => {
      if (active) setBookData(d);
    });
    return () => {
      active = false;
    };
  }, [book]);

  const passage = bookData && book ? sliceKjvPassage(bookData, chapter) : null;

  if (!book) return null;

  const total = book.chapters;
  const atStart = chapter <= 1;
  const atEnd = chapter >= total;

  const bookIdx = books.findIndex((b) => b.abbrev === book.abbrev);
  const prevBook = bookIdx > 0 ? books[bookIdx - 1] : null;
  const nextBook = bookIdx < books.length - 1 ? books[bookIdx + 1] : null;

  const handlePrev = () => {
    if (!atStart) {
      prevChapter();
    } else if (prevBook) {
      selectBook(prevBook.abbrev);
    }
  };

  const handleNext = () => {
    if (!atEnd) {
      nextChapter();
    } else if (nextBook) {
      selectBook(nextBook.abbrev);
    }
  };

  const showPrev = !atStart || prevBook;
  const showNext = !atEnd || nextBook;

  return (
    <>
      <Text style={styles.detailTitle}>{bibleBookName(book.abbrev)}</Text>
      <Text style={styles.detailSubtitle}>Chapter {chapter}</Text>
      {passage ? (
        <ScriptureView passage={passage} />
      ) : bookData === undefined ? (
        <Text style={styles.bibleLoading}>Loading…</Text>
      ) : (
        <Text style={styles.bibleLoading}>KJV text not available.</Text>
      )}

      <View style={styles.bibleBottomNav}>
        {showPrev ? (
          <Pressable
            style={({ hovered }) => [
              styles.bibleNavBtn,
              hovered && styles.rowHover,
            ]}
            onPress={handlePrev}
            accessibilityLabel={
              atStart ? `Previous book: ${prevBook?.book}` : "Previous chapter"
            }
          >
            <Chevron direction="left" size={5} />
            <Text style={styles.bibleNavLabel}>
              {atStart && prevBook ? prevBook.book : `Ch. ${chapter - 1}`}
            </Text>
          </Pressable>
        ) : (
          <View />
        )}
        {showNext ? (
          <Pressable
            style={({ hovered }) => [
              styles.bibleNavBtn,
              styles.bibleNavBtnRight,
              hovered && styles.rowHover,
            ]}
            onPress={handleNext}
            accessibilityLabel={
              atEnd ? `Next book: ${nextBook?.book}` : "Next chapter"
            }
          >
            <Text style={styles.bibleNavLabel}>
              {atEnd && nextBook ? nextBook.book : `Ch. ${chapter + 1}`}
            </Text>
            <Chevron direction="right" size={5} />
          </Pressable>
        ) : (
          <View />
        )}
      </View>
    </>
  );
});
