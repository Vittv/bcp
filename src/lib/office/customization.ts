import type { OfficeId } from "../content/types";

// a reader's inline choices for one office. every slot is optional: a missing
// key means "follow the printed default for this date", which is why the
// computed canticle table is never written back to storage. `null` is an
// explicit "None" for a canticle slot and must survive a reload.
export type OfficeCustomization = {
  /** the opening sentence text, or "all" for the old full list */
  opening?: string;
  invitatory?: "venite" | "jubilate" | "pascha";
  psalmCycle?: "office" | "psalter30";
  canticle1?: number | null;
  canticle2?: number | null;
  suffrages?: "a" | "b";
  /** the psalm, reading and collect menus of noonday and compline; a stored
   * id names one of the office's printed alternatives */
  psalmMenu?: string;
  readingMenu?: string;
  collectMenu?: string;
};

export type OfficeCustomizations = Partial<
  Record<OfficeId, OfficeCustomization>
>;

export const EMPTY_CUSTOMIZATION: OfficeCustomization = {};

// the shape JSON.parse can hand back. storage is decoded here once, before
// anything else in the app sees it.
type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

// the 1979 BCP numbers its daily office canticles 1-21
const FIRST_CANTICLE = 1;
const LAST_CANTICLE = 21;

const CUSTOMIZATION_KEYS: readonly (keyof OfficeCustomization)[] = [
  "opening",
  "invitatory",
  "psalmCycle",
  "canticle1",
  "canticle2",
  "suffrages",
  "psalmMenu",
  "readingMenu",
  "collectMenu",
];

function isRecord(value: JsonValue): value is { [key: string]: JsonValue } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function canticleSlot(value: JsonValue | undefined): number | null | undefined {
  if (value === null) return null;
  if (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= FIRST_CANTICLE &&
    value <= LAST_CANTICLE
  ) {
    return value;
  }
  return undefined;
}

function invitatoryOf(
  value: JsonValue | undefined,
): OfficeCustomization["invitatory"] {
  switch (value) {
    case "venite":
    case "jubilate":
    case "pascha":
      return value;
    default:
      return undefined;
  }
}

function psalmCycleOf(
  value: JsonValue | undefined,
): OfficeCustomization["psalmCycle"] {
  switch (value) {
    case "office":
    case "psalter30":
      return value;
    default:
      return undefined;
  }
}

function suffragesOf(
  value: JsonValue | undefined,
): OfficeCustomization["suffrages"] {
  switch (value) {
    case "a":
    case "b":
      return value;
    default:
      return undefined;
  }
}

// accept only the shapes the composer understands. a stale or hand-edited
// storage entry degrades to the printed default rather than breaking the
// office.
export function sanitizeCustomization(raw: JsonValue): OfficeCustomization {
  if (!isRecord(raw)) return {};
  const out: OfficeCustomization = {};
  if (typeof raw.opening === "string" && raw.opening.length > 0) {
    out.opening = raw.opening;
  }
  const invitatory = invitatoryOf(raw.invitatory);
  if (invitatory) out.invitatory = invitatory;
  const psalmCycle = psalmCycleOf(raw.psalmCycle);
  if (psalmCycle) out.psalmCycle = psalmCycle;
  const one = canticleSlot(raw.canticle1);
  if (one !== undefined) out.canticle1 = one;
  const two = canticleSlot(raw.canticle2);
  if (two !== undefined) out.canticle2 = two;
  const suffrages = suffragesOf(raw.suffrages);
  if (suffrages) out.suffrages = suffrages;
  // menu ids are strings the composer checks against the printed options; a
  // stale id degrades to the suggestion rather than breaking the office
  if (typeof raw.psalmMenu === "string" && raw.psalmMenu.length > 0) {
    out.psalmMenu = raw.psalmMenu;
  }
  if (typeof raw.readingMenu === "string" && raw.readingMenu.length > 0) {
    out.readingMenu = raw.readingMenu;
  }
  if (typeof raw.collectMenu === "string" && raw.collectMenu.length > 0) {
    out.collectMenu = raw.collectMenu;
  }
  return out;
}

export function sanitizeCustomizations(raw: JsonValue): OfficeCustomizations {
  if (!isRecord(raw)) return {};
  const out: OfficeCustomizations = {};
  for (const [id, value] of Object.entries(raw)) {
    const clean = sanitizeCustomization(value);
    if (Object.keys(clean).length > 0) {
      // SAFETY: every key in storage was written from an OfficeId by this app
      out[id as OfficeId] = clean;
    }
  }
  return out;
}

function setChoice<K extends keyof OfficeCustomization>(
  target: OfficeCustomization,
  key: K,
  value: OfficeCustomization[K] | undefined,
): void {
  if (value === undefined) {
    delete target[key];
  } else {
    target[key] = value;
  }
}

// apply a patch, letting `undefined` remove a slot so it follows the default
// again. the patch is already typed, so this only merges it.
export function applyCustomization(
  current: OfficeCustomization | undefined,
  patch: Partial<OfficeCustomization>,
): OfficeCustomization {
  const next: OfficeCustomization = { ...current };
  for (const key of CUSTOMIZATION_KEYS) {
    if (Object.hasOwn(patch, key)) setChoice(next, key, patch[key]);
  }
  return next;
}
