# 1662 lectionary spike - draft schema (Phase 1)

Status: draft, informed by known 1662 BCP structure and the lectionary
workstream in `~/.viai/dev/bcp/plan/PLAN-1662-BCP-EDITION.md`. Not derived from
or copied from any unlicensed digital transcription/dataset. Actual lesson
values must be transcribed from the selected PD witness(es) recorded in
`../PROVENANCE.md` and cross-checked against secondary witnesses.

## Target form

Original 1662 Calendar with the Table of Lessons and Tables/Rules for Proper
Psalms and Lessons (not 1871/later revised tables), as an edition-scoped
dataset distinct from TEC 1979 DOL (`../../dol/`).

## Daily Calendar with the Table of Lessons (`daily-lessons.spike.json`)

One-year daily appointments by civil calendar date. Each day provides Morning
Prayer and Evening Prayer lessons (traditionally first and second lessons).

Proposed shape (illustrative, to be refined by spike transcription):

```json
{
  "meta": {
    "form": "1662-original",
    "primaryWitness": "<id/ref from PROVENANCE.md>",
    "sections": "<page/image refs>",
    "status": "spike|partial|complete"
  },
  "months": {
    "january": {
      "1": {
        "morning": { "first": "<ref>", "second": "<ref>" },
        "evening": { "first": "<ref>", "second": "<ref>" },
        "notes": []
      }
    }
  }
}
```

Notes to capture during transcription:
- calendar/feast markers printed on the day (record as witnessed; resolution to
  office behavior is integration work)
- alternates, footnotes, or special markers (do not drop silently)
- leap-year day handling as presented in witness
- book-name/abbreviation and verse-range notation as witnessed, plus explicit
  normalized mapping (separate mapping table/log)

## Proper Psalms and Lessons (`proper-lessons.spike.json`)

Tables/Rules for Sundays and holy days, including movable/seasonal
dependencies and precedence notes as specified in the witness.

Proposed shape (illustrative):

```json
{
  "meta": {
    "form": "1662-original",
    "primaryWitness": "<id/ref from PROVENANCE.md>",
    "sections": "<page/image refs>",
    "status": "spike|partial|complete"
  },
  "fixed": [
    {
      "label": "<witness label, e.g. holy day name>",
      "psalms": { "morning": [], "evening": [] },
      "lessons": {
        "morning": { "first": "<ref>", "second": "<ref>" },
        "evening": { "first": "<ref>", "second": "<ref>" }
      },
      "notes": []
    }
  ],
  "moveable": [
    {
      "label": "<e.g. Sunday/season label as witnessed>",
      "rule": "<text/structured rule metadata as witnessed>",
      "psalms": {},
      "lessons": {},
      "notes": []
    }
  ],
  "rules": [
    { "id": "<stable key>", "text": "<witnessed rule text/summary>", "notes": [] }
  ]
}
```

## Normalization and mapping (to record in PROVENANCE/log)

- keep witnessed reference strings (or a traceable source form) alongside any
  normalized app/scripture identifiers
- record book-name/abbreviation mapping (including Apocrypha/deuterocanonical
  names as they appear) and verse-range notation conventions
- record ambiguities, illegible/damaged print, and cross-check outcomes
  (`agree | differ | resolved against primary | open issue`)

## Spike scope (Phase 1)

- identify exact page/image ranges in primary witness for daily calendar table,
  proper tables, and prefatory rules/notes
- transcribe **one full calendar month** of daily lessons (recommended: January)
  plus associated rule/heading text needed to interpret it
- transcribe a **small Proper Psalms/Lessons sample** (a few fixed holy days or
  Sundays) to exercise table/rule structure
- cross-check spike entries against secondary PD witness and convenience
  references (verification only), resolving against primary witness
