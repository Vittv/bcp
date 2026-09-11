import {
  memo,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Pressable, Text, View } from "react-native";
import { ScriptureView } from "../../components/office/ScriptureView";
import { Chevron } from "../../components/shell/Chevron";
import { usePalette } from "../../context/PaletteContext";
import { loadKjvBook, sliceKjvPassage } from "../../lib/content/kjv";
import type { KjvBook, KjvPassage } from "../../lib/content/types";
import {
  DetailPage,
  EmptyMessage,
  IndexRow,
  noSelect,
  PickerButton,
  SplitPane,
  useReference,
} from "./shared";
import { sharedStyles as styles } from "./styles";
import { useIndexKeyboard } from "./useIndexKeyboard";

const PROVERS_CHAPTERS = 31;

// the whole book loads once and stays cached; every chapter's verse count
// and full text derive from that single in-memory object
function useProverbsBook(): KjvBook | null {
  const [book, setBook] = useState<KjvBook | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadKjvBook("Proverbs").then((b) => {
      if (!cancelled) setBook(b);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return book;
}

// the chapter index of the floating picker needs each chapter's verse
// count; the screen detail needs the full text, so the metadata hook is
// shared between them
export function useProvChapterMeta(): { chapter: number; verses: number }[] {
  const book = useProverbsBook();
  return useMemo(() => {
    const list: { chapter: number; verses: number }[] = [];
    for (let c = 1; c <= PROVERS_CHAPTERS; c++) {
      const verses = book?.verses[String(c)];
      const count = verses ? Object.keys(verses).length : 0;
      list.push({ chapter: c, verses: count });
    }
    return list;
  }, [book]);
}

export function ProverbsScreen({
  isMobile,
  fontScale,
  onScrollProgress,
}: {
  isMobile: boolean;
  fontScale: number;
  onScrollProgress?: (pct: number) => void;
}) {
  const { openProvChapter } = useReference();

  if (isMobile) {
    return (
      <View style={styles.container}>
        <DetailPage compact>
          <ProvChapterBody chapter={openProvChapter ?? 1} />
        </DetailPage>
      </View>
    );
  }
  return (
    <SplitPane
      fontScale={fontScale}
      onScrollProgress={onScrollProgress}
      detail={
        <ProvChapterBody
          chapter={openProvChapter ?? 1}
          key={`c${openProvChapter ?? 1}`}
        />
      }
      detailOpen
    />
  );
}

// the proverbs bar mirrors the psalms bar: the sidebar-show button and
// the current-pick chip that re-opens the floating picker, with prev/next
// arrows clamped to 1-31 across the book's linear sequence
export function ProverbsBar({ leading }: { leading?: ReactNode }) {
  const { openProvChapter, setOpenProvChapter } = useReference();
  const palette = usePalette();
  const chapters = useProvChapterMeta();
  const n = openProvChapter ?? 1;
  const verses = chapters.find((c) => c.chapter === n)?.verses ?? 0;
  const atStart = n <= 1;
  const atEnd = n >= PROVERS_CHAPTERS;
  return (
    <View style={[styles.bar, noSelect]}>
      <View style={styles.barLeft}>
        {leading}
        <PickerButton
          label={`Proverbs ${n}`}
          meta={`${n} / ${PROVERS_CHAPTERS} · ${verses} verse${
            verses === 1 ? "" : "s"
          }`}
          onPress={() => palette.open("proverbs")}
        />
      </View>
      <View style={styles.barRight}>
        <Pressable
          style={({ hovered }) => [
            styles.arrowBtn,
            hovered && styles.arrowBtnHover,
            atStart && { opacity: 0.4 },
          ]}
          onPress={() => setOpenProvChapter(n - 1)}
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
          onPress={() => setOpenProvChapter(n + 1)}
          disabled={atEnd}
          accessibilityLabel="Next chapter"
        >
          <Chevron direction="right" size={6} />
        </Pressable>
      </View>
    </View>
  );
}

// memoized chapter row: a cursor flip re-renders only the two rows whose
// active state changed, instead of rebuilding the whole list every move
const ChapterRow = memo(function ChapterRow({
  chapter,
  verses,
  active,
  selected,
  onSelect,
}: {
  chapter: number;
  verses: number;
  active: boolean;
  selected: number | null;
  onSelect: (n: number | null) => void;
}) {
  return (
    <IndexRow
      cursor={active}
      onPress={() => onSelect(selected === chapter ? null : chapter)}
    >
      {(a) => (
        <View style={styles.psalmRowInner}>
          <Text
            numberOfLines={1}
            style={[styles.incipit, a && styles.rowTextActive]}
          >
            Chapter {chapter}
          </Text>
          <Text style={[styles.rowMeta, a && styles.rowTextActive]}>
            {verses} verse{verses === 1 ? "" : "s"}
          </Text>
        </View>
      )}
    </IndexRow>
  );
});

export function ChapterIndex({
  chapters,
  query,
  selected,
  onSelect,
}: {
  chapters: { chapter: number; verses: number }[];
  query: string;
  selected: number | null;
  onSelect: (n: number | null) => void;
}) {
  const q = query.trim();
  const filtered = useMemo(() => {
    if (q === "") return chapters;
    const num = parseInt(q, 10);
    if (Number.isNaN(num)) return [];
    return chapters.filter((c) => String(c.chapter).startsWith(String(num)));
  }, [chapters, q]);

  const onEnter = useCallback(
    (_i: number, c: { chapter: number; verses: number }) =>
      onSelect(c.chapter === selected ? null : c.chapter),
    [selected, onSelect],
  );
  const { cursor } = useIndexKeyboard(filtered, onEnter);
  if (filtered.length === 0) {
    return <EmptyMessage message={`No proverbs chapter matches “${q}”.`} />;
  }
  return (
    <View style={styles.indexBody} dataSet={{ indexList: "" }}>
      {filtered.map((c, i) => (
        <ChapterRow
          key={c.chapter}
          chapter={c.chapter}
          verses={c.verses}
          active={i === cursor}
          selected={selected}
          onSelect={onSelect}
        />
      ))}
    </View>
  );
}

// renders the full text of one chapter of Proverbs in the detail pane
function ProvChapterBody({ chapter }: { chapter: number }) {
  const book = useProverbsBook();
  const passage = useMemo<KjvPassage | null>(() => {
    if (!book) return null;
    return sliceKjvPassage(book, chapter);
  }, [book, chapter]);

  if (!passage) return null;

  return (
    <>
      <Text style={styles.detailTitle}>Proverbs {chapter}</Text>
      <Text style={styles.detailSubtitle}>
        {passage.verses.length} verse
        {passage.verses.length === 1 ? "" : "s"}
      </Text>
      <ScriptureView passage={passage} />
    </>
  );
}
