import type { ApocryphaCorpus } from "../../content/bible";
import type { CollectSection, PsalterDay } from "../../content/types";
import type { SettingsSectionId } from "../../settings";

export type PsalmHit = {
  psalm: number;
  incipit: string;
  verses: number;
  // null when the psalm matched by number alone
  snippet: string | null;
};

export type CollectHit = {
  section: CollectSection;
  title: string;
  snippet: string | null;
};

export type SaintHit = {
  slug: string;
  title: string;
  month: number;
  day: number;
  eveOf?: string;
  snippet: string | null;
};

export type LesserFeastHit = {
  slug: string;
  name: string;
  month: number;
  day: number;
  trial?: boolean;
  snippet: string | null;
};

// global palette: every section's index folds into one searchable record
// set so the Ctrl+K palette can jump straight to any reading. each entry
// carries the run that reopens that reading on its own page, so the
// picker only needs switch + navigate once a result is chosen.
export type PaletteSection =
  | "psalms"
  | "psalter"
  | "proverbs"
  | "canticles"
  | "collects"
  | "saints"
  | "lesser-feasts"
  | "bible"
  | "apocrypha"
  | "settings";

export type PaletteRun =
  | { kind: "psalm"; psalm: number }
  | { kind: "psalterDay"; day: number }
  | { kind: "proverb"; chapter: number }
  | { kind: "canticle"; number: number }
  | { kind: "collect"; section: string; title: string }
  | { kind: "saint"; slug: string }
  | { kind: "lesserFeast"; slug: string }
  | { kind: "bible"; book: string; chapter: number }
  | { kind: "settings"; section: SettingsSectionId };

export type PaletteEntry = {
  id: string;
  section: PaletteSection;
  label: string;
  detail?: string;
  run: PaletteRun;
};

// the canonical section order of the global palette's headings. apocrypha
// follows bible: same reader, but a separate corpus with its own book list
// and its own text, so a result's provenance stays obvious in the heading
// alone
export const PALETTE_SECTION_ORDER: PaletteSection[] = [
  "psalms",
  "psalter",
  "proverbs",
  "canticles",
  "collects",
  "saints",
  "lesser-feasts",
  "bible",
  "apocrypha",
  "settings",
];

// per-section and total caps keep a long query (e.g. a psalm text) from
// flooding the merged result list
export const PER_SECTION_CAP = 8;
export const TOTAL_CAP = 40;

export type { ApocryphaCorpus, PsalterDay };
