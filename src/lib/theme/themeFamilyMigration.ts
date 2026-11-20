import { DEFAULT_THEME, THEMES, type ThemeId } from "./themes";

// the original wine-and-parchment family was stored as "canterbury", which now
// names the blue-and-gold family. carry those picks to Winchester once so an
// existing install does not change appearance on upgrade.
export const LEGACY_THEME_FAMILY = "canterbury";
export const RENAMED_THEME_FAMILY: ThemeId = "winchester";

export function resolveStoredThemeFamily(
  stored: string | null,
  migrated: boolean,
): { id: ThemeId; rewrite: boolean } {
  if (!migrated && stored === LEGACY_THEME_FAMILY) {
    return { id: RENAMED_THEME_FAMILY, rewrite: true };
  }
  if (stored && stored in THEMES) {
    // SAFETY: the `in` guard proves the stored string names a family.
    return { id: stored as ThemeId, rewrite: false };
  }
  return { id: DEFAULT_THEME, rewrite: false };
}
