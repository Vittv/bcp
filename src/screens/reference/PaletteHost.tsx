import { pageForBook } from "../../context/BibleContext";
import { useNavigation } from "../../context/NavigationContext";
import { usePalette } from "../../context/PaletteContext";
import type { CollectSection } from "../../lib/content/types";
import { requestOpenSettingsSection } from "../../lib/modalBridge";
import type { PaletteEntry } from "../../lib/reference/search";
import { PaletteScopeView } from "./PaletteHost.scope";
import { useReference } from "./shared";

// one modal, one scope per picker: each page's own index renders inside the
// shared picker window, so the floating picker is the exact same list (with
// its same keyboard handling) the side pane always was. picking applies the
// selection through the page's own setter and closes the window.
export function PaletteHost() {
  const { scope } = usePalette();
  const ref = useReference();
  const { navigateTo } = useNavigation();

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
      case "psalterDay":
        ref.setOpenPsalterDay(run.day);
        navigateTo("psalter");
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
      case "lesserFeast":
        ref.setOpenLesserFeast(run.slug);
        navigateTo("lesser-feasts");
        break;
      case "bible": {
        // the book names its own page, so a deuterocanonical result opens
        // the Apocrypha reader rather than the Old Testament one
        const page = pageForBook(run.book);
        if (page) {
          navigateTo({
            page,
            bookAbbrev: run.book,
            chapter: run.chapter,
          });
        }
        break;
      }
      case "settings":
        requestOpenSettingsSection(run.section);
        break;
    }
  };

  if (!scope) return null;

  return <PaletteScopeView scope={scope} onGlobalPick={handleGlobalPick} />;
}
