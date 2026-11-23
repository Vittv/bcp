import { describe, expect, it } from "bun:test";
import { BASE_OFFICES } from "../../../screens/reference/shared/model";
import { composeBcp1979Litany, get1979LitanyLines } from "../litany";

const at = { year: 2026, month: 11, day: 18 };

describe("1979 Great Litany", () => {
  it("vendors the full text with rubrics, headings and spoken lines", () => {
    const lines = get1979LitanyLines();
    expect(lines.length).toBeGreaterThan(100);
    expect(lines[0].kind).toBe("rubric");
    expect(lines[0].text).toContain("especially in Lent and on Rogation days");
    expect(lines.filter((l) => l.kind === "rubric").length).toBe(8);
    expect(lines.filter((l) => l.kind === "heading").length).toBe(8);
    expect(
      lines.some(
        (l) =>
          l.kind === "text" &&
          l.text.includes("From lightning and tempest") &&
          l.speaker === "officiant",
      ),
    ).toBe(true);
  });

  it("composes as a standalone office with speakers and a date", () => {
    const doc = composeBcp1979Litany(at);
    expect(doc.edition).toBe("1979");
    expect(doc.officeName).toBe("The Litany");
    expect(doc.date).toEqual(at);
    expect(doc.nodes[0].kind).toBe("rubric");
    const speakers = new Set(
      doc.nodes.flatMap((n) =>
        n.kind === "text" && n.speaker ? [n.speaker] : [],
      ),
    );
    expect(speakers.has("officiant")).toBe(true);
    expect(speakers.has("people")).toBe(true);
    expect(speakers.has("all")).toBe(true);
  });

  it("keeps the printed order of the major sections", () => {
    const doc = composeBcp1979Litany(at);
    const heading = (text: string) =>
      doc.nodes.findIndex((n) => n.kind === "heading" && n.text === text);
    expect(heading("The Invocations")).toBeLessThan(heading("The Deprecation"));
    expect(heading("The Deprecation")).toBeLessThan(
      heading("The Supplication"),
    );
    expect(heading("The Supplication")).toBeLessThan(heading("The Grace"));
    expect(heading("The Grace")).toBeLessThan(
      heading("A Supplication for Times of Trouble"),
    );
    expect(
      doc.nodes.some(
        (n) =>
          n.kind === "rubric" &&
          n.text.startsWith("When the Litany is sung or said"),
      ),
    ).toBe(true);
  });

  it("splits the Lord's Prayer into petitions for the shared renderer", () => {
    const doc = composeBcp1979Litany(at);
    const petitions = doc.nodes.filter(
      (n) => n.kind === "text" && n.lordsPrayer,
    );
    expect(petitions.length).toBeGreaterThan(1);
    expect(
      petitions.filter((n) => n.kind === "text" && n.lordsPrayerFirst).length,
    ).toBe(1);
    expect(
      petitions.filter((n) => n.kind === "text" && n.lordsPrayerLast).length,
    ).toBe(1);
    expect(
      doc.nodes.some(
        (n) =>
          n.kind === "text" &&
          n.lordsPrayer &&
          n.text.includes("hallowed be thy Name"),
      ),
    ).toBe(true);
  });

  it("is offered as a tab in the 1979 offices bar", () => {
    expect(BASE_OFFICES.some((o) => o.id === "litany")).toBe(true);
  });
});
