import type { ApocryphaCorpus, Translation } from "./content/bible";

export type TranslationOption = {
  id: Translation;
  label: string;
  description: string;
};

// every translation the app can read, in picker order. the id is the value
// persisted by TranslationContext; the description is shown in Settings.
export const TRANSLATION_OPTIONS: readonly TranslationOption[] = [
  {
    id: "kjv",
    label: "KJV",
    description: "King James Version. The Old and New Testament.",
  },
  {
    id: "web",
    label: "WEB",
    description:
      "World English Bible (British Edition). The Old and New Testament.",
  },
];

export type ApocryphaOption = {
  id: ApocryphaCorpus;
  label: string;
  description: string;
};

// the deuterocanonical corpora, in picker order. this is a separate setting
// from the canonical translation, because it governs a different book list:
// each corpus is a list of books and the text they are read in
export const APOCRYPHA_OPTIONS: readonly ApocryphaOption[] = [
  {
    id: "kjva",
    label: "KJVA",
    description:
      "King James Version, 1611, with its Apocrypha. Fourteen books, each read in the 1611's own text.",
  },
  {
    id: "web",
    label: "WEB",
    description:
      "World English Bible (British Edition). Fifteen books, each read in the WEB's own text.",
  },
];
