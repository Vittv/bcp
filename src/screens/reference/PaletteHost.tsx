import { pageForBook } from "../../context/BibleContext";
import { useNavigation } from "../../context/NavigationContext";
import { usePalette } from "../../context/PaletteContext";
import type { CollectSection } from "../../lib/content/types";
import { requestOpenSettingsSection } from "../../lib/modalBridge";
import type { PaletteEntry } from "../../lib/reference/search";
import { PaletteScopeView } from "./PaletteHost.scope";
import { setPendingReferencePick } from "./shared/pending";

// one modal, one scope per picker: each page's own index renders inside the
// shared picker window, so the floating picker is the exact same list (with
// its same keyboard handling) the side pane always was. picking applies the
// selection through the page's own setter and closes the window.
export function PaletteHost() {
  const { scope } = usePalette();
  const { navigateTo } = useNavigation();

  // a global result jumps to its section page with the value applied,
  // exactly like the calendar's observance shortcut: set the reading
  // first, then switch pages so the pane opens on it
  const handleGlobalPick = (entry: PaletteEntry) => {
    const run = entry.run;
    switch (run.kind) {
      case "psalm":
        setPendingReferencePick({ psalm: run.psalm });
        navigateTo({ page: "psalms", psalm: run.psalm });
        break;
      case "psalterDay":
        setPendingReferencePick({ psalterDay: run.day });
        navigateTo({ page: "psalter", psalterDay: run.day });
        break;
      case "proverb":
        setPendingReferencePick({ proverb: run.chapter });
        navigateTo({ page: "proverbs", proverb: run.chapter });
        break;
      case "canticle":
        setPendingReferencePick({ canticle: run.number });
        navigateTo({ page: "canticles", canticle: run.number });
        break;
      case "collect": {
        const collect = {
          // SAFETY: the global palette indexes collects only under the known
          // sections, so the run's section string is a valid CollectSection id
          section: run.section as CollectSection,
          title: run.title,
        };
        setPendingReferencePick({ collect });
        navigateTo({ page: "collects", collect });
        break;
      }
      case "saint":
        setPendingReferencePick({ saint: run.slug });
        navigateTo({ page: "saints", saint: run.slug });
        break;
      case "lesserFeast":
        setPendingReferencePick({ lesserFeast: run.slug });
        navigateTo({ page: "lesser-feasts", lesserFeast: run.slug });
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
