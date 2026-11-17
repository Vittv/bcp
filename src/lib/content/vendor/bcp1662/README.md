# 1662 BCP Vendor Data (`bcp1662`)

Best-effort vendored lectionary/psalm-appointment data for the **1662 Book of Common Prayer** (original 1662 form, edition-scoped; not a replacement for 1979/DOL).

## Current contents

- `lectionary-daily.json` / `.min.json` - daily Morning/Evening Prayer First and Second Lessons from the 1662 Kalendar/Table of Lessons, by month/day (366 entries incl. Feb 29). Includes feast markers and nulls for blank/proper-lesson cells.
- `lectionary-proper.json` / `.min.json` - Proper Lessons for Sundays and other Holy-days throughout the year (Mattins/Evensong; First/Second lessons where appointed).
- `proper-psalms.json` / `.min.json` - Proper Psalms on certain days (Mattins/Evensong).
- `psalter-cycle.json` / `.min.json` - 30-day monthly psalter appointments (Morning/Evening) by day of month.
- `psalter.json` / `.min.json` - 1662 Coverdale Psalter text (150 psalms, 2508 verses), best-effort extraction for office rendering.
- `lectionary-rules.json` / `.min.json` - key normalized lectionary/psalm-appointment rules and notes (proper overrides ordinary, Sunday/holy-day precedence, psalter cycle, Sunday collect/epistle/gospel week rule, etc.).
- `office-text/` - vendored office texts, canticles, fixed/proper collects, and related scaffolds for Matins/Evensong composition (best-effort).
- `PROVENANCE.md` - witness selection, sourcing policy, extraction/compilation log, caveats, and QA/verification TODOs (**read before treating as definitive**).
- `spike/` - early schema/partial spike artifacts retained for history.

## Status and caveats

- **Best-effort vendoring complete for lectionary/psalm-appointment tables, pending PD image verification:** compiled using readable 1662 reference pages as cross-check/readability aids because primary public-domain witness OCR (`IA bookofcommonpray00chur_14`, 1669) was garbled; structure/samples were corroborated against that PD witness where readable.
- **Cross-checked (readability sources):** daily lessons were compared full-year against Linda Howell’s readable 1662 calendar tables and spot-checked against other 1662 references, with clear normalization/data corrections applied (see `PROVENANCE.md`). Proper lessons/psalms/rules were reviewed against readable tables for key sections. This is sanity-check confidence, not definitive proof.
- **Not yet image-verified:** exact page/image ranges and image-level verification against PD witnesses are still TODO. Resolve any discrepancies in favor of the PD witness.
- **Scope:** lectionary/appointment tables, Coverdale psalter text, and core office/canticle/collect texts for Matins/Evensong composition are vendored as best-effort data; calendar/movable-feast and rubrical edge cases remain under refinement.

## Automation and usage

- `bun scripts/check-bcp1662-vendor.ts` validates JSON/min parity and basic structure/coverage of the vendored tables.
- `src/lib/content/vendor/bcp1662/index.ts` provides a small data-access/compose slice (daily lookup by month/day, proper-psalm lookup, etc.) for exercising the data. It is **not** a full 1662 calendar/office resolver.

## Usage intent

Edition-scoped data for a 1662 BCP form in the app (parallel to 1979/DOL vendor data), with provenance tracked for redistribution as project assets. See `PROVENANCE.md` for sources, method, and remaining work.
