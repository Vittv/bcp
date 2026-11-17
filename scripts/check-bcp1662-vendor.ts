#!/usr/bin/env bun
/**
 * Validate the vendored 1662 BCP lectionary/psalm-appointment tables.
 *
 * Checks JSON/minified parity and basic structural/coverage invariants so the
 * best-effort dataset stays consistent and reviewable. This does NOT verify
 * historical correctness against PD witness page images (see PROVENANCE.md).
 *
 * Usage: bun scripts/check-bcp1662-vendor.ts
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

const base = path.join("src", "lib", "content", "vendor", "bcp1662");

const months = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

const daysIn: Record<(typeof months)[number], number> = {
  january: 31,
  february: 29,
  march: 31,
  april: 30,
  may: 31,
  june: 30,
  july: 31,
  august: 31,
  september: 30,
  october: 31,
  november: 30,
  december: 31,
};

// biome-ignore lint/suspicious/noExplicitAny: script-level JSON parsing of heterogeneous vendor files
async function readJson(name: string): Promise<any> {
  return JSON.parse(await readFile(path.join(base, name), "utf8"));
}

function fail(msg: string, failures: string[]) {
  failures.push(msg);
}

async function main() {
  const failures: string[] = [];

  const daily = await readJson("lectionary-daily.json");
  const dailyMin = await readJson("lectionary-daily.min.json");
  const proper = await readJson("lectionary-proper.json");
  const properMin = await readJson("lectionary-proper.min.json");
  const psalms = await readJson("proper-psalms.json");
  const psalmsMin = await readJson("proper-psalms.min.json");
  const cycle = await readJson("psalter-cycle.json");
  const cycleMin = await readJson("psalter-cycle.min.json");
  const rules = await readJson("lectionary-rules.json");
  const rulesMin = await readJson("lectionary-rules.min.json");
  const psalter = await readJson("psalter.json");
  const psalterMin = await readJson("psalter.min.json");

  for (const [name, a, b] of [
    ["lectionary-daily", daily, dailyMin],
    ["lectionary-proper", proper, properMin],
    ["proper-psalms", psalms, psalmsMin],
    ["psalter-cycle", cycle, cycleMin],
    ["lectionary-rules", rules, rulesMin],
    ["psalter", psalter, psalterMin],
  ] as const) {
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      fail(`${name}.min.json does not match ${name}.json`, failures);
    }
  }

  // daily
  if (daily?.meta?.edition !== "1662")
    fail("daily.meta.edition !== 1662", failures);
  if (!Array.isArray(daily?.meta?.sources) || daily.meta.sources.length === 0) {
    fail("daily.meta.sources missing/empty", failures);
  }
  if (
    JSON.stringify(Object.keys(daily?.months ?? {})) !== JSON.stringify(months)
  ) {
    fail("daily.months keys/order unexpected", failures);
  }
  let total = 0;
  for (const m of months) {
    const md = daily.months?.[m];
    if (!md || typeof md !== "object") {
      fail(`daily missing month ${m}`, failures);
      continue;
    }
    const keys = Object.keys(md);
    if (keys.length !== daysIn[m]) {
      fail(
        `daily ${m} has ${keys.length} days, expected ${daysIn[m]}`,
        failures,
      );
    }
    for (let d = 1; d <= daysIn[m]; d++) {
      const e = md[String(d)];
      if (!e) {
        fail(`daily missing ${m} ${d}`, failures);
        continue;
      }
      total++;
      for (const office of ["morning", "evening"] as const) {
        const o = e[office];
        if (!o || !("first" in o) || !("second" in o)) {
          fail(`daily ${m} ${d} missing ${office} slots`, failures);
        } else {
          if (
            !(o.first === null || typeof o.first === "string") ||
            !(o.second === null || typeof o.second === "string")
          ) {
            fail(`daily ${m} ${d} ${office} slot not string|null`, failures);
          }
        }
      }
      if ("feast" in e && e.feast != null && typeof e.feast !== "string") {
        fail(`daily ${m} ${d} feast not string`, failures);
      }
    }
  }
  if (total !== 366) fail(`daily total ${total}, expected 366`, failures);

  // proper lessons
  if (proper?.meta?.edition !== "1662")
    fail("proper.meta.edition !== 1662", failures);
  if (!Array.isArray(proper?.sundays) || proper.sundays.length === 0) {
    fail("proper.sundays missing/empty", failures);
  }
  if (!Array.isArray(proper?.holyDays)) {
    fail("proper.holyDays missing", failures);
  }

  // proper psalms
  if (psalms?.meta?.edition !== "1662")
    fail("psalms.meta.edition !== 1662", failures);
  if (!Array.isArray(psalms?.days) || psalms.days.length === 0) {
    fail("psalms.days missing/empty", failures);
  }
  for (const d of psalms.days ?? []) {
    if (!d?.name || !Array.isArray(d.mattins) || !Array.isArray(d.evensong)) {
      fail(`psalms entry invalid: ${JSON.stringify(d?.name)}`, failures);
    }
  }

  // monthly psalter cycle (30-day)
  if (cycle?.meta?.edition !== "1662")
    fail("cycle.meta.edition !== 1662", failures);
  const cdays = cycle?.days;
  if (!cdays || typeof cdays !== "object") {
    fail("cycle.days missing", failures);
  } else {
    for (let d = 1; d <= 30; d++) {
      const e = cdays[String(d)];
      if (!e || !Array.isArray(e.morning) || !Array.isArray(e.evening)) {
        fail(`cycle day ${d} missing morning/evening arrays`, failures);
      } else {
        for (const x of e.morning) {
          if (typeof x !== "string") {
            fail(`cycle day ${d} has non-string psalm refs`, failures);
            break;
          }
        }
        for (const x of e.evening) {
          if (typeof x !== "string") {
            fail(`cycle day ${d} has non-string psalm refs`, failures);
            break;
          }
        }
      }
    }
    const extra = Object.keys(cdays).filter(
      (k) => Number(k) < 1 || Number(k) > 30,
    );
    if (extra.length)
      fail(`cycle unexpected day keys: ${extra.join(",")}`, failures);
  }

  // rules
  if (rules?.meta?.edition !== "1662")
    fail("rules.meta.edition !== 1662", failures);
  if (!Array.isArray(rules?.rules) || rules.rules.length === 0) {
    fail("rules.rules missing/empty", failures);
  }
  const ids = rules.rules.map((r: { id?: string }) => r?.id);
  if (new Set(ids).size !== ids.length) fail("rules ids not unique", failures);
  for (const r of rules.rules ?? []) {
    if (!r?.id || !r?.summary)
      fail(`rule missing id/summary: ${JSON.stringify(r)}`, failures);
  }

  // coverdale psalter text (1662)
  if (!psalter || typeof psalter !== "object") {
    fail("psalter missing", failures);
  } else {
    let pcount = 0;
    let vcount = 0;
    for (let n = 1; n <= 150; n++) {
      const p = psalter[String(n)];
      if (!p || !Array.isArray(p.parts) || p.parts.length === 0) {
        fail(`psalter missing psalm ${n}`, failures);
        continue;
      }
      pcount++;
      let hasVerse = false;
      for (const part of p.parts) {
        if (!part || typeof part.verses !== "object" || !part.verses) {
          fail(`psalter psalm ${n} has invalid part/verses`, failures);
          continue;
        }
        const keys = Object.keys(part.verses);
        if (keys.length > 0) hasVerse = true;
        vcount += keys.length;
      }
      if (!hasVerse) fail(`psalter psalm ${n} has no verses`, failures);
    }
    if (pcount !== 150)
      fail(`psalter has ${pcount} psalms, expected 150`, failures);
    if (vcount === 0) fail("psalter has no verses", failures);
  }

  if (failures.length) {
    console.error("bcp1662 vendor check failed:");
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  const psalmVerseCount = psalter
    ? // SAFETY: vendored psalter JSON validated above to be a psalm-number-keyed map of parts/verses.
      Object.values(
        psalter as Record<
          string,
          { parts: Array<{ verses: Record<string, string> }> }
        >,
      ).reduce(
        (s, p) =>
          s +
          (p.parts ?? []).reduce(
            (ss, part) => ss + Object.keys(part.verses ?? {}).length,
            0,
          ),
        0,
      )
    : 0;
  console.log(
    `✓ bcp1662 vendor tables OK (daily ${total} days, proper sundays ${proper.sundays.length} seasons, holyDays ${proper.holyDays.length}, proper-psalm days ${psalms.days.length}, cycle 30 days, rules ${rules.rules.length}, psalter 150 psalms/${psalmVerseCount} verses)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
