# Daily Office Lectionary tables provenance

The four files here are the 1979 Prayer Book's Daily Office Lectionary as a
schedule of citations: book, chapter, verse ranges, psalm numbers and the
titles, with no printed text. They come from Reuben Lillie's project,

  https://github.com/reubenlillie/daily-office   (json/readings/*.min.json)

which is (c) 2018 Reuben L. Lillie under the MIT License. The license text is
`LICENSE-MIT` beside this note, and the same notice ships in
`public/licenses/THIRD-PARTY-NOTICES.txt`.

- `dol-year-1.min.json`, `dol-year-2.min.json`: the two-year cycle, one office
  per Sunday, weekday and fixed date.
- `dol-holy-days.min.json`: the major holy days, keyed by date.
- `dol-special-occasions.min.json`: the Special Occasions table.

Lillie's README makes the point that the Prayer Book "is not and never has been
under copyright", which is the reading of the table used here, a schedule of
citations rather than a text. The liturgical text itself is in `../bcp`, along
with the note about the Church Pension Fund.

## Corrections

These files are not copies of upstream, and were not when they arrived.

Vendoring tidied the citations into the shape the lesson parser expects.
`Rom12:9-21`, `1 cor 1:20-31` and `1 Cor5:1-8` gained their missing spaces and
capitals; nine slips were repaired (`Col 3:-18-4:6`, `Gen 48L8-22`,
`Jas 4:13-6:5`, `John 4;43-54`, `Esth 2:5-8, 15:-23`, a stray paren in
`Luke (1:1-4); 3:1-14)`, `Rev 21:1-4,-14`, and `11:121-144` for Psalm 119 in
both years); and the holy days were sorted by date instead of left in upstream's
insertion order. Holy Cross Day was dated Sep 15 and Saint Andrew Nov 10, both
fixed, as was the title "Annuciation". A diff against upstream now shows these
alongside everything below.

A further 57 citations were corrected afterwards against the printed book (the
bcponline.org Daily Office Lectionary pages, BCP 1979 pp. 934ff). The verifier
checks the result against two other transcriptions of the same table: the
readings table Forward Movement publishes, and the readings and psalms tables
from Venite, which it calls the reference tables. Those two readings tables
carry identical rows, so they are one witness, not two. The 57 are transcription
errors rather than editorial choices: ranges cut short
(`2 Cor 1:11`, `James 1:18`, `2 Sam 24:1-2, 10-15`), ranges mangled
(`Heb 1:1.14`, `Jer 36:27:37-2`, `Gen 26:1-6. 12-33`), the wrong book
(`Matt 16:9-20` on Easter Tuesday, `Lev 23:1-22`, `Luke 4:14-30`), the wrong
psalm (`142:1-11(12)` for 143, `42` for 45 in Proper 11, `36` for 34 on the
First Sunday after Christmas), a Psalm 54 missing from Good Friday evening,
days filed under another day's readings (the Eve of the Ascension carried
Ascension Day's lessons; Proper 13 Monday, Proper 18 Tuesday and Proper 24
Wednesday each had one wrong), and a few holy-day entries (the Eve of the
Annunciation, Saint Philip and Saint James, Saint Simon and Saint Jude, the Eve
of the Visitation). Where a reference table disagrees with the printed book,
the book wins, and `scripts/verify-lectionary.ts` records the difference under
`KNOWN_DIFFS`.

`Baruch 3:24-37`, on the Eve of the Ascension, was the one citation whose book
the lesson parser did not know, so `src/lib/content/lessons.ts` now maps
`BARUCH` to `Bar`.

## Verification

`bun scripts/verify-lectionary.ts` rebuilds every office in 2026 and 2027 from
these files and compares the citations with the reference tables, ignoring
order and normalising book names and verse ranges. It separates the cases where
a reference table is only a subset of ours, such as the optional psalms and
the evening rows, from the ones where the two genuinely disagree, and fails on
anything it cannot explain. Re-run it after any edit here.

## Gaps

Independence Day (July 4) and Thanksgiving Day are the two rows of the printed
table this directory does not model, and neither is implemented. Upstream
carries Thanksgiving with a null `day`; Independence Day is not in it at all.
