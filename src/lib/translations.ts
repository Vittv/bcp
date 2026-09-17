import type { Translation } from "./content/bible";

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
    description: "King James Version.",
  },
  {
    id: "web",
    label: "WEB",
    description: "World English Bible (British Edition).",
  },
];
