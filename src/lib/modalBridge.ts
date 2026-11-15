import type { ChangelogSource } from "./changelogPrefs";
import type { SettingsSectionId } from "./settings";

// module bridges: surfaces below the shell's modal/palette state request the
// shell to open a modal or land on a settings section, keeping the coupling
// explicit in one place instead of scattered across domain modules

let openSettingsSectionHandler: ((section: SettingsSectionId) => void) | null =
  null;

export function requestOpenSettingsSection(section: SettingsSectionId): void {
  openSettingsSectionHandler?.(section);
}

export function registerOpenSettingsSection(
  handler: ((section: SettingsSectionId) => void) | null,
): void {
  openSettingsSectionHandler = handler;
}

let openChangelogHandler: ((source: ChangelogSource | null) => void) | null =
  null;

export function requestOpenChangelog(source: ChangelogSource | null): void {
  openChangelogHandler?.(source);
}

export function registerOpenChangelog(
  handler: ((source: ChangelogSource | null) => void) | null,
): void {
  openChangelogHandler = handler;
}

import type { PaletteScope } from "../context/PaletteContext";

let openPaletteHandler: ((scope: PaletteScope) => void) | null = null;

export function requestPalette(scope: PaletteScope): void {
  openPaletteHandler?.(scope);
}

export function registerOpenPalette(
  handler: ((scope: PaletteScope) => void) | null,
): void {
  openPaletteHandler = handler;
}
