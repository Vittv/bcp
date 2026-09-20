// the settings modal's section catalog, shared with the global cmd+K
// palette so one filter covers both surfaces. sections carry keywords that
// name the options they contain, matching the rail search's behavior.
import { IS_STANDALONE, IS_TAURI } from "./desktop";

export type SettingsSectionId =
  | "appearance"
  | "office"
  | "bible"
  | "desktop"
  | "typography"
  | "install"
  | "about"
  | "help";

export type SettingsSection = {
  id: SettingsSectionId;
  title: string;
  // shorter label for the rail and chips when the full title is a page name;
  // section titles that are also their page title keep one name
  railTitle?: string;
  description: string;
  // extra terms the searches match against: option labels and aliases that
  // belong to the section but aren't in its title
  keywords: string[];
};

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: "appearance",
    title: "Appearance",
    description: "Theme mode for the whole app.",
    keywords: ["theme", "light", "dark", "system"],
  },
  {
    id: "typography",
    title: "Typography",
    description: "Fonts and text size for the whole app.",
    keywords: ["font", "size", "inter", "text"],
  },
  {
    id: "office",
    title: "Office",
    description:
      "How the daily office reads: rubrics, speakers, and the devotions mode.",
    keywords: ["rubrics", "speakers", "devotions", "mode"],
  },
  {
    id: "bible",
    title: "Bible",
    description: "Which Bible translation the daily readings use.",
    keywords: ["translation", "kjv", "web", "readings"],
  },
  {
    id: "desktop",
    title: "Desktop",
    description: "Window chrome and app updates in the desktop app.",
    keywords: ["window", "updates", "controls", "chrome"],
  },
  {
    id: "install",
    title: "Install",
    description: "Install the app on desktop, web, or mobile.",
    keywords: ["desktop", "web", "mobile", "pwa", "app"],
  },
  {
    id: "about",
    title: "About",
    description: "What the app is, its license, and where the code lives.",
    keywords: ["license", "code", "github", "version"],
  },
  {
    id: "help",
    title: "Help & Shortcuts",
    railTitle: "Help",
    description: "Keyboard shortcuts for reading without the mouse.",
    keywords: ["shortcuts", "keyboard", "keys", "esc"],
  },
];

// the desktop category only holds tauri-shell settings (window controls,
// the updater), which don't exist in a browser tab; install only matters
// when the web app is not installed yet, mirroring the sidebar's button
export function visibleSettings(): SettingsSection[] {
  return SETTINGS_SECTIONS.filter(
    (s) =>
      (s.id !== "desktop" || IS_TAURI) &&
      (s.id !== "install" || (!IS_TAURI && !IS_STANDALONE)),
  );
}

// module-level bridge mirroring PaletteContext's requestPalette: the global
// palette opens a section by telling the shell which one to land on, since
// the modal lives above the palette's provider tree
let openSectionHandler: ((section: SettingsSectionId) => void) | null = null;
export function requestOpenSettingsSection(section: SettingsSectionId): void {
  openSectionHandler?.(section);
}
export function registerOpenSettingsSection(
  handler: ((section: SettingsSectionId) => void) | null,
): void {
  openSectionHandler = handler;
}
