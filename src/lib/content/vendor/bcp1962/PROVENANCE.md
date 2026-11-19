# 1962 Canadian BCP, vendored content provenance

Status: curated from the official ACC PDF, 2026-11-18. The lectionary, psalms, calendar, rules, Coverdale psalter text, and The Litany are vendored. The proper collects are vendored; the rest of the 1962 office text is not vendored yet.

Text is based on the Book of Common Prayer (1962) of the General Synod of the Anglican Church of Canada. This project is independent and is not endorsed by the Anglican Church of Canada. For the official publication, visit www.anglican.ca/texts.

## Rights basis

On 2026-11-16, Alicia Brown of the Anglican Church of Canada stated that the 1962 Canadian Book of Common Prayer is in the public domain, with no permission, fees, or terms required, and that attribution is suggested. That response supersedes earlier concerns about digital distribution wording. The attribution above is carried in this notice and should be carried in any in-app notice for 1962 content.

## Primary witness

| Field | Value |
| --- | --- |
| Title | The Book of Common Prayer (1962, Canada) |
| Author | The General Synod of the Anglican Church of Canada |
| URL | https://www.anglican.ca/wp-content/uploads/bcp.pdf |
| Local extraction copy | /tmp/opencode/bcp1962-acc.pdf |
| PDF metadata | 792 pages, created 2000-04-01, modified 2025-11-06, producer Acrobat PDFWriter 4.0 |
| Sections used | Calendar pages v to xii, Days of Fasting page xiii, Table of Lessons pages xv to xlv, Proper Psalms pages l to liii, Psalter appointment pages xlix to lv, Collects General Rubrics page 94, The Litany printed pages 30 to 36, Collects Epistles and Gospels printed pages 94 to 330, The Psalter printed pages 331 to 521 |
| Method | Text extracted with pdftotext -layout, facing pages paired manually, ambiguous readings checked against rendered page images |

## Cross-check sources

Lectionary Central, "The Table of Daily Lessons from The Book of Common Prayer Canada 1962", and the Prayer Book Society of Canada "Tables of Psalms" were used only to flag discrepancies. Nothing was transcribed from them. Where a cross-check disagreed with the witness, the witness reading was kept.

## Files

| File | Contents |
| --- | --- |
| lectionary-daily.json | The Table of Lessons, 58 sections, 407 day rows, 1860 citation slots, 4 printed null slots, plus the optional Trinity XXI to XXVI alternative first lessons |
| proper-psalms.json | 110 proper psalm days, including 20 first Evensong rows and the Eucharist columns stored for fidelity |
| special-occasions.json | 7 occasions, including Dominion Day and Remembrance Day |
| psalter-cycle.json | Two alternating 31-day weekday psalm tables, 24 selections, and the appointing rubrics |
| calendar-rules.json | 155 fixed commemorations, the Year I/II rule, lesson table notes, fasting rules, Ember and Rogation definitions, and 8 transfer rules |
| lectionary-rules.json | Rule records documenting resolver intent |
| citation-map.json | Book aliases and the Psalm 119 part rule used by the citation normalizer |
| psalter.json | The 1962 Coverdale psalter text: 149 psalms (Psalm 58 omitted) and 2489 renumbered verses |
| office-text/litany.json | The Litany, 123 lines: opening rubrics, invocations, deprecation, supplication, Lord's Prayer, Chrysostom prayer, Grace, and the appended Supplication |
| office-text/collects-proper.json | 107 proper collects from the Collects, Epistles, and Gospels, including votive and national occasions |
| office-text/offices.json | Morning and Evening Prayer fixed texts: 26 seasonal opening sentences, exhortation, confession, absolution, both forms of the Lord's Prayer, opening versicles, Venite, rubrics, suffrages, the prayers after the Creed, the Apostles' and Athanasian Creeds, and the Grace |
| office-text/canticles.json | Ten canticles: Te Deum, Benedicite, Benedictus, Jubilate (Psalm 100), Magnificat, Cantate Domino (Psalm 98), Nunc Dimittis, Deus Misereatur (Psalm 67), Cantate Domino from Isaiah 42, and Surge, Illuminare |
| office-text/collects.json | The four fixed collects: Peace and Grace at Morning Prayer, Peace and Aid against all Perils at Evening Prayer |
| office-text/mid-day.json | The Prayers at Mid-day, printed page 16: Lord's Prayer, three mission sentences with collects, and the pointer to Prayers and Thanksgivings |
| office-text/compline.json | An Order for Compline, printed pages 722 to 727: opening versicles, short lessons, the respond, Te lucis, Nunc Dimittis, anthems, Creed, confession, collect and blessing |
| office-text/family-prayer.json | The Morning and Evening forms of Family Prayer, printed pages 728 to 731, with the Lord's Prayer and Grace reused from offices.json |

Every table has a minified twin. The check script at scripts/check-bcp1962-vendor.ts validates parity and structural invariants.

## Printed oddities retained verbatim

These were confirmed against rendered page images from the witness. They are likely printing errors, but the vendored data preserves them.

- Advent II, Year I evening first lesson: `Isa. 5. 18–end` where the cross-check reads 5:18-30.
- Epiphany I, Year I morning second lesson: `Matt. 17. 31–13`.
- Epiphany VI, Tuesday morning second lesson: `Acts 23—23. 11`.
- December 29 morning first lesson: `Ruth 1. 1–8`.
- Trinity II, Year II morning second lesson: `Acts 13. 31–13 (14–26)`.
- Trinity V, Monday evening second lesson: `Luke 2. 31–21`.
- Trinity XVI, Year I morning second lesson: `1 Pet. 2. 31–17`.
- Trinity XVIII, Tuesday evening first lesson: `Ezek. 36. .22–end`.
- Michaelmas Eucharist introit: `103. 119–22`.

## Psalter text curation

`psalter.json` was extracted from the same ACC PDF, from the section titled "The Psalter as it is appointed to be said or sung in churches", printed pages 331 to 521. The witness arranges the psalms in a 30-day monthly cycle with Morning and Evening headings and page running heads; those structural lines were stripped and each psalm's verses collected into a single part keyed by the printed verse number.

- The text is the 1962 Coverdale revision, not the 1662 text. Sample wording differs ("doth he meditate" against 1662 "will he exercise himself"), the divine name prints as `LORD`, and the appointed mediant is `/`, which is preserved verbatim in the verse text.
- The "Order how the Psalter is Appointed" note lists omitted passages: Psalm 14. 5-7, 55. 16, 58 (all), 68. 21-23, 69. 23-29, 104. 35 (in part), 109. 5-19, 136. 27, 137. 7-9, 140. 9-10, 141. 7-8, with the verses renumbered. The witness's printed numbering is captured as-is, so Psalm 58 is absent and the affected psalms have shorter, contiguous verse sequences. Cross-checking verse counts against the 1662 text confirms each documented omission.
- Psalm 119 keeps its 176 verses in one part, matching the app's eight-verses-per-part citation mapping used for `119, Pts N` appointments.
- PDF text-layer damage was repaired where it was unambiguous: `I0` and `I` for verse-number digits, `4.` and missing spaces after verse numbers, `5 I` for verse 51, `L ORD`, `M YSELF`, a leading capital `1` for the pronoun `I`, a displaced `ever.` in the three "O give thanks" psalms (107, 118, 136), a stray space before punctuation, and three verses printed with a lowercase initial. Drop-cap initials were rejoined to their small-caps word using the 1662 text only as a word-boundary oracle, never as a wording source. Latin incipits were dropped because the text layer damaged them and the app does not render them.
- No rendered page images were consulted for the psalter text, so this is a text-layer extraction rather than an image-verified transcription. The verse-count and omission checks above bound the structural risk.

## Litany curation

`office-text/litany.json` was extracted from The Litany, printed pages 30 to 36. It follows the 1662 litany JSON shape: a `lines` array of `rubric`, `heading`, and `text` items, where spoken lines carry a `speaker` of `minister`, `people`, or `all`. The 1962 book prints long petitions and short responses without speaker labels except in the appended Supplication, so speaker attribution in the main Litany is inferred from that alternation and recorded as a caveat in the table. The Royal Family placeholder and the bracketed Ember Ordination petition are retained as printed. Section headings are app navigation aids, not printed rubrics. The check script validates pretty/min parity, the line kinds, speaker values, and the opening and closing rubrics.

## Proper collects curation

`office-text/collects-proper.json` was extracted from the Collects, Epistles, and Gospels, printed pages 94 to 330. Each printed Collect or Collects heading became one `{name, text}` record, matching the 1662 proper-collect shape. Three propers print two collects under one heading (Maundy Thursday, Good Friday, Saint Peter and Saint Paul) and were split with numbered suffixes; the Octave Day of Christmas prints two additional collects split into "Of the Circumcision" and "For the New Year". Votive collects whose title appears only in an explanatory rubric were named from that rubric (for example "For Peace in the World" and "For Labour and Industry"). Margin cross-references, feast-date annotations, and interleaved psalter footnotes were removed where the text layer had displaced them into the collect. The check script validates pretty/min parity, edition, and unique non-empty names and texts.

A later pass repaired Psalm 95 verse 1, where the text layer read `O tion. COME ... salva-`; the Venite in `offices.json` uses the same repaired reading. The verse count is unchanged.

## Daily office text curation

`office-text/offices.json`, `canticles.json` and `collects.json` were extracted from the same ACC PDF, printed pages 1 to 24 (Morning and Evening Prayer), 25 to 29 (Additional Canticles and Invitatories), and 694 to 697 (the Creed of Saint Athanasius). They follow the 1662 office-text JSON shapes so the same compose layer can consume either edition.

Text was extracted with `pdftotext -layout` from the official PDF. Page numbers, running heads and dropped-capital artifacts were removed; words broken by line wrapping were rejoined and unambiguous text-layer damage was repaired. The `/` cantillation mark is preserved in canticles and in the Venite. The Venite uses the clean vendored Psalm 95 text because the psalter text layer damaged its first verse. Jubilate, Cantate Domino (Psalm 98) and Deus Misereatur use the vendored psalter texts; the witness appoints them as psalms from the Psalter rather than printing them as canticles. The "Cantate Domino" among the Additional Canticles is a different text from Isaiah 42.10 and is stored under its own id.

The 1962 wording is retained where it differs from 1662: the Lord's Prayer opening form includes the doxology while the form after the Creed omits it, the suffrages and state prayers name the Queen, the Athanasian Creed is appointed on any day in the year with no feast-day list, and the Apostles' Creed reads "Catholic" rather than "Catholick". The 26 opening sentences are keyed by the printed season labels. The check script validates pretty/min parity, edition, the required fixed texts, office ids, canticle referential integrity, and the four fixed collects.

## Short office curation

`office-text/mid-day.json` and `office-text/compline.json` were extracted from the same ACC PDF, printed pages 16 and 722 to 727. They use the same `lines` shape as the Litany so the app can compose fixed offices without a lesson or psalm resolution. Speaker labels are inferred from the printed Minister and Answer alternation, and the Nunc Dimittis and Apostles' Creed reuse the texts already vendored in `canticles.json` and `offices.json`. The check script validates pretty/min parity, edition, line kinds, non-empty text, speaker values, and the leading rubric on each file.

## Family Prayer curation

`office-text/family-prayer.json` was extracted from the same ACC PDF, printed pages 728 to 731. The book prints a selection of forms for family use rather than a fixed daily sequence; the Morning and Evening forms are curated in full and the topical Additional Prayers are not. The Lord's Prayer and Grace reuse the texts already vendored in `offices.json`. This is the 1962 counterpart of the 1979 daily devotions toggle and is exposed only under the 1962 edition. The check script validates pretty/min parity, edition, and the line kinds and non-empty text of both forms.

## Known limitations

- Psalm appointments are raw citation strings in the resolver; the vendored 1962 psalter text resolves them to passages in the Lectionary and Psalter screens through `getBcp1962PsalmPassage`.
- The 50-year moveable-feast tables in the witness are reference tables, not an algorithmic definition. The app computes these values from the shared Easter and Advent primitives.
- Lesson citations keep parenthetical alternatives and verse halves as visible text. The scripture parser currently strips them for lookup.
