import { monthDayShortLabel } from "../../calendar/sanctorale";
import {
  ALL_SCRIPTURE_BOOKS,
  type ApocryphaCorpus,
  dcBooks,
  getScriptureBookMeta,
} from "../../content/bible";
import { getAllKjvBooks } from "../../content/kjv";
import { parseDolRef } from "../../content/scripture";
import { filterSearch } from "../../search";
import { visibleSettings } from "../../settings";
import {
  canticleExists,
  canticlePassage,
  canticleTitle,
  psalterDaySummary,
  searchCollects,
  searchLesserFeasts,
  searchPsalms,
  searchPsalterDays,
  searchSaints,
} from "./individual";
import {
  type PaletteEntry,
  type PaletteSection,
  PER_SECTION_CAP,
  TOTAL_CAP,
} from "./types";

const COLLECT_SECTION_LABELS: Record<string, string> = {
  "church-year": "The Church Year",
  "holy-days": "Holy Days",
  "common-of-saints": "Common of Saints",
  "various-occasions": "Various Occasions",
};

function collectSectionLabel(section: string): string {
  return COLLECT_SECTION_LABELS[section] ?? section;
}

function pushEntries(out: PaletteEntry[], entries: PaletteEntry[]): void {
  for (const e of entries) {
    if (out.length >= TOTAL_CAP) return;
    out.push(e);
  }
}

function psalmEntries(query: string, cap = Infinity): PaletteEntry[] {
  return searchPsalms(query)
    .slice(0, cap)
    .map((h) => ({
      id: `psalm:${h.psalm}`,
      section: "psalms",
      label: h.incipit || `Psalm ${h.psalm}`,
      detail: `Psalm ${h.psalm} · ${h.verses} verse${h.verses === 1 ? "" : "s"}`,
      run: { kind: "psalm", psalm: h.psalm },
    }));
}

function psalterEntries(query: string, cap = Infinity): PaletteEntry[] {
  return searchPsalterDays(query)
    .slice(0, cap)
    .map((day) => ({
      id: `psalter:${day.day}`,
      section: "psalter",
      label: `Day ${day.day}`,
      detail: psalterDaySummary(day),
      run: { kind: "psalterDay", day: day.day },
    }));
}

function proverbEntries(lower: string, cap = Infinity): PaletteEntry[] {
  const provNum = lower.match(/(?:chapter\D*)?(\d+)/)?.[1];
  if (
    provNum === undefined &&
    !lower.includes("prov") &&
    !lower.includes("chapter")
  ) {
    return [];
  }
  const out: PaletteEntry[] = [];
  for (let n = 1; n <= 31 && out.length < cap; n++) {
    const matched =
      provNum !== undefined
        ? String(n).includes(provNum)
        : lower.includes("prov");
    if (!matched) continue;
    out.push({
      id: `proverb:${n}`,
      section: "proverbs",
      label: `Chapter ${n}`,
      run: { kind: "proverb", chapter: n },
    });
  }
  return out;
}

function canticleEntries(lower: string, cap = Infinity): PaletteEntry[] {
  const canticleWild = lower.includes("canticle") || /^\d+$/.test(lower);
  const out: PaletteEntry[] = [];
  for (let n = 1; n <= 21 && out.length < cap; n++) {
    if (!canticleExists(n)) continue;
    const title = canticleTitle(n) ?? "";
    const verses =
      canticlePassage(n)?.sections.reduce(
        (sum, s) => sum + s.verses.length,
        0,
      ) ?? 0;
    const matched =
      canticleWild ||
      title.toLowerCase().includes(lower) ||
      String(n).startsWith(lower);
    if (!matched) continue;
    out.push({
      id: `canticle:${n}`,
      section: "canticles",
      label: title,
      detail: `Canticle ${n} · ${verses} verse${verses === 1 ? "" : "s"}`,
      run: { kind: "canticle", number: n },
    });
  }
  return out;
}

function collectEntries(query: string, cap = Infinity): PaletteEntry[] {
  return searchCollects(query)
    .slice(0, cap)
    .map((h) => ({
      id: `collect:${h.section}:${h.title}`,
      section: "collects",
      label: h.title,
      detail: collectSectionLabel(h.section),
      run: { kind: "collect", section: h.section, title: h.title },
    }));
}

function saintEntries(query: string, cap = Infinity): PaletteEntry[] {
  return searchSaints(query)
    .slice(0, cap)
    .map((h) => ({
      id: `saint:${h.slug}`,
      section: "saints",
      label: h.title,
      detail: monthDayShortLabel(h.month, h.day),
      run: { kind: "saint", slug: h.slug },
    }));
}

function lesserFeastEntries(query: string, cap = Infinity): PaletteEntry[] {
  return searchLesserFeasts(query)
    .slice(0, cap)
    .map((h) => ({
      id: `lesser-feast:${h.slug}`,
      section: "lesser-feasts",
      label: h.name,
      detail: `${monthDayShortLabel(h.month, h.day)}${h.trial ? " · Trial use" : ""}`,
      run: { kind: "lesserFeast", slug: h.slug },
    }));
}

// settings sections fold into the same palette using the shared rail-search
// matcher, so "theme" or "shortcuts" reaches the matching settings pane
function settingsEntries(query: string, cap = Infinity): PaletteEntry[] {
  return filterSearch(query, visibleSettings())
    .slice(0, cap)
    .map((s) => ({
      id: `settings:${s.id}`,
      section: "settings",
      label: s.title,
      detail: s.description,
      run: { kind: "settings", section: s.id },
    }));
}

// a query that is exactly a category name lists that whole section, so
// "psalm" returns all 150, "bible" every chapter, "old/new testament"
// that half, and "apocrypha" the deuterocanonical set. anything more
// specific keeps the normal capped matches
type BibleExpansion = { testament?: "OT" | "NT" };

function bibleKeyword(lower: string): BibleExpansion | null {
  if (lower === "bible") return {};
  const t = lower.match(/^(old|new) testament$/)?.[1];
  return t ? { testament: t === "old" ? "OT" : "NT" } : null;
}

// the deuterocanonical books answer to their own vocabulary rather than
// folding into the canonical "bible" search, so the corpus's books never
// cited by the lectionary cannot crowd out the 66 that are
function apocryphaKeyword(lower: string): boolean {
  return ["apocrypha", "apocryphal", "deuterocanonical"].includes(lower);
}

function sectionKeyword(lower: string): PaletteSection | null {
  const keywords: [PaletteSection, readonly string[]][] = [
    ["psalms", ["psalm", "psalms"]],
    ["psalter", ["psalter", "30-day psalter", "30 day psalter"]],
    ["proverbs", ["proverb", "proverbs", "prov"]],
    ["canticles", ["canticle", "canticles"]],
    ["collects", ["collect", "collects"]],
    ["saints", ["saint", "saints"]],
    [
      "lesser-feasts",
      [
        "lesser feast",
        "lesser feasts",
        "lesser feast and fasts",
        "lesser feasts and fasts",
        "lff",
        "commemoration",
        "commemorations",
      ],
    ],
    ["settings", ["settings", "preferences"]],
  ];
  for (const [section, names] of keywords) {
    if (names.includes(lower)) return section;
  }
  return null;
}

function expandSection(section: PaletteSection): PaletteEntry[] {
  switch (section) {
    case "psalms":
      return psalmEntries("");
    case "psalter":
      return psalterEntries("");
    case "proverbs":
      return proverbEntries("prov");
    case "canticles":
      return canticleEntries("canticle");
    case "collects":
      return collectEntries("");
    case "saints":
      return saintEntries("");
    case "lesser-feasts":
      return lesserFeastEntries("");
    case "settings":
      return settingsEntries("");
    default:
      return [];
  }
}

function expandBible(expansion: BibleExpansion): PaletteEntry[] {
  const books = getAllKjvBooks().filter(
    (b) => !expansion.testament || b.testament === expansion.testament,
  );
  const out: PaletteEntry[] = [];
  for (const b of books) {
    for (let chapter = 1; chapter <= b.chapters; chapter++) {
      out.push({
        id: `bible:${b.abbrev}:${chapter}`,
        section: "bible",
        label: `${b.book} ${chapter}`,
        run: { kind: "bible", book: b.abbrev, chapter },
      });
    }
  }
  return out;
}

// the deuterocanonical books of the corpus the reader has selected. the
// corpus is a book list and a text together, so the palette lists the
// books the reader can actually open and nothing else
function expandApocrypha(corpus: ApocryphaCorpus): PaletteEntry[] {
  const out: PaletteEntry[] = [];
  for (const b of dcBooks(corpus)) {
    for (let chapter = 1; chapter <= b.chapters; chapter++) {
      out.push({
        id: `apocrypha:${b.abbrev}:${chapter}`,
        section: "apocrypha",
        label: `${b.book} ${chapter}`,
        run: { kind: "bible", book: b.abbrev, chapter },
      });
    }
  }
  return out;
}

// a book + chapter (and optional verse) reference like "John 4" or "Jn 4:16"
function scriptureRefEntries(
  query: string,
  corpus: ApocryphaCorpus,
): PaletteEntry[] {
  const parsed = parseDolRef(ALL_SCRIPTURE_BOOKS, query);
  if (!parsed) return [];
  const meta = getScriptureBookMeta(parsed.book);
  if (!meta) return [];
  if (parsed.chapter < 1 || parsed.chapter > meta.chapters) return [];
  const chapterLabel =
    parsed.verseStart !== undefined ? `${meta.book} ${parsed.chapter}` : null;
  if (meta.testament === "DC") {
    // show it when the selected corpus contains this book
    if (!dcBooks(corpus).some((b) => b.abbrev === meta.abbrev)) return [];
    return [
      {
        id: `apocrypha:${meta.abbrev}:${parsed.chapter}`,
        section: "apocrypha",
        label: `${meta.book} ${parsed.chapter}`,
        detail: chapterLabel
          ? "Apocrypha"
          : `Apocrypha · ${meta.chapters} chapters`,
        run: { kind: "bible", book: meta.abbrev, chapter: parsed.chapter },
      },
    ];
  }
  return [
    {
      id: `bible:${meta.abbrev}:${parsed.chapter}`,
      section: "bible",
      label: `${meta.book} ${parsed.chapter}`,
      detail: `${meta.testament === "OT" ? "Old Testament" : "New Testament"} · ${meta.chapters} chapters`,
      run: { kind: "bible", book: meta.abbrev, chapter: parsed.chapter },
    },
  ];
}

// one merged result list across every picker section, in printed order.
// an empty query stays blank; an exact section name expands to its full
// listing, otherwise each section returns capped content matches. the
// corpus is the reader's selected deuterocanonical corpus, which decides
// the apocryphal book list and the text those books are read in
export function searchPalette(
  query: string,
  corpus: ApocryphaCorpus,
): PaletteEntry[] {
  const q = query.trim();
  if (!q) return [];
  const out: PaletteEntry[] = [];
  const lower = q.toLowerCase();

  const bibleExpansion = bibleKeyword(lower);
  if (bibleExpansion) return expandBible(bibleExpansion);
  if (apocryphaKeyword(lower)) return expandApocrypha(corpus);
  const section = sectionKeyword(lower);
  if (section) return expandSection(section);

  // a direct scripture reference like "John 4" or "Wis 1:1"
  const refHits = scriptureRefEntries(q, corpus);
  pushEntries(out, refHits);
  const refIds = new Set(refHits.map((h) => h.id));

  pushEntries(out, psalmEntries(q, PER_SECTION_CAP));
  pushEntries(out, psalterEntries(q, PER_SECTION_CAP));
  pushEntries(out, proverbEntries(lower, PER_SECTION_CAP));
  pushEntries(out, canticleEntries(lower, PER_SECTION_CAP));
  pushEntries(out, collectEntries(q, PER_SECTION_CAP));
  pushEntries(out, saintEntries(q, PER_SECTION_CAP));
  pushEntries(out, lesserFeastEntries(q, PER_SECTION_CAP));
  pushEntries(out, settingsEntries(q, PER_SECTION_CAP));

  // bible: full book names and abbreviations
  const bibleHits = getAllKjvBooks()
    .filter(
      (b) =>
        (b.book.toLowerCase().includes(lower) ||
          b.abbrev.toLowerCase().includes(lower)) &&
        !refIds.has(`bible:${b.abbrev}`),
    )
    .slice(0, PER_SECTION_CAP);
  pushEntries(
    out,
    bibleHits
      .filter(
        (b) =>
          !refHits.some(
            (r) => r.run.kind === "bible" && r.run.book === b.abbrev,
          ),
      )
      .map((b) => ({
        id: `bible:${b.abbrev}`,
        section: "bible",
        label: b.book,
        detail: `${b.testament === "OT" ? "Old Testament" : "New Testament"} · ${b.chapters} chapters`,
        run: { kind: "bible", book: b.abbrev, chapter: 1 },
      })),
  );

  // apocrypha: its own section, so "sirach" or "wis" lands here rather than
  // competing with the canonical hits for the same eight-row budget. the
  // citation names catch the books the corpus files under another name, so
  // a search for Susanna finds it under the WEB's Daniel (Greek)
  const apocryphaHits = dcBooks(corpus)
    .filter(
      (b) =>
        (b.book.toLowerCase().includes(lower) ||
          b.abbrev.toLowerCase().includes(lower) ||
          (b.citationNames ?? []).some((n) =>
            n.toLowerCase().includes(lower),
          )) &&
        !refHits.some((r) => r.run.kind === "bible" && r.run.book === b.abbrev),
    )
    .slice(0, PER_SECTION_CAP);
  pushEntries(
    out,
    apocryphaHits.map((b) => ({
      id: `apocrypha:${b.abbrev}`,
      section: "apocrypha",
      label: b.book,
      detail: `Apocrypha · ${b.chapters} chapters`,
      run: { kind: "bible", book: b.abbrev, chapter: 1 },
    })),
  );

  return out;
}
