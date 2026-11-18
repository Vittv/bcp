# 1962 Canadian BCP, vendored content provenance

Status: curated from the official ACC PDF, 2026-11-18. The lectionary, psalms, calendar, and rules are vendored. The 1962 psalter text and office text are not vendored.

Text is based on the Book of Common Prayer (1962) of the General Synod of the Anglican Church of Canada. This project is independent and is not endorsed by the Anglican Church of Canada. For the official publication, visit www.anglican.ca/texts.

## Rights basis

On 2026-11-16, Alicia Brown of the Anglican Church of Canada stated that the 1962 Canadian Book of Common Prayer is in the public domain, with no permission, fees, or terms required, and that attribution is suggested. That response supersedes earlier concerns about digital distribution wording. The attribution above is carried in this notice and should be carried in any in-app notice for 1962 content.

## Primary witness

| Field | Value |
| --- | --- |
| Title | The Book of Common Prayer (1962, Canada) |
| Author | The General Synod of the Anglican Church of Canada |
| URL | https://www.anglican.ca/wp-content/uploads/bcp.pdf |
| Local extraction copy | /tmp/opencode/bcp1962-acc.pdf |
| PDF metadata | 792 pages, created 2000-04-01, modified 2025-11-06, producer Acrobat PDFWriter 4.0 |
| Sections used | Calendar pages v to xii, Days of Fasting page xiii, Table of Lessons pages xv to xlv, Proper Psalms pages l to liii, Psalter appointment pages xlix to lv, Collects General Rubrics page 94 |
| Method | Text extracted with pdftotext -layout, facing pages paired manually, ambiguous readings checked against rendered page images |

## Cross-check sources

Lectionary Central, "The Table of Daily Lessons from The Book of Common Prayer Canada 1962", and the Prayer Book Society of Canada "Tables of Psalms" were used only to flag discrepancies. Nothing was transcribed from them. Where a cross-check disagreed with the witness, the witness reading was kept.

## Files

| File | Contents |
| --- | --- |
| lectionary-daily.json | The Table of Lessons, 58 sections, 407 day rows, 1860 citation slots, 4 printed null slots, plus the optional Trinity XXI to XXVI alternative first lessons |
| proper-psalms.json | 110 proper psalm days, including 20 first Evensong rows and the Eucharist columns stored for fidelity |
| special-occasions.json | 7 occasions, including Dominion Day and Remembrance Day |
| psalter-cycle.json | Two alternating 31-day weekday psalm tables, 24 selections, and the appointing rubrics |
| calendar-rules.json | 155 fixed commemorations, the Year I/II rule, lesson table notes, fasting rules, Ember and Rogation definitions, and 8 transfer rules |
| lectionary-rules.json | Rule records documenting resolver intent |
| citation-map.json | Book aliases and the Psalm 119 part rule used by the citation normalizer |

Every table has a minified twin. The check script at scripts/check-bcp1962-vendor.ts validates parity and structural invariants.

## Printed oddities retained verbatim

These were confirmed against rendered page images from the witness. They are likely printing errors, but the vendored data preserves them.

- Advent II, Year I evening first lesson: `Isa. 5. 18–end` where the cross-check reads 5:18-30.
- Epiphany I, Year I morning second lesson: `Matt. 17. 31–13`.
- Epiphany VI, Tuesday morning second lesson: `Acts 23—23. 11`.
- December 29 morning first lesson: `Ruth 1. 1–8`.
- Trinity II, Year II morning second lesson: `Acts 13. 31–13 (14–26)`.
- Trinity V, Monday evening second lesson: `Luke 2. 31–21`.
- Trinity XVI, Year I morning second lesson: `1 Pet. 2. 31–17`.
- Trinity XVIII, Tuesday evening first lesson: `Ezek. 36. .22–end`.
- Michaelmas Eucharist introit: `103. 119–22`.

## Known limitations

- Psalm appointments are raw strings. The resolver maps Psalm 119 parts to verse ranges at read time; the 1962 psalter text itself is not vendored.
- The 50-year moveable-feast tables in the witness are reference tables, not an algorithmic definition. The app computes these values from the shared Easter and Advent primitives.
- Lesson citations keep parenthetical alternatives and verse halves as visible text. The scripture parser currently strips them for lookup.
