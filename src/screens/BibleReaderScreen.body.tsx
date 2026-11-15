import { memo, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { ScriptureView } from "../components/office/ScriptureView";
import { Chevron } from "../components/shell/Chevron";
import { bibleBookName, useBible } from "../context/BibleContext";
import { useTranslation } from "../context/TranslationContext";
import { loadScriptureBook } from "../lib/content/bible";
import { sliceKjvPassage } from "../lib/content/kjv";
import type { KjvBook } from "../lib/content/types";
import { useThemedStyles } from "../lib/theme/themedStyles";
import { sharedStyles as styleDef } from "./reference/styles";

export const BibleChapterBody = memo(function BibleChapterBody() {
  const { book, chapter, nextChapter, prevChapter, selectBook, books } =
    useBible();
  const { translation, apocrypha } = useTranslation();
  const [bookData, setBookData] = useState<KjvBook | null | undefined>(
    undefined,
  );

  useEffect(() => {
    setBookData(undefined);
    if (!book) return;
    let active = true;
    loadScriptureBook({ translation, apocrypha }, book.abbrev).then((d) => {
      if (active) setBookData(d);
    });
    return () => {
      active = false;
    };
  }, [book, translation, apocrypha]);

  const styles = useThemedStyles(styleDef);

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
      // step back onto the previous book's last chapter, mirroring the next arrow
      selectBook(prevBook.abbrev, prevBook.chapters);
    }
  };

  const handleNext = () => {
    if (!atEnd) {
      nextChapter();
    } else if (nextBook) {
      // a linear read: enter the next book at chapter 1, not at a place left there
      selectBook(nextBook.abbrev, 1);
    }
  };

  const showPrev = !atStart || prevBook;
  const showNext = !atEnd || nextBook;

  return (
    <>
      <Text style={styles.detailTitle}>{bibleBookName(book.abbrev)}</Text>
      <Text style={styles.detailSubtitle}>Chapter {chapter}</Text>
      {passage ? (
        <ScriptureView passage={passage} size="body" />
      ) : bookData === undefined ? (
        <Text style={styles.bibleLoading}>Loading…</Text>
      ) : (
        <Text style={styles.bibleLoading}>Text not available.</Text>
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
