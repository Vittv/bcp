import { afterEach, describe, expect, it } from "bun:test";
import {
  decorationFor,
  loadWindowControlStyle,
  resolveWindowControlStyle,
  saveWindowControlStyle,
  WINDOW_CONTROL_OPTIONS,
  WINDOW_DECORATIONS,
} from "../windowDecorations";

// bun has no localStorage, so the persistence helpers need a small stub
function installStorage(initial: Record<string, string> = {}) {
  const items = new Map(Object.entries(initial));
  const storage = {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    removeItem: (key: string) => void items.delete(key),
  };
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });
  return items;
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, "localStorage");
});

describe("window control styles", () => {
  it("resolves system to each host convention", () => {
    expect(resolveWindowControlStyle("system", "macos")).toBe("macos");
    expect(resolveWindowControlStyle("system", "windows")).toBe("windows");
    expect(resolveWindowControlStyle("system", "linux")).toBe("linux");
  });

  it("keeps an explicit style on every host", () => {
    for (const style of ["macos", "windows", "linux", "none"] as const) {
      expect(resolveWindowControlStyle(style, "macos")).toBe(style);
      expect(resolveWindowControlStyle(style, "windows")).toBe(style);
      expect(resolveWindowControlStyle(style, "linux")).toBe(style);
    }
  });

  it("places left-handed controls on the leading edge", () => {
    expect(decorationFor("macos").side).toBe("left");
    expect(decorationFor("windows").side).toBe("right");
    expect(decorationFor("linux").side).toBe("right");
    expect(decorationFor("none").side).toBeNull();
  });

  it("offers system plus every decoration", () => {
    const ids = WINDOW_CONTROL_OPTIONS.map((option) => option.id);
    expect(ids).toEqual(["system", "macos", "windows", "linux", "none"]);
    expect(ids).toContain(decorationFor("none").id);
    expect(Object.keys(WINDOW_DECORATIONS)).toHaveLength(4);
  });

  it("defaults to system without a stored choice", () => {
    installStorage();
    expect(loadWindowControlStyle()).toBe("system");
  });

  it("migrates the legacy show/hide boolean", () => {
    installStorage({ windowControls: "false" });
    expect(loadWindowControlStyle()).toBe("none");

    installStorage({ windowControls: "true" });
    expect(loadWindowControlStyle()).toBe("system");
  });

  it("keeps a stored style even when a legacy value is present", () => {
    installStorage({ windowControlStyle: "macos", windowControls: "false" });
    expect(loadWindowControlStyle()).toBe("macos");
  });

  it("ignores an unknown stored style", () => {
    installStorage({ windowControlStyle: "beos" });
    expect(loadWindowControlStyle()).toBe("system");
  });

  it("saves the style and drops the legacy key", () => {
    const items = installStorage({ windowControls: "false" });
    saveWindowControlStyle("linux");
    expect(items.get("windowControlStyle")).toBe("linux");
    expect(items.has("windowControls")).toBe(false);
  });
});
