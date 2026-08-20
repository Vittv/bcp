import { collectsSchema } from "./schemas";
import type { CollectPassage, CollectRite, CollectSection } from "./types";
import collectsData from "./vendor/bcp/collects.min.json";

const collects = collectsSchema.parse(collectsData);

const SECTIONS: CollectSection[] = [
  "church-year",
  "holy-days",
  "common-of-saints",
  "various-occasions",
];

function findCollect(
  rite: CollectRite,
  section: CollectSection,
  title: string,
): Collect | undefined {
  return collects[rite]?.[section]?.find((c) => c.title === title);
}

export function collectExists(
  rite: CollectRite,
  section: CollectSection,
  title: string,
): boolean {
  return findCollect(rite, section, title) !== undefined;
}

export function collectText(
  rite: CollectRite,
  section: CollectSection,
  title: string,
): string | undefined {
  return findCollect(rite, section, title)?.text;
}

// render the collect identified by rite, section, and title.
export function collectPassage(
  rite: CollectRite,
  section: CollectSection,
  title: string,
): CollectPassage | undefined {
  const collect = findCollect(rite, section, title);
  if (!collect) return undefined;
  return {
    rite,
    section,
    title: collect.title,
    text: collect.text,
    notes: collect.notes ?? null,
  };
}

// all collects of a rite and section, in printed order.
export function collectsBySection(
  rite: CollectRite,
  section: CollectSection,
): Collect[] {
  return collects[rite]?.[section] ?? [];
}

// the sections present for a rite, in printed order.
export function collectSections(rite: CollectRite): CollectSection[] {
  return SECTIONS.filter((s) => (collects[rite]?.[s]?.length ?? 0) > 0);
}
