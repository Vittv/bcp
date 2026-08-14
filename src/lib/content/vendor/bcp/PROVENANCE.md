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

Each file records its extraction script and checksum in this note.

## Extraction notes

- psalter.min.json: extracted from BCPSALT1/BCPSALT2 by
  tools/bcp-extract/extract_psalter.py. 150 psalms, 2507 verses. Latin incipits
  were not captured (part titles are null).
- canticles.min.json: extracted from BCPOFFCE by
  tools/bcp-extract/extract_canticles.py. Canticles 1-21. Known E-text
  transcription quirks preserved verbatim: canticle 6 line reads "good will
  towards mean." (the source's spelling of "men"); canticle 13 has no title
  line in the source, so the BCP title "A Song of Praise" was supplied;
  canticle 12 note text is captured in the "note" field.
- collects.min.json: extracted from BCPCOLCT by
  tools/bcp-extract/parse_pdf_collects.py and repaired against the printed 2007
  BCP (bcp2007.pdf, pdftotext -layout) and Wikisource by
  tools/bcp-extract/gen_patches.py -> tools/bcp-extract/patches.json applied via
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
