// the font vocabulary as data: a face is one family plus the files that back it,
// so the picker, the loader, and the css vars all read one registry instead of
// naming faces at each call site. pure data, no asset imports, so it stays
// importable under bun test.

export type FaceRole = "interface" | "reading" | "heading" | "code";
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
    variants: [
      {
        family: "Inter Tight",
        weight: 400,
        style: "normal",
        weightRange: [100, 900],
      },
    ],
  },
  system: {
    id: "system",
    label: "System default",
    role: "interface",
    generic: SYSTEM_UI,
    variants: [],
    system: true,
  },
  "crimson-pro": {
    id: "crimson-pro",
    label: "Crimson Pro",
    role: "reading",
    // also offered for headings: a body serif is a plausible display pairing
    roles: ["reading", "heading"],
    generic: SERIF_GENERIC,
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
    generic: HEADING_GENERIC,
    variants: [
      {
        family: "Playfair Display",
        weight: 400,
        style: "normal",
        weightRange: [400, 900],
      },
    ],
  },
  "jetbrains-mono": {
    id: "jetbrains-mono",
    label: "JetBrains Mono",
    role: "code",
    generic: "monospace",
    variants: [{ family: "JetBrains Mono", weight: 500, style: "normal" }],
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

// the roles a picker offers: interface, heading, and reading. code stays
// design-fixed for now.
export const INTERFACE_FACES = facesByRole("interface");
export const HEADING_FACES = facesByRole("heading");
export const READING_FACES = facesByRole("reading");

export const DEFAULT_INTERFACE_FONT: FaceId = "inter";
export const DEFAULT_HEADING_FONT: FaceId = "playfair-display";
export const DEFAULT_READING_FONT: FaceId = "crimson-pro";

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
    return variantOf(def, 600, "normal") ?? primaryVariant(def);
  }
  if (register === "italic") {
    return variantOf(def, 400, "italic") ?? primaryVariant(def);
  }
  return primaryVariant(def);
}

// the css font-family string for a face in one register: the register's own
// family ahead of the body family, then the generic fallback. a system face has
// no families, so it is just its generic stack.
export function faceStack(
  def: FaceDef,
  register: FaceRegister = "body",
): string {
  const base = primaryVariant(def);
  const chosen = variantFor(def, register);
  const families =
    chosen && base && chosen.family !== base.family
      ? [chosen.family, base.family]
      : chosen
        ? [chosen.family]
        : [];
  return [...families.map((family) => JSON.stringify(family)), def.generic]
    .filter((part) => part.length > 0)
    .join(", ");
}
