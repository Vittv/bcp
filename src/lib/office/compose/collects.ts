import { resolve, sanctoraleBySlug, sundayOnOrBefore } from "../../calendar";
import type { CalendarDate, DolSlot } from "../../calendar/types";
import { collectPassage } from "../../content";
import type { CollectSection } from "../../content/types";
import type { ComposedNode } from "../types";
import {
  type ComposeContext,
  HOLY_DAY_COLLECTS,
  ORDINALS,
  SPECIAL_COLLECTS,
  SUNDAY_FEASTS,
  WEEKDAY_NAMES,
} from "./shared";

// the day-appropriate occasional collect, e.g. "A Collect for Fridays".
export function dayCollectTitle(weekdayOfDate: number): string | undefined {
  switch (weekdayOfDate) {
    case 0:
      return "A Collect for Sundays";
    case 5:
      return "A Collect for Fridays";
    case 6:
      return "A Collect for Saturdays";
    default:
      return undefined;
  }
}

// any-day collects the printed book offers alongside the weekday one; none
// of them may be trimmed, since each is appointed for every day
export const OCCASIONAL_COLLECTS = new Set([
  "A Collect for the Renewal of Life",
  "A Collect for Peace",
  "A Collect for Aid against Perils",
  "A Collect for Protection",
  "A Collect for the Presence of Christ",
  "A Collect for Grace",
  "A Collect for Guidance",
]);

// the closing prayers the book titles with a rubric
export const PRAYER_TITLES = new Set([
  "The General Thanksgiving",
  "A Prayer of St. Chrysostom",
]);

export function keepOccasionalCollect(
  title: string,
  weekdayOfDate: number,
): boolean {
  return (
    OCCASIONAL_COLLECTS.has(title) || title === dayCollectTitle(weekdayOfDate)
  );
}

export function flushCollectBuf(
  nodes: ComposedNode[],
  buf: string[],
  title: string | undefined,
): void {
  if (buf.length === 0) return;
  nodes.push({ kind: "fixed-collect", text: buf.join("\n"), title });
}

export function collectNode(ctx: ComposeContext): ComposedNode | undefined {
  const found = collectForDate(ctx.litDate, ctx.litSlot);
  if (!found) return undefined;
  const passage = collectPassage(
    ctx.prefs.collectRite,
    found.section,
    found.title,
  );
  if (!passage) return undefined;
  // holy day collects carry the feast slug for the title link
  const slug = found.section === "holy-days" ? ctx.litSlot.holyDay : undefined;
  return { kind: "collect", passage, slug, appointment: found.appointment };
}

export function collectForDate(
  date: CalendarDate,
  slot: DolSlot,
):
  | { title: string; section: CollectSection; appointment?: string }
  | undefined {
  if (slot.day.kind === "special") {
    const direct = SPECIAL_COLLECTS[slot.day.name];
    if (direct)
      return {
        title: direct,
        section: "church-year",
        appointment: slot.day.name
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
      };
    // the weekdays of the Epiphany season use the Epiphany collect.
    if (
      slot.week.kind === "epiphany-following" &&
      /^jan-\d+$/.test(slot.day.name)
    ) {
      return { title: "The Epiphany", section: "church-year" };
    }
  }
  if (slot.holyDay) {
    // BCP pp. 16-18: a fixed feast yields to the Sunday proper (save the
    // feasts that outrank a Sunday), and no fixed feast is observed in
    // Holy Week or Easter Week.
    const sunday = slot.day.kind === "weekday" && slot.day.weekday === 0;
    const inHolyWeek =
      slot.week.kind === "holy-week" || slot.week.kind === "easter-week";
    if ((!sunday || SUNDAY_FEASTS.has(slot.holyDay)) && !inHolyWeek) {
      const title = HOLY_DAY_COLLECTS[slot.holyDay];
      if (title)
        return {
          title,
          section: "holy-days",
          appointment: sanctoraleBySlug(slot.holyDay)?.title ?? slot.holyDay,
        };
    }
  }
  if (slot.week.kind === "holy-week" && slot.day.kind === "weekday") {
    return {
      title: `${WEEKDAY_NAMES[slot.day.weekday]} in Holy Week`,
      section: "church-year",
      appointment: `${WEEKDAY_NAMES[slot.day.weekday]} in Holy Week`,
    };
  }
  if (slot.week.kind === "easter-week" && slot.day.kind === "weekday") {
    return {
      title: `${WEEKDAY_NAMES[slot.day.weekday]} in Easter Week`,
      section: "church-year",
      appointment: `${WEEKDAY_NAMES[slot.day.weekday]} in Easter Week`,
    };
  }
  // ordinary weekdays use the collect of their week (the DOL proper week runs
  // Monday to Sunday, so the week's slot already names it).
  const weekCollect = sundayCollectForSlot(slot);
  if (weekCollect) return { title: weekCollect, section: "church-year" };
  // weeks without a Sunday collect of their own (the Christmas season) borrow
  // from the preceding Sunday.
  const sunday = resolve(sundayOnOrBefore(date));
  if (sunday.day.kind === "special") {
    const direct = SPECIAL_COLLECTS[sunday.day.name];
    if (direct) return { title: direct, section: "church-year" };
  }
  const title = sundayCollectForSlot(sunday);
  if (title) return { title, section: "church-year" };
  return undefined;
}

// the collect for a Sunday: every Sunday has one, so a weekday borrows it.
export function sundayCollectForSlot(slot: DolSlot): string | undefined {
  switch (slot.week.kind) {
    case "advent":
      return `${ORDINALS[slot.week.week - 1]} Sunday of Advent`;
    case "epiphany":
      return slot.week.week === 1
        ? "First Sunday after the Epiphany:  The Baptism of our Lord"
        : `${ORDINALS[slot.week.week]} Sunday after the Epiphany`;
    case "last-epiphany":
      return "Last Sunday after the Epiphany";
    case "lent":
      return `${ORDINALS[slot.week.week - 1]} Sunday in Lent`;
    case "easter":
      return slot.week.week === 7
        ? "Seventh Sunday of Easter:  The Sunday after Ascension Day"
        : `${ORDINALS[slot.week.week - 1]} Sunday of Easter`;
    case "pentecost":
      return "The Day of Pentecost:  Whitsunday";
    case "after-pentecost":
      return `Proper ${slot.week.proper}`;
    default:
      return undefined;
  }
}

// the season marker groups that begin the opening sentences and antiphons.
export function keepSeasonGroup(text: string, ctx: ComposeContext): boolean {
  switch (text) {
    case "Advent":
      return ctx.season === "advent";
    case "Christmas":
      return ctx.season === "christmas";
    case "Epiphany":
      return ctx.season === "epiphany";
    case "Lent":
      return ctx.season === "lent";
    case "Holy Week":
      return ctx.season === "holy-week";
    case "Easter Season, including Ascension Day and the Day of Pentecost":
      return ctx.season === "easter" || ctx.season === "pentecost";
    case "Trinity Sunday":
      return ctx.isTrinity;
    case "All Saints and other Major Saints' Days":
      return ctx.holyDay !== undefined;
    case "Occasions of Thanksgiving":
      return false;
    case "At any Time":
      return true;
    default:
      return false;
  }
}
