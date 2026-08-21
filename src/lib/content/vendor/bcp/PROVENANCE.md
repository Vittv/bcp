# Psalter and Daily Office text provenance

The files in this directory (psalter.min.json, and the offices/collects
files that follow) are derived from the "Book of Common Prayer (1979)
E-text Edition, Version 1.0, 13 December 1993" (the BCP10.TXT / bcp10.txt
files served as BCPSALT1, BCPSALT2, BCPOFFCE, BCPCOLCT).

That E-text states in its header that it is in the PUBLIC DOMAIN:

  "This file, which should be called BCP10.TXT or bcp10.txt, is in the
   PUBLIC DOMAIN. You may make copies, distribute them, produce derivative
   works, reformat, and make extracts from it."

The text of the 1979 Book of Common Prayer is additionally licensed for
reproduction by the Church Pension Fund, but the E-text edition above is
the redistribution basis used here.

Each file records its extraction script (in tools/bcp-extract, run against
the E-text sources in a scratch directory; see tools/bcp-extract/README.md)
and checksum in this note.

## Extraction notes

- psalter.min.json: extracted from BCPSALT1/BCPSALT2 by
  tools/bcp-extract/extract_psalter.py. 150 psalms, 2507 verses. Latin
  incipits were not captured (part titles are null).
- canticles.min.json: extracted from BCPOFFCE by
  tools/bcp-extract/extract_canticles.py. Canticles 1-21. Known E-text
  transcription quirks preserved verbatim: canticle 6 line reads "good will
  towards mean." (the source's spelling of "men"); canticle 13 has no title
  line in the source, so the BCP title "A Song of Praise" was supplied;
  canticle 12 note text is captured in the "note" field.
- collects.min.json: extracted from BCPCOLCT by
  tools/bcp-extract/parse_pdf_collects.py and repaired against the printed
  2007 BCP (bcp2007.pdf, pdftotext -layout) and Wikisource by
  tools/bcp-extract/gen_patches.py -> patches.json applied via
  tools/bcp-extract/patch_collects.py, then cleaned by
  tools/bcp-extract/gen_collects_min.py. 284 collects (142 per rite across
  church-year, holy-days, common-of-saints, various-occasions). Corrections
  cover E-text transcription corruptions (misplaced clauses, wrong words such
  as "various" for "several", dropped punctuation), entries missing from the
  E-text (21 inserts), and pdftotext line-break artifacts. Wikisource is the
  clean transcription used where the PDF extraction carried artifacts; the
  printed PDF wins where the two disagree. The 143 repaired/inserted entries
  carry the printed wording; the 141 already-correct E-text entries are
  preserved verbatim, with the source edition's "=...=" emphasis markers
  resolved to plain text in this file.
- daily-devotions.min.json: hand-digitized (no E-text extraction) from the
  Wikisource scan-backed transcription of the 1979 BCP pp. 136-140
  ("Daily Devotions for Individuals and Families"), cross-checked against
  bcponline.org. The four short services: In the Morning, At Noon, In the
  Early Evening, At the Close of Day. The Lord's Prayer follows the
  Noonday/Compline convention (traditional form, no doxology). The Noon
  "or this" alternate collect is kept in the data; the composer collapses
  option menus to the first alternative. The printed page's "holy Spirit"
  (lowercase h, Psalm 51 extract) is preserved verbatim.
- offices.min.json: extracted from BCPOFFCE by
  tools/bcp-extract/extract_offices.py (verifying reconstruction, 0
  problems).
  The seven Daily Office forms: Daily Morning Prayer and Daily Evening
  Prayer in both Rites, An Order of Service for Noonday, An Order of
  Worship for the Evening, and An Order for Compline. Items carry speakers
  (officiant/people/all) resolved from the source's *italic* speaker
  labels and versicle/response pairings; sections mirror the printed
  headings; embedded canticle headings were normalized from
  canticles.min.json to the printed "N Title Latin" form (the E-text adds
  the word "Canticle" and drops canticle 13's title "A Song of Praise").
  Corrections against the printed 2007 BCP (bcp2007.txt): removed the
  doxology "For thine is the kingdom..." from the Noonday and Compline
  Lord's Prayers (the E-text adds it; the printed book omits it there),
  and fixed fifteen E-text transcription typos (e.g. "Pslam", "Almighty
  god", "boundries", "Pleides", "tresspasses", "statues"). The Noonday and
  Compline offices print the Lord's Prayer in two-column traditional and
  contemporary forms; the E-text parallel-column markers are skipped, so
  only the traditional form is captured. Office psalm texts (Noonday,
  Compline) use the RSV translation and are not compared against the BCP
  psalter. Post-extraction correction: OWE Phos hilaron line "we sing your
  praised, O God" fixed to the printed "we sing your praises, O God".
