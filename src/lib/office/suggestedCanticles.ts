import type { Season } from "../calendar/types";
import type { OfficeRite } from "./types";

// the 1979 BCP Table of Suggested Canticles (pp. 144-145), encoded as the
// printed rows. a pair is a rite choice: Rite I takes the traditional number
// and Rite II the contemporary one. single numbers serve both rites.
type Choice = number | readonly [number, number];

type Row = { ot: Choice; nt: Choice };

export type SuggestedCanticles = [number, number];

export type CanticleContext = {
  office: "morning" | "evening";
  rite: OfficeRite;
  /** 0 = Sunday */
  weekday: number;
  season: Season;
  /** a fixed sanctorale feast takes the feast row */
  isFeast: boolean;
};

const SUNDAY = 0;
const MONDAY = 1;
const WEDNESDAY = 3;
const THURSDAY = 4;
const FRIDAY = 5;

const MORNING: readonly Row[] = [
  { ot: [4, 16], nt: [7, 21] }, // Sunday
  { ot: 9, nt: 19 }, // Monday
  { ot: [2, 13], nt: 18 }, // Tuesday
  { ot: 11, nt: [4, 16] }, // Wednesday
  { ot: 8, nt: [6, 20] }, // Thursday
  { ot: 10, nt: 18 }, // Friday
  { ot: [1, 12], nt: 19 }, // Saturday
];

const EVENING: readonly Row[] = [
  { ot: [3, 15], nt: [5, 17] }, // Sunday
  { ot: 8, nt: [5, 17] }, // Monday
  { ot: 10, nt: [3, 15] }, // Tuesday
  { ot: [1, 12], nt: [5, 17] }, // Wednesday
  { ot: 11, nt: [3, 15] }, // Thursday
  { ot: [2, 13], nt: [5, 17] }, // Friday
  { ot: 9, nt: [3, 15] }, // Saturday
];

// on Feasts of our Lord and other Major Feasts both offices take the Sunday
// row, whatever the weekday.
const FEAST_MORNING: Row = { ot: [4, 16], nt: [7, 21] };
const FEAST_EVENING: Row = { ot: [3, 15], nt: [5, 17] };

const PENITENTIAL = new Set<Season>(["lent", "holy-week"]);

function pick(choice: Choice, rite: OfficeRite): number {
  if (typeof choice === "number") return choice;
  return rite === "One" ? choice[0] : choice[1];
}

function morningRow(ctx: CanticleContext): Row {
  if (ctx.isFeast) return FEAST_MORNING;
  const base = MORNING[ctx.weekday] ?? MORNING[SUNDAY];
  let ot = base.ot;
  let nt = base.nt;
  if (ctx.weekday === SUNDAY) {
    if (ctx.season === "advent") ot = 11;
    if (PENITENTIAL.has(ctx.season)) ot = 14;
    if (ctx.season === "easter") ot = 8;
    if (ctx.season === "advent" || PENITENTIAL.has(ctx.season)) nt = [4, 16];
  }
  if (ctx.weekday === WEDNESDAY && PENITENTIAL.has(ctx.season)) ot = 14;
  if (
    ctx.weekday === THURSDAY &&
    (ctx.season === "advent" || PENITENTIAL.has(ctx.season))
  ) {
    nt = 19;
  }
  if (ctx.weekday === FRIDAY && PENITENTIAL.has(ctx.season)) ot = 14;
  return { ot, nt };
}

function eveningRow(ctx: CanticleContext): Row {
  if (ctx.isFeast) return FEAST_EVENING;
  const base = EVENING[ctx.weekday] ?? EVENING[SUNDAY];
  if (ctx.weekday === MONDAY && PENITENTIAL.has(ctx.season)) {
    return { ot: 14, nt: base.nt };
  }
  return base;
}

// the two canticles for the readings, in order. the composer only uses as
// many as there are readings, so a one-reading office keeps the first.
export function suggestedCanticles(ctx: CanticleContext): SuggestedCanticles {
  const row = ctx.office === "morning" ? morningRow(ctx) : eveningRow(ctx);
  return [pick(row.ot, ctx.rite), pick(row.nt, ctx.rite)];
}
