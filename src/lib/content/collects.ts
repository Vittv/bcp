import { collectsSchema } from "./schemas";
import type {
  Collect,
  CollectPassage,
  CollectRite,
  CollectSection,
} from "./types";
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

// the same collect in the other rite; occasions pair 1:1 by title
// across rites, so a missing counterpart means a bogus reference.
export function counterpartCollect(
  rite: CollectRite,
  section: CollectSection,
  title: string,
): CollectPassage | null {
  const other: CollectRite =
    rite === "traditional" ? "contemporary" : "traditional";
  return collectPassage(other, section, title) ?? null;
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

// one entry per collect, in traditional printed order. both rites carry
// identical titles in identical section order, so the traditional
// sequence stands for the pair; readers see both variants together
export function allCollects(): {
  section: CollectSection;
  title: string;
}[] {
  const out: { section: CollectSection; title: string }[] = [];
  for (const section of SECTIONS) {
    for (const c of collectsBySection("traditional", section)) {
      out.push({ section, title: c.title });
    }
  }
  return out;
}
