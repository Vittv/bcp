import type { CalendarDate, DolSlot } from "../calendar/types";
import type {
  CollectPassage,
  OfficeId,
  OfficeSectionKey,
  OfficeSpeaker,
  PsalmPassage,
} from "../content/types";

// how a reader prefers the office composed. rite selects Morning/Evening
// Prayer Rite One vs Two; collectRite the language of the Collect of the Day;
// personalMode strips speaker labels and the priestly absolution for solo prayer.
export type OfficePrefs = {
  rite: "One" | "Two";
  collectRite: "traditional" | "contemporary";
  showRubrics: boolean;
  showAlternates: boolean;
  personalMode: boolean;
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
export type ComposedNode =
  | { kind: "heading"; text: string; citation?: string }
  | { kind: "rubric"; text: string }
  | { kind: "text"; text: string; speaker?: OfficeSpeaker }
  | {
      kind: "psalm";
      passage: PsalmPassage;
      citation: string;
      optional?: boolean;
      incipit?: string;
    }
  | { kind: "lessons"; lessons: ComposedLesson[] }
  | { kind: "collect"; passage: CollectPassage }
  | { kind: "fixed-collect"; text: string; title?: string };

export type ComposedSection = {
  key: OfficeSectionKey;
  heading: string | null;
  nodes: ComposedNode[];
};

// the full office for a date, ready to render.
export type OfficeDocument = {
  office: OfficeId;
  officeName: string;
  rite: "One" | "Two" | null;
  date: CalendarDate;
  slot: DolSlot;
  entryTitle: string | null;
  sections: ComposedSection[];
};
