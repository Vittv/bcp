# King James Version with Apocrypha (KJVA) provenance

The King James Version (Authorized Version) of 1611 is in the PUBLIC DOMAIN in
the United States and most jurisdictions. The apocryphal books here are the
1611 text as printed in the Authorized Version, from the eBible.org "King
James Version + Apocrypha" module, courtesy of the CrossWire Bible Society.

No license restrictions apply. The text may be freely copied, distributed,
modified, and used for any purpose.

## Source

- eBible.org: https://ebible.org/Scriptures/eng-kjv_usfm.zip
- Project: https://ebible.org/eng-kjv/

## What is vendored

Only the apocrypha. No canonical book is included, so there is no path by
which the canonical text can be swapped: the app's own KJV vendor (the 1769
Oxford standard text) stays the canonical text under every setting.

Ten deuterocanonical books, the ones whose chapter structure matches the book
the app already has:

Tobit, Judith, Wisdom of Solomon, Sirach, Baruch, 1 Maccabees, 2 Maccabees,
1 Esdras, Prayer of Manasses, 2 Esdras.

Five deuterocanonical books read in the World English Bible under both
settings, because the KJVD either has no counterpart or has one in a
different shape:

- Esther (Greek): the KJVD carries the additions only, seven chapters keyed
  10 to 16 as the 1611 prints them, against the WEB's whole Greek Esther in
  ten chapters. Different text under a different division, not one text
  renumbered.
- Daniel (Greek), Psalm 151, 3 Maccabees, 4 Maccabees: no counterpart in
  the KJVD. The 1611 print has no 3 or 4 Maccabees, and Psalm 151, which the
  1611 did print, is missing from this source.

Three KJVD-only books, 3 Holy Children's Song, Susanna and Bel and the
Dragon, are not vendored either. The app has no standalone books for them,
and adding them would make the deuterocanonical corpus differ between the
two texts.

## Extraction notes

- Each book is a separate JSON file (tob.json, jdt.json, ..., 2esd.json)
- Same schema and file naming as the WEB vendor (src/lib/content/vendor/web)
- Parsed from USFM with tools/usfm/parse.ts (see scripts/fetch-kjva.ts)
- Footnotes, cross-references, Strong's numbers, and section headings are
  removed
- The divine name is written "Lord" and "God", as it is in this source and in
  the WEB's apocrypha. The "LORD" convention the canonical vendors use comes
  from a small-caps marker this source does not carry in the apocrypha.
- Sirach has 1393 verses against the WEB's 1359, and 2 Esdras has 874 against
  944. The chapter structure is the same in both, the verse divisions are
  not.
- 10 books, all deuterocanonical
