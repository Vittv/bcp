// the font vocabulary as data: a face is one family plus the files that back it,
// so the picker, the loader, and the css vars all read one registry instead of
// naming faces at each call site. pure data, no asset imports, so it stays
// importable under bun test.

export type FaceRole =
  | "interface"
  | "reading"
  | "heading"
  | "subheading"
  | "code";
export type FaceStyle = "normal" | "italic";

export const SYSTEM_UI =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const SERIF_GENERIC = 'Georgia, "Times New Roman", serif';
const HEADING_GENERIC = `"Crimson Pro", ${SERIF_GENERIC}`;

// one bundled file. expo-font (native) and @font-face (web) both register a file
// under a single family name, so a weight or a style carries its own name.
export type FaceVariant = {
  family: string;
  weight: number;
  style: FaceStyle;
  // a variable file covers a range; the web loader declares it in @font-face
  weightRange?: [number, number];
};

export type FaceDef = {
  id: string;
  label: string;
  role: FaceRole;
  // the generic families a stack falls back through after the face's own
  generic: string;
  // lowercase height as a fraction of the em, read from the shipped file's OS/2
  xHeight?: number;
  variants: FaceVariant[];
  // the platform stack, offered as-is and never bundled
  system?: boolean;
  // a face may stand in for more than one role; unset means the single `role`
  roles?: FaceRole[];
};

export const FACES = {
  inter: {
    id: "inter",
    label: "Inter",
    role: "interface",
    generic: SYSTEM_UI,
    xHeight: 0.546,
    variants: [
      {
        family: "Inter Tight",
        weight: 400,
        style: "normal",
        weightRange: [100, 900],
      },
    ],
  },
  "crimson-pro": {
    id: "crimson-pro",
    label: "Crimson Pro",
    role: "reading",
    // also offered for headings and subheadings: a body serif is a plausible
    // display pairing
    roles: ["reading", "heading", "subheading"],
    generic: SERIF_GENERIC,
    xHeight: 0.42,
    variants: [
      { family: "Crimson Pro", weight: 400, style: "normal" },
      { family: "Crimson Pro SemiBold", weight: 600, style: "normal" },
      { family: "Crimson Pro Italic", weight: 400, style: "italic" },
    ],
  },
  "playfair-display": {
    id: "playfair-display",
    label: "Playfair Display",
    role: "heading",
    // the display serif is also a candidate for the block titles
    roles: ["heading", "subheading"],
    generic: HEADING_GENERIC,
    xHeight: 0.514,
    variants: [
      {
        family: "Playfair Display",
        weight: 400,
        style: "normal",
        weightRange: [400, 900],
      },
    ],
  },
  libron: {
    id: "libron",
    label: "Libron",
    role: "reading",
    // also offered for the chrome: a warm serif alternative to the sans
    roles: ["reading", "interface"],
    generic: SERIF_GENERIC,
    xHeight: 0.531,
    variants: [
      { family: "Libron", weight: 400, style: "normal" },
      { family: "Libron Italic", weight: 400, style: "italic" },
      { family: "Libron Bold", weight: 700, style: "normal" },
    ],
  },
  "eb-garamond": {
    id: "eb-garamond",
    label: "EB Garamond",
    role: "reading",
    roles: ["reading", "heading", "subheading"],
    generic: SERIF_GENERIC,
    xHeight: 0.4,
    variants: [
      { family: "EB Garamond", weight: 400, style: "normal" },
      { family: "EB Garamond SemiBold", weight: 600, style: "normal" },
      { family: "EB Garamond Italic", weight: 400, style: "italic" },
    ],
  },
  "jetbrains-mono": {
    id: "jetbrains-mono",
    label: "JetBrains Mono",
    role: "code",
    generic: "monospace",
    xHeight: 0.55,
    variants: [{ family: "JetBrains Mono", weight: 500, style: "normal" }],
  },
  // declared last so it seats after the bundled faces in the picker, where it
  // reads as the platform fallback rather than a peer of the app's own faces
  system: {
    id: "system",
    label: "System default",
    role: "interface",
    generic: SYSTEM_UI,
    variants: [],
    system: true,
  },
} satisfies Record<string, FaceDef>;

export type FaceId = keyof typeof FACES;

export const FACE_LIST: FaceDef[] = Object.values(FACES);

const BY_ID = new Map<string, FaceDef>(
  FACE_LIST.map((face) => [face.id, face]),
);

export function faceById(id: string): FaceDef | undefined {
  return BY_ID.get(id);
}

export function faceRoles(def: FaceDef): FaceRole[] {
  return def.roles ?? [def.role];
}

export function faceHasRole(def: FaceDef, role: FaceRole): boolean {
  return faceRoles(def).includes(role);
}

export function facesByRole(role: FaceRole): FaceDef[] {
  return FACE_LIST.filter((face) => faceHasRole(face, role));
}

// the roles a picker offers: interface, heading, subheading, and reading. code
// stays design-fixed for now.
export const INTERFACE_FACES = facesByRole("interface");
export const HEADING_FACES = facesByRole("heading");
export const SUBHEADING_FACES = facesByRole("subheading");
export const READING_FACES = facesByRole("reading");

export const DEFAULT_INTERFACE_FONT: FaceId = "inter";
export const DEFAULT_HEADING_FONT: FaceId = "playfair-display";
export const DEFAULT_SUBHEADING_FONT: FaceId = "eb-garamond";
export const DEFAULT_READING_FONT: FaceId = "libron";

// the reader's three registers: the body face plus the emphasis and italic files
// a family ships, each falling back to the body face when that file is absent
export type FaceRegister = "body" | "semibold" | "italic";

function primaryVariant(def: FaceDef): FaceVariant | undefined {
  return (
    def.variants.find((v) => v.style === "normal" && v.weight === 400) ??
    def.variants[0]
  );
}

function variantOf(
  def: FaceDef,
  weight: number,
  style: FaceStyle,
): FaceVariant | undefined {
  return def.variants.find((v) => v.style === style && v.weight === weight);
}

function variantFor(
  def: FaceDef,
  register: FaceRegister,
): FaceVariant | undefined {
  if (register === "semibold") {
    // a face that ships a bold but no semibold still gives emphasis
    return (
      variantOf(def, 600, "normal") ??
      variantOf(def, 700, "normal") ??
      primaryVariant(def)
    );
  }
  if (register === "italic") {
    return variantOf(def, 400, "italic") ?? primaryVariant(def);
  }
  return primaryVariant(def);
}

// the css font-family string for a face in one register: the register's own
// family ahead of the body family, then the generic fallback. a system face has
// no families, so it is just its generic stack. `mapFamily` renames the face's
// own families (the generic is left alone), which the reading role uses to reach
// an aliased registration.
export function faceStack(
  def: FaceDef,
  register: FaceRegister = "body",
  mapFamily: (family: string) => string = (family) => family,
): string {
  const base = primaryVariant(def);
  const chosen = variantFor(def, register);
  const families =
    chosen && base && chosen.family !== base.family
      ? [chosen.family, base.family]
      : chosen
        ? [chosen.family]
        : [];
  return [
    ...families.map((family) => JSON.stringify(mapFamily(family))),
    def.generic,
  ]
    .filter((part) => part.length > 0)
    .join(", ");
}

// the reading role normalizes apparent size: the faces differ widely in
// x-height (Crimson Pro and EB Garamond are small-bodied, Libron is not), so a
// shared px reads at very different heights. every face is scaled toward one
// reference x-height (Crimson Pro's), so the body keeps its optical size
// whichever face is chosen.
export const READING_X_HEIGHT = 0.42;

export function readingSizeAdjust(def: FaceDef): number {
  return def.xHeight ? READING_X_HEIGHT / def.xHeight : 1;
}

// the loader injects the reading face under an aliased family so `size-adjust`
// reaches the body alone; a face that also serves another role (Libron in the
// chrome, Crimson Pro and EB Garamond in headings) keeps its own scale there.
export function readingFamilyName(family: string): string {
  return `${family} Reading`;
}

export function readingStack(
  def: FaceDef,
  register: FaceRegister = "body",
): string {
  return faceStack(def, register, readingFamilyName);
}
