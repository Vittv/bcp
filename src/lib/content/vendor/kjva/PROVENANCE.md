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

Fourteen deuterocanonical books, the 1611 print's own apocryphal corpus, in
the 1611's order:

Tobit, Judith, Rest of Esther, Wisdom of Solomon, Sirach, Baruch, the Song of
the Three Children, Susanna, Bel and the Dragon, 1 Maccabees, 2 Maccabees,
1 Esdras, Prayer of Manasses, 2 Esdras.

Four books read in the World English Bible under the WEB corpus, because the
source has no counterpart for them:

- Esther (Greek): the source carries the additions only, seven chapters keyed
  10 to 16 as the 1611 prints them, against the WEB's whole Greek Esther in
  ten chapters. Different text under a different division, not one text
  renumbered, so the two are never linked.
- Daniel (Greek): the source has no Septuagint Daniel. The WEB's is the
  whole Septuagint Daniel, chapters 1 to 12 in the Septuagint's text, then
  Susanna and Bel and the Dragon as chapters 13 and 14.
- Psalm 151: the 1611 print has it, the source does not.
- 3 Maccabees and 4 Maccabees: the 1611 print has neither.

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
- The Rest of Esther is renumbered. The source keys its chapters 10 to 16,
  continuing the canonical Esther the way the 1611 print does, and its first
  chapter's verses from 4 for the same reason. The vendor file renumbers
  both to 1-based within the book, so the app's single-number chapter count
  keeps working. The source's original keys are recorded here.
- 14 books, all deuterocanonical
