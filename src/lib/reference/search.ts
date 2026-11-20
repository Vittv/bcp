export {
  searchCollects,
  searchLesserFeasts,
  searchPsalms,
  searchPsalterDays,
  searchSaints,
} from "./search/individual";

// the collect index paints rows grouped by section, and the shared keyboard
// and pointer cursor maps a DOM row onto the hit array by position. keep that
// array in painted order so the highlight lands on the row under the mouse.
export function groupCollectHits<T extends { section: string }>(
  hits: T[],
): T[] {
  const groups = [...new Set(hits.map((h) => h.section))];
  return groups.flatMap((section) => hits.filter((h) => h.section === section));
}
export { searchPalette } from "./search/palette";
export type {
  CollectHit,
  LesserFeastHit,
  PaletteEntry,
  PaletteRun,
  PaletteSection,
  PsalmHit,
  SaintHit,
} from "./search/types";
export { PALETTE_SECTION_ORDER } from "./search/types";
