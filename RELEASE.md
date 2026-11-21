<!-- release-date: 2026-11-21 -->

## Features

- shell: add a calendar button to the Daily Office bar that opens the same month picker as the Offices page, changes the office date, and records a history step so Back restores the previous day.
- shell: add a prayer-book edition chip to the top bar at every width, so the edition stays reachable when the sidebar is hidden.

## Improvements

- shell: hide the season label on phone-width layouts at a larger UI Scale and seat the edition chip beside the cross icon; on desktop, place the chip after the countdown.
- shell: match the chip's year to the sidebar picker's accent weight and give its menu the same width as the button.
- web: anchor the Daily Office month sheet to the office bar like the Offices date picker, so it opens to the right instead of hanging off the icon.
- web: let mobile reference pages scroll through the shell scroller so sticky smallcaps rules actually pin on holy-day, lesser-feast and Psalter pages.
- search: raise the palette and font-picker search fields to 16px so iPhone Safari stops zooming the page on focus, and drop the font picker's magnifier so its text lines up with the font names.
- settings: match the settings search text to the rail labels and tighten its magnifier.
- shell: lift the top bar above the sidebar and drawer so its menus paint over them.
- changelog: show the release date in the modal header, at the right beside the version and close button.

## Fixes

- shell: stop the sidebar from freezing after a cancelled drawer drag, which left navigation presses ignored until a refresh.
- feasts: cite the 1979 Book of Common Prayer as the source for TEC holy days instead of Lesser Feasts and Fasts, which stays the source for lesser feasts.

## Internal

- ui: add an optional trigger text style and a centered variant to the shared dropdown, and extract the month picker into a component shared by both office bars.

**Full Changelog**: https://github.com/Vittv/bcp/compare/v0.8.0...v0.8.1
