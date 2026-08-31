import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { ScriptureView } from "../../components/office/ScriptureView";
import { Chevron } from "../../components/shell/Chevron";
import { loadKjvBook, sliceKjvPassage } from "../../lib/content/kjv";
import type { KjvBook, KjvPassage } from "../../lib/content/types";
import {
  DetailPage,
  EmptyMessage,
  noSelect,
  SplitPane,
  useReference,
} from "./shared";
import { sharedStyles as styles } from "./styles";

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

export function ProverbsScreen({
  isMobile,
  fontScale,
  onScrollProgress,
}: {
  isMobile: boolean;
  fontScale: number;
  onScrollProgress?: (pct: number) => void;
}) {
  const { query, setQuery, openProvChapter, setOpenProvChapter } =
    useReference();
  const book = useProverbsBook();

  const chapterMeta = useMemo(() => {
    const list: { chapter: number; verses: number }[] = [];
    for (let c = 1; c <= PROVERS_CHAPTERS; c++) {
      const verses = book?.verses[String(c)];
      const count = verses ? Object.keys(verses).length : 0;
      list.push({ chapter: c, verses: count });
    }
    return list;
  }, [book]);

  if (isMobile) {
    return (
      <View style={styles.container}>
        {openProvChapter !== null ? (
          <DetailPage compact>
            <ProvChapterBody chapter={openProvChapter} />
          </DetailPage>
        ) : (
          <ChapterIndex
            chapters={chapterMeta}
            query={query}
            selected={null}
            onSelect={setOpenProvChapter}
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
          placeholder="Search chapters by number"
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
          accessibilityLabel="Search proverbs chapters"
        />
      }
      list={
        <ChapterIndex
          chapters={chapterMeta}
          query={query}
          selected={openProvChapter}
          onSelect={(n) => setOpenProvChapter(openProvChapter === n ? null : n)}
        />
      }
      detail={
        <ProvChapterBody
          chapter={openProvChapter ?? 1}
          key={`c${openProvChapter ?? 1}`}
        />
      }
      detailOpen={openProvChapter !== null}
    />
  );
}

// the proverbs bar mirrors the psalms bar: on mobile it carries search
// (or a back button when a chapter is open). desktop search lives in the
// right navigator header instead.
export function ProverbsBar({
  leading,
  isMobile,
}: {
  leading?: ReactNode;
  isMobile: boolean;
}) {
  const { query, setQuery, openProvChapter, setOpenProvChapter } =
    useReference();
  const inputRef = useRef<TextInput>(null);
  const searching = isMobile ? openProvChapter === null : false;

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
            onPress={() => setOpenProvChapter(null)}
            accessibilityLabel="Back to chapters"
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
          placeholder="Search chapters by number"
          placeholderTextColor="var(--text-secondary, #7a6e64)"
          style={styles.search}
          accessibilityLabel="Search proverbs chapters"
        />
      ) : null}
    </Pressable>
  );
}

function ChapterIndex({
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

  if (filtered.length === 0) {
    return <EmptyMessage message={`No proverbs chapter matches “${q}”.`} />;
  }
  return (
    <View style={styles.indexBody}>
      {filtered.map((c) => {
        const isSelected = c.chapter === selected;
        return (
          <Pressable
            key={c.chapter}
            style={({ hovered }) => [styles.row, hovered && styles.rowHover]}
            onPress={() => onSelect(isSelected ? null : c.chapter)}
          >
            <View style={styles.psalmRowInner}>
              <Text
                style={[styles.psalmNumber, isSelected && styles.rowTextActive]}
              >
                {c.chapter}
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.incipit, isSelected && styles.rowTextActive]}
              >
                Chapter {c.chapter}
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
