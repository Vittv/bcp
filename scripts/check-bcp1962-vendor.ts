#!/usr/bin/env bun
/**
 * Validate the vendored 1962 Canadian BCP lectionary/calendar tables.
 *
 * Checks JSON/minified parity and basic structural/coverage invariants. This
 * does not verify historical correctness against the ACC witness page images,
 * see PROVENANCE.md for that record.
 *
 * Usage: bun scripts/check-bcp1962-vendor.ts
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

const base = path.join("src", "lib", "content", "vendor", "bcp1962");

const tables = [
  "lectionary-daily",
  "proper-psalms",
  "special-occasions",
  "psalter-cycle",
  "lectionary-rules",
  "calendar-rules",
  "citation-map",
] as const;

const seasons = new Set([
  "advent",
  "christmastide",
  "after-christmas",
  "epiphany",
  "pre-lent",
  "lent",
  "holy-week",
  "easter-week",
  "easter",
  "ascension",
  "whitsunday",
  "trinity",
  "before-advent",
]);

type LessonPair = { first?: string | null; second?: string | null };
type LessonSet = { morning?: LessonPair; evening?: LessonPair };
type DayEntry = {
  label?: string;
  common?: LessonSet;
  years?: Record<"1" | "2", LessonSet>;
  marks?: string[];
  note?: string;
};
type Section = {
  id?: string;
  label?: string;
  season?: string;
  week?: number | null;
  days?: Record<string, DayEntry>;
};
type ProperPsalmDay = {
  id?: string;
  name?: string;
  mattins?: string | null;
  evensong?: string | null;
  firstEvensong?: string;
};
type Occasion = {
  id?: string;
  name?: string;
  psalms?: string;
  lessons?: string[];
};
type MonthSet = {
  id?: string;
  months?: number[];
  days?: Record<string, { mattins?: string; evensong?: string }>;
};
type Selection = { id?: number; psalms?: string };
type Rule = { id?: string; summary?: string };
type Commemoration = { month?: number; day?: number; name?: string };
type TransferRule = { id?: string; text?: string };
type AlternativeLessons = {
  years?: Record<
    "1" | "2",
    Record<string, { morning: string; evening: string }>
  >;
};

type PsalmPart = { title?: string | null; verses?: Record<string, string> };
type Psalter = Record<string, { parts?: PsalmPart[] }>;
type LitanyLine = {
  kind?: string;
  text?: string;
  speaker?: string;
};
type Litany = { meta?: { edition?: string }; lines?: LitanyLine[] };
type ProperCollect = { name?: string; text?: string };
type ProperCollects = {
  meta?: { edition?: string };
  collects?: ProperCollect[];
};

type VendorTable = {
  meta?: { edition?: string; sources?: unknown[] };
  sections?: Section[];
  alternativeFirstLessons?: AlternativeLessons;
  days?: ProperPsalmDay[];
  occasions?: Occasion[];
  monthSets?: MonthSet[];
  selections?: Selection[];
  rules?: Rule[];
  fixedCalendar?: Commemoration[];
  transferRules?: TransferRule[];
  bookAliases?: Array<[string, string]>;
  psalmParts?: { partCount?: number; versesPerPart?: number };
};

async function readJson<T>(name: string): Promise<T> {
  const text = await readFile(path.join(base, name), "utf8");
  // SAFETY: vendored static JSON parsed at validation time, checked by this script.
  return JSON.parse(text) as T;
}

function fail(msg: string, failures: string[]) {
  failures.push(msg);
}

function checkLessonSet(
  set: LessonSet | undefined,
  where: string,
  failures: string[],
) {
  for (const office of ["morning", "evening"] as const) {
    const o = set?.[office];
    if (!o || !("first" in o) || !("second" in o)) {
      fail(`${where} missing ${office} slots`, failures);
      continue;
    }
    if (!(o.first === null || typeof o.first === "string")) {
      fail(`${where} ${office}.first not string|null`, failures);
    }
    if (!(o.second === null || typeof o.second === "string")) {
      fail(`${where} ${office}.second not string|null`, failures);
    }
  }
}

async function main() {
  const failures: string[] = [];
  const data: Record<string, VendorTable> = {};
  const min: Record<string, VendorTable> = {};

  for (const name of tables) {
    data[name] = await readJson<VendorTable>(`${name}.json`);
    min[name] = await readJson<VendorTable>(`${name}.min.json`);
    if (JSON.stringify(data[name]) !== JSON.stringify(min[name])) {
      fail(`${name}.min.json does not match ${name}.json`, failures);
    }
    if (data[name].meta?.edition !== "1962") {
      fail(`${name}.meta.edition !== 1962`, failures);
    }
    if (
      !Array.isArray(data[name].meta?.sources) ||
      data[name].meta?.sources?.length === 0
    ) {
      fail(`${name}.meta.sources missing/empty`, failures);
    }
  }

  const daily = data["lectionary-daily"];
  const sections = daily.sections;
  if (!Array.isArray(sections) || sections.length === 0) {
    fail("daily.sections missing/empty", failures);
  } else {
    const ids = sections.map((s) => s.id);
    if (new Set(ids).size !== ids.length)
      fail("daily section ids not unique", failures);
    let dayRows = 0;
    let citations = 0;
    let nulls = 0;
    for (const s of sections) {
      if (!s.id || !s.label) {
        fail(
          `daily section missing id/label: ${JSON.stringify(s.id)}`,
          failures,
        );
      }
      if (!s.season || !seasons.has(s.season)) {
        fail(`daily section ${s.id} season invalid: ${s.season}`, failures);
      }
      const days = s.days;
      if (!days || typeof days !== "object") {
        fail(`daily section ${s.id} days missing`, failures);
        continue;
      }
      dayRows += Object.keys(days).length;
      for (const [key, entry] of Object.entries(days)) {
        const isSunday = key === "sunday" || entry?.years != null;
        if (isSunday) {
          if (!entry?.years?.["1"] || !entry?.years?.["2"]) {
            fail(`daily ${s.id} ${key} missing a year variant`, failures);
          }
          for (const y of ["1", "2"] as const) {
            checkLessonSet(
              entry?.years?.[y],
              `daily ${s.id} ${key} year ${y}`,
              failures,
            );
          }
        } else {
          if (!entry?.common)
            fail(`daily ${s.id} ${key} missing common`, failures);
          checkLessonSet(entry?.common, `daily ${s.id} ${key}`, failures);
        }
        const sets: Array<LessonSet | undefined> = isSunday
          ? [entry?.years?.["1"], entry?.years?.["2"]]
          : [entry?.common];
        for (const set of sets) {
          for (const office of ["morning", "evening"] as const) {
            for (const slot of ["first", "second"] as const) {
              const v = set?.[office]?.[slot];
              if (v === null) nulls++;
              else if (typeof v === "string") citations++;
            }
          }
        }
      }
    }
    if (sections.length !== 58)
      fail(`daily has ${sections.length} sections, expected 58`, failures);
    if (dayRows !== 407)
      fail(`daily has ${dayRows} day rows, expected 407`, failures);
    if (citations !== 1860)
      fail(`daily has ${citations} citations, expected 1860`, failures);
    if (nulls !== 4)
      fail(`daily has ${nulls} null slots, expected 4`, failures);

    const alt = daily.alternativeFirstLessons?.years;
    if (!alt?.["1"] || !alt?.["2"]) {
      fail("daily.alternativeFirstLessons.years missing", failures);
    } else {
      for (const y of ["1", "2"] as const) {
        if (Object.keys(alt[y]).length !== 6) {
          fail(
            `alternativeFirstLessons year ${y} has ${Object.keys(alt[y]).length} entries, expected 6`,
            failures,
          );
        }
      }
    }
  }

  const psalms = data["proper-psalms"];
  const psalmDays = psalms.days;
  if (!Array.isArray(psalmDays) || psalmDays.length === 0) {
    fail("proper-psalms.days missing/empty", failures);
  } else {
    const ids = psalmDays.map((d) => d.id);
    if (new Set(ids).size !== ids.length)
      fail("proper-psalms ids not unique", failures);
    let firstEvensong = 0;
    for (const d of psalmDays) {
      if (!d.id || !d.name) {
        fail(
          `proper psalms entry missing id/name: ${JSON.stringify(d.id)}`,
          failures,
        );
      }
      for (const key of ["mattins", "evensong"] as const) {
        if (!(d[key] === null || typeof d[key] === "string")) {
          fail(`proper psalms ${d.id} ${key} not string|null`, failures);
        }
      }
      if (d.firstEvensong) firstEvensong++;
    }
    if (psalmDays.length !== 110) {
      fail(
        `proper psalms has ${psalmDays.length} days, expected 110`,
        failures,
      );
    }
    if (firstEvensong < 1)
      fail("proper psalms has no first Evensong rows", failures);
  }

  const occasions = data["special-occasions"].occasions;
  if (!Array.isArray(occasions) || occasions.length === 0) {
    fail("special-occasions.occasions missing/empty", failures);
  } else {
    const ids = occasions.map((o) => o.id);
    if (new Set(ids).size !== ids.length)
      fail("special-occasions ids not unique", failures);
    for (const o of occasions) {
      if (!o.id || !o.name || typeof o.psalms !== "string") {
        fail(`special occasion invalid: ${JSON.stringify(o.id)}`, failures);
      }
      if (!Array.isArray(o.lessons) || o.lessons.length === 0) {
        fail(`special occasion ${o.id} lessons missing/empty`, failures);
      }
    }
    if (occasions.length !== 7) {
      fail(
        `special occasions has ${occasions.length} entries, expected 7`,
        failures,
      );
    }
  }

  const sets = data["psalter-cycle"].monthSets;
  if (!Array.isArray(sets) || sets.length !== 2) {
    fail("psalter-cycle.monthSets missing or not exactly 2", failures);
  } else {
    const months = sets.flatMap((s) => s.months ?? []);
    if (new Set(months).size !== 12) {
      fail("psalter-cycle months do not cover 1..12 once", failures);
    }
    for (const s of sets) {
      const keys = Object.keys(s.days ?? {});
      if (keys.length !== 31) {
        fail(
          `psalter-cycle set ${s.id} has ${keys.length} days, expected 31`,
          failures,
        );
      }
      for (let d = 1; d <= 31; d++) {
        const e = s.days?.[String(d)];
        if (typeof e?.mattins !== "string" || typeof e?.evensong !== "string") {
          fail(`psalter-cycle ${s.id} day ${d} slots invalid`, failures);
        }
      }
    }
    const selections = data["psalter-cycle"].selections;
    if (!Array.isArray(selections) || selections.length !== 24) {
      fail(
        `psalter-cycle has ${selections?.length} selections, expected 24`,
        failures,
      );
    }
  }

  const rules = data["lectionary-rules"].rules;
  if (!Array.isArray(rules) || rules.length === 0) {
    fail("lectionary-rules.rules missing/empty", failures);
  } else {
    const ids = rules.map((r) => r.id);
    if (new Set(ids).size !== ids.length)
      fail("lectionary-rules ids not unique", failures);
    for (const r of rules) {
      if (!r.id || !r.summary)
        fail(`rule missing id/summary: ${JSON.stringify(r)}`, failures);
    }
  }

  const fixed = data["calendar-rules"].fixedCalendar;
  if (!Array.isArray(fixed) || fixed.length === 0) {
    fail("calendar-rules.fixedCalendar missing/empty", failures);
  } else if (fixed.length !== 155) {
    fail(`calendar has ${fixed.length} commemorations, expected 155`, failures);
  }
  const transfers = data["calendar-rules"].transferRules;
  if (!Array.isArray(transfers) || transfers.length !== 8) {
    fail("calendar-rules.transferRules missing or not exactly 8", failures);
  }

  const aliases = data["citation-map"].bookAliases;
  if (!Array.isArray(aliases) || aliases.length === 0) {
    fail("citation-map.bookAliases missing/empty", failures);
  }
  const parts = data["citation-map"].psalmParts;
  if (parts?.partCount !== 22 || parts?.versesPerPart !== 8) {
    fail("citation-map.psalmParts invalid", failures);
  }

  const psalter = await readJson<Psalter>("psalter.json");
  const psalterMin = await readJson<Psalter>("psalter.min.json");
  if (JSON.stringify(psalter) !== JSON.stringify(psalterMin)) {
    fail("psalter.min.json does not match psalter.json", failures);
  }
  // the 1962 book omits Psalm 58 and renumbers the verses after each omission.
  const psalmKeys = Object.keys(psalter)
    .map(Number)
    .sort((a, b) => a - b);
  const expectedKeys = Array.from({ length: 150 }, (_, i) => i + 1).filter(
    (n) => n !== 58,
  );
  if (JSON.stringify(psalmKeys) !== JSON.stringify(expectedKeys)) {
    fail("psalter keys are not 1..150 excluding Psalm 58", failures);
  }
  let verseCount = 0;
  for (const [num, psalm] of Object.entries(psalter)) {
    if (!Array.isArray(psalm.parts) || psalm.parts.length === 0) {
      fail(`psalter ${num} parts missing/empty`, failures);
      continue;
    }
    for (const part of psalm.parts) {
      if (!part.verses || typeof part.verses !== "object") {
        fail(`psalter ${num} part verses missing`, failures);
        continue;
      }
      for (const [v, text] of Object.entries(part.verses)) {
        if (typeof text !== "string" || text.trim() === "") {
          fail(`psalter ${num}:${v} empty/non-string verse`, failures);
        }
        verseCount++;
      }
    }
  }
  if (verseCount !== 2489) {
    fail(`psalter has ${verseCount} verses, expected 2489`, failures);
  }

  const litany = await readJson<Litany>("office-text/litany.json");
  const litanyMin = await readJson<Litany>("office-text/litany.min.json");
  if (JSON.stringify(litany) !== JSON.stringify(litanyMin)) {
    fail("office-text/litany.min.json does not match litany.json", failures);
  }
  if (litany.meta?.edition !== "1962") {
    fail("litany.meta.edition !== 1962", failures);
  }
  const litanyLines = litany.lines;
  if (!Array.isArray(litanyLines) || litanyLines.length === 0) {
    fail("litany.lines missing/empty", failures);
  } else {
    for (const [i, line] of litanyLines.entries()) {
      if (!["rubric", "heading", "text"].includes(line.kind ?? "")) {
        fail(`litany line ${i} invalid kind: ${line.kind}`, failures);
      }
      if (typeof line.text !== "string" || line.text.trim() === "") {
        fail(`litany line ${i} empty/non-string text`, failures);
      }
      if (
        line.speaker &&
        !["minister", "people", "all"].includes(line.speaker)
      ) {
        fail(`litany line ${i} invalid speaker: ${line.speaker}`, failures);
      }
    }
    if (litanyLines[0]?.kind !== "rubric") {
      fail("litany first line is not a rubric", failures);
    }
    if (litanyLines[litanyLines.length - 1]?.kind !== "rubric") {
      fail("litany last line is not a rubric", failures);
    }
  }

  const properCollects = await readJson<ProperCollects>(
    "office-text/collects-proper.json",
  );
  const properCollectsMin = await readJson<ProperCollects>(
    "office-text/collects-proper.min.json",
  );
  if (JSON.stringify(properCollects) !== JSON.stringify(properCollectsMin)) {
    fail(
      "office-text/collects-proper.min.json does not match collects-proper.json",
      failures,
    );
  }
  if (properCollects.meta?.edition !== "1962") {
    fail("collects-proper.meta.edition !== 1962", failures);
  }
  const properList = properCollects.collects;
  if (!Array.isArray(properList) || properList.length === 0) {
    fail("collects-proper.collects missing/empty", failures);
  } else {
    const names = new Set<string>();
    for (const [i, c] of properList.entries()) {
      if (typeof c.name !== "string" || c.name.trim() === "") {
        fail(`collects-proper ${i} missing name`, failures);
      } else if (names.has(c.name)) {
        fail(`collects-proper duplicate name: ${c.name}`, failures);
      } else {
        names.add(c.name);
      }
      if (typeof c.text !== "string" || c.text.trim() === "") {
        fail(`collects-proper ${i} missing text`, failures);
      }
    }
  }

  if (failures.length) {
    console.error("bcp1962 vendor check failed:");
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log(
    `✓ bcp1962 vendor tables OK (daily ${sections?.length} sections/407 rows/1860 refs, proper psalms ${psalmDays?.length} days, occasions ${occasions?.length}, cycle 2x31 days/24 selections, rules ${rules?.length}, calendar ${fixed?.length} commemorations, psalter ${psalmKeys.length} psalms/${verseCount} verses, litany ${litanyLines?.length} lines, proper collects ${properList?.length})`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
