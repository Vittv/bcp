import { describe, expect, it } from "bun:test";
import { FACES, faceHasRole, faceStack, SYSTEM_UI } from "../faces";
import {
  type FaceSource,
  faceSource,
  normalizeFamilyNames,
  SYSTEM_FACE_PREFIX,
  systemFaceDef,
  systemFaceId,
  systemFamilyFromId,
  systemFontsSupported,
} from "../systemFonts";

describe("system face ids", () => {
  it("round-trips a family through its id", () => {
    expect(SYSTEM_FACE_PREFIX).toBe("sys:");
    expect(systemFaceId("Iosevka")).toBe("sys:Iosevka");
    expect(systemFamilyFromId("sys:Iosevka")).toBe("Iosevka");
  });

  it("reads any id without the prefix as a non-system id", () => {
    expect(systemFamilyFromId("inter")).toBeNull();
    expect(systemFamilyFromId("playfair-display")).toBeNull();
    expect(systemFamilyFromId("")).toBeNull();
  });

  it("keeps a family that itself contains a colon intact", () => {
    expect(systemFamilyFromId(systemFaceId("A:B"))).toBe("A:B");
  });
});

describe("systemFaceDef", () => {
  it("is a byte-less face offered to every role picker", () => {
    const face = systemFaceDef("Georgia");
    expect(face.system).toBe(true);
    expect(faceHasRole(face, "interface")).toBe(true);
    expect(faceHasRole(face, "heading")).toBe(true);
    expect(faceHasRole(face, "reading")).toBe(true);
  });

  it("labels the face with the family", () => {
    expect(systemFaceDef("Georgia").label).toBe("Georgia");
    expect(systemFaceDef("Georgia").id).toBe("sys:Georgia");
  });

  it("stacks as the family over the platform fallback", () => {
    expect(faceStack(systemFaceDef("Georgia"))).toBe(`"Georgia", ${SYSTEM_UI}`);
  });

  // no variants means no register distinction: the same family is offered for
  // every register and the engine picks the cut the style asks for.
  it("collapses every register onto the one family", () => {
    const face = systemFaceDef("Georgia");
    const expected = `"Georgia", ${SYSTEM_UI}`;
    expect(faceStack(face, "semibold")).toBe(expected);
    expect(faceStack(face, "italic")).toBe(expected);
  });
});

describe("faceSource", () => {
  it("classifies an enumerated device font as a system face", () => {
    expect(faceSource(systemFaceDef("Georgia"))).toBe("system");
  });

  it("classifies the bundled system stack and faces as built-in", () => {
    const sources: FaceSource[] = [
      faceSource(FACES.system),
      faceSource(FACES.inter),
    ];
    expect(sources).toEqual(["built-in", "built-in"]);
  });
});

describe("normalizeFamilyNames", () => {
  it("trims, drops blanks, and folds case when deduping", () => {
    expect(normalizeFamilyNames(["  Inter ", "inter", "", "  "])).toEqual([
      "Inter",
    ]);
  });

  it("sorts the result", () => {
    expect(normalizeFamilyNames(["zeta", "alpha", "beta"])).toEqual([
      "alpha",
      "beta",
      "zeta",
    ]);
  });

  it("ignores entries that are not non-empty strings", () => {
    expect(normalizeFamilyNames(["Inter", 1, null, { family: "X" }])).toEqual([
      "Inter",
    ]);
  });
});

describe("systemFontsSupported", () => {
  // bun is neither the tauri shell nor a chromium page, so this pins the
  // capability probe's negative branch
  it("is false where neither the shell nor the local-font api is present", () => {
    expect(systemFontsSupported()).toBe(false);
  });
});
