import { SearchPalette } from "../../components/shell/SearchPalette";
import { bibleBookName, useBible } from "../../context/BibleContext";
import { type PaletteScope, usePalette } from "../../context/PaletteContext";
import { getMark } from "../../lib/content/bibleProgress";
import type { PaletteEntry } from "../../lib/reference/search";
import { BibleBookList, BibleChapterList } from "../BibleReaderScreen";
import { CanticleIndex } from "./CanticlesScreen";
import { CollectIndex } from "./CollectsScreen";
import { GlobalIndex } from "./GlobalIndex";
import { LesserFeastIndex } from "./LesserFeastsScreen";
import { ChapterIndex, useProvChapterMeta } from "./ProverbsScreen";
import { PsalmIndex } from "./PsalmsScreen";
import { PsalterIndex } from "./PsalterScreen";
import { SaintIndex } from "./SaintsScreen";
import { useReference } from "./shared";

export function PaletteScopeView({
  scope,
  onGlobalPick,
}: {
  scope: PaletteScope;
  onGlobalPick: (entry: PaletteEntry) => void;
}) {
  const { close } = usePalette();
  const ref = useReference();
  const { book, chapter, selectBook, selectChapter } = useBible();
  const chapterMeta = useProvChapterMeta();

  switch (scope) {
    case "psalms":
      return (
        <SearchPalette
          placeholder="Search by number or text"
          searchLabel="Search psalms"
          onClose={close}
          render={(query) => (
            <PsalmIndex
              query={query}
              onSelect={(n) => {
                ref.setOpenPsalm(n);
                close();
              }}
            />
          )}
        />
      );
    case "psalter":
      return (
        <SearchPalette
          placeholder="Search by day or psalm number"
          searchLabel="Search psalter days"
          onClose={close}
          render={(query) => (
            <PsalterIndex
              query={query}
              selected={ref.openPsalterDay}
              onSelect={(n) => {
                if (n !== null) ref.setOpenPsalterDay(n);
                close();
              }}
            />
          )}
        />
      );
    case "canticles":
      return (
        <SearchPalette
          placeholder="Search by number or title"
          searchLabel="Search canticles"
          onClose={close}
          render={(query) => (
            <CanticleIndex
              query={query}
              selected={ref.openCanticle}
              onSelect={(n) => {
                if (n !== null) ref.setOpenCanticle(n);
                close();
              }}
            />
          )}
        />
      );
    case "collects":
      return (
        <SearchPalette
          placeholder="Search by title or text"
          searchLabel="Search collects"
          onClose={close}
          render={(query) => (
            <CollectIndex
              query={query}
              selected={ref.selectedCollect}
              onSelect={(c) => {
                if (c) ref.setSelectedCollect(c);
                close();
              }}
            />
          )}
        />
      );
    case "saints":
      return (
        <SearchPalette
          placeholder="Search holy days by name or date"
          searchLabel="Search holy days"
          onClose={close}
          render={(query) => (
            <SaintIndex
              query={query}
              selected={ref.openSaint}
              onSelect={(slug) => {
                if (slug) ref.setOpenSaint(slug);
                close();
              }}
            />
          )}
        />
      );
    case "lesser-feasts":
      return (
        <SearchPalette
          placeholder="Search lesser feasts by name or date"
          searchLabel="Search lesser feasts"
          onClose={close}
          render={(query) => (
            <LesserFeastIndex
              query={query}
              selected={ref.openLesserFeast}
              onSelect={(slug) => {
                if (slug) ref.setOpenLesserFeast(slug);
                close();
              }}
            />
          )}
        />
      );
    case "proverbs":
      return (
        <SearchPalette
          placeholder="Search chapters by number"
          searchLabel="Search proverbs chapters"
          onClose={close}
          render={(query) => (
            <ChapterIndex
              chapters={chapterMeta}
              query={query}
              selected={ref.openProvChapter}
              onSelect={(n) => {
                if (n !== null) ref.setOpenProvChapter(n);
                close();
              }}
            />
          )}
        />
      );
    case "bible":
      return (
        <SearchPalette
          placeholder="Search by book name or abbreviation"
          searchLabel="Search bible books"
          onClose={close}
          render={(query) => (
            <BibleBookList
              query={query}
              onSelect={(abbrev) => {
                selectBook(abbrev);
                close();
              }}
            />
          )}
        />
      );
    case "bible-chapter":
      return book ? (
        <SearchPalette
          placeholder={`Search ${bibleBookName(book.abbrev)} chapters by number`}
          searchLabel={`Search ${bibleBookName(book.abbrev)} chapters`}
          onClose={close}
          render={(query) => (
            <BibleChapterList
              chapters={Array.from({ length: book.chapters }, (_, i) => i + 1)}
              chapterTitles={book.chapterTitles}
              query={query}
              selected={chapter}
              // clamped: a mark from an older content build can exceed a shorter book
              continueAt={Math.min(getMark(book.abbrev), book.chapters)}
              onSelect={(n) => {
                selectChapter(n);
                close();
              }}
            />
          )}
        />
      ) : null;
    case "search":
      return (
        <SearchPalette
          placeholder="Search the whole prayer book"
          searchLabel="Search everything"
          onClose={close}
          autoHeight
          render={(query) => (
            <GlobalIndex
              query={query}
              onSelect={(entry) => {
                onGlobalPick(entry);
                close();
              }}
            />
          )}
        />
      );
    default:
      return null;
  }
}
