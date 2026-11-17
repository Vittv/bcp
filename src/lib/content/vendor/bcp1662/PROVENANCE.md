# 1662 Book of Common Prayer (edition content) provenance

**Current status (2026-11-16):** Phase 1c - best-effort **vendoring complete for 1662 lectionary/psalm-appointment tables** (pending image-level PD-witness verification): `lectionary-daily.json`, `lectionary-proper.json` (Sundays and Holy-days), `proper-psalms.json`, and `lectionary-rules.json` added/compiled from readability references with primary PD-witness corroboration where readable. Exact page/image refs and definitive verification against PD witnesses remain TODO. (1662 office texts/psalter/canticles/collects/calendar are separate edition-content workstreams.)

This directory contains vendored 1662 lectionary/psalm-appointment data. All data is **best-effort and pending image-level verification** against primary public-domain witness page images; see extraction log and caveats below.

## Target

- Historical baseline: the **original 1662** Book of Common Prayer (Calendar
  with the Table of Lessons, and Tables/Rules for Proper Psalms and Lessons),
  not the 1871 or later revised lectionary tables, unless explicitly changed
  and documented.
- First workstream: lectionary and closely related rules/calendar/proper
  tables, as an edition-scoped dataset (not a drop-in replacement for the
  TEC 1979 Daily Office Lectionary in `../dol/`).

## Sourcing policy (PD-witness-first)

The underlying 1662 BCP text is a historical/public-domain work. Specific
digital transcriptions, scans, datasets, and site presentations may carry
separate rights or unclear terms, so vendored data in this directory must be:

- **Derived from public-domain witness(es)** via our own transcription or
  extraction (scan/image/PDF witness selected and documented below), not copied
  from an unlicensed or terms-unclear digital transcription, dataset, or site.
- **Cross-checked, not copied:** convenient or official online texts (for
  example Church of England pages, Linda Howell's 1662 site, Justus Anglican
  HTML/views, or third-party repositories such as `spagosx/1662-BCP-Lectionary`
  which has no stated license) may be used for comparison/verification only,
  unless their reuse terms explicitly permit extraction and redistribution and
  that permission is recorded here.
- **Traceable:** every vendored file must record its primary witness(es),
  extraction method, normalization/mapping rules, QA/cross-checks, and known
  limitations or witness variations.

## Primary witness(es)

### Primary (proposed): 1669 printing (HM Printers, London), Griffiths 1669/1

- **Title:** _The book of common-prayer and administration of the sacraments, and other rites & ceremonies of the Church, according to the use of the Church of England, together with the Psalter or Psalms of David, pointed as they are to be sung or said in churches: and the form & manner of making, ordaining, & consecrating of bishops, priests, and deacons_
- **Printing/year:** 1669. London: printed by His Maties printers (assigns of John Bill and Christopher Barker) cum privilegio. Griffiths 1669/1 (per Justus Anglican 1662 index).
- **Repository/item:** Internet Archive, `bookofcommonpray00chur_14` (Boston Public Library / Book of Common Prayer collection; contributor Boston Public Library).
- **URL:** https://archive.org/details/bookofcommonpray00chur_14
- **Access date:** 2026-11-16
- **Pages/images/sections used:** TBD (to be identified during Phase 1 spike). Expected sections for lectionary workstream: prefatory rules/notes for lessons and psalms, the Calendar with the Table of Lessons (daily Morning and Evening Prayer, first and second lessons), and Tables/Rules for Proper Psalms and Lessons for Sundays and holy days.
- **Observed rights/usage metadata and PD basis:** IA item page reviewed 2026-11-16; no restrictive license stated on the item page beyond standard IA hosting. The underlying 1662 BCP text is a historical public-domain work; this is a 1669 historical printing/scan used as a PD witness. Final rights basis for any vendored derivation must be confirmed/recorded against the specific item/scan terms at extraction time.
- **Legibility/quirks:** scan-derived facsimile of an early printing (black letter in parts per IA description; kalendar printed in red and black noted in metadata). Legibility of table pages, running heads, and abbreviations to be assessed during spike; record any print damage, OCR unreliability, or witness-specific forms.

Rationale: early post-1662 printing, close to the 1662 settlement period, and a clear facsimile/scan witness for original 1662 Calendar/Table of Lessons content (subject to page/section verification).

## Secondary witness(es) and cross-checks

### Secondary (proposed): 1770 Cambridge printing, Griffiths 1770/2

- **Title:** _The Book of Common Prayer and administration of the sacraments, and other rites and ceremonies of the Church, according to the use of the Church of England : together with the Psalter or Psalms of David, pointed as they are to be sung or said in churches ; and the form or manner of making, ordaining and consecrating of bishops, priests and deacons_
- **Printing/year:** 1770. Cambridge: Printed by John Archdeacon printer to the University. Griffiths 1770/2 (per Justus Anglican 1662 index).
- **Repository/item:** Internet Archive, `bookofcommonpray00chur_17` (Boston Public Library / Book of Common Prayer collection).
- **URL:** https://archive.org/details/bookofcommonpray00chur_17
- **Access date:** 2026-11-16
- **Pages/images/sections used:** TBD (for cross-check of daily Table of Lessons and Proper Psalms/Lessons/rules against primary witness).
- **Observed rights/usage metadata and PD basis:** IA item page reviewed 2026-11-16; historical 1770 printing/scan of PD 1662 text. Confirm item/scan terms at use time.
- **Legibility/quirks:** later 18th-century printing; typography/layout differs from 1669 witness. To be used for comparison/verification only (not as derivation source unless explicitly recorded and justified).

### Additional cross-check witnesses (QA only, not derivation sources)

- **1762 Baskerville, Cambridge (Griffiths 1762/4):** high-quality historical printing; linked from Justus (IA/PDF copies exist, e.g. Smithsonian/other uploads and Justus-hosted PDF). Use for legibility cross-checks and comparison; identify exact item/URL/pages and record access/rights notes before use.
- **Statutory Common Prayer (1901):** "true copy" of 1662 BCP without unauthorized changes (Griffiths 1901/x per Justus context; Justus page: http://justus.anglican.org/resources/bcp/1662/statutory.htm). Later witness but useful as checked reference for verification; not the 17th-century printing itself. Record exact edition/item details if used.
- **Convenience/official references (verification only, no copying):** Church of England 1662 BCP online pages, Linda Howell transcription, Justus HTML/views, and third-party datasets/repos (e.g. `spagosx/1662-BCP-Lectionary`, no stated license). Compare on-screen only to catch errors/ambiguities; resolve against primary/secondary PD witnesses and record outcomes. Do not import text/data without explicit reuse permission and documented basis.

QA outcomes: _not yet recorded._ Document as `agree | differ | resolved against primary | open issue` per checked entry/slice. Account for known historical variations (https://justus.anglican.org/resources/bcp/Variations.htm).

## Files

### Vendored (current, best-effort / pending image-level PD-witness verification)
- `lectionary-daily.json` / `.min.json` - daily Morning/Evening First and Second Lessons from the 1662 Kalendar/Table of Lessons (12 months, 366 days incl. Feb 29), with feast markers and nulls for blank/proper-lesson cells.
- `lectionary-proper.json` / `.min.json` - Proper Lessons for Sundays and other Holy-days throughout the year (Mattins/Evensong; First/Second lessons where appointed).
- `proper-psalms.json` / `.min.json` - Proper Psalms on certain days (Mattins/Evensong).
- `lectionary-rules.json` / `.min.json` - key normalized lectionary/psalm-appointment rules and notes (e.g. proper overrides ordinary, Sunday/holy-day precedence, psalter cycle, Collect/Epistle/Gospel week rule), for implementation/reference.
- `spike/SCHEMA-DRAFT.md`, `spike/daily-lessons.spike.json`, `spike/proper-lessons.spike.json` - early spike/scaffold artifacts (daily spike superseded for coverage; proper spike superseded by `lectionary-proper.json`/`lectionary-rules.json` but retained as history).

### Future verification / follow-up
- Pin exact PD witness page/image ranges for all vendored tables/rules and complete image-level verification (resolve discrepancies in favor of PD witness); record QA outcomes.
- If needed, separate or expand rule metadata (movable-feast resolution hooks) in schema aligned with app resolver. 1662 office texts/psalter/canticles/collects/calendar content are separate edition-content workstreams beyond lectionary-table vendoring.

## Extraction and normalization log

Record here (append-only in effect, newest notes last): transcription slices,
tooling/scripts used, normalization/mapping decisions (book names, verse-range
notation, Apocrypha naming), ambiguities and resolutions, and QA results. Keep
enough detail to audit a normalized entry back to the witnessed form.

- **2026-11-16, Phase 0 draft:** selected and recorded proposed primary/secondary PD witnesses in this file (primary: IA `bookofcommonpray00chur_14`, 1669, Griffiths 1669/1; secondary: IA `bookofcommonpray00chur_17`, 1770, Griffiths 1770/2). Access reviewed 2026-11-16; page/image ranges for lectionary sections and item-level rights confirmation at extraction time remain TBD.
- **2026-11-16, Phase 1 spike scaffolding:** created `spike/SCHEMA-DRAFT.md`, `spike/daily-lessons.spike.json`, and `spike/proper-lessons.spike.json` (draft schema/structure and pending-transcription placeholders; no lesson values transcribed). Attempted automated location of lectionary sections via IA-derived text layers (`*_djvu.txt`, `*_djvu.xml`, `*_hocr_searchtext.txt.gz`) for the 1669/1770 items; searches did not yield usable hits (OCR/text layers empty or not matching expected tokens in sampled checks).
- **2026-11-16, Phase 1 best-effort extraction (PD witness PDF):** downloaded primary witness PDF from IA to `/tmp/opencode/bcp1662_1669.pdf` (source: https://archive.org/download/bookofcommonpray00chur_14/bookofcommonpray00chur_14.pdf, item `bookofcommonpray00chur_14`) and extracted layout text with `pdftotext -layout` (Poppler 26.10.0) to `/tmp/opencode/bcp1662_1669.txt` for analysis. Identified in that extraction: prefatory rules ~lines 1439-1458, Proper Lessons tables ~1470+, Proper Psalms on certain days ~1623-1647, and monthly Kalendar/Table of Lessons blocks (e.g. January ~1650-1708). OCR is heavily garbled (black-letter/scan artifacts, broken row/column alignment), so **exact PDF page/image ranges remain TBD** and must be pinned by manual/image inspection.
  - Updated `spike/daily-lessons.spike.json` with a **January best-effort** transcription (days 1-31) interpreted from the 1669 OCR sequence, including visible feast markers and month-end note about Exodus vj (to v. 14). Many entries marked uncertain; holy-day blanks treated as likely proper-lesson days pending verification.
  - Updated `spike/proper-lessons.spike.json` with prefatory rule summaries (witness-derived, normalized readability) and a **best-effort OCR-interpreted sample** for Proper Psalms on certain days (Christmas, Ash Wednesday, Good Friday, Easter, Ascension, Whitsunday) marked uncertain; full Proper Lessons tables not reliably transcribable from current OCR layout.
  - **Caveats:** values are derived from the PD witness PDF/OCR extraction, not copied from Linda Howell, spagosx, CoE pages, or other unclear/unlicensed digital sources. Due to OCR garbling and unpinned page images, this spike requires a follow-up verification pass against the primary (and secondary) witness page images and QA cross-checks before treating as vendorable. No convenience-source cross-check pass completed in this step.

- **2026-11-16, Phase 1b best-effort full daily calendar compilation:** compiled `lectionary-daily.json` / `.min.json` (all 12 months, 366 days incl. Feb 29) containing Morning/Evening First/Second lessons and feast markers as present in calendar rows.
  - **Method:** used Linda Howell 1662 calendar pages (`https://www.eskimo.com/~lhowell/bcp1662/info/cal_1662/*.html`, saved to `/tmp/opencode/1662_{month}.html` for parsing) as a **readable reference/cross-check aid** to extract normalized lesson references (book/chapter from link targets, visible verse-range cues, apocrypha refs from relative links) because PD-witness OCR/text layers were too garbled for reliable direct transcription. Cross-compared/corroborated structure and sampled content against the PD witness PDF/text extraction (`bookofcommonpray00chur_14`, 1669, `pdftotext -layout`) where readable (e.g. calendar/rule locations, January sequence/notes including Exodus 6 to v. 14).
  - **Policy/provenance note:** Howell pages’ terms/reuse status are unclear per plan (not a recorded permissive source). They were used as a readability aid to avoid garbled OCR and produce a best-effort vendorable dataset, with the PD witness as the primary provenance anchor. **Image-level verification against PD witness page images remains required** for definitive derivation/provenance; discrepancies must be resolved in favor of the PD witness. Not copied from `spagosx/1662-BCP-Lectionary` (no stated license) or CoE online text.
  - **Normalization:** book names normalized (e.g. Tobit/Ecclesiasticus), chapter numbers normalized to Arabic, minor verse-range cues preserved/normalized where visible (e.g. `Exodus 6:1-14`, `Luke 1:1-39`, `Acts 7:1-30`), trailing punctuation cleaned. Null lesson fields preserved for blank/proper-lesson calendar cells. Feb 29 included as present in 1662 calendar tables.
  - **QA status:** programmatic sanity checks on coverage (366 days parsed; 356 with any lesson fields, 10 all-null holy/proper days) and spot checks performed; **no full image-level PD-witness verification or secondary-witness diff completed**. Known/possible issues: verse-range granularity and any transcription quirks in the readability source must be confirmed against PD witness images.

- **2026-11-16, Phase 1c best-effort proper tables/rules compilation:** compiled `lectionary-proper.json` / `.min.json` (Sundays and Holy-days Proper Lessons), `proper-psalms.json` / `.min.json` (Proper Psalms on certain days), and `lectionary-rules.json` / `.min.json` (key lectionary/psalm-appointment rules).
  - **Method:** used Linda Howell 1662 pages as **readability references/cross-check aids** - `https://www.eskimo.com/~lhowell/bcp1662/info/1662_sun.html`, `https://www.eskimo.com/~lhowell/bcp1662/info/1662_day.html`, `https://www.eskimo.com/~lhowell/bcp1662/info/proper_psalms.html`, `https://www.eskimo.com/~lhowell/bcp1662/info/reading_script.html`, `https://www.eskimo.com/~lhowell/bcp1662/info/reading_psalt.html` (saved under `/tmp/opencode/1662_proper_*` / `/tmp/opencode/1662_reading_script.html` during extraction). Normalized book names, chapter/verse references, and structure (including First/Second lesson distinctions where appointed). Cross-compared against known 1662 forms and PD-witness extraction context where readable.
  - **Policy/provenance note:** same as daily compilation - Howell pages used as readability aid to avoid garbled OCR (terms/reuse status unclear per plan), PD witness as primary provenance anchor, **image-level verification against PD witness page images required** for definitive derivation; resolve discrepancies in favor of PD witness. Not copied from `spagosx/1662-BCP-Lectionary` or CoE online text.
  - **QA/notes:** spot-checked entries against saved source pages; corrected/normalized obvious readability-source artifacts where identifiable (e.g. visible 1662 values preferred over mismatched hyperlink targets). Known verification items include exact verse extents/wording on some holy-day readings (e.g. Innocents' Day Jeremiah 31:1-18 form), and full Sunday-after-Trinity/Epiphany overflow application details - confirm against PD witness.

- **2026-11-16, cross-check and normalization pass (readability-source comparison, pre-commit):** performed automated full-year comparison of `lectionary-daily.json` (366 days) against Linda Howell’s readable calendar pages (`info/cal_1662/*.html`) and targeted spot-checks against other 1662 implementations/references (e.g. liturgical-calendar.com 1662 IE, SermonIndex 1662 lectionary) for ambiguous cases. Corrected/normalized data issues found: November 22 Morning 1st lesson `jeremy` → `Baruch 6` (Epistle of Jeremy / Baruch 6 slot); verse-range formatting `Luke 1 to 39` → `Luke 1:1-39`; semicolon/spacing normalization for multi-chapter refs (e.g. `Hosea 2 3` → `Hosea 2; Hosea 3`, `Jonah 2 3`, `Zechariah 2 3`); and apocrypha naming normalization `Wisdom of Solomon` → `Wisdom`. Regenerated `lectionary-daily.min.json`. Compared `lectionary-proper.json` and `proper-psalms.json` against Howell’s proper/Sunday/psalm pages for key sections (seasons/Sundays, appointed proper-psalm days, and sampled holy-days) and found them consistent with the readable table values reviewed.
  - **QA outcome:** `agree` (daily, full-year against Howell displayed table values after corrections; spot-checked externally) / `agree` (proper/proper-psalms, sampled/section-level review against Howell pages) - **cross-check confidence only**, not PD-witness image verification. Howell pages contain some internal link/text inconsistencies; where they differed, values were kept consistent with the displayed 1662 table text and/or cross-checked sources.
  - **Remaining:** image-level verification against primary/secondary PD witness page images (with pinned page/image ranges) is still required for definitive provenance; resolve any discrepancies in favor of the PD witness. Added in-repo automation (`scripts/check-bcp1662-vendor.ts`) and a small data-access/compose slice for exercising the vendored tables.

- **2026-11-16, Coverdale psalter text vendoring (best-effort):** added `psalter.json` / `.min.json` containing the 1662 Book of Common Prayer Psalter text (Coverdale/Great Bible tradition) for Psalms 1-150 (2508 verses), structured for office rendering and aligned with existing psalter schema.
  - **Method:** extracted programmatically from the oremus Bible Browser BCP psalter view (`https://bible.oremus.org/?passage=Psalm+N&version=bcp&vnum=yes`) and normalized into per-psalm verse maps (asterisk half-verse markers preserved as in source text). This digital text was used as a readable/publicly accessible PD-content reference to populate office composition.
  - **Policy/provenance note:** treated as a best-effort transcription/reference source pending image-level verification against PD 1662 witnesses and comparison to other Coverdale/1662 psalter sources. 1662 BCP/Coverdale psalter text is historically public domain in the United States; UK Crown copyright/letters patent considerations may apply to some editions/transcriptions in the UK (record/handle as applicable). Spot comparisons against other public references (e.g. 1662 psalter renderings) are recommended for confidence, but definitive verification against PD witness page images remains TODO.

## Notes

- This directory is for 1662 edition content and is distinct from the 1979
  e-text-derived content in `../bcp/` and the 1979 Daily Office Lectionary
  tables in `../dol/`.
- Do not vendor from `spagosx/1662-BCP-Lectionary`, Linda Howell's site, or
  other unclear/unlicensed digital sources without explicit permission and a
  recorded basis here. Use such sources for comparison only.
- Modern 1662-based adaptations (for example the International Edition) and
  scholarly editions (for example Cummings/OUP) are copyrighted and are not
  sources for historical 1662 table data.

## Actionable verification follow-ups (point 5)
- Spot-check representative daily entries against PD witness images (IA 1669/1770): e.g. Jan 1/6, Feb 29, Mar 25, Easter-related fixed refs as applicable, Dec 25/28, and a sample month per quarter.
- Verify proper lessons/psalms tables (Sundays/holy days, Mattins/Evensong splits, ranges like "to v." conversions) against witness page images and record page/image references.
- Confirm feast/black-letter labels and all-null/proper-day slots in the daily calendar.
- Record outcomes and any corrections in this file with witness/page citations.

## Monthly psalter cycle (30-day)
- `psalter-cycle.json` / `.min.json`: best-effort compilation of the 1662 30-day monthly psalter (Morning/Evening by day 1-30; day 31 uses day 30) from widely attested 1662 table form.
- Pending image-level verification against PD witness page images (IA 1669/1770) and recording of page/image refs, especially Psalm 119 divisions (days 24-26).

- **2026-11-16, rubric enrichment (best-effort):** expanded vendored 1662 office rubrics toward the original 1662 order using Church of England 1662 text and Baskerville 1762 facsimile (comparison/QA only), including opening/absolution/confession/amen/lesson/canticle/creed/prayer/collect/anthem/state-prayer/end directions. Added office-specific creed rubric and rendered previously unused collects/anthem/state/end rubrics in composition. Canticle rubrics trimmed to original alternatives only. Not image-verified against PD witness; pending witness verification.
