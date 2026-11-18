# bcp1962 vendored content

This directory holds the vendored 1962 Canadian Book of Common Prayer lectionary, calendar, psalm appointments, and rules. See PROVENANCE.md for sources, rights basis, extraction method, and printed oddities retained verbatim.

The data is edition scoped. It is not a set of readings to drop into the 1979 or 1662 forms. The resolver lives in src/lib/content/bcp1962.ts and the calendar slice in src/lib/calendar/bcp1962.ts, both modeled on their 1662 counterparts.

Each table has a pretty and a minified twin. Run `bun run check:bcp1962` after editing any table.

The 1962 psalter text and office text are not vendored. Psalm appointments are stored as citation strings and rendered as appointments, not as psalm text.
