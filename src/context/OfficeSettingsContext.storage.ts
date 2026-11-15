import type { OfficeId } from "../lib/content/types";
import {
  applyCustomization,
  EMPTY_CUSTOMIZATION,
  type OfficeCustomization,
  type OfficeCustomizations,
  sanitizeCustomizations,
} from "../lib/office/customization";
import type { OfficeRite } from "../lib/office/types";

export type ToggleUpdate = boolean | ((prev: boolean) => boolean);

export const KEY_RUBRICS = "rubrics";
export const KEY_SPEAKERS = "speakers";
export const KEY_DEVOTIONS = "devotions";
export const KEY_RITE = "rite";
export const KEY_CUSTOMIZATIONS = "office:customizations:v1";

// the printed book always carries rubrics and speakers, so a reader with no
// stored preference starts with both shown; an explicit off survives
export const DEFAULT_RUBRICS = true;
export const DEFAULT_SPEAKERS = true;
export const DEFAULT_DEVOTIONS = false;
// the contemporary office is the default
export const DEFAULT_RITE: OfficeRite = "Two";

export function loadBoolean(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === "true" || v === "false") return v === "true";
  } catch {
    // ignore
  }
  return fallback;
}

export function persistBoolean(key: string, v: boolean): void {
  try {
    localStorage.setItem(key, String(v));
  } catch {
    // ignore
  }
}

export function loadRite(): OfficeRite {
  try {
    const v = localStorage.getItem(KEY_RITE);
    if (v === "One" || v === "Two") return v;
  } catch {
    // ignore
  }
  return DEFAULT_RITE;
}

export function persistRite(v: OfficeRite): void {
  try {
    localStorage.setItem(KEY_RITE, v);
  } catch {
    // ignore
  }
}

export function loadCustomizations(): OfficeCustomizations {
  try {
    const raw = localStorage.getItem(KEY_CUSTOMIZATIONS);
    if (raw) return sanitizeCustomizations(JSON.parse(raw));
  } catch {
    // ignore
  }
  return {};
}

export function persistCustomizations(v: OfficeCustomizations): void {
  try {
    localStorage.setItem(KEY_CUSTOMIZATIONS, JSON.stringify(v));
  } catch {
    // ignore
  }
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
