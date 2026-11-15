import { LESSER_FEASTS } from "../../calendar/lesserFeasts";
import {
  monthDayLabel,
  monthDayShortLabel,
  SANCTORALE_ENTRIES,
  sanctoraleDateLabel,
  sanctoraleNameVariants,
} from "../../calendar/sanctorale";
import {
  canticleExists,
  canticlePassage,
  canticleTitle,
} from "../../content/canticles";
import { allCollects, collectText } from "../../content/collects";
import { parsePsalmCitation } from "../../content/psalms";
import {
  psalmIncipit,
  psalmNumbers,
  psalmPassage,
  psalmVerseCount,
} from "../../content/psalter";
import { PSALTER_DAYS, psalterDaySummary } from "../../content/psalterDays";
import type { PsalterDay } from "../../content/types";
import { snippet } from "./helpers";
import type { CollectHit, LesserFeastHit, PsalmHit, SaintHit } from "./types";

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

// lesser feasts matching `query` by name or by either date form. an empty
// query yields all 247 entries in calendar-date order.
export function searchLesserFeasts(query: string): LesserFeastHit[] {
  const q = query.trim().toLowerCase();
  const hits: LesserFeastHit[] = [];
  for (const feast of LESSER_FEASTS) {
    if (q) {
      const matched =
        feast.name.toLowerCase().includes(q) ||
        monthDayLabel(feast.month, feast.day).toLowerCase().includes(q) ||
        monthDayShortLabel(feast.month, feast.day).toLowerCase().includes(q) ||
        (feast.trial === true && "trial use".includes(q));
      if (!matched) continue;
    }
    hits.push({
      slug: feast.slug,
      name: feast.name,
      month: feast.month,
      day: feast.day,
      trial: feast.trial,
      snippet: q ? snippet(feast.name, q) : null,
    });
  }
  return hits;
}

// the 30-day cycle matching `query` by day number or by any psalm number in
// its portions, so "119" finds the three days that carry it. an empty query
// yields all 30 days.
export function searchPsalterDays(query: string): PsalterDay[] {
  const q = query.trim().toLowerCase();
  if (!q) return PSALTER_DAYS;
  const dayNum = q.match(/^(?:day\s*)?(\d{1,2})$/)?.[1];
  return PSALTER_DAYS.filter((day) => {
    if (dayNum) {
      return String(day.day).startsWith(dayNum);
    }
    if (String(day.day).startsWith(q)) return true;
    return [...day.morning, ...day.evening].some((citation) => {
      const parsed = parsePsalmCitation(citation);
      return parsed ? String(parsed.psalm).includes(q) : false;
    });
  });
}

export { canticleExists, canticlePassage, canticleTitle, psalterDaySummary };
