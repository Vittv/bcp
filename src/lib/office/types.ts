import type { CalendarDate, DolSlot } from "../calendar/types";
import type {
  CanticlePassage,
  CollectPassage,
  OfficeId,
  OfficeSectionKey,
  OfficeSpeaker,
  PsalmPassage,
} from "../content/types";
import type { OfficeCustomization } from "./customization";

// how a reader prefers the office composed. rite selects Morning/Evening
// Prayer Rite One vs Two; collectRite the language of the Collect of the Day;
// personalMode strips speaker labels and the priestly absolution for solo prayer.
export type OfficeRite = "One" | "Two";

export type InvitatoryChoice = "venite" | "jubilate" | "pascha";

export type OfficePrefs = {
  rite: OfficeRite;
  collectRite: "traditional" | "contemporary";
  showRubrics: boolean;
  showAlternates: boolean;
  personalMode: boolean;
  // per-office inline choices; missing slots follow the printed defaults
  customization?: OfficeCustomization;
  // the reference page's Full text mode: every sentence, both invitatory
  // psalms and the office's printed canticle menu, as in the book
  fullText?: boolean;
};

export const DEFAULT_PREFS: OfficePrefs = {
  rite: "Two",
  collectRite: "contemporary",
  showRubrics: true,
  showAlternates: false,
  personalMode: true,
};

// the offices offered in the Today view, keyed by rite.
export const DAILY_OFFICES: Record<
  "morning" | "evening",
  { One: OfficeId; Two: OfficeId }
> = {
  morning: { One: "morning-rite-one", Two: "morning-rite-two" },
  evening: { One: "evening-rite-one", Two: "evening-rite-two" },
};

export type ComposedLesson = {
  number: 1 | 2 | 3;
  label: string;
  ref: string;
  optional?: boolean;
};

// one rendered unit of a composed office.
// the printed menus noonday and compline keep inside their single section
export type MenuKey = "psalm" | "reading" | "collect";

export type MenuChoiceOption = {
  id: string;
  /** the trigger's text when this option is selected */
  label: string;
  /** the popover row's text when it should differ from the trigger's */
  menuLabel?: string;
  /** rows sharing a group are preceded once by this heading */
  group?: string;
};

export type MenuChoices = {
  options: MenuChoiceOption[];
};

export type OfficeMenus = Partial<Record<MenuKey, MenuChoices>>;

export type ComposedNode =
  | { kind: "heading"; text: string; citation?: string }
  | { kind: "rubric"; text: string }
  /** a printed menu the reader picks from; options come from choices.menus */
  | { kind: "menu"; menu: MenuKey }
  | {
      kind: "text";
      text: string;
      speaker?: OfficeSpeaker;
      /** the printed citation a trailing line names, on the menu readings */
      citation?: string;
    }
  | {
      kind: "psalm";
      passage: PsalmPassage;
      citation: string;
      optional?: boolean;
      incipit?: string;
    }
  | { kind: "lessons"; lessons: ComposedLesson[] }
  | { kind: "reading"; lesson: ComposedLesson }
  | {
      kind: "canticle";
      // null when the reader chose None; the slot still renders so the
      // control stays reachable
      passage: CanticlePassage | null;
      slot: 1 | 2;
      suggested: boolean;
    }
  | {
      kind: "collect";
      passage: CollectPassage;
      // the feast the collect belongs to, for linking its title
      slug?: string;
    }
  | { kind: "fixed-collect"; text: string; title?: string };

export type ComposedSection = {
  key: OfficeSectionKey;
  heading: string | null;
  nodes: ComposedNode[];
};

// the choices the office offers today, so the inline controls can show the
// suggestion first without recomposing a second document.
export type OfficeChoices = {
  openingSuggested?: string;
  openingGroups: { season: string; texts: string[] }[];
  invitatorySuggested: InvitatoryChoice;
  canticleSuggested: [number | null, number | null];
  suffragesSuggested: "a" | "b";
  menus?: OfficeMenus;
};

// the full office for a date, ready to render.
export type OfficeDocument = {
  office: OfficeId;
  officeName: string;
  rite: "One" | "Two" | null;
  date: CalendarDate;
  slot: DolSlot;
  entryTitle: string | null;
  choices: OfficeChoices;
  sections: ComposedSection[];
};
