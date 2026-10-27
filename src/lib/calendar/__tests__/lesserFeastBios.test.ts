import { describe, expect, test } from "bun:test";
import { LESSER_FEAST_BIOS } from "../lesserFeastBios";
import { LESSER_FEASTS, lesserFeastBySlug } from "../lesserFeasts";
import {
  LESSER_FEAST_WIKI,
  wikipediaArticleUrl,
  wikipediaSearchUrl,
} from "../lesserFeastWiki";

const january = LESSER_FEASTS.filter((feast) => feast.month === 1);

describe("lesser feast biographies", () => {
  test("every biography belongs to a feast", () => {
    for (const slug of Object.keys(LESSER_FEAST_BIOS)) {
      expect(lesserFeastBySlug(slug)).toBeDefined();
    }
  });

  test("every entry carries an original biography", () => {
    for (const feast of LESSER_FEASTS) {
      expect(LESSER_FEAST_BIOS[feast.slug]?.trim().length).toBeGreaterThan(0);
    }
  });

  test("biographies are prose, not the date fallback", () => {
    for (const bio of Object.values(LESSER_FEAST_BIOS)) {
      expect(bio).not.toContain("Commemorated on");
      expect(bio.length).toBeGreaterThan(80);
    }
  });

  test("biographies use no em dashes", () => {
    for (const bio of Object.values(LESSER_FEAST_BIOS)) {
      expect(bio).not.toContain("\u2014");
    }
  });
});

describe("lesser feast wikipedia links", () => {
  test("every article link belongs to a feast", () => {
    for (const slug of Object.keys(LESSER_FEAST_WIKI)) {
      expect(lesserFeastBySlug(slug)).toBeDefined();
    }
  });

  test("january's entries have a verified article", () => {
    for (const feast of january) {
      expect(LESSER_FEAST_WIKI[feast.slug]?.length).toBeGreaterThan(0);
    }
  });

  test("every article link has a title and a well formed url", () => {
    for (const links of Object.values(LESSER_FEAST_WIKI)) {
      for (const link of links) {
        expect(link.title.trim().length).toBeGreaterThan(0);
        expect(
          wikipediaArticleUrl(link.title).startsWith(
            "https://en.wikipedia.org/wiki/",
          ),
        ).toBe(true);
      }
    }
  });

  test("the search fallback is well formed", () => {
    expect(
      wikipediaSearchUrl(
        "Elizabeth Ann Seton, Vowed Religious and Educator, 1821",
      ),
    ).toBe(
      "https://en.wikipedia.org/wiki/Special:Search?search=Elizabeth%20Ann%20Seton%2C%20Vowed%20Religious%20and%20Educator%2C%201821",
    );
  });
});
