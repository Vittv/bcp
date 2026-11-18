# bcp1962 vendored content

This directory holds the vendored 1962 Canadian Book of Common Prayer lectionary, calendar, psalm appointments, and rules. See PROVENANCE.md for sources, rights basis, extraction method, and printed oddities retained verbatim.

The data is edition scoped. It is not a set of readings to drop into the 1979 or 1662 forms. The resolver lives in src/lib/content/bcp1962.ts and the calendar slice in src/lib/calendar/bcp1962.ts, both modeled on their 1662 counterparts.

Each table has a pretty and a minified twin. Run `bun run check:bcp1962` after editing any table.

The 1962 Coverdale psalter text is vendored in psalter.json (149 psalms, Psalm 58 omitted, with the printed verse renumbering). Appointments are stored as citation strings and resolved to this text for rendering. The Litany is vendored in office-text/litany.json and composed as a standalone office. The 107 proper collects are vendored in office-text/collects-proper.json. The rest of the 1962 office text is not vendored yet.
