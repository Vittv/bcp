import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { BarDropdown } from "../components/shell/BarDropdown";
import { Chevron } from "../components/shell/Chevron";
import { bibleBookName, useBible } from "../context/BibleContext";
import { usePalette } from "../context/PaletteContext";
import { useTranslation } from "../context/TranslationContext";
import { useThemedStyles } from "../lib/theme/themedStyles";
import { APOCRYPHA_OPTIONS, TRANSLATION_OPTIONS } from "../lib/translations";
import { noSelect, PickerButton } from "./reference/shared";
import { sharedStyles as styleDef } from "./reference/styles";

export function BibleBar({ leading }: { leading?: ReactNode }) {
  const {
    book,
    chapter,
    nextChapter,
    prevChapter,
    testament,
    books,
    switchCorpus,
  } = useBible();
  const { translation, setTranslation, apocrypha } = useTranslation();
  const palette = usePalette();
  const styles = useThemedStyles(styleDef);
  const total = book?.chapters ?? 0;
  const atStart = chapter <= 1;
  const atEnd = total > 0 && chapter >= total;
  // the chip follows the corpus the page is showing, so an apocryphal page
  // offers the apocryphal corpora and a canonical page the canonical ones
  const apocryphal = testament === "DC";
  // the book's place in its corpus, so the corpus is visible in the bar: the
  // reader can see which list they are in and how long it is
  const bookIndex = book
    ? books.findIndex((b) => b.abbrev === book.abbrev)
    : -1;
  const corpusMeta =
    bookIndex >= 0 ? `${bookIndex + 1} of ${books.length}` : undefined;

  return (
    <View style={[styles.bar, noSelect]}>
      <View style={styles.barLeft}>
        {leading}
        {/* text picker: reads the active text and opens the full list. the
            code reads in accent red, the app's selected-state color, in both
            bar and menu */}
        {apocryphal ? (
          <BarDropdown
            value={apocrypha}
            options={APOCRYPHA_OPTIONS}
            onChange={switchCorpus}
            mono
            accent
            align="start"
            accessibilityLabel="Apocrypha corpus"
          />
        ) : (
          <BarDropdown
            value={translation}
            options={TRANSLATION_OPTIONS}
            onChange={setTranslation}
            mono
            accent
            align="start"
            accessibilityLabel="Bible translation"
          />
        )}
        <PickerButton
          label={book ? bibleBookName(book.abbrev) : "Book"}
          meta={corpusMeta}
          onPress={() => palette.open("bible")}
        />
      </View>
      <View style={styles.barRight}>
        {book && total > 0 ? (
          <>
            <Pressable
              style={({ hovered }) => [
                styles.pickerBtn,
                { flexGrow: 0, flexShrink: 0 },
                hovered && styles.pickerBtnHover,
              ]}
              onPress={() => palette.open("bible-chapter")}
              accessibilityRole="button"
              accessibilityLabel={`Change chapter: ${chapter} of ${total}`}
            >
              <Text
                numberOfLines={1}
                style={[styles.pickerText, { flexShrink: 0 }]}
              >
                {`Ch. ${chapter} / ${total}`}
              </Text>
            </Pressable>
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
          </>
        ) : null}
      </View>
    </View>
  );
}
