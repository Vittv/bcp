# bcp1962 vendored content

This directory holds the vendored 1962 Canadian Book of Common Prayer lectionary, calendar, psalm appointments, and rules. See PROVENANCE.md for sources, rights basis, extraction method, and printed oddities retained verbatim.

The data is edition scoped. It is not a set of readings to drop into the 1979 or 1662 forms. The resolver lives in src/lib/content/bcp1962.ts and the calendar slice in src/lib/calendar/bcp1962.ts, both modeled on their 1662 counterparts.

Each table has a pretty and a minified twin. Run `bun run check:bcp1962` after editing any table.

The 1962 Coverdale psalter text is vendored in psalter.json (149 psalms, Psalm 58 omitted, with the printed verse renumbering). Appointments are stored as citation strings and resolved to this text for rendering.

The office texts are vendored under office-text/ in the 1662 shape: offices.json holds the fixed texts of Morning and Evening Prayer, canticles.json the appointed canticles, collects.json the four fixed collects, litany.json the Litany, mid-day.json the Prayers at Mid-day, compline.json the Order for Compline, family-prayer.json the Morning and Evening family forms, and collects-proper.json the 107 proper collects. The compose layer in src/lib/content/bcp1962.ts builds a full office from these files plus the date's lessons and psalms; Today and the reference Offices screen render it instead of falling back to 1979.
