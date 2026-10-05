# World English Bible, British Edition (WEBBE) provenance

The World English Bible (WEB) is a Modern English translation of the Holy
Bible. It is built upon the American Standard Version (ASV) of 1901, and is
in the PUBLIC DOMAIN, with no copyright and no licensing restrictions.

The British Edition (WEBBE) uses British spellings and the acronym "LORD"
for the divine name. The deuterocanonical books ("Apocrypha", marked as
testament "DC") are drawn from the single ecumenical collection this edition
ships, 15 books: Psalm 151, the Prayer of Manasses, and two Greek-text
volumes, Esther (Greek) and Daniel (Greek). Those last two are the
Septuagint of books already in the canon rather than extra books, carrying
the Greek additional material alongside it.

## Source

- eBible.org: https://ebible.org/Scriptures/eng-webbe_usfm.zip
- Project: https://ebible.org/eng-webbe/

## Extraction notes

- Each book is a separate JSON file (gen.json, exod.json, ..., dangrk.json)
- Same schema and file naming as the KJV vendor (src/lib/content/vendor/kjv)
- Parsed from USFM with tools/usfm/parse.ts (see scripts/fetch-web.ts)
- Chapter/verse numbers follow the deuterocanonical "published" numbering,
  so Psalm 151 is chapter "151" and Esther (Greek) keeps the Hebrew-Esther
  verse numbers, with the Septuagint's own material merged into 1:1, 5:1 and
  8:13. that is a partial selection, not the full traditional Additions to
  Esther: the letters to Judas are absent from this text
- Footnotes, cross-references, Strong's numbers, and section headings are
  removed; psalm superscriptions (\d in USFM) are dropped to match the
  vendored KJV, but "Selah" and the words of Jesus are kept
- Verses consisting only of an editorial footnote (e.g. Sirach verses
  omitted by the best authorities, Romans 16:25) are excluded, since they
  have no renderable text; combined-verse ranges like "\v 28-29" keep
  their text under the first verse number
- 81 books: 39 OT, 27 NT, 15 deuterocanonical
