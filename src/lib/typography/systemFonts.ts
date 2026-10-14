import { IS_TAURI } from "../desktop";
import { type FaceDef, SYSTEM_UI } from "./faces";

export const SYSTEM_FACE_PREFIX = "sys:";

export type SystemFontsState = "idle" | "loading" | "ready" | "unavailable";

// a system face is a face with no bytes to load: the renderer resolves the
// family through the OS, so the def carries the family name and nothing else.
// it stands in for any role, and no register distinction is needed because
// the engine picks the actual weight and slant from the chosen family.
export function systemFaceId(family: string): string {
  return `${SYSTEM_FACE_PREFIX}${family}`;
}

export function systemFamilyFromId(id: string): string | null {
  return id.startsWith(SYSTEM_FACE_PREFIX)
    ? id.slice(SYSTEM_FACE_PREFIX.length)
    : null;
}

export function systemFaceDef(family: string): FaceDef {
  return {
    id: systemFaceId(family),
    label: family,
    role: "reading",
    roles: ["interface", "heading", "reading"],
    generic: SYSTEM_UI,
    variants: [{ family, weight: 400, style: "normal" }],
    system: true,
  };
}

export type FaceSource = "built-in" | "system";

// where a picker row's face came from. a `sys:` id is an enumerated device
// font; the bundled "System default" face is a device stack too, but it ships
// as a fixed choice, so it stays bundled.
export function faceSource(face: FaceDef): FaceSource {
  if (systemFamilyFromId(face.id) !== null) return "system";
  return "built-in";
}

type LocalFont = { family: string };
type LocalFontQuery = () => Promise<LocalFont[]>;

// probes the optional local font access api, which only chromium implements.
function localFontQuery(): LocalFontQuery | undefined {
  // SAFETY: the property is read, never written; every caller narrows the
  // result with a `typeof ... === "function"` check before calling it.
  return (globalThis as { queryLocalFonts?: LocalFontQuery }).queryLocalFonts;
}

// whether this build can list the machine's fonts at all. desktop always can
// (the shell reads the platform font database); web only under chromium, whose
// local font access api safari and firefox do not implement.
export function systemFontsSupported(): boolean {
  if (IS_TAURI) return true;
  return typeof localFontQuery() === "function";
}

let cache: Promise<string[]> | null = null;

// the machine's font families, newest request sharing the first. desktop asks
// the shell so linux and macos get the list the webview api cannot give them;
// web asks the local font access api. a platform with neither resolves to an
// empty list and the picker shows no system group.
export function listSystemFonts(): Promise<string[]> {
  if (!cache) cache = loadSystemFonts().catch(() => []);
  return cache;
}

async function loadSystemFonts(): Promise<string[]> {
  if (IS_TAURI) {
    const { invoke } = await import("@tauri-apps/api/core");
    const names = await invoke<string[]>("list_system_fonts");
    return normalizeFamilyNames(names);
  }
  const query = localFontQuery();
  if (typeof query === "function") {
    const fonts = await query();
    return normalizeFamilyNames(fonts.map((font) => font.family));
  }
  return [];
}

// trim, drop blanks, and fold case so a family listed twice under different
// casing is offered once. the input is whatever the platform returned, so
// anything that is not a non-empty string is dropped at this boundary.
export function normalizeFamilyNames(names: readonly unknown[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of names) {
    const name = typeof raw === "string" ? raw.trim() : "";
    if (name.length === 0) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out.sort((a, b) => a.localeCompare(b));
}
