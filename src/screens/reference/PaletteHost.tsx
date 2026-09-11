import { SearchPalette } from "../../components/shell/SearchPalette";
import { useBible } from "../../context/BibleContext";
import { useNavigation } from "../../context/NavigationContext";
import { usePalette } from "../../context/PaletteContext";
import { getKjvBookMeta } from "../../lib/content/kjv";
import type { CollectSection } from "../../lib/content/types";
import type { PaletteEntry } from "../../lib/reference/search";
import { BibleBookList } from "../BibleReaderScreen";
import { CanticleIndex } from "./CanticlesScreen";
import { CollectIndex } from "./CollectsScreen";
import { GlobalIndex } from "./GlobalIndex";
import { ChapterIndex, useProvChapterMeta } from "./ProverbsScreen";
import { PsalmIndex } from "./PsalmsScreen";
import { SaintIndex } from "./SaintsScreen";
import { useReference } from "./shared";

// one modal, seven scopes: each page's own index renders inside the shared
// picker window, so the floating picker is the exact same list (with its
// same keyboard handling) the side pane always was. picking applies the
// selection through the page's own setter and closes the window.
export function PaletteHost() {
  const { scope, close } = usePalette();
  const ref = useReference();
  const { selectBook } = useBible();
  const { navigateTo } = useNavigation();
  const chapterMeta = useProvChapterMeta();

  // a global result jumps to its section page with the value applied,
  // exactly like the calendar's observance shortcut: set the reading
  // first, then switch pages so the pane opens on it
  const handleGlobalPick = (entry: PaletteEntry) => {
    const run = entry.run;
    switch (run.kind) {
      case "psalm":
        ref.setOpenPsalm(run.psalm);
        navigateTo("psalms");
        break;
      case "proverb":
        ref.setOpenProvChapter(run.chapter);
        navigateTo("proverbs");
        break;
      case "canticle":
        ref.setOpenCanticle(run.number);
        navigateTo("canticles");
        break;
      case "collect":
        ref.setSelectedCollect({
          // SAFETY: the global palette indexes collects only under the known
          // sections, so the run's section string is a valid CollectSection id
          section: run.section as CollectSection,
          title: run.title,
        });
        navigateTo("collects");
        break;
      case "saint":
        ref.setOpenSaint(run.slug);
        navigateTo("saints");
        break;
      case "bible": {
        const meta = getKjvBookMeta(run.book);
        if (meta) {
          navigateTo({
            page: meta.testament === "NT" ? "new-testament" : "old-testament",
            bookAbbrev: run.book,
            chapter: run.chapter,
          });
        }
        break;
      }
    }
  };

  if (!scope) return null;

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
          placeholder="Search saints by name or date"
          searchLabel="Search saints"
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
                handleGlobalPick(entry);
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
