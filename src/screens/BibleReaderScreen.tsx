import { memo, type ReactNode, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ScriptureView } from "../components/office/ScriptureView";
import { Chevron } from "../components/shell/Chevron";
import { bibleBookName, useBible } from "../context/BibleContext";
import type { KjvBook } from "../lib/content/kjv";
import { loadKjvBook, sliceKjvPassage } from "../lib/content/kjv";
import {
  DetailPage,
  EmptyMessage,
  noSelect,
  SplitPane,
} from "./reference/shared";
import { sharedStyles as styles } from "./reference/styles";

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
  const { book, selectBook } = useBible();

  if (isMobile) {
    return (
      <View style={styles.container}>
        {book ? (
          <DetailPage compact>
            <BibleChapterBody />
          </DetailPage>
        ) : (
          <BibleBookList onSelect={selectBook} />
        )}
      </View>
    );
  }

  return (
    <SplitPane
      fontScale={fontScale}
      onScrollProgress={onScrollProgress}
      list={<BibleBookList selected={book?.abbrev} onSelect={selectBook} />}
      detail={book ? <BibleChapterBody /> : <EmptyMessage message="" />}
      detailOpen={book !== null}
    />
  );
}

// ---------------------------------------------------------------------------
// Bar
// ---------------------------------------------------------------------------

export function BibleBar({
  leading,
  isMobile,
}: {
  leading?: ReactNode;
  isMobile: boolean;
}) {
  const { book, chapter, clearBook, nextChapter, prevChapter } = useBible();
  const total = book?.chapters ?? 0;
  const atStart = chapter <= 1;
  const atEnd = total > 0 && chapter >= total;

  return (
    <View style={[styles.bar, noSelect]}>
      <View style={styles.barLeft}>
        {leading}
        {isMobile && book ? (
          <Pressable
            style={({ hovered }) => [
              styles.backBtn,
              hovered && styles.rowHover,
            ]}
            onPress={clearBook}
            accessibilityLabel="Back to book list"
            accessibilityRole="button"
          >
            <Chevron direction="left" size={5} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        ) : null}
      </View>
      {book && total > 0 ? (
        <View style={styles.barRight}>
          <Pressable
            style={({ hovered }) => [
              styles.backBtn,
              hovered && styles.rowHover,
              atStart && { opacity: 0.4 },
            ]}
            onPress={prevChapter}
            disabled={atStart}
            accessibilityLabel="Previous chapter"
          >
            <Chevron direction="left" size={5} />
          </Pressable>
          <Text style={styles.backText}>
            {bibleBookName(book.abbrev)} {chapter}
          </Text>
          <Pressable
            style={({ hovered }) => [
              styles.backBtn,
              hovered && styles.rowHover,
              atEnd && { opacity: 0.4 },
            ]}
            onPress={nextChapter}
            disabled={atEnd}
            accessibilityLabel="Next chapter"
          >
            <Chevron direction="right" size={5} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Book list
// ---------------------------------------------------------------------------

function BibleBookList({
  selected,
  onSelect,
}: {
  selected?: string | null;
  onSelect: (abbrev: string) => void;
}) {
  const { books } = useBible();
  return (
    <View style={styles.indexBody}>
      {books.map((b) => (
        <Pressable
          key={b.abbrev}
          style={({ hovered }) => [styles.row, hovered && styles.rowHover]}
          onPress={() => onSelect(b.abbrev)}
        >
          <View style={styles.psalmRowInner}>
            <Text
              numberOfLines={1}
              style={[
                styles.incipit,
                { flex: 1 },
                b.abbrev === selected && styles.rowTextActive,
              ]}
            >
              {b.book}
            </Text>
            <Text
              style={[
                styles.rowMeta,
                b.abbrev === selected && styles.rowTextActive,
              ]}
            >
              {b.chapters} ch.
            </Text>
          </View>
        </Pressable>
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
