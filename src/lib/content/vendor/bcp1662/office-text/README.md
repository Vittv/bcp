# 1662 Office Text (scaffold)

Planned vendored 1662 office content for full Matins/Evensong composition (1979-depth parity, adapted to 1662 structure). **Not yet extracted/populated.**

## Intended contents
- `offices.json` / `.min.json`: Morning Prayer (Matins), Evening Prayer (Evensong), Litany (and other daily forms as scoped) — orders, rubrics, fixed texts, versicles/responses, section structure.
- `canticles.json` / `.min.json`: 1662 canticles and appointment/rubric context.
- `psalter.json` / `.min.json` and `psalter-cycle.json`: 1662 Coverdale Psalter text and 30-day monthly cycle/rules (incl. 31st-day/appointed handling).
- `collects.json` / `.min.json`: collects and proper material required for office/calendar context.

## Sourcing/provenance (required before vendoring)
- **Primary derivation must be from public-domain witness(es)** (e.g. 1662-era/early printing or other PD facsimiles/scans, with identity/URL/date recorded), transcribed/extracted by us.
- Use convenience/modern transcriptions only for cross-check/QA unless explicit reuse terms permit vendoring.
- Document witnesses, extraction/normalization, cross-checks, and caveats in `../PROVENANCE.md` (or a dedicated provenance file) following the repo’s vendor practice.

See `~/.viai/dev/bcp/plan/PLAN-1662-BCP-EDITION.md` for the full sourcing/extraction process.
