#!/usr/bin/env bun
/**
 * Generate the psalter's 30-day cycle from the headings in the vendored
 * psalter text. The headings name the portion that opens after the verse
 * carrying them, so the table is a walk through the psalms with each heading
 * closing one portion and opening the next.
 *
 * Usage: bun scripts/gen-psalter-days.ts
 *
 * The output is committed; the test in src/lib/content/__tests__ re-derives
 * the same table, so a re-extraction that drops or moves a heading fails.
 */

import { writeFileSync } from "node:fs";
import {
  derivePsalterDays,
  PSALTER_DAY_COUNT,
} from "../src/lib/content/psalterCycle";
import { psalterSchema } from "../src/lib/content/schemas";
import psalter from "../src/lib/content/vendor/bcp/psalter.min.json";

const OUT = "src/lib/content/vendor/bcp/psalter-days.min.json";

const days = derivePsalterDays(psalterSchema.parse(psalter));
if (days.length !== PSALTER_DAY_COUNT) {
  throw new Error(`expected ${PSALTER_DAY_COUNT} days, got ${days.length}`);
}

writeFileSync(OUT, JSON.stringify(days));
console.log(`wrote ${OUT}: ${days.length} days`);
