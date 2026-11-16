import type { OfficeId } from "../lib/content/types";
import {
  applyCustomization,
  EMPTY_CUSTOMIZATION,
  type OfficeCustomization,
  type OfficeCustomizations,
  sanitizeCustomizations,
} from "../lib/office/customization";
import type { OfficeRite } from "../lib/office/types";
import {
  readStorageJson,
  readStorageString,
  writeStorageJson,
  writeStorageString,
} from "../lib/storage";

export type ToggleUpdate = boolean | ((prev: boolean) => boolean);

export const KEY_RUBRICS = "rubrics";
export const KEY_SPEAKERS = "speakers";
export const KEY_DEVOTIONS = "devotions";
export const KEY_SECTIONS = "sections";
export const KEY_RITE = "rite";
export const KEY_CUSTOMIZATIONS = "office:customizations:v1";

// the printed book always carries rubrics and speakers, so a reader with no
// stored preference starts with both shown; an explicit off survives
export const DEFAULT_RUBRICS = true;
export const DEFAULT_SPEAKERS = true;
export const DEFAULT_DEVOTIONS = false;
export const DEFAULT_SECTIONS = true;
// the contemporary office is the default
export const DEFAULT_RITE: OfficeRite = "Two";

export function loadBoolean(key: string, fallback: boolean): boolean {
  const v = readStorageString(key);
  if (v === "true" || v === "false") return v === "true";
  return fallback;
}

export function persistBoolean(key: string, v: boolean): void {
  writeStorageString(key, String(v));
}

export function loadRite(): OfficeRite {
  const v = readStorageString(KEY_RITE);
  if (v === "One" || v === "Two") return v;
  return DEFAULT_RITE;
}

export function persistRite(v: OfficeRite): void {
  writeStorageString(KEY_RITE, v);
}

export function loadCustomizations(): OfficeCustomizations {
  const raw = readStorageJson<OfficeCustomizations>(KEY_CUSTOMIZATIONS);
  if (raw != null) return sanitizeCustomizations(raw);
  return {};
}

export function persistCustomizations(v: OfficeCustomizations): void {
  writeStorageJson(KEY_CUSTOMIZATIONS, v);
}

export function customizationFor(
  customizations: OfficeCustomizations,
  officeId: OfficeId,
): OfficeCustomization {
  return customizations[officeId] ?? EMPTY_CUSTOMIZATION;
}

export function applyOfficeChoice(
  prev: OfficeCustomizations,
  officeId: OfficeId,
  patch: Partial<OfficeCustomization>,
): OfficeCustomizations {
  const clean = applyCustomization(prev[officeId], patch);
  const next = { ...prev };
  if (Object.keys(clean).length === 0) {
    delete next[officeId];
  } else {
    next[officeId] = clean;
  }
  return next;
}

export function removeOfficeCustomization(
  prev: OfficeCustomizations,
  officeId: OfficeId,
): OfficeCustomizations | null {
  if (!(officeId in prev)) return null;
  const next = { ...prev };
  delete next[officeId];
  return next;
}
