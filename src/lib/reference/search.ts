import {
  SANCTORALE_ENTRIES,
  monthDayShortLabel,
  sanctoraleDateLabel,
  sanctoraleNameVariants,
} from "../calendar/sanctorale";
import { canticleExists, canticlePassage, canticleTitle } from "../content/canticles";
import { allCollects, collectText } from "../content/collects";
import { getAllKjvBooks } from "../content/kjv";
import {
  psalmIncipit,
  psalmNumbers,
  psalmPassage,
  psalmVerseCount,
} from "../content/psalter";
import type { CollectSection } from "../content/types";

export type PsalmHit = {
  psalm: number;
  incipit: string;
  verses: number;
  // null when the psalm matched by number alone
  snippet: string | null;
};

export type CollectHit = {
  section: CollectSection;
  title: string;
  snippet: string | null;
};

// a short excerpt of `text` centered on the first case-insensitive
// occurrence of `q`, or null when `q` does not occur.
function snippet(text: string, q: string): string | null {
  const at = text.toLowerCase().indexOf(q);
  if (at === -1) return null;
  const from = Math.max(0, at - 30);
  const to = Math.min(text.length, at + q.length + 40);
  return `${from > 0 ? "…" : ""}${text.slice(from, to).trim()}${to < text.length ? "…" : ""}`;
}

// psalms matching `query` by number or verse text, in canonical order.
// an empty query yields the full list with no snippets. a leading "psalm"
// or "ps" prefix (e.g. "Psalm 20") is parsed as an exact psalm number so
// natural phrasing navigates to that psalm rather than matching no text.
export function searchPsalms(query: string): PsalmHit[] {
  const q = query.trim().toLowerCase();
  const numbers = psalmNumbers();
  if (!q) {
    return numbers.map((n) => ({
      psalm: n,
      incipit: psalmIncipit(n) ?? "",
      verses: psalmVerseCount(n),
      snippet: null,
    }));
  }
  const prefixNum = q.match(/^(?:psalms?|ps)\s+(\d+)$/)?.[1];
  const hits: PsalmHit[] = [];
  for (const n of numbers) {
    if (prefixNum) {
      if (String(n) !== prefixNum) continue;
      hits.push({
        psalm: n,
        incipit: psalmIncipit(n) ?? "",
        verses: psalmVerseCount(n),
        snippet: null,
      });
      break;
    }
    let matched: string | null = String(n).includes(q) ? "" : null;
    for (const verse of psalmPassage({ psalm: n })?.verses ?? []) {
      const s = snippet(verse.text, q);
      if (s !== null) {
        matched = s;
        break;
      }
    }
    if (matched !== null) {
      hits.push({
        psalm: n,
        incipit: psalmIncipit(n) ?? "",
        verses: psalmVerseCount(n),
        snippet: matched || null,
      });
    }
  }
  return hits;
}

// collects matching `query` by title or by either rite's text, one hit
// per collect in printed order. an empty query yields the full list.
export function searchCollects(query: string): CollectHit[] {
  const q = query.trim().toLowerCase();
  const hits: CollectHit[] = [];
  for (const entry of allCollects()) {
    if (!q) {
      hits.push({ section: entry.section, title: entry.title, snippet: null });
      continue;
    }
    const s =
      snippet(entry.title, q) ??
      snippet(
        collectText("traditional", entry.section, entry.title) ?? "",
        q,
      ) ??
      snippet(collectText("contemporary", entry.section, entry.title) ?? "", q);
    if (s !== null) {
      hits.push({ section: entry.section, title: entry.title, snippet: s });
    }
  }
  return hits;
}

export type SaintHit = {
  slug: string;
  title: string;
  month: number;
  day: number;
  eveOf?: string;
  snippet: string | null;
};

// holy days and saints matching `query` by proper title or by any exact
// name variant (e.g. "Saint James" matches both the July feast and the
// brother-of-our-Lord feast). an empty query yields all 36 entries in
// calendar-date order.
export function searchSaints(query: string): SaintHit[] {
  const q = query.trim().toLowerCase();
  const hits: SaintHit[] = [];
  for (const entry of SANCTORALE_ENTRIES) {
    if (q) {
      const names = sanctoraleNameVariants(entry);
      const matched =
        names.some((v) => v.toLowerCase().includes(q)) ||
        sanctoraleDateLabel(entry).toLowerCase().includes(q);
      if (!matched) continue;
    }
    hits.push({
      slug: entry.slug,
      title: entry.title,
      month: entry.month,
      day: entry.day,
      eveOf: entry.eveOf,
      snippet: q ? snippet(entry.title, q) : null,
    });
  }
  return hits;
}

// global palette: every section's index folds into one searchable record
// set so the Ctrl+K palette can jump straight to any reading. each entry
// carries the run that reopens that reading on its own page, so the
// picker only needs switch + navigate once a result is chosen.
export type PaletteSection =
  | "psalms"
  | "proverbs"
  | "canticles"
  | "collects"
  | "saints"
  | "bible";

export type PaletteRun =
  | { kind: "psalm"; psalm: number }
  | { kind: "proverb"; chapter: number }
  | { kind: "canticle"; number: number }
  | { kind: "collect"; section: string; title: string }
  | { kind: "saint"; slug: string }
  | { kind: "bible"; book: string; chapter: number };

export type PaletteEntry = {
  id: string;
  section: PaletteSection;
  label: string;
  detail?: string;
  run: PaletteRun;
};

// the canonical section order of the global palette's headings
export const PALETTE_SECTION_ORDER: PaletteSection[] = [
  "psalms",
  "proverbs",
  "canticles",
  "collects",
  "saints",
  "bible",
];

// per-section and total caps keep a long query (e.g. a psalm text) from
// flooding the merged result list
const PER_SECTION_CAP = 8;
const TOTAL_CAP = 40;

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

// one merged result list across every picker section, in printed order.
// an empty query yields nothing: the global palette starts blank and only
// fills as the user types.
export function searchPalette(query: string): PaletteEntry[] {
  const q = query.trim();
  if (!q) return [];
  const out: PaletteEntry[] = [];
  const lower = q.toLowerCase();

  // psalms: number, "psalm N" prefix, or verse-text matches
  const psalmHits = searchPsalms(q).slice(0, PER_SECTION_CAP);
  pushEntries(
    out,
    psalmHits.map((h) => ({
      id: `psalm:${h.psalm}`,
      section: "psalms",
      label: h.incipit || `Psalm ${h.psalm}`,
      detail: `Psalm ${h.psalm} · ${h.verses} verse${h.verses === 1 ? "" : "s"}`,
      run: { kind: "psalm", psalm: h.psalm },
    })),
  );

  // proverbs: "proverbs"/"prov"/"chapter n", or a bare digit sequence
  const provNum = lower.match(/(?:chapter\D*)?(\d+)/)?.[1];
  if (lower.includes("prov") || lower.includes("chapter") || provNum) {
    const provHits: PaletteEntry[] = [];
    for (let n = 1; n <= 31 && provHits.length < PER_SECTION_CAP; n++) {
      const matched =
        provNum !== undefined
          ? String(n).includes(provNum)
          : lower.includes("prov");
      if (!matched) continue;
      provHits.push({
        id: `proverb:${n}`,
        section: "proverbs",
        label: `Chapter ${n}`,
        run: { kind: "proverb", chapter: n },
      });
    }
    pushEntries(out, provHits);
  }

  // canticles: "canticle(s)" or a number lists in order, otherwise title
  const canticleWild = lower.includes("canticle") || /^\d+$/.test(lower);
  const canticleHits: PaletteEntry[] = [];
  for (let n = 1; n <= 21 && canticleHits.length < PER_SECTION_CAP; n++) {
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
    canticleHits.push({
      id: `canticle:${n}`,
      section: "canticles",
      label: title,
      detail: `Canticle ${n} · ${verses} verse${verses === 1 ? "" : "s"}`,
      run: { kind: "canticle", number: n },
    });
  }
  pushEntries(out, canticleHits);

  // collects: any rite's title or text
  const collectHits = searchCollects(q).slice(0, PER_SECTION_CAP);
  pushEntries(
    out,
    collectHits.map((h) => ({
      id: `collect:${h.section}:${h.title}`,
      section: "collects",
      label: h.title,
      detail: collectSectionLabel(h.section),
      run: { kind: "collect", section: h.section, title: h.title },
    })),
  );

  // saints and holy days by proper title or name variant
  const saintHits = searchSaints(q).slice(0, PER_SECTION_CAP);
  pushEntries(
    out,
    saintHits.map((h) => ({
      id: `saint:${h.slug}`,
      section: "saints",
      label: h.title,
      detail: monthDayShortLabel(h.month, h.day),
      run: { kind: "saint", slug: h.slug },
    })),
  );

  // bible: full book names and abbreviations
  const bibleHits = getAllKjvBooks()
    .filter(
      (b) =>
        b.book.toLowerCase().includes(lower) ||
        b.abbrev.toLowerCase().includes(lower),
    )
    .slice(0, PER_SECTION_CAP);
  pushEntries(
    out,
    bibleHits.map((b) => ({
      id: `bible:${b.abbrev}`,
      section: "bible",
      label: b.book,
      detail: `${b.testament === "OT" ? "Old Testament" : "New Testament"} · ${b.chapters} chapters`,
      run: { kind: "bible", book: b.abbrev, chapter: 1 },
    })),
  );

  return out;
}
