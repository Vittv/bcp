import { describe, expect, test } from "bun:test";
import { FEAST_REGISTRY } from "../feastsByTradition";
import { LESSER_FEAST_BIOS } from "../lesserFeastBios";
import { LESSER_FEASTS } from "../lesserFeasts";
import {
  LESSER_FEAST_WIKI,
  wikipediaArticleUrl,
  wikipediaSearchUrl,
} from "../lesserFeastWiki";
import { OLDER_FEAST_BIOS } from "../olderFeastBios";
import { OLDER_FEAST_WIKI } from "../olderFeastWiki";
import { SANCTORALE_BIOS } from "../sanctoraleBios";
import { SANCTORALE_WIKI } from "../sanctoraleWiki";

const january = LESSER_FEASTS.filter((feast) => feast.month === 1);
const registrySlugs = new Set(FEAST_REGISTRY.map((feast) => feast.slug));
const bio = (slug: string) =>
  SANCTORALE_BIOS[slug] ?? LESSER_FEAST_BIOS[slug] ?? OLDER_FEAST_BIOS[slug];
const wiki = (slug: string) =>
  SANCTORALE_WIKI[slug] ?? LESSER_FEAST_WIKI[slug] ?? OLDER_FEAST_WIKI[slug];

describe("feast biographies", () => {
  test("every biography belongs to a feast", () => {
    for (const map of [SANCTORALE_BIOS, LESSER_FEAST_BIOS, OLDER_FEAST_BIOS]) {
      for (const slug of Object.keys(map)) {
        expect(registrySlugs.has(slug)).toBe(true);
      }
    }
  });

  test("every entry carries an original biography", () => {
    for (const feast of FEAST_REGISTRY) {
      expect(bio(feast.slug)?.trim().length).toBeGreaterThan(0);
    }
  });

  test("biographies are prose, not the date fallback", () => {
    for (const map of [SANCTORALE_BIOS, LESSER_FEAST_BIOS, OLDER_FEAST_BIOS]) {
      for (const text of Object.values(map)) {
        expect(text).not.toContain("Commemorated on");
        expect(text.length).toBeGreaterThan(80);
      }
    }
  });

  test("biographies use no em dashes", () => {
    for (const map of [SANCTORALE_BIOS, LESSER_FEAST_BIOS, OLDER_FEAST_BIOS]) {
      for (const text of Object.values(map)) {
        expect(text).not.toContain("\u2014");
      }
    }
  });
});

describe("feast wikipedia links", () => {
  test("every article link belongs to a feast", () => {
    for (const map of [SANCTORALE_WIKI, LESSER_FEAST_WIKI, OLDER_FEAST_WIKI]) {
      for (const slug of Object.keys(map)) {
        expect(registrySlugs.has(slug)).toBe(true);
      }
    }
  });

  test("every entry has a resolved wikipedia link set", () => {
    for (const feast of FEAST_REGISTRY) {
      expect(wiki(feast.slug)).toBeDefined();
    }
  });

  test("january's entries have a verified article", () => {
    for (const feast of january) {
      expect(LESSER_FEAST_WIKI[feast.slug]?.length).toBeGreaterThan(0);
    }
  });

  test("every article link has a title and a well formed url", () => {
    for (const map of [SANCTORALE_WIKI, LESSER_FEAST_WIKI, OLDER_FEAST_WIKI]) {
      for (const links of Object.values(map)) {
        for (const link of links) {
          expect(link.title.trim().length).toBeGreaterThan(0);
          expect(
            wikipediaArticleUrl(link.title).startsWith(
              "https://en.wikipedia.org/wiki/",
            ),
          ).toBe(true);
        }
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
