# BCP text extraction tooling

These scripts generate the `src/lib/content/vendor/bcp/*.min.json` artifacts
from the public-domain "Book of Common Prayer (1979) E-text Edition, Version
1.0, 13 December 1993" files (BCPSALT1, BCPSALT2, BCPOFFCE, BCPCOLCT), with
the pdftotext output of the printed 2007 BCP and Wikisource as cross-checks.
See `src/lib/content/vendor/bcp/PROVENANCE.md` for the provenance narrative.

The raw source files and intermediate JSON artifacts are not stored in the
repo (the printed-book pdftotext is not freely redistributable). Point the
scripts at them with:

    BCP_SCRATCH=/path/to/scratch  BCP_SOURCES=/path/to/sources  python3 <script>

`paths.py` resolves defaults: scratch and sources default to `/tmp/bcp`, and
the repo vendor directory is located relative to this directory. Scripts that
import a sibling module (verify_collects.py) must be run from this directory.

## Pipeline

- `extract_psalter.py`     -> psalter.min.json
- `extract_canticles.py`   -> canticles.min.json
- `extract_offices.py`     -> offices.min.json (and offices.json in scratch)
- collects:
  `extract_collects.py` -> collects.json; `parse_pdf_collects.py` and
  `parse_wikisource*.py` build the reference texts; `gen_patches.py` derives
  the corrections, `patch_collects.py` applies them, `verify_collects.py`
  confirms every entry against the authoritative text, and
  `gen_collects_min.py` emits collects.min.json.

## Sources expected

- bcpsalt1.txt, bcpsalt2.txt, bcpoffce.txt, bcpcolct.txt, bcplectn.txt
  (the BCP10.TXT family of E-texts)
- bcp2007.txt (pdftotext -layout of the printed 2007 BCP, used only as a
  cross-check reference)
- wikisource_trad_raw.txt, wikisource_cont_raw.txt (Wikisource captures,
  used only for adjudicated collects corrections)

`extract_offices.py` additionally reads the repo's canticles.min.json to
normalize the embedded canticle headings to the printed "N Title Latin" form.
