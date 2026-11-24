<!-- release-date: 2026-11-24 -->

## Features

- office: add the 1979 Great Litany alongside the 1662 and 1962 forms, with all three texts checked against the printed books.
- office: give 1979 Noonday and Compline their own headed sections, with pickers for the psalms, reading and collect under smallcaps rules.
- office: add psalm, collect, mission and closing-blessing pickers to 1979 Morning and Evening Prayer; the collect and mission pickers sit in their sticky section rules.
- office: bring the same section rules and collect picker to the 1662 and 1962 daily offices, and add a picker for the 1962 Prayers for the Queen.
- office: add an absolution choice to Morning and Evening Prayer. 1979 offers "Us" or "You" and defaults to the deacon's "us" form; 1662 offers the priest's absolution or the Collect for the Twenty-first Sunday after Trinity and defaults to the collect.
- office: give 1962 Compline section rules, compact "Protection" / "Lighten" collect chips and a full-width picker for the optional added prayers.
- office: offer full text mode for the 1662 and 1962 daily offices, printing every printed alternative at once.

## Improvements

- lectionary: give the 1962 proper title the same accented serif voice as the office masthead.
- 1962: name the edition after the Anglican Church of Canada in the office header, feast cards and calendar.
- office: match the 1662 office header layout to the 1962 one.
- shell: match the reference search trigger to the top bar chips, and use the status bar bullet in the sidebar footer.
- office: show psalm counts in picker labels so the appointed set is clear before opening the menu.

## Fixes

- content: restore the truncated collect for Aid against Perils in 1979 Evening Prayer from the printed book.
- content: treat the note about the deacon's form in the 1979 absolution as a rubric instead of spoken text.
- readings: stop showing "No gospel appointed today" when a Gospel lesson is appointed, and keep both lessons when the "OT & Gospel" choice is selected.
- 1962: treat the note in Compline that points to Family Prayer as a rubric instead of spoken text.
- 1662: default the occasional prayer to A General Thanksgiving, as the rubric directs the five following prayers to be read.
- links: open external URLs through the native shell instead of inside the web view.

## Internal

- ci: harden the Pages deployment workflow.
- office: add a shared section-heading node kind so sticky rules and their pickers behave the same way in every edition.

**Full Changelog**: https://github.com/Vittv/bcp/compare/v0.8.1...v0.8.2
