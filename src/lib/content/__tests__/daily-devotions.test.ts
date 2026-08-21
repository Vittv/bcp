import { describe, expect, test } from "bun:test";
import { office, officeExists, officeList, officeSections } from "../offices";
import type { OfficeItem } from "../types";

type TextItem = Extract<OfficeItem, { kind: "text" }>;

const DEVOTION_IDS = [
  "devotions-morning",
  "devotions-noon",
  "devotions-evening",
  "devotions-close",
] as const;

describe("daily devotions", () => {
  test("all four devotions resolve through the office registry", () => {
    for (const id of DEVOTION_IDS) {
      expect(officeExists(id), id).toBe(true);
      expect(office(id)?.sections.length, id).toBe(1);
    }
  });

  test("names match the book", () => {
    expect(office("devotions-morning")?.name).toBe(
      "Daily Devotion: In the Morning",
    );
    expect(office("devotions-noon")?.name).toBe("Daily Devotion: At Noon");
    expect(office("devotions-evening")?.name).toBe(
      "Daily Devotion: In the Early Evening",
    );
    expect(office("devotions-close")?.name).toBe(
      "Daily Devotion: At the Close of Day",
    );
  });

  test("the seven main offices remain the printed-order list", () => {
    expect(officeList().map((o) => o.id)).not.toContain("devotions-morning");
    expect(officeList()).toHaveLength(7);
  });

  test("per-devotion item counts are stable", () => {
    const counts: Record<(typeof DEVOTION_IDS)[number], number> = {
      "devotions-morning": 17,
      "devotions-noon": 16,
      "devotions-evening": 14,
      "devotions-close": 17,
    };
    for (const id of DEVOTION_IDS) {
      const total = officeSections(id).reduce((n, s) => n + s.items.length, 0);
      expect(total, id).toBe(counts[id]);
    }
  });

  test("each devotion carries its appointed psalm and reading", () => {
    const headings = (id: (typeof DEVOTION_IDS)[number]) =>
      officeSections(id)[0]?.items.filter((i) => i.kind === "heading") ?? [];
    expect(headings("devotions-morning").map((h) => h.text)).toEqual([
      "From Psalm 51",
      "A Reading",
      "The Lord's Prayer",
      "The Collect",
    ]);
    expect(headings("devotions-noon").map((h) => h.text)).toEqual([
      "From Psalm 113",
      "A Reading",
      "The Lord's Prayer",
      "The Collect",
    ]);
    expect(headings("devotions-close").map((h) => h.text)).toEqual([
      "Psalm 134",
      "A Reading",
      "The Lord's Prayer",
      "The Collect",
    ]);
    const reading = (id: (typeof DEVOTION_IDS)[number]) =>
      headings(id).find((h) => h.text === "A Reading");
    expect(reading("devotions-morning")?.citation).toBe("1 Peter 1:3");
    expect(reading("devotions-noon")?.citation).toBe("Isaiah 26:3; 30:15");
    expect(reading("devotions-evening")?.citation).toBe("2 Corinthians 4:5-6");
    expect(reading("devotions-close")?.citation).toBe("Jeremiah 14:9, 22");
  });

  test("Noon keeps the 'or this' alternate collect in the data", () => {
    const items = officeSections("devotions-noon")[0]?.items ?? [];
    const collectAt = items.findIndex(
      (i) => i.kind === "text" && i.text.startsWith("Blessed Savior"),
    );
    expect(items[collectAt + 1]).toEqual({
      kind: "option",
      text: "or this",
    });
    const alternate = items[collectAt + 2];
    expect(alternate?.kind).toBe("text");
    if (alternate?.kind === "text") {
      // SAFETY: kind narrowed above.
      expect(alternate.text).toContain("my own peace I leave with you");
    }
  });

  test("versicles and the Lord's Prayer are said by all; readings are unattributed", () => {
    for (const id of DEVOTION_IDS) {
      const items = officeSections(id)[0]?.items ?? [];
      const ourFather = items.find(
        (i): i is TextItem =>
          i.kind === "text" && i.text.startsWith("Our Father"),
      );
      expect(ourFather?.speaker, id).toBe("all");
      const reading = items.find(
        (i): i is TextItem =>
          i.kind === "text" && i.text.startsWith("Blessed be the God"),
      );
      if (reading) expect(reading.speaker, id).toBeUndefined();
    }
  });
});
