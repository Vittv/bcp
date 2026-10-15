import { describe, expect, it } from "bun:test";
import {
  DEFAULT_HEADING_FONT,
  DEFAULT_INTERFACE_FONT,
  DEFAULT_READING_FONT,
  FACE_LIST,
  FACES,
  faceById,
  faceHasRole,
  faceStack,
  HEADING_FACES,
  INTERFACE_FACES,
  READING_FACES,
  READING_X_HEIGHT,
  readingSizeAdjust,
  readingStack,
  SERIF_GENERIC,
  SYSTEM_UI,
} from "../faces";

describe("face registry", () => {
  it("gives every face a unique id that matches its registry key", () => {
    const ids = FACE_LIST.map((face) => face.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const [key, face] of Object.entries(FACES)) {
      expect(face.id).toBe(key);
    }
  });

  it("bundles at least one normal file for every non-system face", () => {
    for (const face of FACE_LIST) {
      if (face.system) {
        expect(face.variants).toHaveLength(0);
        continue;
      }
      expect(face.variants.some((v) => v.style === "normal")).toBe(true);
    }
  });

  it("records an x-height for every bundled reading face", () => {
    for (const face of READING_FACES) {
      if (face.system) continue;
      expect(face.xHeight ?? 0).toBeGreaterThan(0);
    }
  });

  it("resolves the defaults to faces that serve their own roles", () => {
    const iface = faceById(DEFAULT_INTERFACE_FONT);
    const heading = faceById(DEFAULT_HEADING_FONT);
    const reading = faceById(DEFAULT_READING_FONT);
    expect(iface && faceHasRole(iface, "interface")).toBe(true);
    expect(heading && faceHasRole(heading, "heading")).toBe(true);
    expect(reading && faceHasRole(reading, "reading")).toBe(true);
  });

  it("offers the interface, heading, and reading roles in the pickers", () => {
    expect(INTERFACE_FACES.map((face) => face.id)).toEqual([
      "inter",
      "libron",
      "system",
    ]);
    expect(HEADING_FACES.map((face) => face.id)).toEqual([
      "crimson-pro",
      "playfair-display",
      "eb-garamond",
    ]);
    expect(READING_FACES.map((face) => face.id)).toEqual([
      "crimson-pro",
      "libron",
      "eb-garamond",
    ]);
  });
});

// the stacks are pinned, so a registry edit cannot silently change how text
// renders on web or native.
describe("faceStack", () => {
  it("builds the interface face over the system stack", () => {
    expect(faceStack(FACES.inter)).toBe(`"Inter Tight", ${SYSTEM_UI}`);
  });

  it("builds a system face from its generic stack alone", () => {
    expect(faceStack(FACES.system)).toBe(SYSTEM_UI);
  });

  it("keeps the reader's three registers on the family's files", () => {
    const serif = 'Georgia, "Times New Roman", serif';
    expect(faceStack(FACES["crimson-pro"], "body")).toBe(
      `"Crimson Pro", ${serif}`,
    );
    expect(faceStack(FACES["crimson-pro"], "semibold")).toBe(
      `"Crimson Pro SemiBold", "Crimson Pro", ${serif}`,
    );
    expect(faceStack(FACES["crimson-pro"], "italic")).toBe(
      `"Crimson Pro Italic", "Crimson Pro", ${serif}`,
    );
  });

  it("falls back to the body family when a register file is absent", () => {
    expect(faceStack(FACES["jetbrains-mono"], "semibold")).toBe(
      '"JetBrains Mono", monospace',
    );
  });

  it("builds the heading stack", () => {
    expect(faceStack(FACES["playfair-display"])).toBe(
      '"Playfair Display", "Crimson Pro", Georgia, "Times New Roman", serif',
    );
  });
});

// the reading role renders every face at one reference x-height, so a face
// swap changes the glyphs without changing the apparent body size.
describe("reading normalization", () => {
  it("leaves the reference face at its own size", () => {
    expect(readingSizeAdjust(FACES["crimson-pro"])).toBe(1);
  });

  it("scales every other reading face to the target x-height", () => {
    for (const id of ["libron", "eb-garamond"] as const) {
      const def = FACES[id];
      expect((def.xHeight ?? 0) * readingSizeAdjust(def)).toBeCloseTo(
        READING_X_HEIGHT,
        5,
      );
    }
  });

  it("aliases the reading families so the scale reaches the body alone", () => {
    expect(readingStack(FACES.libron)).toBe(
      `"Libron Reading", ${SERIF_GENERIC}`,
    );
    expect(readingStack(FACES["crimson-pro"], "italic")).toBe(
      `"Crimson Pro Italic Reading", "Crimson Pro Reading", ${SERIF_GENERIC}`,
    );
  });

  it("leaves a system face on its generic stack", () => {
    expect(readingStack(FACES.system)).toBe(SYSTEM_UI);
  });
});
