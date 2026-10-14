import { describe, expect, it } from "bun:test";
import {
  DEFAULT_HEADING_FONT,
  DEFAULT_INTERFACE_FONT,
  DEFAULT_READING_FONT,
  FACE_LIST,
  FACES,
  faceById,
  faceStack,
  HEADING_FACES,
  INTERFACE_FACES,
  READING_FACES,
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

  it("resolves the defaults to faces in their own roles", () => {
    expect(faceById(DEFAULT_INTERFACE_FONT)?.role).toBe("interface");
    expect(faceById(DEFAULT_HEADING_FONT)?.role).toBe("heading");
    expect(faceById(DEFAULT_READING_FONT)?.role).toBe("reading");
  });

  it("offers the interface, heading, and reading roles in the pickers", () => {
    expect(INTERFACE_FACES.map((face) => face.id)).toEqual(["inter", "system"]);
    expect(HEADING_FACES.map((face) => face.id)).toEqual([
      "crimson-pro",
      "playfair-display",
    ]);
    expect(READING_FACES.map((face) => face.id)).toEqual(["crimson-pro"]);
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
