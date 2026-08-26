# King James Version (KJV) Bible provenance

The King James Version (Authorized Version) of 1611 is in the PUBLIC DOMAIN
in the United States and most jurisdictions. The text used here is derived
from the 1769 Oxford standard text (the "Cambridge Paragraph Bible" edition),
as digitized and maintained by public-domain Bible projects.

No license restrictions apply. The KJV text may be freely copied, distributed,
modified, and used for any purpose.

## Source

Text sourced from the public-domain KJV 1769 edition as provided by:
- Project Gutenberg (etext #10, #1581)
- CrossWire Bible Society (KJV module)
- Unbound Bible (Biola University)

All sources provide the same 1769 standard text. Verse versification follows
the traditional Protestant canon (66 books: 39 Old Testament, 27 New Testament).

## Extraction notes

- Each book is a separate JSON file (gen.json, exod.json, ..., rev.json)
- Schema: `{ "book": "Genesis", "abbrev": "Gen", "testament": "OT", "chapters": 50, "verses": { "1": { "1": "In the beginning...", ... } } }`
- Verse numbers are 1-indexed within each chapter
- Text preserves original KJV spelling, punctuation, and capitalization
- No Strong's numbers, cross-references, or section headings included
- Apocrypha/Deuterocanonical books excluded (Protestant canon only)
- File naming: lowercase book abbreviation (gen, exod, lev, ..., rev)