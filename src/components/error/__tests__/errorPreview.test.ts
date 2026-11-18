import { describe, expect, it } from "bun:test";

import { clearErrorPreview, isErrorPreview } from "../errorPreview";

describe("error preview flag", () => {
  it("recognises the error preview value", () => {
    expect(isErrorPreview("?preview=error")).toBe(true);
    expect(isErrorPreview("?x=1&preview=error")).toBe(true);
    expect(isErrorPreview("?preview=other")).toBe(false);
    expect(isErrorPreview("")).toBe(false);
  });

  it("strips the flag and keeps the rest of the url", () => {
    expect(
      clearErrorPreview("http://localhost:8081/?preview=error&x=1#top"),
    ).toBe("/?x=1#top");
  });
});
