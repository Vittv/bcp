# Lesser Feasts and Fasts calendar provenance

`calendar.min.json` is the calendar of Lesser Feasts and Fasts 2024, the
edition conforming to the 81st General Convention. It is taken from the free
PDF published by the Episcopal Church:

  https://www.episcopalchurch.org/resources/lesser-feasts-and-fasts-english/

The file carries only the calendar: date, name and trial-use marker. It does
not carry the book's biographies, collects, psalms, lessons or prefaces.

Copyright (c) 2024 by The Domestic and Foreign Missionary Society of The
Protestant Episcopal Church in the United States of America. The book permits
a congregation to reproduce portions for its own use and forbids commercial or
large-scale reproduction without written permission from Church Publishing.
Only the factual calendar (names and dates) is reproduced here; the
copyrighted propers are deliberately absent.

## Shape

One row per commemoration, sorted by month and day:

  { "month": 1, "day": 4, "slug": "elizabeth-ann-seton...",
    "name": "Elizabeth Ann Seton, ...", "trial": true }

`trial` is present only for the five entries the 2024 edition marks with
brackets as authorized for trial use. `slug` is derived from the name for
stable keys; it is not printed in the book.

## Omissions

The 2024 calendar has 280 dated entries. The 32 dates already carried by the
app's sanctorale and fixed feasts are left out (the 29 sanctorale days plus
the Holy Name, the Epiphany and the Nativity), as is Independence Day, a civic
observance. That leaves 247 rows.
