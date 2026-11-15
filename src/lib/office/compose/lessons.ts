import { weekday } from "../../calendar";
import { canticlePassage } from "../../content";
import { entryForAlternateYear } from "../../content/lectionary";
import type { DolEntry, OfficeSection } from "../../content/types";
import { suggestedCanticles } from "../suggestedCanticles";
import type {
  ComposedLesson,
  ComposedNode,
  LessonSlot,
  OfficeChoices,
} from "../types";
import {
  type ComposeContext,
  convert,
  isEveningOffice,
  isMorningOffice,
} from "./shared";

export function readingsApply(choices: OfficeChoices, stored: string): boolean {
  if (!choices.lessonSlots) return false;
  const present = new Set<number>(
    choices.lessonSlots.map((slot) => READING_NUMBERS[slot.key]),
  );
  return [...stored].some((digit) => present.has(Number(digit)));
}

export function lessonSlotsOf(ctx: ComposeContext): LessonSlot[] {
  const group = ctx.lessonGroup;
  const shared = sharedLessonSet(ctx.entry);
  const slots: LessonSlot[] = [];
  for (const { key, label, desc } of SHORT_READING_SLOTS) {
    if (!group || typeof group[key] !== "string") continue;
    slots.push(desc && shared ? { key, label, desc } : { key, label });
  }
  return slots;
}

export const SHORT_READING_SLOTS: LessonSlot[] = [
  { key: "first", label: "First Lesson", desc: "OT" },
  { key: "second", label: "Second Lesson", desc: "NT" },
  { key: "third", label: "Third Lesson", desc: undefined },
  { key: "gospel", label: "Gospel", desc: undefined },
];

export function composeLessons(
  section: OfficeSection,
  ctx: ComposeContext,
): ComposedNode[] {
  if (ctx.prefs.fullText) return composeLessonsFull(section, ctx);
  const all = lessonList(ctx);
  // a lesson's optional alternate belongs to the same reading slot, so it
  // does not add a canticle.
  const groups = ([1, 2, 3] as const)
    .map((number) => all.filter((lesson) => lesson.number === number))
    .filter((group) => group.length > 0);
  const maxCanticles = Math.min(2, groups.length);

  const nodes: ComposedNode[] = [];
  let nextGroup = 0;
  let canticleIndex = 0;
  let inCanticleMenu = false;
  for (const item of section.items) {
    if (item.kind === "heading") {
      // the first heading opens the printed canticle menu; from here the
      // section's own headings and text are replaced by composed nodes.
      inCanticleMenu = true;
      canticleIndex += 1;
      if (canticleIndex <= maxCanticles) {
        const slot = canticleIndex === 1 ? 1 : 2;
        const number = canticleNumberForSlot(ctx, slot, groups.length);
        const passage =
          number === null ? null : (canticlePassage(number) ?? null);
        // the slot always emits a node so its control stays reachable even
        // when the reader chose None
        nodes.push({
          kind: "canticle",
          passage,
          slot,
          suggested: canticleIsSuggested(ctx, slot),
        });
      }
      if (nextGroup < groups.length) {
        for (const lesson of groups[nextGroup]) {
          nodes.push({ kind: "reading", lesson });
        }
        nextGroup += 1;
      }
      continue;
    }
    if (inCanticleMenu) continue;
    if (item.kind === "season") continue;
    if (item.kind === "text" && item.text.includes("A Reading (Lesson) from")) {
      if (groups.length > 0) {
        for (const lesson of groups[0]) {
          nodes.push({ kind: "reading", lesson });
        }
        nextGroup = 1;
      }
      continue;
    }
    const node = convert(item, ctx.prefs);
    if (node) nodes.push(node);
  }
  return nodes;
}

// full text reference mode: the office as printed, with all lessons at the
// reading placeholder and the whole canticle menu after them.
export function composeLessonsFull(
  section: OfficeSection,
  ctx: ComposeContext,
): ComposedNode[] {
  const lessons = lessonList(ctx);
  const nodes: ComposedNode[] = [];
  let region: "reading" | "canticles" = "reading";
  for (const item of section.items) {
    if (
      item.kind === "text" &&
      item.text.includes("A Reading (Lesson) from") &&
      lessons.length > 0
    ) {
      nodes.push({ kind: "lessons", lessons });
      continue;
    }
    if (item.kind === "heading") {
      region = "canticles";
      const node = convert(item, ctx.prefs);
      if (node) nodes.push(node);
      continue;
    }
    if (region === "reading" && item.kind === "season") continue;
    const node = convert(item, ctx.prefs);
    if (node) nodes.push(node);
  }
  return nodes;
}

// the canticle for a reading slot: the reader's explicit choice (a number or
// null for "None"), otherwise the p. 144 suggested canticle for the day.
export function canticleNumberForSlot(
  ctx: ComposeContext,
  slot: 1 | 2,
  readingCount: number,
): number | null {
  const key = slot === 1 ? "canticle1" : "canticle2";
  const override = ctx.prefs.customization?.[key];
  if (override !== undefined) return override;
  return suggestedCanticleForSlot(ctx, slot, readingCount);
}

export function suggestedCanticleForSlot(
  ctx: ComposeContext,
  slot: 1 | 2,
  readingCount: number,
): number | null {
  const [first, second] = suggestedCanticles({
    office: isMorningOffice(ctx.officeId) ? "morning" : "evening",
    rite: ctx.rite,
    weekday: weekday(ctx.date),
    season: ctx.season,
    isFeast: ctx.holyDay !== undefined,
  });
  // if only one reading is used at Evening Prayer, the table's footnote
  // directs the Magnificat instead of the weekday's first canticle.
  if (slot === 1 && readingCount === 1 && isEveningOffice(ctx.officeId)) {
    return ctx.rite === "One" ? 3 : 15;
  }
  return slot === 1 ? first : second;
}

export function canticleIsSuggested(ctx: ComposeContext, slot: 1 | 2): boolean {
  const key = slot === 1 ? "canticle1" : "canticle2";
  return ctx.prefs.customization?.[key] === undefined;
}

// the reading positions an office keeps, resolved from the reader's stored
// choice, plus whether Evening's First Reading belongs to the alternate
// year (p. 934, two Readings at both offices). a missing key keeps the
// whole day, and a stored set with nothing in common with the day degrades
// to keeping the whole day, the way stale choices fall back to the printed
// default.
export type ReadingsSpec = {
  keep: Set<LessonSlot["key"]>;
  swapFirst: boolean;
};

export const READING_KEYS: LessonSlot["key"][] = [
  "first",
  "second",
  "third",
  "gospel",
];

export const READING_NUMBERS: Record<LessonSlot["key"], 1 | 2 | 3> = {
  first: 1,
  second: 2,
  third: 3,
  gospel: 3,
};

// whether the day's entry is one shared set for both offices (the year
// tables) rather than a morning/evening split (holy days, special
// occasions, appointed eves, Palm Sunday's own day)
export function sharedLessonSet(entry: DolEntry | undefined): boolean {
  return (
    entry !== undefined &&
    entry.lessons.morning === undefined &&
    entry.lessons.evening === undefined
  );
}

export function resolveReadings(ctx: ComposeContext): ReadingsSpec {
  const group = ctx.lessonGroup;
  if (!group) return { keep: new Set(), swapFirst: false };
  const present = READING_KEYS.filter((key) => typeof group[key] === "string");
  const keepAll = new Set(present);
  const stored = ctx.prefs.customization?.readings;
  if (stored === undefined) return { keep: keepAll, swapFirst: false };
  const wanted = new Set<number>([...stored].map(Number));
  const keep = new Set(
    present.filter((key) => wanted.has(READING_NUMBERS[key])),
  );
  const swapFirst =
    keep.size > 0 &&
    stored === "12" &&
    isEveningOffice(ctx.officeId) &&
    sharedLessonSet(ctx.entry);
  if (keep.size === 0) return { keep: keepAll, swapFirst: false };
  return { keep, swapFirst };
}

export function lessonList(ctx: ComposeContext): ComposedLesson[] {
  const group = ctx.lessonGroup;
  if (!group) return [];
  const lessons: ComposedLesson[] = [];
  const fields: Array<{
    key: "first" | "second" | "third" | "gospel";
    label: string;
    number: 1 | 2 | 3;
    alt: "altFirst" | "altSecond" | "altGospel" | null;
  }> = [
    { key: "first", alt: "altFirst", label: "First Lesson", number: 1 },
    { key: "second", alt: "altSecond", label: "Second Lesson", number: 2 },
    { key: "third", alt: null, label: "Third Lesson", number: 3 },
    { key: "gospel", alt: "altGospel", label: "Gospel", number: 3 },
  ];
  // full text prints the book as it is, so the reader's readings choice
  // never filters or swaps there
  const spec = ctx.prefs.fullText ? undefined : resolveReadings(ctx);
  // p. 934: two Readings at both offices put the alternate year's Old
  // Testament First Reading at Evening Prayer
  let alternateFirst: { first?: string; altFirst?: string } | undefined;
  if (spec?.swapFirst) {
    const swapped = entryForAlternateYear(ctx.slot);
    if (typeof swapped?.lessons.first === "string") {
      alternateFirst = {
        first: swapped.lessons.first,
        altFirst: swapped.lessons.altFirst,
      };
    }
  }
  for (const { key, alt, label, number } of fields) {
    if (spec && !spec.keep.has(key)) continue;
    let ref = group[key];
    if (typeof ref !== "string") continue;
    if (key === "first" && typeof alternateFirst?.first === "string") {
      ref = alternateFirst.first;
    }
    lessons.push({ number, label, ref });
    if (alt === null || !ctx.prefs.showAlternates) continue;
    const swappedAlt = key === "first" ? alternateFirst?.altFirst : undefined;
    const alternate =
      key === "first" && typeof swappedAlt === "string"
        ? swappedAlt
        : group[alt];
    if (typeof alternate === "string") {
      lessons.push({
        number,
        label: `${label} (alternative)`,
        ref: alternate,
        optional: true,
      });
    }
  }
  return lessons;
}
