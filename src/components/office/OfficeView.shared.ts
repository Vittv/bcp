import type { ApocryphaCorpus, Translation } from "../../lib/content/bible";
import { canticleTitle } from "../../lib/content/canticles";
import type { OfficeSpeaker } from "../../lib/content/types";
import type { ComposedNode, LessonSlot, MenuKey } from "../../lib/office/types";
import type { ControlOption } from "./OfficeControls";

export const SPEAKER_LABEL: Record<OfficeSpeaker, string> = {
  officiant: "Officiant",
  people: "People",
  all: "All",
};

export type ScriptureConfig = {
  translation: Translation;
  apocrypha: ApocryphaCorpus;
};

export function scriptureForRite(rite: "One" | "Two" | null): ScriptureConfig {
  // rite I keeps the traditional language; other offices/readings follow
  // the contemporary rite II text
  if (rite === "One") return { translation: "kjv", apocrypha: "kjva" };
  return { translation: "web", apocrypha: "web" };
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export function canticleOptions(
  suggestedNumber: number | null,
  rite: "One" | "Two" | null,
): ControlOption[] {
  const options: ControlOption[] = [];
  const suggestedTitle = suggestedNumber
    ? `${suggestedNumber}. ${canticleTitle(suggestedNumber) ?? ""}`
    : "None";
  options.push({
    id: "suggested",
    label: suggestedTitle,
    menuLabel: suggestedTitle,
    group: "Suggested",
  });
  const all = Array.from({ length: 21 }, (_, i) => i + 1);
  // the rite's own set first, then the other set, so the common choices are
  // at the top without hiding the rest
  const traditional = all.filter((n) => n <= 7);
  const contemporary = all.filter((n) => n > 7);
  const first = rite === "One" ? traditional : contemporary;
  const second = rite === "One" ? contemporary : traditional;
  for (const number of first) {
    options.push({
      id: String(number),
      label: `${number}. ${canticleTitle(number) ?? ""}`,
      group: rite === "One" ? "Rite I" : "Rite II",
    });
  }
  for (const number of second) {
    options.push({
      id: String(number),
      label: `${number}. ${canticleTitle(number) ?? ""}`,
      group: rite === "One" ? "Rite II" : "Rite I",
    });
  }
  options.push({ id: "none", label: "None", group: "Other" });
  return options;
}

export const INVITATORY_LABEL: Record<
  "venite" | "jubilate" | "pascha",
  string
> = {
  venite: "Venite (Psalm 95)",
  jubilate: "Jubilate (Psalm 100)",
  pascha: "Pascha nostrum",
};

// short position names for the Readings picker; the corpus descriptors
// appear on shared year-table days, where the book assigns the positions
export const READING_NAME: Record<LessonSlot["key"], string> = {
  first: "First",
  second: "Second",
  third: "Third",
  gospel: "Gospel",
};

// digits to positions to composition and the picker alike; third and
// gospel share position 3 and never carry refs on the same day
export const READING_NO: Record<LessonSlot["key"], 1 | 2 | 3> = {
  first: 1,
  second: 2,
  third: 3,
  gospel: 3,
};

export function slotName(slot: LessonSlot): string {
  // the corpus reads as the name where the book assigns it (OT, NT,
  // Gospel); split-set days fall back to the position
  return slot.desc ?? READING_NAME[slot.key];
}

// the inline control belonging to one printed menu node; noonday and compline
// have no heading rows, so the picker takes the full column
export const MENU_META: Record<
  MenuKey,
  {
    key: "psalmMenu" | "readingMenu" | "collectMenu";
    label: string;
    a11y: string;
  }
> = {
  psalm: { key: "psalmMenu", label: "Psalm", a11y: "Psalm" },
  reading: { key: "readingMenu", label: "Reading", a11y: "Reading" },
  collect: { key: "collectMenu", label: "Collect", a11y: "Collect" },
};

export function nodeKey(node: ComposedNode): string {
  switch (node.kind) {
    case "heading":
      return `h:${node.text}`;
    case "rubric":
      return `r:${node.text}`;
    case "menu":
      return `m:${node.menu}`;
    case "text":
      return `t:${node.citation ?? ""}:${node.speaker ?? ""}:${node.text}`;
    case "psalm":
      return `p:${node.citation}`;
    case "lessons":
      return `l:${node.lessons.map((l) => l.ref).join("|")}`;
    case "reading":
      return `rd:${node.lesson.label}:${node.lesson.ref}`;
    case "canticle":
      return `cn:${node.slot}:${node.passage?.number ?? "none"}`;
    case "collect":
      return `c:${node.passage.text}`;
    case "fixed-collect":
      return `fc:${node.title ?? ""}:${node.text}`;
  }
}

export function sectionKeys(nodes: readonly ComposedNode[]) {
  const seen = new Map<string, number>();
  return nodes.map((node) => {
    const base = nodeKey(node);
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return `${base}#${count}`;
  });
}
