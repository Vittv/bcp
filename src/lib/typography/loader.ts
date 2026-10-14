import { Asset } from "expo-asset";
import { Platform } from "react-native";
import { FACE_ASSETS } from "./assets";
import type { FaceDef, FaceVariant } from "./faces";

type FontSource = string | number | { uri?: string; localUri?: string };

// a bundled font module to a uri the browser can fetch. metro hands the require()
// result through as a module id number, which expo-asset turns into an asset uri.
function assetUri(face: FontSource | undefined): string {
  if (face === undefined) return "";
  if (typeof face === "string") return face;
  if (typeof face === "object" && face !== null) {
    return face.uri ?? face.localUri ?? "";
  }
  return Asset.fromModule(face).uri;
}

function fontFaceRule(
  variant: FaceVariant,
  uri: string,
  format?: string,
): string {
  const weight = variant.weightRange
    ? `${variant.weightRange[0]} ${variant.weightRange[1]}`
    : String(variant.weight);
  const source = format
    ? `url(${JSON.stringify(uri)}) format(${JSON.stringify(format)})`
    : `url(${JSON.stringify(uri)})`;
  return `@font-face{font-family:${JSON.stringify(
    variant.family,
  )};font-style:${variant.style};font-weight:${weight};font-display:swap;src:${source}}`;
}

function styleElement(id: string): HTMLStyleElement {
  const existing = document.getElementById(id);
  if (existing) {
    // SAFETY: ensureFace and injectFontFace only ever create a <style> under an
    // id of this shape, so the element found here is the stylesheet we wrote.
    return existing as HTMLStyleElement;
  }
  const el = document.createElement("style");
  el.id = id;
  document.head.appendChild(el);
  return el;
}

// write one @font-face rule into a tagged <style>, replacing it if it exists.
// the id doubles as the dedupe key, so a face is registered once.
export function injectFontFace(
  variant: FaceVariant,
  uri: string,
  id: string,
  format?: string,
): void {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  styleElement(id).textContent = fontFaceRule(variant, uri, format);
}

// inject one @font-face per bundled variant of a face. expo-font's web build
// already does this for the useFonts set; this covers faces registered outside
// it (the interface face).
export function ensureFace(def: FaceDef): void {
  for (const variant of def.variants) {
    const id = `face-${variant.family.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const uri = assetUri(FACE_ASSETS[variant.family]);
    if (uri.length === 0) continue;
    injectFontFace(variant, uri, id, "woff2");
  }
}
